from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth import authenticate
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'display_name', 'avatar', 'timezone', 'theme',
            'has_password', 'email_notifications_enabled',
            'study_reminder_enabled', 'study_reminder_time',
            'habit_reminder_enabled', 'habit_reminder_time',
            'goal_deadline_reminder_enabled', 'goal_deadline_reminder_days',
            'date_joined', 'last_login',
        ]
        read_only_fields = ['id', 'email', 'has_password', 'date_joined', 'last_login']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'display_name', 'avatar', 'timezone', 'theme',
            'email_notifications_enabled',
            'study_reminder_enabled', 'study_reminder_time',
            'habit_reminder_enabled', 'habit_reminder_time',
            'goal_deadline_reminder_enabled', 'goal_deadline_reminder_days',
        ]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    display_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=normalized).exists():
            raise ValidationError('A user with this email address already exists.')
        return normalized

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        display_name = validated_data.get('display_name', '')
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            display_name=display_name,
            has_password=True,
        )
        return user


class EmailLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            request=self.context.get('request'),
            username=data['email'],
            password=data['password'],
        )
        if not user:
            raise ValidationError({'detail': 'Invalid email or password.'})
        if not user.is_active:
            raise ValidationError({'detail': 'Account is disabled.'})
        if not user.has_password:
            raise ValidationError(
                {'detail': 'This account does not have a password set. Please sign in with Google.'}
            )
        data['user'] = user
        return data


class SetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise ValidationError('Passwords do not match.')
        return data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise ValidationError('Passwords do not match.')
        return data

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise ValidationError('Current password is incorrect.')
        return value
