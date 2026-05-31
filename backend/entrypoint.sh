#!/bin/sh
set -e

echo "Waiting for Postgres at $POSTGRES_HOST:$POSTGRES_PORT ..."
until python -c "import socket,os,sys; s=socket.socket(); s.settimeout(2)
try:
    s.connect((os.environ.get('POSTGRES_HOST','db'), int(os.environ.get('POSTGRES_PORT','5432')))); s.close()
except Exception: sys.exit(1)" 2>/dev/null; do
  echo "  ...still waiting for database"
  sleep 2
done
echo "Postgres is up."

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Seeding demo data (skips if data already exists)..."
python manage.py seed || true

echo "Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3
