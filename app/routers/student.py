from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..dependencies import get_db, get_current_student
from .. import models
from ..schemas import (
    GradeSchema, GradeHistorySchema, GradeWithHistory,
    AttendanceSchema,
    AppealSchema, AppealCreate,
    StudentStatsSchema, StudentFullProfile
)

router = APIRouter(prefix="/student", tags=["student"])


@router.get("/profile", response_model=StudentFullProfile)
def get_my_profile(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить полный профиль студента."""
    grades = db.query(models.Grade).filter(
        models.Grade.student_id == student.id
    ).all()
    
    attendance = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id
    ).all()
    
    appeals = db.query(models.Appeal).filter(
        models.Appeal.student_id == student.id
    ).all()
    
    stats = db.query(models.StudentStats).filter(
        models.StudentStats.student_id == student.id
    ).first()
    
    # Получаем текущую группу
    current_group_link = db.query(models.StudentGroup).filter(
        models.StudentGroup.student_id == student.id,
        models.StudentGroup.is_current == True
    ).first()
    
    return {
        "id": student.id,
        "group_id": current_group_link.group_id if current_group_link else None,
        "enrollment_year": student.enrollment_year,
        "group": current_group_link.group if current_group_link else None,
        "stats": stats,
        "grades": grades,
        "attendance": attendance,
        "appeals": appeals
    }


@router.get("/my-profile")
def get_student_profile(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить профиль студента для отображения."""
    # Получаем ФИО из связанной учётной записи
    user_link = db.query(models.UserStudentLink).options(
        joinedload(models.UserStudentLink.user_account)
    ).filter(
        models.UserStudentLink.student_id == student.id
    ).first()
    
    full_name = "Неизвестный студент"
    if user_link and user_link.user_account:
        ua = user_link.user_account
        full_name = f"{ua.last_name or ''} {ua.first_name or ''} {ua.patronymic or ''}".strip()
    
    # Получаем текущую группу
    current_group_link = db.query(models.StudentGroup).options(
        joinedload(models.StudentGroup.group),
        joinedload(models.StudentGroup.reason)
    ).filter(
        models.StudentGroup.student_id == student.id,
        models.StudentGroup.is_current == True
    ).first()
    
    # Получаем все группы
    all_groups = db.query(models.StudentGroup).options(
        joinedload(models.StudentGroup.group)
    ).filter(
        models.StudentGroup.student_id == student.id
    ).all()
    
    group_names = []
    if all_groups:
        for sg in all_groups:
            if sg.group:
                name = sg.group.name
                if sg.is_current:
                    name += " (текущая)"
                group_names.append(name)
    
    # Получаем текущий семестр
    semester = db.query(models.Semester).filter(
        models.Semester.is_current == True
    ).first()
    semester_str = f"{semester.term} {semester.year}" if semester else "Не определён"
    
    return {
        "full_name": full_name,
        "enrollment_year": student.enrollment_year,
        "group_name": current_group_link.group.name if current_group_link and current_group_link.group else "Не назначена",
        "group_names": group_names,
        "reason_name": current_group_link.reason.name if current_group_link and current_group_link.reason else "Поступление",
        "semester": semester_str,
    }


@router.get("/grades", response_model=List[GradeSchema])
def get_my_grades(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить все оценки студента."""
    grades = db.query(models.Grade).options(
        joinedload(models.Grade.discipline_group).joinedload(models.DisciplineGroup.discipline),
        joinedload(models.Grade.control_type),
    ).filter(
        models.Grade.student_id == student.id
    ).all()
    return grades


@router.get("/grades/{grade_id}", response_model=GradeWithHistory)
def get_my_grade_history(
    grade_id: int,
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить историю изменений оценки."""
    grade = db.query(models.Grade).filter(
        models.Grade.id == grade_id,
        models.Grade.student_id == student.id
    ).first()
    
    if not grade:
        raise HTTPException(status_code=404, detail="Оценка не найдена")
    
    history = db.query(models.GradeHistory).filter(
        models.GradeHistory.grade_id == grade_id
    ).order_by(models.GradeHistory.changed_at.desc()).all()
    
    return {"grade": grade, "history": history}


@router.get("/stats", response_model=StudentStatsSchema)
def get_my_stats(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить статистику студента (GPA, кредиты)."""
    # Находим текущий семестр
    semester = db.query(models.Semester).filter(models.Semester.is_current == True).first()
    if not semester:
        semester = db.query(models.Semester).first()
    if not semester:
        semester = models.Semester(year=2024, term="Осенний", is_current=True)
        db.add(semester)
        db.commit()
        db.refresh(semester)
    
    stats = db.query(models.StudentStats).filter(
        models.StudentStats.student_id == student.id,
        models.StudentStats.semester_id == semester.id
    ).first()
    
    if not stats:
        grades = db.query(models.Grade).filter(
            models.Grade.student_id == student.id
        ).all()
        
        if grades:
            gpa = sum(float(g.value) for g in grades) / len(grades)
        else:
            gpa = 0.0
        
        stats = models.StudentStats(
            student_id=student.id,
            semester_id=semester.id,
            gpa=round(float(gpa), 2),
            total_grades=len(grades)
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    return stats


@router.get("/attendance", response_model=List[AttendanceSchema])
def get_my_attendance(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить все записи посещаемости."""
    attendance = db.query(models.Attendance).options(
        joinedload(models.Attendance.discipline_group).joinedload(models.DisciplineGroup.discipline),
    ).filter(
        models.Attendance.student_id == student.id
    ).all()
    return attendance


@router.get("/attendance/stats")
def get_attendance_stats(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить статистику посещаемости."""
    attendance = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id
    ).all()
    
    total = len(attendance)
    present = sum(1 for a in attendance if a.status == "present")
    absent = sum(1 for a in attendance if a.status == "absent")
    
    return {
        "total": total,
        "present": present,
        "absent": absent,
        "percentage": round((present / total * 100) if total > 0 else 0, 1)
    }


@router.get("/appeals", response_model=List[AppealSchema])
def get_my_appeals(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить все апелляции студента."""
    appeals = db.query(models.Appeal).options(
        joinedload(models.Appeal.subject),
        joinedload(models.Appeal.status),
    ).filter(
        models.Appeal.student_id == student.id
    ).all()
    return appeals


@router.post("/appeals", response_model=AppealSchema)
def create_appeal(
    appeal_data: AppealCreate,
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Создать новую апелляцию."""
    # Проверяем, что предмет существует
    subject = db.query(models.Subject).filter(models.Subject.id == appeal_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    
    # Проверяем, что нет активной апелляции
    existing = db.query(models.Appeal).join(models.AppealStatus).filter(
        models.Appeal.student_id == student.id,
        models.Appeal.subject_id == appeal_data.subject_id,
        models.AppealStatus.name == "На рассмотрении"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="У вас уже есть активная апелляция по этому предмету"
        )
    
    # Ищем статус "На рассмотрении"
    status = db.query(models.AppealStatus).filter(
        models.AppealStatus.name == "На рассмотрении"
    ).first()
    
    appeal = models.Appeal(
        student_id=student.id,
        subject_id=appeal_data.subject_id,
        description=appeal_data.description,
        status_id=status.id if status else 1
    )
    db.add(appeal)
    db.commit()
    db.refresh(appeal)
    return appeal


@router.get("/ranking")
def get_my_ranking(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить рейтинг студента."""
    all_students = db.query(models.Student).all()
    
    rankings = []
    for s in all_students:
        grades = db.query(models.Grade).filter(
            models.Grade.student_id == s.id
        ).all()
        
        if grades:
            avg = sum(float(g.value) for g in grades) / len(grades)
        else:
            avg = 0.0
        
        # Получаем текущую группу
        current = db.query(models.StudentGroup).filter(
            models.StudentGroup.student_id == s.id,
            models.StudentGroup.is_current == True
        ).first()
        
        rankings.append({
            "student_id": s.id,
            "group_id": current.group_id if current else None,
            "average": round(float(avg), 2)
        })
    
    rankings.sort(key=lambda x: x["average"], reverse=True)
    
    my_rank = None
    for i, r in enumerate(rankings, 1):
        if r["student_id"] == student.id:
            my_rank = i
            break
    
    return {
        "my_rank": my_rank,
        "total_students": len(rankings),
        "my_average": next((r["average"] for r in rankings if r["student_id"] == student.id), 0)
    }


@router.get("/subjects")
def get_my_subjects(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить дисциплины студента из всех его групп."""
    # Получаем все группы студента
    student_groups = db.query(models.StudentGroup).filter(
        models.StudentGroup.student_id == student.id
    ).all()
    
    if not student_groups:
        return []
    
    group_ids = [sg.group_id for sg in student_groups]
    
    # Получаем предметы из всех групп
    group_subjects = db.query(models.GroupSubject).filter(
        models.GroupSubject.group_id.in_(group_ids)
    ).all()
    
    subjects = []
    seen_ids = set()
    for gs in group_subjects:
        if gs.subject and gs.subject.id not in seen_ids:
            seen_ids.add(gs.subject.id)
            subjects.append({
                "id": gs.subject.id,
                "code": gs.subject.code,
                "name": gs.subject.name,
                "credits": gs.subject.credits,
                "group_id": gs.group_id,
                "group_name": gs.group.name if gs.group else None
            })
    
    return subjects


@router.get("/groups")
def get_my_groups(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить все группы студента."""
    from ..schemas import StudentGroupSchema
    student_groups = db.query(models.StudentGroup).options(
        joinedload(models.StudentGroup.group)
    ).filter(
        models.StudentGroup.student_id == student.id
    ).all()
    return student_groups
