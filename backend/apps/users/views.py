import requests
import json
from django.conf import settings
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.utils.crypto import get_random_string
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from allauth.socialaccount.models import SocialAccount
from .models import CustomUser
from .serializers import (
    UserSerializer, UserUpdateSerializer, EmailLoginSerializer,
    RegisterSerializer, SetPasswordSerializer, ChangePasswordSerializer
)


class LoginRateThrottle(AnonRateThrottle):
    rate = '10/minute'


@api_view(['GET'])
@permission_classes([AllowAny])
def google_auth_initiate(request):
    """Initiate Google OAuth flow. Returns the authorization URL."""
    state = get_random_string(32)
    request.session['oauth_state'] = state
    request.session.save()

    client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
    redirect_uri = settings.SOCIALACCOUNT_PROVIDERS.get('google', {}).get(
        'CALLBACK_URL',
        f"{settings.BACKEND_URL if hasattr(settings, 'BACKEND_URL') else 'http://localhost:8000'}/accounts/google/login/callback/"
    )

    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'access_type': 'online',
    }
    auth_url = 'https://accounts.google.com/o/oauth2/v2/auth?' + '&'.join(
        f'{k}={v}' for k, v in params.items()
    )
    return Response({'auth_url': auth_url})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Return the currently authenticated user."""
    if request.method == 'PATCH':
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def user_register(request):
    """Register a new user account with email and password."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        user_data = UserSerializer(user).data
        return Response(
            {
                'user': user_data,
                **user_data,
                'detail': 'Account created successfully.',
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def email_login(request):
    """Email + password login for users who have set a password."""
    serializer = EmailLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        user_data = UserSerializer(user).data
        return Response({
            'user': user_data,
            **user_data,
            'detail': 'Logged in successfully.',
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """Invalidate the session and log the user out."""
    logout(request)
    return Response({'detail': 'Logged out successfully.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_password(request):
    """Set a password for Google-authenticated users who don't have one yet."""
    if request.user.has_password:
        return Response(
            {'detail': 'Use change-password endpoint to update an existing password.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    serializer = SetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.has_password = True
        request.user.save(update_fields=['password', 'has_password'])
        return Response({'detail': 'Password set successfully.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change an existing password. Requires current password verification."""
    if not request.user.has_password:
        return Response(
            {'detail': 'No password set. Use set-password endpoint.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        # Keep session alive after password change
        from django.contrib.auth import update_session_auth_hash
        update_session_auth_hash(request, request.user)
        return Response({'detail': 'Password changed successfully.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """Get or update user profile settings."""
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Return a CSRF token for frontend use."""
    token = get_token(request)
    return Response({'csrfToken': token})
