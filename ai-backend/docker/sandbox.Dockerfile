# Pre-built image for isolated per-investigation sandboxes. Build once:
#   docker build -t devfix-sandbox:latest -f ai-backend/docker/sandbox.Dockerfile ai-backend
# sandbox_service.py runs one throwaway container from this image per run,
# clones the real repo inside it, and never lets the clone/build/test/patch
# steps touch the host filesystem.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN git config --global user.email "devfix-ai@users.noreply.github.com" \
    && git config --global user.name "DevFix AI" \
    && git config --global --add safe.directory /workspace/repo

WORKDIR /workspace

CMD ["sleep", "infinity"]
