from typing import Any, Dict

import httpx

from app.utils.exceptions import AgentExecutionException

GITHUB_API = "https://api.github.com"


async def create_pull_request(
    github_token: str,
    full_name: str,
    head_branch: str,
    base_branch: str,
    title: str,
    body: str
) -> Dict[str, Any]:
    """Open a real PR via the GitHub REST API using the user's own OAuth
    access token (already granted `repo` scope during GitHub connect)."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{GITHUB_API}/repos/{full_name}/pulls",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github+json",
                "User-Agent": "DevFix-AI-Backend"
            },
            json={
                "title": title,
                "head": head_branch,
                "base": base_branch,
                "body": body
            },
            timeout=15.0
        )

    data = res.json()
    if res.status_code not in (200, 201):
        raise AgentExecutionException(data.get("message") or f"GitHub PR creation failed with HTTP {res.status_code}")

    return {
        "title": data.get("title"),
        "url": data.get("html_url"),
        "status": "OPEN",
        "headBranch": head_branch,
        "body": body,
        "filesChanged": data.get("changed_files") or 0,
        "linesAdded": data.get("additions") or 0,
        "linesRemoved": data.get("deletions") or 0
    }
