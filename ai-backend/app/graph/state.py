from typing import TypedDict, List, Dict, Any, Optional


class RepositoryRef(TypedDict):
    full_name: str
    clone_url: str
    default_branch: str


class AgentState(TypedDict):
    run_id: str
    github_token: str
    repository: RepositoryRef
    issue_id: str
    issue_number: int
    issue_title: str
    issue_description: str
    relevant_files: List[str]
    code_context: Dict[str, Any]
    root_cause: str
    proposed_fix: str
    affected_files: List[str]
    patch_applied: bool
    branch_name: str
    pull_request: Optional[Dict[str, Any]]
    test_results: Dict[str, Any]
    security_results: Dict[str, Any]
    confidence: float
    current_agent: str
    progress: int
    retry_count: int
    approval_required: bool
    status: str
