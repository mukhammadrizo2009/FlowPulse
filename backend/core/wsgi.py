import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
application = get_wsgi_application()

# DevOps fail-safe: Ensure database tables & Site ID 1 exist on startup
try:
    from django.db import connection
    from django.core.management import call_command
    with connection.cursor() as cursor:
        tables = connection.introspection.table_names(cursor)
        if 'django_site' not in tables:
            print("===> [FlowPulse DevOps] Database tables missing. Running automatic migration...")
            call_command('migrate', interactive=False)
            from django.contrib.sites.models import Site
            site_domain = os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'flowpulse.onrender.com')
            Site.objects.update_or_create(id=1, defaults={'domain': site_domain, 'name': 'FlowPulse'})
            print("===> [FlowPulse DevOps] Automatic migration completed and Site 1 configured.")
        else:
            from django.contrib.sites.models import Site
            if not Site.objects.filter(id=1).exists():
                site_domain = os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'flowpulse.onrender.com')
                Site.objects.create(id=1, domain=site_domain, name='FlowPulse')
except Exception as e:
    print(f"===> [FlowPulse DevOps] WSGI database check note: {e}")
