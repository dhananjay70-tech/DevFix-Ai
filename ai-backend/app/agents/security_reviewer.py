from typing import Dict, Any

from app.utils.logger import logger
from app.utils.json_parse import safe_json_extract
from app.services.llm_service import get_llm


def run_security_reviewer(state: Dict[str, Any]) -> Dict[str, Any]:
    logger.info(f"Security Review Agent auditing real diff for run {state.get('run_id')}")

    diff = state.get("proposed_fix", "")
    if not diff.strip():
        return {
            "current_agent": "security_review",
            "progress": 92,
            "security_results": {"passed": False, "risk_level": "HIGH", "findings": ["No diff was produced to review"]},
            "confidence": 0.3
        }

    llm = get_llm()
    prompt = (
        "Review this git diff for security risk before it is merged automatically. "
        "Flag hardcoded secrets/credentials, destructive shell commands, disabled auth/validation, "
        "unsafe eval/exec, injection risks, or anything unrelated to a bug fix.\n\n"
        f"Diff:\n{diff[:6000]}\n\n"
        'Reply with ONLY JSON: {"passed": true|false, "risk_level": "LOW|MEDIUM|HIGH", "findings": ["..."]}'
    )
    response = llm.invoke(prompt)
    parsed = safe_json_extract(response.content)
    if not parsed:
        parsed = {"passed": False, "risk_level": "HIGH", "findings": ["Security review response could not be parsed"]}

    return {
        "current_agent": "security_review",
        "progress": 92,
        "security_results": parsed,
        "confidence": 0.85 if parsed.get("passed") else 0.5
    }
