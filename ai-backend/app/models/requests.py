from pydantic import BaseModel, Field
from typing import Optional


class RepositoryPayload(BaseModel):
    full_name: str
    clone_url: str
    default_branch: str = "main"


class IssuePayload(BaseModel):
    number: int
    title: str
    description: Optional[str] = ""


class RunWorkflowRequest(BaseModel):
    run_id: str = Field(..., description="Node.js agent_runs.id — used as-is, not regenerated")
    repository: RepositoryPayload
    issue: IssuePayload
    github_token: str = Field(..., description="User's GitHub OAuth access token (repo scope)")


class ApprovalRequest(BaseModel):
    reviewer_comment: Optional[str] = Field(None, description="Optional human review notes")


class ScanRepositoryRequest(BaseModel):
    repository: RepositoryPayload
    github_token: str = Field(..., description="User's GitHub OAuth access token")
