#!/bin/bash
set -euo pipefail

tag=${SSH_ORIGINAL_COMMAND:-}

if [[ ! $tag =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]]; then
  echo "Invalid tag: '$tag'" >&2
  exit 1
fi

cd "$(dirname "$0")"

sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${tag#v}/" .env

docker compose pull
docker compose up --detach --wait --wait-timeout 120
docker compose ps
