FROM node:22-bookworm-slim

ARG CLAUDE_CODE_VERSION=2.1.126
ARG CODEX_VERSION=0.128.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates curl git jq lsof procps python3 \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} @openai/codex@${CODEX_VERSION}

WORKDIR /repo
