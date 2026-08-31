from typing import Dict, Any

from app.utils.logger import logger
from app.utils.exceptions import AgentExecutionException
from app.services.llm_service import get_llm
from app.services.sandbox_service import sandbox_service


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return text.strip() + "\n"


def run_fix_generator(state: Dict[str, Any]) -> Dict[str, Any]:
    run_id = state["run_id"]
    retry_count = state.get("retry_count", 0)
    logger.info(f"Fix Generation Agent synthesizing real patch for run {run_id} (attempt #{retry_count + 1})")

    # Discard any partially-applied changes from a previous failed attempt so
    # this attempt patches the original, unmodified code.
    sandbox_service.reset_worktree(run_id)

    code_context = state.get("code_context", {})
    target_file = code_context.get("target_file", "")
    previous_test_output = state.get("test_results", {}).get("output", "") if retry_count > 0 else ""

    llm = get_llm()
    prompt = (
        "You are fixing a real bug in a real repository. Produce a single unified diff "
        "(git patch format: '--- a/<path>' / '+++ b/<path>' / '@@ ... @@' hunks) that fixes the issue. "
        "Only modify what's necessary. Reply with ONLY the diff — no commentary, no markdown fences.\n\n"
        f"Issue title: {state.get('issue_title', '')}\n"
        f"Issue description: {state.get('issue_description', '')}\n"
        f"Root cause: {state.get('root_cause', '')}\n\n"
        f"File: {target_file}\n"
        f"Content:\n{code_context.get('content', '')[:8000]}\n"
    )
    if previous_test_output:
        prompt += (
            "\nA previous attempt's tests failed with this output — fix the underlying "
            f"issue, don't just patch the test:\n{previous_test_output[:3000]}\n"
        )

    response = llm.invoke(prompt)
    diff_text = _strip_fences(response.content)

    try:
        sandbox_service.apply_patch(run_id, diff_text)
    except AgentExecutionException as e:
        logger.warning(f"Patch failed to apply on attempt #{retry_count + 1} for run {run_id}: {e}")
        return {
            "current_agent": "generate_fix",
            "progress": 70,
            "proposed_fix": diff_text,
            "patch_applied": False,
            "test_results": {"passed": False, "skipped": False, "output": f"Patch failed to apply: {e.detail}"},
            "retry_count": retry_count + 1,
            "confidence": 0.4
        }

    real_diff = sandbox_service.git_diff(run_id)

    return {
        "current_agent": "generate_fix",
        "progress": 70,
        "proposed_fix": real_diff,
        "affected_files": [target_file] if target_file else [],
        "patch_applied": True,
        "retry_count": retry_count + 1,
        "confidence": 0.8
    }
