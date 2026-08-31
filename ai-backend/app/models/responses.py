from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "devfix-ai"

class RunResponse(BaseModel):
    run_id: str
    status: str
    current_agent: str
    progress: int
    confidence: float
    root_cause: Optional[str] = ""
    proposed_fix: Optional[str] = ""
    test_results: Dict[str, Any] = Field(default_factory=dict)
    security_results: Dict[str, Any] = Field(default_factory=dict)


class DetectedIssueModel(BaseModel):
    id: str
    severity: str = "HIGH"  # HIGH | MEDIUM | LOW
    title: str
    file: str
    line: Optional[int] = None
    error_message: str
    evidence: Optional[str] = ""
    explanation: Optional[str] = ""
    confidence: float = 0.85
    status: str = "Detected"


class ScanRepositoryResponse(BaseModel):
    repository: str
    status: str = "COMPLETED"
    issues_found: int = 0
    test_summary: Dict[str, Any] = Field(default_factory=dict)
    issues: list[DetectedIssueModel] = Field(default_factory=list)
