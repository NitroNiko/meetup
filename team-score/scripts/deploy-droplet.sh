#!/usr/bin/env bash
# Deploy WYC Team Score to a DigitalOcean Droplet (Docker Compose).
# Usage (on the droplet, as root):
#   curl -fsSL ... | bash
# or copy this file and run: ADMIN_PIN=secret ./deploy-droplet.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/wyc-team-score}"
REPO_URL="${REPO_URL:-https://github.com/NitroNiko/meetup.git}"
REPO_BRANCH="${REPO_BRANCH:-cursor/team-score-platform-0e5d}"
ADMIN_PIN="${ADMIN_PIN:-}"

if [[ -z "$ADMIN_PIN" ]]; then
  echo "Bitte ADMIN_PIN setzen, z.B.: ADMIN_PIN='mein-pin' $0" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

mkdir -p "$APP_DIR"
if [[ ! -d "$APP_DIR/repo/.git" ]]; then
  git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR/repo"
else
  git -C "$APP_DIR/repo" fetch origin "$REPO_BRANCH"
  git -C "$APP_DIR/repo" checkout "$REPO_BRANCH"
  git -C "$APP_DIR/repo" pull --ff-only origin "$REPO_BRANCH"
fi

cd "$APP_DIR/repo/team-score"
echo "ADMIN_PIN=$ADMIN_PIN" > .env
docker compose up -d --build

echo
echo "Deploy fertig."
echo "App: http://$(curl -fsSL ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}'):3000"
echo "Logs: docker compose -f $APP_DIR/repo/team-score/docker-compose.yml logs -f"
