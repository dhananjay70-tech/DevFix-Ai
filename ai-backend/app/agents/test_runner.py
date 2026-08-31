from typing import Dict, Any
from app.utils.logger import logger
from app.services.sandbox_service import sandbox_service


def run_test_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    run_id = state["run_id"]

    if state.get("patch_applied") is False:
        logger.info(f"Skipping test execution for run {run_id} — patch did not apply")
        return {
            "current_agent": "run_tests",
            "progress": 82,
            "test_results": state.get("test_results", {"passed": False, "output": "Patch did not apply"}),
            "confidence": 0.3
        }

    logger.info(f"Test Agent executing real tests in sandbox for run {run_id}")
    results = sandbox_service.run_tests(run_id)

    return {
        "current_agent": "run_tests",
        "progress": 82,
        "test_results": results,
        "confidence": 0.9 if results.get("passed") else 0.5
    }
