#!/usr/bin/env bash
# Setup server Ubuntu (22.04 / 24.04) untuk Knowledge Base Retro.
# Jalankan dari dalam folder repo yang sudah di-clone:
#   sudo bash deploy/setup.sh kb.domainkamu.com email@kamu.com
# Aman dijalankan ulang (idempotent): langkah yang sudah selesai akan dilewati.
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_USER="${SUDO_USER:-ubuntu}"
DB_NAME="knowledge_base"
DB_USER="kb"
PHP_VER="8.3"

say()  { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    ✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;31m    ! %s\033[0m\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "Jalankan dengan sudo: sudo bash deploy/setup.sh <domain> <email>"; exit 1; }
[[ -f "$APP_DIR/artisan" ]] || { echo "Script harus berada di folder deploy/ di dalam repo."; exit 1; }

if [[ -z "$DOMAIN" ]]; then read -rp "Subdomain aplikasi (mis. kb.domainkamu.com): " DOMAIN; fi
if [[ -z "$EMAIL" ]]; then read -rp "Email untuk sertifikat HTTPS (Let's Encrypt): " EMAIL; fi
[[ -n "$DOMAIN" ]] || { echo "Domain wajib diisi."; exit 1; }

# umask 002 supaya file baru di storage/ tetap bisa ditulis grup www-data (PHP-FPM).
as_app() { sudo -u "$APP_USER" -H bash -c "umask 002 && cd '$APP_DIR' && $*"; }

# ───────────────────────── 1. Paket sistem ─────────────────────────
say "Memasang paket sistem (Nginx, PHP $PHP_VER, PostgreSQL, Node, Composer)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq software-properties-common curl unzip git ca-certificates gnupg >/dev/null

if ! apt-cache show "php${PHP_VER}-fpm" >/dev/null 2>&1; then
  add-apt-repository -y ppa:ondrej/php >/dev/null
  apt-get update -qq
fi
apt-get install -y -qq nginx postgresql \
  "php${PHP_VER}-fpm" "php${PHP_VER}-cli" "php${PHP_VER}-pgsql" "php${PHP_VER}-mbstring" \
  "php${PHP_VER}-xml" "php${PHP_VER}-curl" "php${PHP_VER}-zip" "php${PHP_VER}-bcmath" \
  "php${PHP_VER}-intl" "php${PHP_VER}-sqlite3" certbot python3-certbot-nginx >/dev/null
ok "Nginx, PHP $PHP_VER, PostgreSQL"

if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
ok "Node $(node -v)"

if ! command -v composer >/dev/null; then
  curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
  php /tmp/composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
  rm -f /tmp/composer-setup.php
fi
ok "Composer $(composer --version 2>/dev/null | awk '{print $3}')"

# ───────────────────────── 2. Database ─────────────────────────
say "Menyiapkan database PostgreSQL…"
systemctl enable --now postgresql >/dev/null
if [[ -f "$APP_DIR/.env" ]] && grep -q '^DB_PASSWORD=.\+' "$APP_DIR/.env"; then
  DB_PASS="$(grep '^DB_PASSWORD=' "$APP_DIR/.env" | cut -d= -f2-)"
else
  DB_PASS="$(openssl rand -hex 16)"
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
  sudo -u postgres psql -q -c "CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';"
else
  sudo -u postgres psql -q -c "ALTER ROLE $DB_USER WITH PASSWORD '$DB_PASS';"
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  sudo -u postgres psql -q -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
fi
ok "Database $DB_NAME (user $DB_USER)"

# ───────────────────────── 3. Konfigurasi aplikasi ─────────────────────────
say "Menyiapkan file .env…"
FIRST_INSTALL=0
ADMIN_PASS=""
if [[ ! -f "$APP_DIR/.env" ]]; then
  FIRST_INSTALL=1
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  ADMIN_PASS="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)"
fi
set_env() { # set_env KEY VALUE
  local k="$1" v="$2"
  if grep -q "^${k}=" "$APP_DIR/.env"; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$APP_DIR/.env"
  else
    echo "${k}=${v}" >> "$APP_DIR/.env"
  fi
}
set_env APP_ENV production
set_env APP_DEBUG false
set_env APP_URL "https://${DOMAIN}"
set_env LOG_LEVEL warning
set_env DB_CONNECTION pgsql
set_env DB_HOST 127.0.0.1
set_env DB_PORT 5432
set_env DB_DATABASE "$DB_NAME"
set_env DB_USERNAME "$DB_USER"
set_env DB_PASSWORD "$DB_PASS"
set_env SESSION_SECURE_COOKIE true
if [[ -n "$ADMIN_PASS" ]]; then
  set_env KB_ADMIN_EMAIL "${EMAIL:-admin@${DOMAIN}}"
  set_env KB_ADMIN_PASSWORD "$ADMIN_PASS"
fi
chown "$APP_USER":www-data "$APP_DIR/.env"
chmod 640 "$APP_DIR/.env"
ok ".env siap"

# ───────────────────────── 4. Build aplikasi ─────────────────────────
say "Memasang dependensi dan build (bisa beberapa menit)…"
chown -R "$APP_USER":www-data "$APP_DIR"
usermod -aG www-data "$APP_USER"
find "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" -type d -exec chmod 2775 {} +
as_app "composer install --no-dev --optimize-autoloader --no-interaction --quiet"
grep -q '^APP_KEY=.\+' "$APP_DIR/.env" || as_app "php artisan key:generate --force"
as_app "npm ci --no-audit --no-fund --silent && npm run build --silent"
as_app "php artisan migrate --force"
if [[ $FIRST_INSTALL -eq 1 ]]; then
  as_app "php artisan db:seed --force"
fi
chmod -R ug+rwX "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"
chgrp -R www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"
as_app "php artisan optimize"
ok "Aplikasi ter-build dan database ter-migrasi"

# ───────────────────────── 5. Nginx ─────────────────────────
say "Mengonfigurasi Nginx untuk $DOMAIN…"
SITE="/etc/nginx/sites-available/knowledge_base_retro"
cat > "$SITE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    root ${APP_DIR}/public;
    index index.php;
    charset utf-8;
    client_max_body_size 20M;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.svg { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location /build/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ ^/index\.php(/|\$) {
        fastcgi_pass unix:/run/php/php${PHP_VER}-fpm.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)\$;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT \$realpath_root;
        fastcgi_read_timeout 120;
        internal;
    }

    location ~ /\.(?!well-known).* { deny all; }
    location ~ \.php\$ { return 404; }
}
NGINX
ln -sf "$SITE" /etc/nginx/sites-enabled/knowledge_base_retro
# Matikan situs default Nginx hanya bila tidak ada situs lain yang aktif.
if [[ -e /etc/nginx/sites-enabled/default ]] && [[ "$(ls /etc/nginx/sites-enabled | wc -l)" -le 2 ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi
nginx -t
systemctl enable --now "php${PHP_VER}-fpm" nginx >/dev/null
systemctl reload nginx
ok "Nginx aktif untuk http://$DOMAIN"

# ───────────────────────── 6. HTTPS ─────────────────────────
say "Memasang HTTPS (Let's Encrypt)…"
SERVER_IP="$(curl -fsS4 https://api.ipify.org || true)"
DNS_IP="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)"
if [[ -d "/etc/letsencrypt/live/$DOMAIN" || ( -n "$EMAIL" && -n "$DNS_IP" && "$DNS_IP" == "$SERVER_IP" ) ]]; then
  # --keep-until-expiring: bila sertifikat sudah ada, cukup pasang ulang ke konfigurasi Nginx.
  if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "${EMAIL:-admin@$DOMAIN}" --redirect --keep-until-expiring; then
    ok "HTTPS aktif: https://$DOMAIN"
  else
    warn "Certbot gagal. Pastikan port 80 & 443 terbuka di firewall/security group, lalu jalankan: sudo certbot --nginx -d $DOMAIN"
  fi
else
  warn "DNS $DOMAIN belum mengarah ke server ini (DNS: ${DNS_IP:-tidak ada}, server: ${SERVER_IP:-?})."
  warn "Setelah record A benar, jalankan: sudo certbot --nginx -d $DOMAIN -m $EMAIL --agree-tos --redirect"
fi

# ───────────────────────── Selesai ─────────────────────────
say "Selesai!"
echo "    Aplikasi : https://$DOMAIN"
echo "    Admin    : https://$DOMAIN/login"
if [[ -n "$ADMIN_PASS" ]]; then
  echo "    Email    : $(grep '^KB_ADMIN_EMAIL=' "$APP_DIR/.env" | cut -d= -f2-)"
  echo "    Password : $ADMIN_PASS"
  echo
  echo "    Simpan password di atas lalu ganti setelah login (menu Pengguna)."
  echo "    Setelah itu hapus baris KB_ADMIN_PASSWORD dari $APP_DIR/.env."
fi
echo "    Atur provider AI di menu Admin → Pengaturan AI."
