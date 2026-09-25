#!/usr/bin/env bash
# guber.uz serverini Linux (Ubuntu) noutbukda o'rnatish
# Ishga tushirish ("server" papkasida):  bash install-linux.sh
set -euo pipefail
cd "$(dirname "$0")"

echo -e "\n=== guber.uz server o'rnatish (Linux) ===\n"

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker o'rnatilmoqda (parol so'ralishi mumkin)..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi
DOCKER="docker"
docker info >/dev/null 2>&1 || DOCKER="sudo docker"
sudo systemctl enable --now docker >/dev/null 2>&1 || true
echo "[OK] Docker ishlayapti"

# 2. Qopqoq yopilganda uxlamasin, uyqu o'chsin
if [ -f /etc/systemd/logind.conf ]; then
  sudo sed -i -E 's/^#?HandleLidSwitch=.*/HandleLidSwitch=ignore/; s/^#?HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
  grep -q '^HandleLidSwitch=' /etc/systemd/logind.conf || echo 'HandleLidSwitch=ignore' | sudo tee -a /etc/systemd/logind.conf >/dev/null
fi
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target >/dev/null 2>&1 || true
echo "[OK] Uyqu o'chirildi, qopqoq yopilsa ham ishlaydi (qayta yoqilgandan keyin to'liq kuchga kiradi)"

# 3. .env
[ -f .env ] || cp .env.example .env

# 4. Cloudflare
if ! grep -qE '^CF_TUNNEL_TOKEN=.+' .env; then
  echo -e "\nCloudflare sozlanadi. API token kerak bo'ladi (QOLLANMA.md, 3-qadam).\n"
  $DOCKER compose run --rm cf-setup
fi

# 5. Ishga tushirish
$DOCKER compose up -d
$DOCKER compose ps
echo -e "\n[OK] Server ishlayapti!"
echo "  Noutbukda tekshirish: http://localhost:8080"
echo "  Internetda:           https://guber.uz  (1-2 daqiqadan so'ng)"
