from typing import Optional

from fastapi import FastAPI, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.requests import RunWorkflowRequest, ApprovalRequest, ScanRepositoryRequest
from app.models.responses import HealthResponse, RunResponse, ScanRepositoryResponse
from app.services.sandbox_service import sandbox_service
from app.services.scanner_service import scanner_service
from app.services.node_core_service import node_core_service
from app.graph.workflow import app_graph
from app.utils.logger import logger
from app.utils.exceptions import RunNotFoundException

app = FastAPI(
    title=settings.APP_NAME,
    description="DevFix AI LangGraph & LangChain Autonomous Agent Microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(status="ok", service="devfix-ai")


def _graph_config(run_id: str) -> dict:
    return {"configurable": {"thread_id": run_id}}


def _to_run_response(run_id: str, state: dict) -> RunResponse:
    return RunResponse(
        run_id=run_id,
        status=state.get("status", "RUNNING"),
        current_agent=state.get("current_agent", ""),
        progress=state.get("progress", 0),
        confidence=state.get("confidence", 0.0),
        root_cause=state.get("root_cause", ""),
        proposed_fix=state.get("proposed_fix", ""),
        test_results=state.get("test_results", {}),
        security_results=state.get("security_results", {})
    )


async def _sync(state: dict):
    await node_core_service.sync_agent_run(
        run_id=state["run_id"],
        status=state.get("status", "RUNNING"),
        current_agent=state.get("current_agent", ""),
        progress=state.get("progress", 0),
        confidence=state.get("confidence", 0.0),
        root_cause=state.get("root_cause", ""),
        affected_files=state.get("affected_files"),
        diff=state.get("proposed_fix"),
        test_results=state.get("test_results"),
        security_results=state.get("security_results"),
        pull_request=state.get("pull_request")
    )


async def _sync_failure(run_id: str, current_agent: str, progress: int, error: str):
    await node_core_service.sync_agent_run(
        run_id=run_id,
        status="FAILED",
        current_agent=current_agent,
        progress=progress,
        confidence=0.0,
        root_cause="",
        error_message=error
    )


async def _drive_graph(run_id: str, initial_input):
    """Run the graph until it reaches an interrupt (human_approval, before
    finalize) or completes. Syncs Node after every node so the frontend's poll
    reflects live progress, never a canned/final-only status."""
    try:
        async for step_state in app_graph.astream(initial_input, _graph_config(run_id), stream_mode="values"):
            await _sync(step_state)
    except Exception as e:
        logger.error(f"Investigation run {run_id} failed: {e}")
        sandbox_service.destroy(run_id)
        await _sync_failure(run_id, "error", 0, str(e))


async def _resume_after_approval(run_id: str):
    try:
        async for step_state in app_graph.astream(None, _graph_config(run_id), stream_mode="values"):
            await _sync(step_state)
    except Exception as e:
        logger.error(f"Finalizing run {run_id} failed: {e}")
        await _sync_failure(run_id, "finalize", 95, str(e))
    finally:
        sandbox_service.destroy(run_id)


@app.post("/api/ai/run", response_model=RunResponse, status_code=status.HTTP_202_ACCEPTED)
async def run_workflow(req: RunWorkflowRequest, background_tasks: BackgroundTasks):
    run_id = req.run_id
    repository = req.repository.model_dump()

    sandbox_service.create(
        run_id=run_id,
        clone_url=repository["clone_url"],
        github_token=req.github_token,
        default_branch=repository.get("default_branch") or "main"
    )

    initial_state = {
        "run_id": run_id,
        "github_token": req.github_token,
        "repository": repository,
        "issue_id": str(req.issue.number),
        "issue_number": req.issue.number,
        "issue_title": req.issue.title,
        "issue_description": req.issue.description or "",
        "relevant_files": [],
        "code_context": {},
        "root_cause": "",
        "proposed_fix": "",
        "affected_files": [],
        "patch_applied": True,
        "branch_name": "",
        "pull_request": None,
        "test_results": {},
        "security_results": {},
        "confidence": 0.0,
        "current_agent": "supervisor",
        "progress": 5,
        "retry_count": 0,
        "approval_required": False,
        "status": "RUNNING"
    }

    background_tasks.add_task(_drive_graph, run_id, initial_state)

    return _to_run_response(run_id, initial_state)


@app.get("/api/ai/runs/{run_id}", response_model=RunResponse)
def get_run_status(run_id: str):
    snapshot = app_graph.get_state(_graph_config(run_id))
    if not snapshot or not snapshot.values:
        raise RunNotFoundException(run_id)
    return _to_run_response(run_id, snapshot.values)


@app.post("/api/ai/runs/{run_id}/approve", response_model=RunResponse)
async def approve_run(run_id: str, background_tasks: BackgroundTasks, req: Optional[ApprovalRequest] = None):
    snapshot = app_graph.get_state(_graph_config(run_id))
    if not snapshot or not snapshot.values:
        raise RunNotFoundException(run_id)

    background_tasks.add_task(_resume_after_approval, run_id)

    state = dict(snapshot.values)
    state["status"] = "RUNNING"
    state["current_agent"] = "finalize"
    return _to_run_response(run_id, state)


@app.post("/api/ai/runs/{run_id}/reject", response_model=RunResponse)
async def reject_run(run_id: str, req: Optional[ApprovalRequest] = None):
    snapshot = app_graph.get_state(_graph_config(run_id))
    if not snapshot or not snapshot.values:
        raise RunNotFoundException(run_id)

    sandbox_service.destroy(run_id)

    state = dict(snapshot.values)
    state["status"] = "REJECTED"
    await _sync(state)
    return _to_run_response(run_id, state)


from app.models.requests import RunWorkflowRequest, ApprovalRequest, ScanRepositoryRequest, AssistantChatRequest
from app.services.assistant_service import assistant_service


@app.post("/api/ai/scan", response_model=ScanRepositoryResponse)
async def scan_repository(req: ScanRepositoryRequest):
    """Clones the repository in sandbox, executes tests/builds, scans source code,
    and returns real detected bugs and failing tests."""
    repo = req.repository
    res = await scanner_service.scan_repository(
        full_name=repo.full_name,
        clone_url=repo.clone_url,
        default_branch=repo.default_branch or "main",
        github_token=req.github_token
    )
    return res


@app.post("/api/ai/assistant/chat")
async def assistant_chat(req: AssistantChatRequest):
    """Context-aware AI assistant endpoint answering questions about repositories,
    investigations, pull requests, dashboard metrics, and code fixes."""
    return await assistant_service.chat(
        message=req.message,
        context=req.context or {},
        history=req.history or []
    )

