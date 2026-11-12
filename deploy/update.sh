#!/usr/bin/env bash
# Tarik kode terbaru dari GitHub lalu build ulang. Jalankan sebagai user pemilik aplikasi:
#   bash deploy/update.sh
set -euo pipefail
umask 002
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "==> Menarik kode terbaru…"
git fetch --quiet origin main
git reset --hard origin/main

echo "==> Dependensi & build…"
composer install --no-dev --optimize-autoloader --no-interaction --quiet
npm ci --no-audit --no-fund --silent
npm run build --silent

echo "==> Migrasi database…"
php artisan migrate --force
php artisan optimize

echo "==> Selesai: $(git log -1 --format='%h %s')"
