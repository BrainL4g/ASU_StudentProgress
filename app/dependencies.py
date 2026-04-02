from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import SessionLocal
from .config import SECRET_KEY, ALGORITHM
from . import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.UserAccount:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        from .auth import decode_access_token
        payload = decode_access_token(token)
        if payload is None:
            raise credentials_exception
        username = payload.get("sub")
        if not isinstance(username, str):
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = db.query(models.UserAccount).filter(models.UserAccount.username == username).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован"
        )
    return user


def require_admin(current_user: models.UserAccount = Depends(get_current_user)) -> models.UserAccount:
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ только для администраторов")
    return current_user


def get_current_student(current_user: models.UserAccount = Depends(get_current_user), db: Session = Depends(get_db)) -> models.Student:
    if current_user.role.name != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ только для студентов")
    link = db.query(models.UserStudentLink).filter(
        models.UserStudentLink.user_account_id == current_user.id
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль студента не найден")
    return link.student


def get_current_teacher(current_user: models.UserAccount = Depends(get_current_user), db: Session = Depends(get_db)) -> models.Teacher:
    if current_user.role.name != "teacher":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ только для преподавателей")
    link = db.query(models.UserTeacherLink).filter(
        models.UserTeacherLink.user_account_id == current_user.id
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Профиль преподавателя не найден")
    return link.teacher
