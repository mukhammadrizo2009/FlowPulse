#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "===> Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

echo "===> Collecting static files..."
python manage.py collectstatic --noinput

echo "===> Applying database migrations..."
python manage.py migrate

echo "===> Build completed successfully!"
