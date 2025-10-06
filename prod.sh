#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_COMPOSE="$ROOT_DIR/database/docker-compose.yml"
BASE_COMPOSE="$ROOT_DIR/docker-compose.yml"
PROD_COMPOSE="$ROOT_DIR/docker-compose.prod.yml"

if [ ! -f "$DB_COMPOSE" ]; then
  echo "Missing database/docker-compose.yml — expected it at $DB_COMPOSE"
  exit 1
fi

echo "Starting production stack (api + web + database)..."
docker compose -f "$BASE_COMPOSE" -f "$DB_COMPOSE" -f "$PROD_COMPOSE" up --build -d

echo "Services started. Use 'docker compose ps' to check status and 'docker compose logs -f' to follow logs.'"
