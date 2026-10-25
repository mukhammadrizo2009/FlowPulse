from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'display_name', 'has_password', 'is_active', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'has_password']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('display_name', 'avatar', 'timezone', 'theme')}),
        ('Notifications', {
            'fields': (
                'email_notifications_enabled', 'study_reminder_enabled', 'study_reminder_time',
                'habit_reminder_enabled', 'habit_reminder_time',
                'goal_deadline_reminder_enabled', 'goal_deadline_reminder_days',
            )
        }),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'password1', 'password2')}),
    )
    search_fields = ['email', 'display_name']
    ordering = ['-date_joined']
    filter_horizontal = ['groups', 'user_permissions']
