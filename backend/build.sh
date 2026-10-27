#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "===> Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# If node/npm exists, build latest frontend
if command -v npm &> /dev/null && [ -d "../frontend" ]; then
    echo "===> Building frontend assets..."
    (cd ../frontend && npm install --legacy-peer-deps && npm run build && cp -r dist/* ../backend/frontend_dist/ || true)
fi

echo "===> Collecting static files..."
python manage.py collectstatic --noinput

echo "===> Applying database migrations..."
python manage.py migrate --noinput

echo "===> Build completed successfully!"
