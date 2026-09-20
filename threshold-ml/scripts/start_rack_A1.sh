#!/bin/bash
set -e
cd "$(dirname "$0")/.."
echo "Building rack-A1..."
sudo docker compose build rack-A1
echo "Starting rack-A1 + sidecar..."
sudo docker compose up -d rack-A1 retrain-rack-A1
echo ""
echo "Waiting for ingest..."
sleep 3
sudo docker logs --tail 20 threshold-ml-rack-A1-1 2>&1 | tail -20
echo ""
echo "Connect Pi to:"
echo "  Wi-Fi IP:   $(hostname -I | awk '{print $1}'):5000"
if command -v tailscale >/dev/null 2>&1; then
  echo "  Tailscale: $(tailscale ip -4 2>/dev/null | head -1):5000"
fi
echo ""
echo "Pi command:"
echo "  uv run python scripts/pi_stream_client.py --server $(hostname -I | awk '{print $1}'):5000"
echo ""
echo "Logs:"
echo "  sudo docker logs -f threshold-ml-rack-A1-1"
echo "  sudo docker logs -f threshold-ml-retrain-rack-A1-1"
