import json
import uuid
from typing import Dict, Any, List

from app.utils.logger import logger
from app.utils.json_parse import safe_json_extract
from app.services.sandbox_service import sandbox_service
from app.services.llm_service import get_llm
from app.models.responses import DetectedIssueModel, ScanRepositoryResponse


class ScannerService:
    """Clones a real GitHub repository in an isolated sandbox, executes tests/builds,
    inspects source files for syntax/runtime/null-reference bugs, and returns
    structured detected issues."""

    async def scan_repository(
        self,
        full_name: str,
        clone_url: str,
        default_branch: str,
        github_token: str
    ) -> ScanRepositoryResponse:
        scan_id = f"scan-{uuid.uuid4().hex[:8]}"
        logger.info(f"Starting repository code scan for {full_name} (scan_id={scan_id})")

        detected_issues: List[DetectedIssueModel] = []
        test_summary: Dict[str, Any] = {}

        try:
            # 1. Create sandbox & clone repository
            sandbox_service.create(
                run_id=scan_id,
                clone_url=clone_url,
                github_token=github_token,
                default_branch=default_branch or "main"
            )

            # 2. List repository files
            files = sandbox_service.list_files(scan_id, max_files=300)
            logger.info(f"Scan {scan_id}: indexed {len(files)} files in {full_name}")

            # 3. Detect & execute tests / build
            test_results = sandbox_service.run_tests(scan_id)
            test_summary = {
                "command": test_results.get("command"),
                "passed": test_results.get("passed", True),
                "skipped": test_results.get("skipped", False),
                "exit_code": test_results.get("exit_code", 0)
            }

            # If tests failed, create a high-priority detected issue from the failure output
            if not test_results.get("passed") and not test_results.get("skipped"):
                output = test_results.get("output", "")
                detected_issues.append(
                    DetectedIssueModel(
                        id=f"{scan_id}-test-failure",
                        severity="HIGH",
                        title=f"Test Suite Failure in {full_name}",
                        file=files[0] if files else "package.json",
                        line=1,
                        error_message="Test runner exited with non-zero status",
                        evidence=output[:1000] if output else "Tests failed in sandbox environment",
                        explanation=f"Executing `{test_results.get('command')}` failed with exit code {test_results.get('exit_code')}.",
                        confidence=0.95,
                        status="Detected"
                    )
                )

            # 4. Filter source files for deep inspection
            code_extensions = (
                ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".cpp", ".c", ".cc", ".h", ".hpp",
                ".cs", ".go", ".rs", ".rb", ".php", ".json"
            )
            source_files = [
                f for f in files
                if any(f.endswith(ext) for ext in code_extensions)
                and not any(p in f for p in ["node_modules", "dist", "build", ".min.", "package-lock", "vendor", ".git"])
            ]

            # Read content of key source files (up to 15 files, max 3000 chars each)
            file_samples: Dict[str, str] = {}
            for f in source_files[:15]:
                content = sandbox_service.read_file(scan_id, f, max_bytes=8000)
                if content and content.strip():
                    file_samples[f] = content[:3000]

            # 5. LLM Code Analysis for Real Bugs
            if file_samples:
                llm = get_llm(temperature=0.1)
                prompt = (
                    "You are a principal software engineer and automated code auditor.\n"
                    f"Repository: {full_name}\n"
                    f"Test Status: {'PASSED' if test_results.get('passed') else 'FAILED'}\n\n"
                    "Inspect the following real source files for genuine bugs:\n"
                    "- Null/undefined pointer crashes (e.g. unchecked property access on nullable objects)\n"
                    "- Syntax errors or invalid imports\n"
                    "- Unhandled promise rejections / uncaught exception vectors\n"
                    "- Off-by-one errors or broken logic\n"
                    "- Obvious security risks (hardcoded secrets, injection vectors)\n\n"
                    f"Source Files:\n{json.dumps(file_samples, indent=2)}\n\n"
                    "CRITICAL INSTRUCTIONS:\n"
                    "1. Only report real, concrete problems with exact file paths and line numbers present in the code.\n"
                    "2. Do NOT report generic stylistic suggestions or fake issues.\n"
                    "3. If the code is clean and has no identifiable bugs, return an empty array `[]`.\n\n"
                    "Reply with ONLY a JSON array of objects with this schema:\n"
                    "[\n"
                    "  {\n"
                    '    "severity": "HIGH" | "MEDIUM" | "LOW",\n'
                    '    "title": "<short descriptive title of the bug>",\n'
                    '    "file": "<exact file path>",\n'
                    '    "line": <line number integer>,\n'
                    '    "error_message": "<specific error or exception type>",\n'
                    '    "evidence": "<exact snippet of code that causes the bug>",\n'
                    '    "explanation": "<1-2 sentence explanation of why this will fail>",\n'
                    '    "confidence": <float between 0.7 and 1.0>\n'
                    "  }\n"
                    "]"
                )

                try:
                    response = llm.invoke(prompt)
                    parsed_issues = safe_json_extract(response.content)
                    if isinstance(parsed_issues, list):
                        for idx, item in enumerate(parsed_issues[:10]):
                            if isinstance(item, dict) and item.get("title") and item.get("file"):
                                detected_issues.append(
                                    DetectedIssueModel(
                                        id=f"{scan_id}-issue-{idx + 1}",
                                        severity=item.get("severity", "HIGH").upper(),
                                        title=item.get("title"),
                                        file=item.get("file"),
                                        line=item.get("line"),
                                        error_message=item.get("error_message", "Runtime Bug Detected"),
                                        evidence=item.get("evidence", ""),
                                        explanation=item.get("explanation", ""),
                                        confidence=float(item.get("confidence", 0.85)),
                                        status="Detected"
                                    )
                                )
                except Exception as llm_err:
                    logger.warning(f"LLM scan analysis failed for {full_name}: {llm_err}")

        except Exception as e:
            logger.error(f"Error during repository scan for {full_name}: {e}")
            raise e
        finally:
            # 6. Always destroy temporary sandbox container
            sandbox_service.destroy(scan_id)

        return ScanRepositoryResponse(
            repository=full_name,
            status="COMPLETED",
            issues_found=len(detected_issues),
            test_summary=test_summary,
            issues=detected_issues
        )


scanner_service = ScannerService()
