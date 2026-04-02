"""
Pydantic схемы для валидации данных API.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import datetime
import re


# ──── Auth schemas ────

class Token(BaseModel):
    access_token: str
    token_type: str


class UserRoleSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class UserRegister(BaseModel):
    """Схема регистрации с валидацией."""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default='student')
    # ФИО (необязательные)
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    patronymic: Optional[str] = Field(None, min_length=2, max_length=100)

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Только буквы, цифры и _')
        return v

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if '@' not in v or '.' not in v.split('@')[-1]:
            raise ValueError('Некорректный формат email')
        return v.lower()

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ['student', 'teacher', 'admin']:
            raise ValueError('Роль: student, teacher или admin')
        return v


class PasswordResetRequest(BaseModel):
    email: str = Field(..., min_length=5)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if '@' not in v:
            raise ValueError('Некорректный формат email')
        return v.lower()


class PasswordResetConfirm(BaseModel):
    email: str = Field(..., min_length=5)
    new_password: str = Field(..., min_length=6, max_length=100)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if '@' not in v:
            raise ValueError('Некорректный формат email')
        return v.lower()


# ──── User schemas ────

class UserAccountCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    role_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None


class UserAccountUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None


class UserAccountSchema(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    is_active: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None
    role: UserRoleSchema

    class Config:
        from_attributes = True


# ──── Group schemas ────

class GroupSchema(BaseModel):
    id: int
    name: str
    course: Optional[str] = None

    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    name: str
    course: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    course: Optional[str] = None


# ──── Subject schemas ────

class SubjectSchema(BaseModel):
    id: int
    code: str
    name: str
    credits: float

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    code: str
    name: str
    credits: float = 0


class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    credits: Optional[float] = None


# ──── Semester schemas ────

class SemesterSchema(BaseModel):
    id: int
    year: int
    term: str

    class Config:
        from_attributes = True


class SemesterCreate(BaseModel):
    year: int
    term: str


class SemesterUpdate(BaseModel):
    year: Optional[int] = None
    term: Optional[str] = None


# ──── ControlType schemas ────

class ControlTypeSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ControlTypeCreate(BaseModel):
    name: str


# ──── Student schemas ────

class StudentSchema(BaseModel):
    id: int
    group_id: Optional[int] = None
    enrollment_year: Optional[int] = None

    class Config:
        from_attributes = True


class StudentCreate(BaseModel):
    group_id: Optional[int] = None
    enrollment_year: Optional[int] = None


class StudentUpdate(BaseModel):
    group_id: Optional[int] = None
    enrollment_year: Optional[int] = None


class UserAccountBrief(BaseModel):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None

    class Config:
        from_attributes = True


class StudentWithGroup(BaseModel):
    id: int
    group_id: Optional[int] = None
    enrollment_year: Optional[int] = None
    group: Optional[GroupSchema] = None
    user_account: Optional[UserAccountBrief] = None

    class Config:
        from_attributes = True


# ──── Teacher schemas ────

class TeacherSchema(BaseModel):
    id: int
    department: Optional[str] = None

    class Config:
        from_attributes = True


class TeacherCreate(BaseModel):
    department: Optional[str] = None


class TeacherUpdate(BaseModel):
    department: Optional[str] = None


# ──── GroupSubject schemas ────

class GroupSubjectBase(BaseModel):
    group_id: int
    subject_id: int
    semester_id: int
    teacher_id: Optional[int] = None


class GroupSubjectCreate(GroupSubjectBase):
    pass


class GroupSubjectSchema(BaseModel):
    id: int
    group_id: int
    subject_id: int
    semester_id: int
    teacher_id: Optional[int] = None
    group: Optional[GroupSchema] = None
    subject: Optional[SubjectSchema] = None
    semester: Optional[SemesterSchema] = None
    teacher: Optional[TeacherSchema] = None

    class Config:
        from_attributes = True


# ──── Grade schemas ────

class GradeBase(BaseModel):
    student_id: int
    subject_id: int
    control_type_id: int
    value: float = Field(ge=0, le=5, description="Оценка от 0 до 5")


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    value: float = Field(ge=0, le=5, description="Оценка от 0 до 5")
    reason: Optional[str] = None  # Причина изменения


class GradeSchema(BaseModel):
    id: int
    student_id: int
    subject_id: int
    control_type_id: int
    value: float
    date: Optional[datetime.date] = None
    teacher_id: Optional[int] = None
    subject: Optional[SubjectSchema] = None
    control_type: Optional[ControlTypeSchema] = None
    history: List["GradeHistorySchema"] = []

    class Config:
        from_attributes = True


class GradeHistorySchema(BaseModel):
    id: int
    grade_id: int
    old_value: Optional[float] = None
    new_value: float
    changed_at: Optional[datetime.datetime] = None
    changed_by_id: Optional[int] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class GradeWithHistory(BaseModel):
    grade: "GradeSchema"
    history: List[GradeHistorySchema] = []


# ──── Attendance schemas ────

class AttendanceBase(BaseModel):
    student_id: int
    group_subject_id: int
    date: Optional[datetime.date] = None
    status: str = Field(..., pattern="^(present|absent|late)$")


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: str = Field(..., pattern="^(present|absent|late)$")


class AttendanceSchema(BaseModel):
    id: int
    student_id: int
    group_subject_id: int
    date: Optional[datetime.date] = None
    status: str

    class Config:
        from_attributes = True


# ──── Appeal schemas ────

class AppealBase(BaseModel):
    subject_id: int
    description: str


class AppealCreate(AppealBase):
    pass


class AppealUpdate(BaseModel):
    status: Optional[str] = None
    comment: Optional[str] = None  # Комментарий администратора


class AppealSchema(BaseModel):
    id: int
    student_id: int
    subject_id: int
    description: Optional[str] = None
    status: str
    comment: Optional[str] = None
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None
    subject: Optional[SubjectSchema] = None

    class Config:
        from_attributes = True


# ──── Stats schemas ────

class StudentStatsSchema(BaseModel):
    id: int
    student_id: int
    gpa: float
    total_grades: int

    class Config:
        from_attributes = True


# ──── Link schemas ────

class UserStudentLinkCreate(BaseModel):
    user_account_id: int
    student_id: int


class UserStudentLinkSchema(BaseModel):
    id: int
    user_account_id: int
    student_id: int
    user_account: Optional[UserAccountSchema] = None

    class Config:
        from_attributes = True


class UserTeacherLinkCreate(BaseModel):
    user_account_id: int
    teacher_id: int


class UserTeacherLinkSchema(BaseModel):
    id: int
    user_account_id: int
    teacher_id: int
    user_account: Optional[UserAccountSchema] = None

    class Config:
        from_attributes = True


# ──── Composite schemas ────

class StudentFullProfile(BaseModel):
    id: int
    group_id: Optional[int] = None
    enrollment_year: Optional[int] = None
    group: Optional[GroupSchema] = None
    stats: Optional[StudentStatsSchema] = None
    grades: List[GradeSchema] = []
    attendance: List[AttendanceSchema] = []
    appeals: List[AppealSchema] = []

    class Config:
        from_attributes = True


class AppealWithStudent(BaseModel):
    id: int
    student_id: int
    subject_id: int
    description: Optional[str] = None
    status: str
    comment: Optional[str] = None
    created_at: Optional[datetime.datetime] = None
    subject: Optional[SubjectSchema] = None
    student: Optional[StudentWithGroup] = None

    class Config:
        from_attributes = True
