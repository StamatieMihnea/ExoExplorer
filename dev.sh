#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_COMPOSE="$ROOT_DIR/database/docker-compose.yml"
BASE_COMPOSE="$ROOT_DIR/docker-compose.yml"
DEV_COMPOSE="$ROOT_DIR/docker-compose.dev.yml"

if [ ! -f "$DB_COMPOSE" ]; then
  echo "Missing database/docker-compose.yml — expected it at $DB_COMPOSE"
  exit 1
fi

echo "Starting development stack (api + web + database)..."
docker compose -f "$BASE_COMPOSE" -f "$DB_COMPOSE" -f "$DEV_COMPOSE" up --build
