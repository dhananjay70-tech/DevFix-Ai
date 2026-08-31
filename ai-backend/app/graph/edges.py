from app.graph.state import AgentState
from app.utils.logger import logger

def route_after_tests(state: AgentState) -> str:
    test_res = state.get("test_results", {})
    passed = test_res.get("passed", True)
    retry_count = state.get("retry_count", 0)

    if not passed:
        if retry_count < 3:
            logger.info(f"Tests failed (attempt #{retry_count}). Returning to generate_fix")
            return "generate_fix"
        else:
            logger.warning(f"Tests failed after max retries ({retry_count}). Escalating to human_approval")
            return "human_approval"
    
    return "security_review"

def route_after_security(state: AgentState) -> str:
    sec_res = state.get("security_results", {})
    risk_level = sec_res.get("risk_level", "LOW")
    passed = sec_res.get("passed", True)

    if risk_level == "HIGH" or not passed or state.get("approval_required"):
        logger.info("Security risk identified or approval required. Routing to human_approval")
        return "human_approval"
    
    return "human_approval"  # Move to human approval phase before pull request finalization
