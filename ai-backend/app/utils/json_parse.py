import json
import re
from typing import Any, Optional


def safe_json_extract(text: str) -> Optional[Any]:
    """Parse a JSON object out of an LLM response, tolerating surrounding
    prose or markdown fences the model added despite instructions not to."""
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            return None
    return None
