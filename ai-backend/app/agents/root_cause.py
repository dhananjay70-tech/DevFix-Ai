from typing import Dict, Any
from app.utils.logger import logger
from app.services.llm_service import get_llm


def run_root_cause(state: Dict[str, Any]) -> Dict[str, Any]:
    run_id = state.get("run_id")
    logger.info(f"Root Cause Agent analyzing real code for run {run_id}")

    code_context = state.get("code_context", {})
    llm = get_llm()
    prompt = (
        "You are a senior engineer diagnosing the root cause of a reported bug.\n\n"
        f"Issue title: {state.get('issue_title', '')}\n"
        f"Issue description: {state.get('issue_description', '')}\n\n"
        f"Target file: {code_context.get('target_file', '')}\n"
        f"File content:\n{code_context.get('content', '')[:6000]}\n\n"
        "Explain the concrete root cause of this bug in 2-4 sentences, referencing "
        "the actual code shown above. Do not give generic advice."
    )
    response = llm.invoke(prompt)
    root_cause_text = response.content.strip()

    return {
        "current_agent": "find_root_cause",
        "progress": 55,
        "root_cause": root_cause_text,
        "confidence": 0.75
    }
