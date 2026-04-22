#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4310}"
STATE_DIR="${ROOT_DIR}/.local/http-server"
PID_FILE="${STATE_DIR}/server.pid"
LOG_FILE="${STATE_DIR}/server.log"

mkdir -p "${STATE_DIR}"

is_running() {
  if [[ ! -f "${PID_FILE}" ]]; then
    return 1
  fi

  local pid
  pid="$(cat "${PID_FILE}")"
  [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null
}

start_server() {
  if is_running; then
    echo "Server already running on http://127.0.0.1:${PORT} (pid $(cat "${PID_FILE}"))"
    return 0
  fi

  if [[ -f "${PID_FILE}" ]]; then
    rm -f "${PID_FILE}"
  fi

  : >"${LOG_FILE}"
  local pid
  pid="$(
    ROOT_DIR="${ROOT_DIR}" PORT="${PORT}" LOG_FILE="${LOG_FILE}" python3 - <<'PY'
import os
import subprocess

root_dir = os.environ["ROOT_DIR"]
port = os.environ["PORT"]
log_file = os.environ["LOG_FILE"]

with open(log_file, "ab", buffering=0) as log:
    process = subprocess.Popen(
        ["python3", "-m", "http.server", port, "-d", os.path.join(root_dir, "dist")],
        stdin=subprocess.DEVNULL,
        stdout=log,
        stderr=log,
        start_new_session=True,
    )

print(process.pid)
PY
  )"
  echo "${pid}" >"${PID_FILE}"

  sleep 1
  if kill -0 "${pid}" 2>/dev/null; then
    echo "Started background server on http://127.0.0.1:${PORT} (pid ${pid})"
    echo "Log: ${LOG_FILE}"
    return 0
  fi

  echo "Failed to start background server. Check ${LOG_FILE}" >&2
  rm -f "${PID_FILE}"
  return 1
}

stop_server() {
  if ! is_running; then
    rm -f "${PID_FILE}"
    echo "Server is not running"
    return 0
  fi

  local pid
  pid="$(cat "${PID_FILE}")"
  kill "${pid}"
  rm -f "${PID_FILE}"
  echo "Stopped server pid ${pid}"
}

status_server() {
  if is_running; then
    echo "Server is running on http://127.0.0.1:${PORT} (pid $(cat "${PID_FILE}"))"
    echo "Log: ${LOG_FILE}"
    return 0
  fi

  echo "Server is not running"
  return 1
}

case "${1:-start}" in
  start)
    start_server
    ;;
  stop)
    stop_server
    ;;
  status)
    status_server
    ;;
  restart)
    stop_server || true
    start_server
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart}" >&2
    exit 1
    ;;
esac
