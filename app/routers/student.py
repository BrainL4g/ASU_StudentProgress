from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    
    return {
        "id": student.id,
        "group_id": student.group_id,
        "enrollment_year": student.enrollment_year,
        "group": student.group,
        "stats": stats,
        "grades": grades,
        "attendance": attendance,
        "appeals": appeals
    }


@router.get("/grades", response_model=List[GradeSchema])
def get_my_grades(
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Получить все оценки студента."""
    grades = db.query(models.Grade).filter(
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
    stats = db.query(models.StudentStats).filter(
        models.StudentStats.student_id == student.id
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
    attendance = db.query(models.Attendance).filter(
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
    appeals = db.query(models.Appeal).filter(
        models.Appeal.student_id == student.id
    ).all()
    return appeals


@router.post("/appeals", response_model=AppealSchema)
def submit_appeal(
    appeal_data: AppealCreate,
    db: Session = Depends(get_db),
    student: models.Student = Depends(get_current_student)
):
    """Подать апелляцию."""
    existing = db.query(models.Appeal).filter(
        models.Appeal.student_id == student.id,
        models.Appeal.subject_id == appeal_data.subject_id,
        models.Appeal.status == "pending"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="У вас уже есть активная апелляция по этому предмету"
        )
    
    appeal = models.Appeal(
        student_id=student.id,
        subject_id=appeal_data.subject_id,
        description=appeal_data.description,
        status="pending"
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
        
        rankings.append({
            "student_id": s.id,
            "group_id": s.group_id,
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
    """Получить дисциплины студента."""
    if not student.group_id:
        return []
    
    group_subjects = db.query(models.GroupSubject).filter(
        models.GroupSubject.group_id == student.group_id
    ).all()
    
    subjects = []
    for gs in group_subjects:
        if gs.subject:
            subjects.append({
                "id": gs.subject.id,
                "code": gs.subject.code,
                "name": gs.subject.name,
                "credits": gs.subject.credits
            })
    
    return subjects
