"""
Auth router — регистрация, вход, восстановление пароля.
Единый формат JSON для всех эндпоинтов.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import datetime

from ..dependencies import get_db
from ..auth import verify_password, get_password_hash, create_access_token
from .. import models, schemas

router = APIRouter(prefix="/auth", tags=["auth"])


# ──── Схемы для входа (JSON формат) ────
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ──── Вспомогательные функции ────

def get_user_by_username(db: Session, username: str) -> models.UserAccount | None:
    """Получить пользователя по имени."""
    return db.query(models.UserAccount).filter(
        models.UserAccount.username == username
    ).first()


def get_user_by_email(db: Session, email: str) -> models.UserAccount | None:
    """Получить пользователя по email."""
    return db.query(models.UserAccount).filter(
        models.UserAccount.email == email
    ).first()


def get_or_create_role(db: Session, role_name: str) -> models.UserRole:
    """Получить или создать роль."""
    role = db.query(models.UserRole).filter(
        models.UserRole.name == role_name
    ).first()
    if not role:
        role = models.UserRole(name=role_name)
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


# ──── Эндпоинты ────

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Вход по имени пользователя и паролю.
    Возвращает JWT токен для доступа к API.
    """
    # Поиск пользователя
    user = get_user_by_username(db, payload.username)
    
    # Проверка существования и активности
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован. Обратитесь к администратору."
        )
    
    # Проверка пароля
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль"
        )
    
    # Создание токена
    access_token = create_access_token({
        "sub": user.username,
        "role": user.role.name,
        "user_id": user.id
    })
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register")
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """
    Регистрация нового пользователя.
    Email обязателен для возможности восстановления пароля.
    При регистрации студента/преподавателя автоматически создаётся профиль.
    """
    # Проверяем уникальность имени пользователя
    existing_user = get_user_by_username(db, payload.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует"
        )

    # Проверяем уникальность email
    existing_email = get_user_by_email(db, payload.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    # Получаем или создаём роль
    role = get_or_create_role(db, payload.role)

    # Создаём пользователя с ФИО
    password_hash = get_password_hash(payload.password)
    user = models.UserAccount(
        username=payload.username,
        email=payload.email,
        password_hash=password_hash,
        is_active=True,
        role_id=role.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        patronymic=payload.patronymic,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Автоматическое создание профиля в зависимости от роли
    profile_info = {}
    
    if payload.role == "student":
        # Создаём студента
        student = models.Student(
            enrollment_year=datetime.datetime.now().year
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        
        # Создаём связь пользователь-студент
        link = models.UserStudentLink(
            user_account_id=user.id,
            student_id=student.id
        )
        db.add(link)
        db.commit()
        
        # Если указана группа - создаём StudentGroup
        if payload.group_id:
            # Находим основание "Поступление"
            reason = db.query(models.EnrollmentReason).filter(
                models.EnrollmentReason.name == "Поступление"
            ).first()
            
            sg = models.StudentGroup(
                student_id=student.id,
                group_id=payload.group_id,
                reason_id=reason.id if reason else 1,
                enrollment_date=datetime.date.today(),
                is_current=True
            )
            db.add(sg)
            db.commit()
        
        profile_info = {
            "student_id": student.id,
            "enrollment_year": student.enrollment_year
        }
        
    elif payload.role == "teacher":
        # Создаём преподавателя
        teacher = models.Teacher(
            department=None
        )
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        
        # Создаём связь пользователь-преподаватель
        link = models.UserTeacherLink(
            user_account_id=user.id,
            teacher_id=teacher.id
        )
        db.add(link)
        db.commit()
        
        profile_info = {
            "teacher_id": teacher.id
        }

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": role.name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "patronymic": user.patronymic,
        "profile": profile_info,
        "message": "Регистрация прошла успешно"
    }


@router.post("/password-reset")
def password_reset(payload: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Запрос на восстановление пароля.
    В демо-режиме возвращаем информацию о существовании email.
    """
    user = get_user_by_email(db, payload.email)

    # Всегда возвращаем одинаковое сообщение для безопасности
    # (чтобы нельзя было определить, существует ли email)
    response = {
        "message": "Если указанный email зарегистрирован в системе, вы можете сбросить пароль.",
    }
    
    # Для демо: показываем, найден ли email
    if user:
        response["email_exists"] = True
        response["username"] = user.username
    else:
        response["email_exists"] = False

    return response


@router.post("/reset-password")
def reset_password(payload: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Сброс пароля (демо-режим).
    Принимает email и новый пароль.
    В реальном приложении здесь должна быть проверка токена из email.
    """
    user = get_user_by_email(db, payload.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь с таким email не найден"
        )

    # Обновляем пароль
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {
        "message": "Пароль успешно изменён",
        "username": user.username
    }


@router.post("/verify-token")
def verify_token(token_data: dict, db: Session = Depends(get_db)):
    """
    Проверка валидности токена (для фронтенда).
    """
    from .auth import decode_access_token
    token = token_data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Токен не передан")
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Недействительный токен")
    username = payload.get("sub")
    user = db.query(models.UserAccount).filter(models.UserAccount.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден или деактивирован")
    return {"valid": True, "role": payload.get("role"), "username": username}
