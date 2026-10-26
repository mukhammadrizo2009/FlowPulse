import os
import sys

# Ensure backend is in sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Automatically change working directory to backend so all Django paths resolve
chdir = backend_dir
wsgi_app = 'core.wsgi:application'
