from typing import Dict, Any
from app.utils.logger import logger
from app.services.sandbox_service import sandbox_service


def run_repo_analyzer(state: Dict[str, Any]) -> Dict[str, Any]:
    run_id = state["run_id"]
    logger.info(f"Repository Analysis Agent listing real files for run {run_id}")

    files = sandbox_service.list_files(run_id)

    return {
        "current_agent": "analyze_repository",
        "progress": 25,
        "relevant_files": files,
        "confidence": 0.6
    }
