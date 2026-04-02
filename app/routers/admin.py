from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db, require_admin
from ..auth import get_password_hash
from .. import models
from ..schemas import (
    GroupSchema, GroupCreate, GroupUpdate,
    SubjectSchema, SubjectCreate, SubjectUpdate,
    SemesterSchema, SemesterCreate, SemesterUpdate,
    ControlTypeSchema, ControlTypeCreate,
    StudentSchema, StudentCreate, StudentUpdate, StudentWithGroup,
    TeacherSchema, TeacherCreate, TeacherUpdate,
    UserAccountSchema, UserAccountCreate, UserAccountUpdate,
    GroupSubjectSchema, GroupSubjectCreate,
    UserStudentLinkCreate, UserTeacherLinkCreate,
    AppealSchema, AppealUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])

# === GROUPS ===
@router.get("/groups", response_model=list[GroupSchema])
def list_groups(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.Group).all()


@router.post("/groups", response_model=GroupSchema)
def create_group(
    group: GroupCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    existing = db.query(models.Group).filter(models.Group.name == group.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Группа с таким названием уже существует")
    db_group = models.Group(**group.dict())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group


@router.get("/groups/{group_id}", response_model=GroupSchema)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    return group


@router.put("/groups/{group_id}", response_model=GroupSchema)
def update_group(
    group_id: int,
    group_update: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    for key, value in group_update.dict(exclude_unset=True).items():
        setattr(group, key, value)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/groups/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    db.delete(group)
    db.commit()
    return {"message": "Группа удалена"}


# === SUBJECTS ===
@router.get("/subjects", response_model=list[SubjectSchema])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.Subject).all()


@router.post("/subjects", response_model=SubjectSchema)
def create_subject(
    subject: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    existing = db.query(models.Subject).filter(models.Subject.code == subject.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Предмет с таким кодом уже существует")
    db_subject = models.Subject(**subject.dict())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject


@router.get("/subjects/{subject_id}", response_model=SubjectSchema)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectSchema)
def update_subject(
    subject_id: int,
    subject_update: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    for key, value in subject_update.dict(exclude_unset=True).items():
        setattr(subject, key, value)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    db.delete(subject)
    db.commit()
    return {"message": "Предмет удален"}


# === SEMESTERS ===
@router.get("/semesters", response_model=list[SemesterSchema])
def list_semesters(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.Semester).all()


@router.post("/semesters", response_model=SemesterSchema)
def create_semester(
    semester: SemesterCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    db_semester = models.Semester(**semester.dict())
    db.add(db_semester)
    db.commit()
    db.refresh(db_semester)
    return db_semester


@router.get("/semesters/{semester_id}", response_model=SemesterSchema)
def get_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Семестр не найден")
    return semester


@router.put("/semesters/{semester_id}", response_model=SemesterSchema)
def update_semester(
    semester_id: int,
    semester_update: SemesterUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Семестр не найден")
    for key, value in semester_update.dict(exclude_unset=True).items():
        setattr(semester, key, value)
    db.commit()
    db.refresh(semester)
    return semester


@router.delete("/semesters/{semester_id}")
def delete_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Семестр не найден")
    db.delete(semester)
    db.commit()
    return {"message": "Семестр удален"}


# === CONTROL TYPES ===
@router.get("/control-types", response_model=list[ControlTypeSchema])
def list_control_types(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.ControlType).all()


@router.post("/control-types", response_model=ControlTypeSchema)
def create_control_type(
    control_type: ControlTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    existing = db.query(models.ControlType).filter(models.ControlType.name == control_type.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Тип контроля уже существует")
    db_ct = models.ControlType(**control_type.dict())
    db.add(db_ct)
    db.commit()
    db.refresh(db_ct)
    return db_ct


@router.delete("/control-types/{ct_id}")
def delete_control_type(
    ct_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    ct = db.query(models.ControlType).filter(models.ControlType.id == ct_id).first()
    if not ct:
        raise HTTPException(status_code=404, detail="Тип контроля не найден")
    db.delete(ct)
    db.commit()
    return {"message": "Тип контроля удален"}


# === STUDENTS ===
@router.get("/students", response_model=list[StudentWithGroup])
def list_students(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.Student).all()


@router.post("/students", response_model=StudentSchema)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    db_student = models.Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@router.get("/students/{student_id}", response_model=StudentWithGroup)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    return student


@router.put("/students/{student_id}", response_model=StudentSchema)
def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    for key, value in student_update.dict(exclude_unset=True).items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    db.delete(student)
    db.commit()
    return {"message": "Студент удален"}


# === TEACHERS ===
@router.get("/teachers", response_model=list[TeacherSchema])
def list_teachers(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.Teacher).all()


@router.post("/teachers", response_model=TeacherSchema)
def create_teacher(
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    db_teacher = models.Teacher(**teacher.dict())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher


@router.get("/teachers/{teacher_id}", response_model=TeacherSchema)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    return teacher


@router.put("/teachers/{teacher_id}", response_model=TeacherSchema)
def update_teacher(
    teacher_id: int,
    teacher_update: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    for key, value in teacher_update.dict(exclude_unset=True).items():
        setattr(teacher, key, value)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/teachers/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    db.delete(teacher)
    db.commit()
    return {"message": "Преподаватель удален"}


# === USER ACCOUNTS ===
@router.get("/users", response_model=list[UserAccountSchema])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.UserAccount).all()


@router.post("/users", response_model=UserAccountSchema)
def create_user(
    user: UserAccountCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    existing = db.query(models.UserAccount).filter(models.UserAccount.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
    password_hash = get_password_hash(user.password)
    db_user = models.UserAccount(
        username=user.username,
        password_hash=password_hash,
        role_id=user.role_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users/{user_id}", response_model=UserAccountSchema)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.put("/users/{user_id}", response_model=UserAccountSchema)
def update_user(
    user_id: int,
    user_update: UserAccountUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user_update.username:
        existing = db.query(models.UserAccount).filter(
            models.UserAccount.username == user_update.username,
            models.UserAccount.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Имя пользователя уже занято")
        user.username = user_update.username
    if user_update.password:
        user.password_hash = get_password_hash(user_update.password)
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.first_name is not None:
        user.first_name = user_update.first_name
    if user_update.last_name is not None:
        user.last_name = user_update.last_name
    if user_update.patronymic is not None:
        user.patronymic = user_update.patronymic
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/toggle-active", response_model=UserAccountSchema)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    user = db.query(models.UserAccount).filter(models.UserAccount.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.role.name == "admin":
        raise HTTPException(status_code=400, detail="Нельзя удалить администратора")
    db.delete(user)
    db.commit()
    return {"message": "Пользователь удален"}


# === USER-STUDENT LINKS ===
@router.post("/link-student")
def link_user_to_student(
    link: UserStudentLinkCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    user = db.query(models.UserAccount).filter(models.UserAccount.id == link.user_account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    student = db.query(models.Student).filter(models.Student.id == link.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    existing = db.query(models.UserStudentLink).filter(
        models.UserStudentLink.user_account_id == link.user_account_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже привязан к студенту")
    db_link = models.UserStudentLink(**link.dict())
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return {"message": "Связь создана"}


@router.post("/link-teacher")
def link_user_to_teacher(
    link: UserTeacherLinkCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    user = db.query(models.UserAccount).filter(models.UserAccount.id == link.user_account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    teacher = db.query(models.Teacher).filter(models.Teacher.id == link.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    existing = db.query(models.UserTeacherLink).filter(
        models.UserTeacherLink.user_account_id == link.user_account_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже привязан к преподавателю")
    db_link = models.UserTeacherLink(**link.dict())
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return {"message": "Связь создана"}


# === GROUP-SUBJECT ===
@router.get("/group-subjects", response_model=list[GroupSubjectSchema])
def list_group_subjects(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.GroupSubject).all()


@router.post("/group-subjects", response_model=GroupSubjectSchema)
def create_group_subject(
    gs: GroupSubjectCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    db_gs = models.GroupSubject(**gs.dict())
    db.add(db_gs)
    db.commit()
    db.refresh(db_gs)
    return db_gs


# === APPEALS ===
@router.get("/appeals", response_model=list[AppealSchema])
def list_appeals(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    return db.query(models.Appeal).all()


@router.put("/appeals/{appeal_id}", response_model=AppealSchema)
def update_appeal(
    appeal_id: int,
    appeal_update: AppealUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(require_admin)
):
    appeal = db.query(models.Appeal).filter(models.Appeal.id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="Апелляция не найдена")
    if appeal_update.status:
        appeal.status = appeal_update.status
    if appeal_update.comment is not None:
        appeal.comment = appeal_update.comment
    db.commit()
    db.refresh(appeal)
    return appeal
