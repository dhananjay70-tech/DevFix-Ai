# DevFix AI - Autonomous AI Microservice

Autonomous AI agent service built with Python, FastAPI, LangChain, and LangGraph.

## Architecture

- **FastAPI**: REST API service handling issue analysis and agent run state tracking.
- **LangGraph**: StateGraph workflow orchestrating multi-agent collaboration:
  `Supervisor → Repo Analyzer → Code Localizer → Root Cause → Fix Generator → Test Runner → Security Reviewer → Human Approval → Finalize`
- **LangChain**: Prompting, tool bindings, structured outputs, and LLM orchestration.
- **REST Sync**: Communicates execution progress to the Node.js core backend via REST endpoints.

## Project Structure

```
ai-backend/
├── app/
│   ├── main.py              # FastAPI application entry point & endpoints
│   ├── config.py            # Environment settings
│   ├── agents/              # 7 Specialized AI agent definitions
│   ├── graph/               # LangGraph StateGraph, nodes, and conditional edges
│   ├── tools/               # 8 LangChain tools for repo, issue, test, git inspection
│   ├── services/            # Execution state manager & Node.js REST sync client
│   ├── models/              # Pydantic request & response schemas
│   └── utils/               # Structured logging & exception handlers
├── .env.example
├── requirements.txt
└── README.md
```

## Getting Started

1. **Create & Activate Virtual Environment**:
   ```bash
   cd ai-backend
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Unix/macOS:
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start FastAPI Server**:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```

## API Endpoints

- `GET /health`: Microservice health check
- `POST /api/ai/analyze`: Initialize an autonomous AI investigation
- `POST /api/ai/run`: Trigger complete LangGraph workflow
- `GET /api/ai/runs/{run_id}`: Retrieve agent run status, progress, root cause, test results, security results
- `POST /api/ai/runs/{run_id}/approve`: Resume workflow after human review approval
- `POST /api/ai/runs/{run_id}/reject`: Reject proposed patch
