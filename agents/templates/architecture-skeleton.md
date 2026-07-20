# Architecture

## section:vision
[one sentence — what the system is]

## section:tech-stack
_not yet decided_

## section:data-model
_not yet decided_

## section:actors
_not yet decided_

## section:api-interfaces
_not yet decided_

## section:deployment
_not yet decided_

## section:guardrails
Source code under /src/ with subdirectories as needed (db/, api/, lib/, config/).
Config under /src/config/. Secrets in /src/.env — never hardcoded.
Build output to /dist/. Runtime writable storage under /data/.
AI prompts under /src/ai/ if the system uses AI.

## section:configuration
_not yet decided_
