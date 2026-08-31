from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from app.graph.state import AgentState
from app.graph.nodes import (
    node_supervisor,
    node_analyze_repository,
    node_locate_code,
    node_find_root_cause,
    node_generate_fix,
    node_run_tests,
    node_security_review,
    node_human_approval,
    node_finalize
)
from app.graph.edges import route_after_tests, route_after_security

def build_graph():
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("supervisor", node_supervisor)
    workflow.add_node("analyze_repository", node_analyze_repository)
    workflow.add_node("locate_code", node_locate_code)
    workflow.add_node("find_root_cause", node_find_root_cause)
    workflow.add_node("generate_fix", node_generate_fix)
    workflow.add_node("run_tests", node_run_tests)
    workflow.add_node("security_review", node_security_review)
    workflow.add_node("human_approval", node_human_approval)
    workflow.add_node("finalize", node_finalize)

    # Set Entry Point
    workflow.set_entry_point("supervisor")

    # Linear Sequential Edges
    workflow.add_edge("supervisor", "analyze_repository")
    workflow.add_edge("analyze_repository", "locate_code")
    workflow.add_edge("locate_code", "find_root_cause")
    workflow.add_edge("find_root_cause", "generate_fix")
    workflow.add_edge("generate_fix", "run_tests")

    # Conditional Edges
    workflow.add_conditional_edges(
        "run_tests",
        route_after_tests,
        {
            "generate_fix": "generate_fix",
            "security_review": "security_review",
            "human_approval": "human_approval"
        }
    )

    workflow.add_conditional_edges(
        "security_review",
        route_after_security,
        {
            "human_approval": "human_approval",
            "finalize": "finalize"
        }
    )

    workflow.add_edge("human_approval", "finalize")
    workflow.add_edge("finalize", END)

    # The graph always reaches human_approval before finalize (see edges.py).
    # Pausing here — instead of letting finalize run in the same invoke() — is
    # what makes the existing approve/reject API actually gate real GitHub
    # writes rather than being cosmetic.
    return workflow.compile(checkpointer=MemorySaver(), interrupt_before=["finalize"])

app_graph = build_graph()
