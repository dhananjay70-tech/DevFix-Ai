from typing import Dict, Any
from app.utils.logger import logger


def run_supervisor(state: Dict[str, Any]) -> Dict[str, Any]:
    repo_name = (state.get("repository") or {}).get("full_name", "unknown")
    logger.info(f"Supervisor Agent starting run {state.get('run_id')} for {repo_name}")
    return {
        "current_agent": "supervisor",
        "progress": 10,
        "status": "RUNNING",
        "confidence": 0.5
    }
