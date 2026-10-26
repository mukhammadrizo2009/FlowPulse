import os
import sys

# Ensure backend is in sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

chdir = backend_dir
wsgi_app = 'core.wsgi:application'

def on_starting(server):
    """
    Runs once in Gunicorn master process before workers are forked.
    Guarantees database migrations and Site ID 1 exist.
    """
    try:
        import django
        from django.core.management import call_command
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
        django.setup()
        print("===> [FlowPulse DevOps] Gunicorn on_starting: Running migrations...")
        call_command('migrate', interactive=False)
        from django.contrib.sites.models import Site
        site_domain = os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'flowpulse.onrender.com')
        Site.objects.update_or_create(id=1, defaults={'domain': site_domain, 'name': 'FlowPulse'})
        print(f"===> [FlowPulse DevOps] Gunicorn on_starting: Migrations complete, Site 1 ready ({site_domain}).")
    except Exception as e:
        print(f"===> [FlowPulse DevOps] Gunicorn on_starting notice: {e}")
