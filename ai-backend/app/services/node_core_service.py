import httpx
from typing import Any, Dict, List, Optional

from app.config import settings
from app.utils.logger import logger


class NodeCoreService:
    def __init__(self):
        self.base_url = settings.NODE_CORE_API_URL

    async def get_health(self) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"{self.base_url}/health", timeout=5.0)
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.warning(f"Could not reach Node.js core backend at {self.base_url}: {e}")
        return None

    async def sync_agent_run(
        self,
        run_id: str,
        status: str,
        current_agent: str,
        progress: int,
        confidence: float,
        root_cause: str = "",
        affected_files: Optional[List[str]] = None,
        diff: Optional[str] = None,
        test_results: Optional[Dict[str, Any]] = None,
        security_results: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        pull_request: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        payload: Dict[str, Any] = {
            "status": status,
            "currentAgent": current_agent,
            "progress": progress,
            "confidence": confidence,
            "rootCause": root_cause
        }
        if affected_files is not None:
            payload["affectedFiles"] = affected_files
        if diff is not None:
            payload["diff"] = diff
        if test_results is not None:
            payload["testResults"] = test_results
        if security_results is not None:
            payload["securityResults"] = security_results
        if error_message is not None:
            payload["errorMessage"] = error_message
        if pull_request is not None:
            payload["pullRequest"] = pull_request

        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    f"{self.base_url}/internal/agent-runs/{run_id}/sync",
                    json=payload,
                    headers={"x-internal-api-key": settings.INTERNAL_API_KEY},
                    timeout=10.0
                )
                if res.status_code in (200, 201):
                    return res.json()
                logger.warning(f"Node core sync for run {run_id} returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Failed to sync agent run {run_id} to Node.js backend: {e}")
        return None


node_core_service = NodeCoreService()
