import jwt
import os
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Usuario


def generar_token(usuario):
    payload = {
        'id': usuario.id,
        'email': usuario.email,
        'rol': usuario.rol.nombre,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow(),
    }
    token = jwt.encode(payload, os.getenv('SECRET_KEY'), algorithm='HS256')
    return token


def verificar_token(token):
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token expirado')
    except jwt.InvalidTokenError:
        raise Exception('Token inválido')


def obtener_usuario_desde_request(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = verificar_token(token)
        usuario = Usuario.objects.select_related('rol').get(pk=payload['id'])
        return usuario
    except Exception:
        return None