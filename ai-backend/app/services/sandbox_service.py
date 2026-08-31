import io
import os
import shutil
import subprocess
import tarfile
import tempfile
import threading
from typing import Any, Dict, List, Optional

import docker
from docker.errors import DockerException

from app.config import settings
from app.utils.exceptions import AgentExecutionException
from app.utils.logger import logger

REPO_DIR = "/workspace/repo"


class SandboxHandle:
    def __init__(self, run_id: str, container=None, local_dir: Optional[str] = None):
        self.run_id = run_id
        self.container = container
        self.local_dir = local_dir

    @property
    def is_local(self) -> bool:
        return self.local_dir is not None


class SandboxService:
    """Runs each investigation's clone/patch/test cycle inside an isolated
    Docker container or local workspace directory. One sandbox per run_id,
    kept alive across the human-approval pause and torn down on finalize/reject."""

    def __init__(self):
        self._client = None
        self._docker_checked = False
        self._docker_available = False
        self._sandboxes: Dict[str, SandboxHandle] = {}
        self._lock = threading.Lock()

    def _check_docker(self) -> bool:
        if not self._docker_checked:
            try:
                self._client = docker.from_env()
                self._client.ping()
                self._docker_available = True
                logger.info("Docker daemon is active and accessible.")
            except Exception as e:
                self._docker_available = False
                logger.warning(f"Docker is not available ({e}). Falling back to isolated local workspace sandboxes.")
            finally:
                self._docker_checked = True
        return self._docker_available

    def _get(self, run_id: str) -> SandboxHandle:
        handle = self._sandboxes.get(run_id)
        if not handle:
            raise AgentExecutionException(f"No active sandbox for run {run_id}")
        return handle

    @staticmethod
    def _inject_token(clone_url: str, token: str) -> str:
        if clone_url.startswith("https://") and token:
            return clone_url.replace("https://", f"https://x-access-token:{token}@", 1)
        return clone_url

    def _exec(self, handle: SandboxHandle, cmd: List[str]):
        if handle.is_local:
            try:
                shell_cmd = " ".join(cmd) if isinstance(cmd, list) and cmd and cmd[0] == "sh" and len(cmd) > 2 else cmd
                if isinstance(shell_cmd, list):
                    shell_cmd = " ".join(shell_cmd)
                
                # If command is sh -c "...", strip wrapper
                if shell_cmd.startswith("sh -c "):
                    shell_cmd = shell_cmd[6:].strip("'\"")

                proc = subprocess.run(
                    shell_cmd,
                    cwd=handle.local_dir,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                return proc.returncode, proc.stdout or "", proc.stderr or ""
            except subprocess.TimeoutExpired:
                return 124, "", "Command timed out after 120s"
            except Exception as e:
                return 1, "", str(e)
        else:
            exit_code, output = handle.container.exec_run(cmd, workdir=REPO_DIR, demux=True)
            stdout_b, stderr_b = output if output else (None, None)
            stdout = (stdout_b or b"").decode(errors="replace")
            stderr = (stderr_b or b"").decode(errors="replace")
            return exit_code, stdout, stderr

    def _write_file(self, handle: SandboxHandle, abs_path: str, content: str):
        if handle.is_local:
            target_path = os.path.join(handle.local_dir, os.path.basename(abs_path))
            with open(target_path, "w", encoding="utf-8") as f:
                f.write(content)
        else:
            data = content.encode("utf-8")
            tarstream = io.BytesIO()
            with tarfile.open(fileobj=tarstream, mode="w") as tar:
                info = tarfile.TarInfo(name=abs_path.lstrip("/"))
                info.size = len(data)
                tar.addfile(info, io.BytesIO(data))
            tarstream.seek(0)
            handle.container.put_archive("/", tarstream)

    def create(self, run_id: str, clone_url: str, github_token: str, default_branch: str) -> SandboxHandle:
        with self._lock:
            if len(self._sandboxes) >= settings.MAX_CONCURRENT_SANDBOXES:
                raise AgentExecutionException("Too many concurrent investigations running — try again shortly")

        auth_url = self._inject_token(clone_url, github_token)

        if self._check_docker():
            try:
                container = self._client.containers.run(
                    settings.SANDBOX_IMAGE,
                    command="sleep infinity",
                    detach=True,
                    mem_limit="2g",
                    nano_cpus=2_000_000_000,
                    working_dir="/workspace",
                    name=f"devfix-sandbox-{run_id}",
                    remove=False,
                )
                handle = SandboxHandle(run_id, container=container)
                with self._lock:
                    self._sandboxes[run_id] = handle

                exit_code, out, err = handle.container.exec_run(
                    ["git", "clone", "--branch", default_branch, "--single-branch", auth_url, REPO_DIR],
                    workdir="/workspace",
                )
                if exit_code != 0:
                    self.destroy(run_id)
                    raise AgentExecutionException(f"Failed to clone repository: {out.decode(errors='replace') if out else err}")

                return handle
            except Exception as e:
                logger.warning(f"Docker sandbox creation failed ({e}). Falling back to local workspace.")

        # Local workspace sandbox fallback
        temp_dir = os.path.join(tempfile.gettempdir(), f"devfix_sandbox_{run_id}")
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        os.makedirs(temp_dir, exist_ok=True)

        logger.info(f"Cloning {clone_url} (branch {default_branch}) into local sandbox {temp_dir}")
        clone_res = subprocess.run(
            ["git", "clone", "--branch", default_branch, "--single-branch", auth_url, "."],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=180
        )
        if clone_res.returncode != 0:
            shutil.rmtree(temp_dir, ignore_errors=True)
            raise AgentExecutionException(f"Failed to clone repository: {clone_res.stderr or clone_res.stdout}")

        handle = SandboxHandle(run_id, local_dir=temp_dir)
        with self._lock:
            self._sandboxes[run_id] = handle

        return handle

    def list_files(self, run_id: str, max_files: int = 400) -> List[str]:
        handle = self._get(run_id)
        if handle.is_local:
            file_list = []
            for root, dirs, files in os.walk(handle.local_dir):
                # Skip .git
                if ".git" in dirs:
                    dirs.remove(".git")
                if "node_modules" in dirs:
                    dirs.remove("node_modules")
                for f in files:
                    rel = os.path.relpath(os.path.join(root, f), handle.local_dir).replace("\\", "/")
                    file_list.append(rel)
                    if len(file_list) >= max_files:
                        return file_list
            return file_list
        else:
            code, out, err = self._exec(handle, ["sh", "-c", f"git ls-files | head -n {max_files}"])
            if code != 0:
                raise AgentExecutionException(f"Failed to list repository files: {err or out}")
            return [f for f in out.splitlines() if f.strip()]

    def read_file(self, run_id: str, path: str, max_bytes: int = 20000) -> str:
        handle = self._get(run_id)
        if handle.is_local:
            full_path = os.path.join(handle.local_dir, path)
            if not os.path.isfile(full_path):
                return ""
            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    return f.read(max_bytes)
            except Exception:
                return ""
        else:
            code, out, err = self._exec(handle, ["sh", "-c", f"head -c {max_bytes} {path} 2>&1"])
            if code != 0:
                return ""
            return out

    def search(self, run_id: str, query: str, max_matches: int = 20) -> List[Dict[str, Any]]:
        handle = self._get(run_id)
        matches = []
        if handle.is_local:
            for rel_file in self.list_files(run_id, max_files=200):
                full_path = os.path.join(handle.local_dir, rel_file)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        for line_idx, line in enumerate(f, 1):
                            if query.lower() in line.lower():
                                matches.append({
                                    "file": rel_file,
                                    "line": line_idx,
                                    "snippet": line.strip()
                                })
                                if len(matches) >= max_matches:
                                    return matches
                except Exception:
                    continue
            return matches
        else:
            cmd = f"grep -rns -I -F '{query}' . 2>/dev/null | head -n {max_matches}"
            code, out, err = self._exec(handle, ["sh", "-c", cmd])
            for line in out.splitlines():
                parts = line.split(":", 2)
                if len(parts) == 3:
                    file_path = parts[0][2:] if parts[0].startswith("./") else parts[0]
                    matches.append({
                        "file": file_path,
                        "line": int(parts[1]) if parts[1].isdigit() else 0,
                        "snippet": parts[2].strip()
                    })
            return matches

    def reset_worktree(self, run_id: str):
        handle = self._get(run_id)
        if handle.is_local:
            subprocess.run(["git", "checkout", "--", "."], cwd=handle.local_dir, capture_output=True)
            subprocess.run(["git", "clean", "-fd"], cwd=handle.local_dir, capture_output=True)
        else:
            code, out, err = self._exec(handle, ["sh", "-c", "git checkout -- . && git clean -fd"])
            if code != 0:
                raise AgentExecutionException(f"Failed to reset sandbox worktree: {err or out}")

    def apply_patch(self, run_id: str, diff_text: str):
        handle = self._get(run_id)
        if handle.is_local:
            patch_file = os.path.join(handle.local_dir, "devfix.patch")
            with open(patch_file, "w", encoding="utf-8", newline="\n") as f:
                f.write(diff_text)
            res = subprocess.run(["git", "apply", "--whitespace=fix", "devfix.patch"], cwd=handle.local_dir, capture_output=True, text=True)
            if res.returncode != 0:
                raise AgentExecutionException(f"Generated patch did not apply: {res.stderr or res.stdout}")
        else:
            self._write_file(handle, "/tmp/devfix.patch", diff_text)
            code, out, err = self._exec(handle, ["sh", "-c", "git apply --whitespace=fix /tmp/devfix.patch"])
            if code != 0:
                raise AgentExecutionException(f"Generated patch did not apply: {err or out}")

    def detect_test_command(self, run_id: str) -> Optional[str]:
        handle = self._get(run_id)
        if handle.is_local:
            if os.path.isfile(os.path.join(handle.local_dir, "package.json")):
                return "npm test"
            if os.path.isfile(os.path.join(handle.local_dir, "pytest.ini")) or os.path.isdir(os.path.join(handle.local_dir, "tests")):
                return "pytest -q"
            return None
        else:
            code, out, _ = self._exec(handle, ["sh", "-c", "cat package.json 2>/dev/null"])
            if code == 0 and '"test"' in out:
                _, lockfile_out, _ = self._exec(handle, ["sh", "-c", "test -f package-lock.json && echo yes"])
                install = "npm ci --silent" if "yes" in lockfile_out else "npm install --silent"
                return f"{install} && npm test --silent"

            code, out, _ = self._exec(handle, ["sh", "-c", "(test -f pytest.ini -o -f pyproject.toml -o -d tests) && echo yes"])
            if "yes" in out:
                return "(test -f requirements.txt && pip install -q -r requirements.txt || true) && pytest -q"

            return None

    def run_tests(self, run_id: str) -> Dict[str, Any]:
        cmd = self.detect_test_command(run_id)
        if not cmd:
            return {"passed": True, "skipped": True, "output": "No test suite found in the repository"}

        handle = self._get(run_id)
        if handle.is_local:
            res = subprocess.run(cmd, cwd=handle.local_dir, shell=True, capture_output=True, text=True, timeout=180)
            output = (res.stdout + "\n" + res.stderr).strip()
            return {
                "passed": res.returncode == 0,
                "skipped": False,
                "exit_code": res.returncode,
                "command": cmd,
                "output": output[-8000:]
            }
        else:
            code, out, err = self._exec(handle, ["sh", "-c", cmd])
            output = (out + "\n" + err).strip()
            return {
                "passed": code == 0,
                "skipped": False,
                "exit_code": code,
                "command": cmd,
                "output": output[-8000:]
            }

    def git_diff(self, run_id: str) -> str:
        handle = self._get(run_id)
        if handle.is_local:
            res = subprocess.run(["git", "diff"], cwd=handle.local_dir, capture_output=True, text=True)
            return res.stdout
        else:
            code, out, err = self._exec(handle, ["sh", "-c", "git diff"])
            if code != 0:
                raise AgentExecutionException(f"git diff failed: {err}")
            return out

    def create_branch_commit_push(self, run_id: str, branch_name: str, commit_message: str):
        handle = self._get(run_id)
        if handle.is_local:
            subprocess.run(["git", "checkout", "-b", branch_name], cwd=handle.local_dir, check=True)
            subprocess.run(["git", "-c", "user.email=devfix-ai@users.noreply.github.com", "-c", "user.name=DevFix AI", "add", "-A"], cwd=handle.local_dir, check=True)
            subprocess.run(["git", "-c", "user.email=devfix-ai@users.noreply.github.com", "-c", "user.name=DevFix AI", "commit", "-m", commit_message], cwd=handle.local_dir, check=True)
            push_res = subprocess.run(["git", "push", "origin", branch_name], cwd=handle.local_dir, capture_output=True, text=True)
            if push_res.returncode != 0:
                raise AgentExecutionException(f"Failed to push branch '{branch_name}': {push_res.stderr or push_res.stdout}")
        else:
            cmd = (
                f"git checkout -b {branch_name} && "
                f"git -c user.email=devfix-ai@users.noreply.github.com -c user.name='DevFix AI' add -A && "
                f"git -c user.email=devfix-ai@users.noreply.github.com -c user.name='DevFix AI' commit -m '{commit_message}' && "
                f"git push origin {branch_name}"
            )
            code, out, err = self._exec(handle, ["sh", "-c", cmd])
            if code != 0:
                raise AgentExecutionException(f"Failed to push branch '{branch_name}': {err or out}")

    def destroy(self, run_id: str):
        with self._lock:
            handle = self._sandboxes.pop(run_id, None)
        if handle:
            if handle.is_local and handle.local_dir:
                try:
                    shutil.rmtree(handle.local_dir, ignore_errors=True)
                except Exception as e:
                    logger.warning(f"Failed to remove local sandbox dir {handle.local_dir}: {e}")
            elif handle.container:
                try:
                    handle.container.remove(force=True)
                except Exception as e:
                    logger.warning(f"Failed to remove sandbox container for run {run_id}: {e}")


sandbox_service = SandboxService()
