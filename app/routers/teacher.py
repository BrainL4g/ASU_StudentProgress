from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
import datetime
import csv
import io

from ..dependencies import get_db, get_current_teacher
from .. import models
from ..schemas import (
    GradeSchema, GradeCreate, GradeUpdate, GradeHistorySchema, GradeWithHistory,
    AttendanceSchema, AttendanceCreate, AttendanceUpdate,
    StudentWithGroup, SubjectSchema, GroupSubjectSchema,
    ControlTypeSchema,
)

router = APIRouter(prefix="/teacher", tags=["teacher"])


def verify_teacher_has_access_to_group_subject(
    db: Session,
    teacher_id: int,
    group_id: int,
    subject_id: int
) -> bool:
    """Проверить, что преподаватель ведёт данную дисциплину у группы."""
    gs = db.query(models.GroupSubject).filter(
        models.GroupSubject.teacher_id == teacher_id,
        models.GroupSubject.group_id == group_id,
        models.GroupSubject.subject_id == subject_id
    ).first()
    return gs is not None


def verify_teacher_has_access_to_student(
    db: Session,
    teacher_id: int,
    student_id: int
) -> bool:
    """Проверить, что преподаватель ведёт хотя бы одну дисциплину у группы студента."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student or not student.group_id:
        return False
    
    gs = db.query(models.GroupSubject).filter(
        models.GroupSubject.teacher_id == teacher_id,
        models.GroupSubject.group_id == student.group_id
    ).first()
    return gs is not None


@router.get("/my-group-subjects", response_model=List[GroupSubjectSchema])
def get_my_group_subjects(
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить все связи групп и дисциплин, закреплённые за текущим преподавателем."""
    return db.query(models.GroupSubject).options(
        joinedload(models.GroupSubject.group),
        joinedload(models.GroupSubject.subject),
        joinedload(models.GroupSubject.semester),
        joinedload(models.GroupSubject.teacher)
    ).filter(
        models.GroupSubject.teacher_id == teacher.id
    ).all()


