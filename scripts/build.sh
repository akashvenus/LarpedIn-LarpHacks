#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

cd frontend
npm ci
npm run build
cd ..

pip install uv==0.13.6
uv sync --project backend --frozen

test -f frontend/dist/index.html || { echo "Frontend build produced no dist/index.html"; exit 1; }
echo "Build OK"
