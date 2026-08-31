from fastapi import HTTPException, status

class AgentExecutionException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)

class RunNotFoundException(HTTPException):
    def __init__(self, run_id: str):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=f"Run '{run_id}' not found")