@router.get("/students", response_model=List[StudentWithGroup])
def get_my_students(
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить студентов, которым преподаватель выставлял оценки."""
    # Получаем группы, где преподаватель ведёт дисциплины
    group_ids = db.query(models.GroupSubject.group_id).filter(
        models.GroupSubject.teacher_id == teacher.id
    ).distinct().all()
    group_ids = [g[0] for g in group_ids]
    
    if not group_ids:
        return []
    
    students = db.query(models.Student).filter(
        models.Student.group_id.in_(group_ids)
    ).all()
    
    return students


@router.get("/subjects", response_model=List[SubjectSchema])
def get_my_subjects(
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить дисциплины преподавателя."""
    # Получаем дисциплины через GroupSubject
    subject_ids = db.query(models.GroupSubject.subject_id).filter(
        models.GroupSubject.teacher_id == teacher.id
    ).distinct().all()
    subject_ids = [s[0] for s in subject_ids]
    
    if not subject_ids:
        return []
    
    subjects = db.query(models.Subject).filter(
        models.Subject.id.in_(subject_ids)
    ).all()
    
    return subjects


@router.get("/group-subjects", response_model=List[GroupSubjectSchema])
def get_group_subjects(
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить все связи групп и дисциплин (legacy endpoint)."""
    return db.query(models.GroupSubject).options(
        joinedload(models.GroupSubject.group),
        joinedload(models.GroupSubject.subject),
        joinedload(models.GroupSubject.semester),
        joinedload(models.GroupSubject.teacher)
    ).all()


@router.get("/students-by-group/{group_id}", response_model=List[StudentWithGroup])
def get_students_by_group(
    group_id: int,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить студентов по ID группы (только если преподаватель ведёт дисциплины в этой группе)."""
    # Проверяем, что преподаватель ведёт дисциплины в этой группе
    gs = db.query(models.GroupSubject).filter(
        models.GroupSubject.teacher_id == teacher.id,
        models.GroupSubject.group_id == group_id
    ).first()
    
    if not gs:
        raise HTTPException(
            status_code=403,
            detail="У вас нет дисциплин в этой группе"
        )
    
    students = db.query(models.Student).options(
        joinedload(models.Student.group)
    ).filter(
        models.Student.group_id == group_id
    ).all()
    
    # Добавляем информацию о пользователе к каждому студенту
    result = []
    for student in students:
        student_dict = {
            "id": student.id,
            "group_id": student.group_id,
            "enrollment_year": student.enrollment_year,
            "group": student.group,
            "user_account": None
        }
        # Получаем связь с пользователем
        user_link = db.query(models.UserStudentLink).filter(
            models.UserStudentLink.student_id == student.id
        ).first()
        if user_link and user_link.user_account:
            ua = user_link.user_account
            student_dict["user_account"] = {
                "id": ua.id,
                "username": ua.username,
                "first_name": ua.first_name,
                "last_name": ua.last_name,
                "patronymic": ua.patronymic
            }
        result.append(student_dict)
    
    return result


@router.get("/grades", response_model=List[GradeSchema])
def get_all_grades(
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить все оценки преподавателя."""
    grades = db.query(models.Grade).options(
        joinedload(models.Grade.subject),
        joinedload(models.Grade.control_type),
    ).filter(
        models.Grade.teacher_id == teacher.id
    ).all()
    return grades


@router.post("/grades", response_model=GradeSchema)
def assign_grade(
    grade_data: GradeCreate,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Выставить оценку студенту."""
    # Получаем студента и проверяем группу
    student = db.query(models.Student).filter(models.Student.id == grade_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    
    if not student.group_id:
        raise HTTPException(status_code=400, detail="Студент не привязан к группе")
    
    # Проверяем, что преподаватель ведёт эту дисциплину в группе студента
    if not verify_teacher_has_access_to_group_subject(db, teacher.id, student.group_id, grade_data.subject_id):
        raise HTTPException(
            status_code=403,
            detail="Вы не ведёте эту дисциплину в группе данного студента"
        )
    
    existing = db.query(models.Grade).filter(
        models.Grade.student_id == grade_data.student_id,
        models.Grade.subject_id == grade_data.subject_id,
        models.Grade.control_type_id == grade_data.control_type_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Оценка за этот тип контроля уже выставлена. Используйте редактирование."
        )
    
    grade = models.Grade(
        student_id=grade_data.student_id,
        subject_id=grade_data.subject_id,
        control_type_id=grade_data.control_type_id,
        value=grade_data.value,
        teacher_id=teacher.id,
        date=datetime.date.today()
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.get("/grades/{grade_id}", response_model=GradeWithHistory)
def get_grade_with_history(
    grade_id: int,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить оценку с историей изменений."""
    grade = db.query(models.Grade).options(
        joinedload(models.Grade.subject),
        joinedload(models.Grade.control_type),
    ).filter(
        models.Grade.id == grade_id,
        models.Grade.teacher_id == teacher.id
    ).first()
    
    if not grade:
        raise HTTPException(status_code=404, detail="Оценка не найдена")
    
    history = db.query(models.GradeHistory).filter(
        models.GradeHistory.grade_id == grade_id
    ).order_by(models.GradeHistory.changed_at.desc()).all()
    
    return {"grade": grade, "history": history}


@router.put("/grades/{grade_id}", response_model=GradeSchema)
def update_grade(
    grade_id: int,
    grade_update: GradeUpdate,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Редактировать оценку."""
    grade = db.query(models.Grade).filter(
        models.Grade.id == grade_id,
        models.Grade.teacher_id == teacher.id
    ).first()
    
    if not grade:
        raise HTTPException(status_code=404, detail="Оценка не найдена или у вас нет прав")
    
    old_value = grade.value
    grade.value = grade_update.value
    
    hist = models.GradeHistory(
        grade_id=grade.id,
        old_value=old_value,
        new_value=grade_update.value,
        changed_at=datetime.datetime.utcnow(),
        changed_by_id=teacher.id,
        reason=grade_update.reason
    )
    db.add(hist)
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/grades/{grade_id}")
def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Удалить оценку."""
    grade = db.query(models.Grade).filter(
        models.Grade.id == grade_id,
        models.Grade.teacher_id == teacher.id
    ).first()
    
    if not grade:
        raise HTTPException(status_code=404, detail="Оценка не найдена или у вас нет прав")
    
    db.delete(grade)
    db.commit()
    return {"message": "Оценка удалена"}


@router.get("/attendance", response_model=List[AttendanceSchema])
def get_attendance_records(
    group_subject_id: int = None,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить записи посещаемости (только по дисциплинам преподавателя)."""
    query = db.query(models.Attendance).join(
        models.GroupSubject,
        models.Attendance.group_subject_id == models.GroupSubject.id
    ).filter(
        models.GroupSubject.teacher_id == teacher.id
    )
    
    if group_subject_id:
        query = query.filter(models.Attendance.group_subject_id == group_subject_id)
    
    return query.all()


@router.post("/attendance", response_model=AttendanceSchema)
def mark_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Отметить посещаемость."""
    # Проверяем, что преподаватель ведёт эту дисциплину
    gs = db.query(models.GroupSubject).filter(
        models.GroupSubject.id == attendance_data.group_subject_id,
        models.GroupSubject.teacher_id == teacher.id
    ).first()
    
    if not gs:
        raise HTTPException(
            status_code=403,
            detail="Вы не ведёте эту дисциплину"
        )

    # Проверяем, что студент в этой группе
    student = db.query(models.Student).filter(
        models.Student.id == attendance_data.student_id,
        models.Student.group_id == gs.group_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=403,
            detail="Студент не принадлежит к этой группе"
        )
    
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == attendance_data.student_id,
        models.Attendance.group_subject_id == attendance_data.group_subject_id,
        models.Attendance.date == (attendance_data.date or datetime.date.today())
    ).first()
    
    if existing:
        existing.status = attendance_data.status
        db.commit()
        db.refresh(existing)
        return existing
    
    attendance = models.Attendance(
        student_id=attendance_data.student_id,
        group_subject_id=attendance_data.group_subject_id,
        date=attendance_data.date or datetime.date.today(),
        status=attendance_data.status
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


@router.put("/attendance/{attendance_id}", response_model=AttendanceSchema)
def update_attendance(
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Редактировать запись посещаемости (только свои дисциплины)."""
    attendance = db.query(models.Attendance).join(
        models.GroupSubject,
        models.Attendance.group_subject_id == models.GroupSubject.id
    ).filter(
        models.Attendance.id == attendance_id,
        models.GroupSubject.teacher_id == teacher.id
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Запись посещаемости не найдена или у вас нет прав")
    
    attendance.status = attendance_update.status
    db.commit()
    db.refresh(attendance)
    return attendance


@router.delete("/attendance/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Удалить запись посещаемости (только свои дисциплины)."""
    attendance = db.query(models.Attendance).join(
        models.GroupSubject,
        models.Attendance.group_subject_id == models.GroupSubject.id
    ).filter(
        models.Attendance.id == attendance_id,
        models.GroupSubject.teacher_id == teacher.id
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Запись посещаемости не найдена или у вас нет прав")
    
    db.delete(attendance)
    db.commit()
    return {"message": "Запись посещаемости удалена"}


@router.get("/group-student-attendance")
def get_student_attendance(
    student_id: int,
    group_subject_id: int,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить посещаемость конкретного студента по дисциплине."""
    # Проверяем доступ
    gs = db.query(models.GroupSubject).filter(
        models.GroupSubject.id == group_subject_id,
        models.GroupSubject.teacher_id == teacher.id
    ).first()
    
    if not gs:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой дисциплине")
    
    records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.group_subject_id == group_subject_id
    ).order_by(models.Attendance.date.desc()).all()
    return records


@router.get("/groups")
def get_groups(
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить список групп, в которых преподаватель ведёт дисциплины."""
    group_ids = db.query(models.GroupSubject.group_id).filter(
        models.GroupSubject.teacher_id == teacher.id
    ).distinct().all()
    group_ids = [g[0] for g in group_ids]
    
    if not group_ids:
        return []
    
    return db.query(models.Group).filter(models.Group.id.in_(group_ids)).all()


@router.get("/control-types", response_model=List[ControlTypeSchema])
def get_control_types(
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Получить список типов контроля."""
    return db.query(models.ControlType).all()


@router.get("/export-grades")
def export_grades(
    group_id: int,
    subject_id: int,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Экспорт оценок в CSV по группе и дисциплине."""
    # Проверяем доступ
    gs = db.query(models.GroupSubject).filter(
        models.GroupSubject.teacher_id == teacher.id,
        models.GroupSubject.group_id == group_id,
        models.GroupSubject.subject_id == subject_id
    ).first()
    
    if not gs:
        raise HTTPException(
            status_code=403,
            detail="Вы не ведёте эту дисциплину в данной группе"
        )
    
    # Получаем группу и дисциплину
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    
    if not group or not subject:
        raise HTTPException(
            status_code=404,
            detail="Группа или дисциплина не найдены"
        )
    
    # Получаем студентов группы
    students = db.query(models.Student).filter(
        models.Student.group_id == group_id
    ).all()
    
    # Получаем оценки
    grades_query = db.query(models.Grade).options(
        joinedload(models.Grade.control_type)
    ).filter(
        models.Grade.student_id.in_([s.id for s in students]),
        models.Grade.subject_id == subject_id
    )
    grades = grades_query.all()
    
    # Создаём CSV с UTF-8 BOM для корректного отображения в Excel
    output = io.StringIO()
    # Добавляем BOM для UTF-8
    output.write('\ufeff')
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)
    
    # Заголовок
    writer.writerow([f'Экспорт оценок: {group.name} - {subject.name}'])
    writer.writerow([f'Дисциплина: {subject.name} ({subject.code})'])
    writer.writerow([f'Дата экспорта: {datetime.datetime.now().strftime("%d.%m.%Y %H:%M")}'])
    writer.writerow([])
    
    # Таблица оценок
    writer.writerow(['№', 'Студент', 'Тип контроля', 'Оценка', 'Дата', 'Преподаватель'])
    
    # Получаем ФИО преподавателя
    teacher_name = "N/A"
    teacher_link = db.query(models.UserTeacherLink).filter(
        models.UserTeacherLink.teacher_id == teacher.id
    ).first()
    if teacher_link and teacher_link.user_account:
        t_user = teacher_link.user_account
        parts = [p for p in [t_user.last_name, t_user.first_name, t_user.patronymic] if p]
        teacher_name = " ".join(parts) if parts else "N/A"
    
    row_num = 1
    for student in students:
        student_grades = [g for g in grades if g.student_id == student.id]
        # Получаем ФИО студента через связь
        student_name = f"Студент #{student.id}"
        user_link = db.query(models.UserStudentLink).filter(
            models.UserStudentLink.student_id == student.id
        ).first()
        if user_link and user_link.user_account:
            user = user_link.user_account
            parts = [p for p in [user.last_name, user.first_name, user.patronymic] if p]
            student_name = " ".join(parts) if parts else f"Студент #{student.id}"
        
        if student_grades:
            for grade in student_grades:
                writer.writerow([
                    row_num,
                    student_name,
                    grade.control_type.name if grade.control_type else "N/A",
                    grade.value,
                    grade.date.strftime("%d.%m.%Y") if grade.date else "",
                    teacher_name
                ])
                row_num += 1
        else:
            writer.writerow([row_num, student_name, "Нет оценок", "", "", ""])
            row_num += 1
    
    output.seek(0)
    
    # Формируем полностью ASCII имя файла
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"grades_g{group_id}_s{subject_id}_{timestamp}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
        }
    )


def _get_person_name(db, user_link_query):
    """Вспомогательная: получить ФИО по запросу связи."""
    link = user_link_query.first()
    if link and link.user_account:
        u = link.user_account
        parts = [p for p in [u.last_name, u.first_name, u.patronymic] if p]
        return " ".join(parts) if parts else u.username
    return "N/A"


@router.get("/export-all-grades")
def export_all_grades(
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Экспорт всех оценок преподавателя в CSV."""
    grades = db.query(models.Grade).options(
        joinedload(models.Grade.subject),
        joinedload(models.Grade.control_type),
        joinedload(models.Grade.student),
    ).filter(
        models.Grade.teacher_id == teacher.id
    ).order_by(models.Grade.date.desc()).all()

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

    teacher_name = _get_person_name(
        db, db.query(models.UserTeacherLink).filter(models.UserTeacherLink.teacher_id == teacher.id)
    )

    writer.writerow([f'Экспорт всех оценок преподавателя'])
    writer.writerow([f'Преподаватель: {teacher_name}'])
    writer.writerow([f'Дата экспорта: {datetime.datetime.now().strftime("%d.%m.%Y %H:%M")}'])
    writer.writerow([])
    writer.writerow(['№', 'Студент', 'Дисциплина', 'Тип контроля', 'Оценка', 'Дата'])

    for i, g in enumerate(grades, 1):
        student_name = _get_person_name(
            db, db.query(models.UserStudentLink).filter(models.UserStudentLink.student_id == g.student_id)
        )
        writer.writerow([
            i,
            student_name,
            g.subject.name if g.subject else "N/A",
            g.control_type.name if g.control_type else "N/A",
            g.value,
            g.date.strftime("%d.%m.%Y") if g.date else "",
        ])

    output.seek(0)
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"all_grades_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@router.get("/export-attendance")
def export_attendance(
    group_id: int,
    subject_id: int,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Экспорт посещаемости по группе и дисциплине в CSV."""
    gs = db.query(models.GroupSubject).filter(
        models.GroupSubject.teacher_id == teacher.id,
        models.GroupSubject.group_id == group_id,
        models.GroupSubject.subject_id == subject_id
    ).first()
    if not gs:
        raise HTTPException(status_code=403, detail="Вы не ведёте эту дисциплину в данной группе")

    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()

    records = db.query(models.Attendance).filter(
        models.Attendance.group_subject_id == gs.id
    ).order_by(models.Attendance.date.desc()).all()

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

    writer.writerow([f'Посещаемость: {group.name if group else ""} - {subject.name if subject else ""}'])
    writer.writerow([f'Дата экспорта: {datetime.datetime.now().strftime("%d.%m.%Y %H:%M")}'])
    writer.writerow([])
    writer.writerow(['№', 'Студент', 'Дата', 'Статус'])

    status_labels = {'present': 'Присутствует', 'absent': 'Отсутствует', 'late': 'Опоздал'}

    for i, r in enumerate(records, 1):
        student_name = _get_person_name(
            db, db.query(models.UserStudentLink).filter(models.UserStudentLink.student_id == r.student_id)
        )
        writer.writerow([
            i,
            student_name,
            r.date.strftime("%d.%m.%Y") if r.date else "",
            status_labels.get(r.status, r.status),
        ])

    output.seek(0)
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"attendance_g{group_id}_s{subject_id}_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@router.get("/export-group-summary")
def export_group_summary(
    group_id: int,
    db: Session = Depends(get_db),
    teacher: models.Teacher = Depends(get_current_teacher)
):
    """Сводный отчёт по группе (все дисциплины преподавателя) в CSV."""
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    gs_list = db.query(models.GroupSubject).options(
        joinedload(models.GroupSubject.subject)
    ).filter(
        models.GroupSubject.teacher_id == teacher.id,
        models.GroupSubject.group_id == group_id
    ).all()

    if not gs_list:
        raise HTTPException(status_code=403, detail="У вас нет дисциплин в этой группе")

    students = db.query(models.Student).filter(models.Student.group_id == group_id).all()
    subject_ids = [gs.subject_id for gs in gs_list]

    grades = db.query(models.Grade).options(
        joinedload(models.Grade.control_type),
        joinedload(models.Grade.subject),
    ).filter(
        models.Grade.student_id.in_([s.id for s in students]),
        models.Grade.subject_id.in_(subject_ids)
    ).all()

    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.group_subject_id.in_([gs.id for gs in gs_list])
    ).all()

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

    writer.writerow([f'Сводный отчёт: {group.name}'])
    writer.writerow([f'Дата экспорта: {datetime.datetime.now().strftime("%d.%m.%Y %H:%M")}'])
    writer.writerow([])

    for gs in gs_list:
        subj = gs.subject
        writer.writerow([f'Дисциплина: {subj.name if subj else "N/A"} ({subj.code if subj else ""})'])
        writer.writerow(['№', 'Студент', 'Оценки', 'Средний балл', 'Присутствует', 'Отсутствует', '% посещаемости'])

        subj_grades = [g for g in grades if g.subject_id == gs.subject_id]
        subj_att = [a for a in attendance_records if a.group_subject_id == gs.id]

        for i, student in enumerate(students, 1):
            student_name = _get_person_name(
                db, db.query(models.UserStudentLink).filter(models.UserStudentLink.student_id == student.id)
            )
            st_grades = [g for g in subj_grades if g.student_id == student.id]
            grades_str = ", ".join([f"{g.value}({g.control_type.name if g.control_type else '?'})" for g in st_grades]) or "—"
            avg = round(sum(g.value for g in st_grades) / len(st_grades), 2) if st_grades else "—"

            st_att = [a for a in subj_att if a.student_id == student.id]
            present = sum(1 for a in st_att if a.status == 'present')
            absent = sum(1 for a in st_att if a.status == 'absent')
            total = len(st_att)
            pct = round(present / total * 100, 1) if total > 0 else "—"

            writer.writerow([i, student_name, grades_str, avg, present, absent, pct])

        writer.writerow([])

    output.seek(0)
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"summary_g{group_id}_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )
