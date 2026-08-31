import json
import re
from typing import Dict, Any

from app.utils.logger import logger
from app.utils.json_parse import safe_json_extract
from app.services.sandbox_service import sandbox_service
from app.services.llm_service import get_llm

_STOPWORDS = {
    "this", "that", "when", "with", "from", "have", "should", "would",
    "could", "issue", "error", "the", "and", "there", "which", "into"
}


def _extract_keywords(text: str):
    words = re.findall(r"[A-Za-z_][A-Za-z0-9_]{3,}", text)
    seen, out = set(), []
    for w in words:
        lw = w.lower()
        if lw in _STOPWORDS or lw in seen:
            continue
        seen.add(lw)
        out.append(w)
    return out


def run_code_localizer(state: Dict[str, Any]) -> Dict[str, Any]:
    run_id = state["run_id"]
    issue_text = f"{state.get('issue_title', '')}\n{state.get('issue_description', '')}"
    logger.info(f"Code Localization Agent searching real files for run {run_id}")

    keywords = _extract_keywords(issue_text)
    matches = []
    for kw in keywords[:5]:
        matches.extend(sandbox_service.search(run_id, kw))

    seen_files, deduped = set(), []
    for m in matches:
        if m["file"] not in seen_files:
            seen_files.add(m["file"])
            deduped.append(m)

    files = state.get("relevant_files", [])
    llm = get_llm()
    prompt = (
        "You are locating the file most likely responsible for a reported bug.\n\n"
        f"Issue:\n{issue_text}\n\n"
        f"Repository files (partial list):\n{chr(10).join(files[:200])}\n\n"
        f"Keyword search hits:\n{json.dumps(deduped[:20])}\n\n"
        'Reply with ONLY a JSON object: {"target_file": "<most likely file path from the list above>", "reasoning": "<one sentence>"}'
    )
    response = llm.invoke(prompt)
    parsed = safe_json_extract(response.content)

    target_file = ""
    if parsed and parsed.get("target_file") in files:
        target_file = parsed["target_file"]
    elif deduped:
        target_file = deduped[0]["file"]
    elif files:
        target_file = files[0]

    content = sandbox_service.read_file(run_id, target_file) if target_file else ""

    return {
        "current_agent": "locate_code",
        "progress": 40,
        "code_context": {
            "target_file": target_file,
            "content": content,
            "matches": deduped[:20]
        },
        "confidence": 0.7
    }
