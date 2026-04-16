"""
Очищенный seed - создаёт минимальные рабочие данные
"""

import datetime
from sqlalchemy.orm import Session

from app.models import UserRole, AppealStatus, Faculty, Specialization, EnrollmentReason
from app.models import ControlType, Semester, Group, Subject, Teacher, UserAccount
from app.models import Student, UserTeacherLink, UserStudentLink, StudentGroup
from app.models import DisciplineGroup, Grade, Appeal, StudentStats, GroupSubject
from app.models import Attendance
from app.auth import get_password_hash


def seed_database(db: Session) -> None:
    """Fill database with clean test data."""
    if db.query(UserRole).first() is not None:
        print("[seed] Data already exists.")
        return

    print("[seed] Creating clean test data...")

    try:
        # 1. Roles
        role_admin = UserRole(name="admin")
        role_teacher = UserRole(name="teacher")
        role_student = UserRole(name="student")
        db.add_all([role_admin, role_teacher, role_student])
        db.flush()

        # 2. Appeal Status
        status_pending = AppealStatus(name="На рассмотрении")
        status_approved = AppealStatus(name="Удовлетворена")
        status_rejected = AppealStatus(name="Отклонена")
        db.add_all([status_pending, status_approved, status_rejected])
        db.flush()

        # 3. Faculty
        fac_cs = Faculty(name="ФИВТ")
        db.add(fac_cs)
        db.flush()

        # 4. Specialization
        spec_is = Specialization(name="ИС", faculty_id=fac_cs.id)
        spec_pi = Specialization(name="ПИ", faculty_id=fac_cs.id)
        db.add_all([spec_is, spec_pi])
        db.flush()

        # 5. Enrollment Reason
        reason_enroll = EnrollmentReason(name="Поступление")
        db.add(reason_enroll)
        db.flush()

        # 6. Control Types
        ct_exam = ControlType(name="Экзамен")
        ct_credit = ControlType(name="Зачёт")
        db.add_all([ct_exam, ct_credit])
        db.flush()

        # 7. Semesters
        sem = Semester(year=2024, term="Осенний", is_current=True)
        db.add(sem)
        db.flush()

        # 8. Groups
        group_is21 = Group(name="ИС-21", course="2", faculty_id=fac_cs.id, specialization_id=spec_is.id)
        group_is22 = Group(name="ИС-22", course="1", faculty_id=fac_cs.id, specialization_id=spec_is.id)
        db.add_all([group_is21, group_is22])
        db.flush()

        # 9. Subjects
        subj_prog = Subject(code="PROG", name="Программирование", credits=4)
        subj_math = Subject(code="MATH", name="Математика", credits=5)
        db.add_all([subj_prog, subj_math])
        db.flush()

        # 10. Teachers
        teacher1 = Teacher(department="Кафедра программирования")
        db.add(teacher1)
        db.flush()

        # 11. Admin
        admin_user = UserAccount(
            username="admin",
            email="admin@asu.ru",
            password_hash=get_password_hash("admin123"),
            role_id=role_admin.id,
            is_active=True,
            first_name="Админ",
            last_name="Администратор"
        )
        db.add(admin_user)
        db.flush()

        # 12. Teacher user
        teacher_user = UserAccount(
            username="petrov",
            email="petrov@asu.ru",
            password_hash=get_password_hash("teacher123"),
            role_id=role_teacher.id,
            is_active=True,
            first_name="Пётр",
            last_name="Петров"
        )
        db.add(teacher_user)
        db.flush()

        # 13. Teacher link
        link_t = UserTeacherLink(user_account_id=teacher_user.id, teacher_id=teacher1.id)
        db.add(link_t)
        db.flush()

        # 14. Students with groups
        students_data = [
            ("ivanov", "Иван", "Иванов", 2023, group_is21),
            ("smirnov", "Сергей", "Смирнов", 2023, group_is21),
            ("kuznetsov", "Алексей", "Кузнецов", 2023, group_is21),
            ("popov", "Пётр", "Попов", 2024, group_is22),
        ]

        student_ids = []
        for username, first_name, last_name, year, group in students_data:
            # User
            user = UserAccount(
                username=username,
                email=f"{username}@student.asu.ru",
                password_hash=get_password_hash("student123"),
                role_id=role_student.id,
                is_active=True,
                first_name=first_name,
                last_name=last_name
            )
            db.add(user)
            db.flush()

            # Student
            student = Student(enrollment_year=year)
            db.add(student)
            db.flush()
            student_ids.append(student.id)

            # Link
            link = UserStudentLink(user_account_id=user.id, student_id=student.id)
            db.add(link)
            db.flush()

            # StudentGroup - связь с группой!
            sg = StudentGroup(
                student_id=student.id,
                group_id=group.id,
                reason_id=reason_enroll.id,
                enrollment_date=datetime.date(year, 9, 1),
                is_current=True
            )
            db.add(sg)
            
            # Для kuznetsov добавляем вторую группу (ИС-22)
            if username == "kuznetsov":
                sg2 = StudentGroup(
                    student_id=student.id,
                    group_id=group_is22.id,
                    reason_id=reason_enroll.id,
                    enrollment_date=datetime.date(year, 9, 1),
                    is_current=True
                )
                db.add(sg2)

        db.flush()

        # 14.5. Дополнительный преподаватель (тестовый)
        teacher2 = Teacher(department="Кафедра математики")
        db.add(teacher2)
        db.flush()
        teacher2_user = UserAccount(
            username="test_teacher",
            email="test_teacher@asu.ru",
            password_hash=get_password_hash("test123"),
            role_id=role_teacher.id,
            is_active=True,
            first_name="Тест",
            last_name="Преподаватель"
        )
        db.add(teacher2_user)
        db.flush()
        link_t2 = UserTeacherLink(user_account_id=teacher2_user.id, teacher_id=teacher2.id)
        db.add(link_t2)
        db.flush()

        # 14.6. Тестовый студент (в двух группах)
        test_student_user = UserAccount(
            username="test_student",
            email="test_student@asu.ru",
            password_hash=get_password_hash("test123"),
            role_id=role_student.id,
            is_active=True,
            first_name="Тест",
            last_name="Студент"
        )
        db.add(test_student_user)
        db.flush()
        test_student = Student(enrollment_year=2024)
        db.add(test_student)
        db.flush()
        link_ts = UserStudentLink(user_account_id=test_student_user.id, student_id=test_student.id)
        db.add(link_ts)
        db.flush()
        # Тестовый студент в двух группах
        sg_test1 = StudentGroup(
            student_id=test_student.id,
            group_id=group_is21.id,
            reason_id=reason_enroll.id,
            enrollment_date=datetime.date(2024, 9, 1),
            is_current=True
        )
        sg_test2 = StudentGroup(
            student_id=test_student.id,
            group_id=group_is22.id,
            reason_id=reason_enroll.id,
            enrollment_date=datetime.date(2024, 9, 1),
            is_current=True
        )
        db.add_all([sg_test1, sg_test2])
        db.flush()

        # 15. DisciplineGroups
        dg1 = DisciplineGroup(
            discipline_id=subj_prog.id,
            group_id=group_is21.id,
            teacher_id=teacher1.id,
            semester_id=sem.id,
            academic_year="2024-2025"
        )
        dg2 = DisciplineGroup(
            discipline_id=subj_math.id,
            group_id=group_is21.id,
            teacher_id=teacher1.id,
            semester_id=sem.id,
            academic_year="2024-2025"
        )
        dg3 = DisciplineGroup(
            discipline_id=subj_prog.id,
            group_id=group_is22.id,
            teacher_id=teacher1.id,
            semester_id=sem.id,
            academic_year="2024-2025"
        )
        # kuznetsov как преподаватель математики
        dg4 = DisciplineGroup(
            discipline_id=subj_math.id,
            group_id=group_is21.id,
            teacher_id=teacher2.id,
            semester_id=sem.id,
            academic_year="2024-2025"
        )
        dg5 = DisciplineGroup(
            discipline_id=subj_math.id,
            group_id=group_is22.id,
            teacher_id=teacher2.id,
            semester_id=sem.id,
            academic_year="2024-2025"
        )
        db.add_all([dg1, dg2, dg3, dg4, dg5])
        db.flush()

        # 15. GroupSubject - для студентов (нужно для /student/subjects)
        gs1 = GroupSubject(
            group_id=group_is21.id,
            subject_id=subj_prog.id,
            semester_id=sem.id,
            teacher_id=teacher1.id
        )
        gs2 = GroupSubject(
            group_id=group_is21.id,
            subject_id=subj_math.id,
            semester_id=sem.id,
            teacher_id=teacher1.id
        )
        gs3 = GroupSubject(
            group_id=group_is22.id,
            subject_id=subj_prog.id,
            semester_id=sem.id,
            teacher_id=teacher1.id
        )
        # kuznetsov преподаёт математику
        gs4 = GroupSubject(
            group_id=group_is21.id,
            subject_id=subj_math.id,
            semester_id=sem.id,
            teacher_id=teacher2.id
        )
        gs5 = GroupSubject(
            group_id=group_is22.id,
            subject_id=subj_math.id,
            semester_id=sem.id,
            teacher_id=teacher2.id
        )
        db.add_all([gs1, gs2, gs3, gs4, gs5])
        db.flush()

        # 16. Grades - для ivanov и smirnov
        grade1 = Grade(student_id=student_ids[0], discipline_group_id=dg1.id, control_type_id=ct_exam.id, value=4, teacher_id=teacher1.id)
        grade2 = Grade(student_id=student_ids[1], discipline_group_id=dg1.id, control_type_id=ct_exam.id, value=5, teacher_id=teacher1.id)
        grade3 = Grade(student_id=student_ids[1], discipline_group_id=dg2.id, control_type_id=ct_exam.id, value=4, teacher_id=teacher1.id)
        # Оценки kuznetsov в обеих группах
        grade4 = Grade(student_id=student_ids[2], discipline_group_id=dg1.id, control_type_id=ct_exam.id, value=4, teacher_id=teacher1.id)
        grade5 = Grade(student_id=student_ids[2], discipline_group_id=dg3.id, control_type_id=ct_exam.id, value=3, teacher_id=teacher1.id)
        db.add_all([grade1, grade2, grade3, grade4, grade5])
        db.flush()

        # 17. Attendance - посещаемость
        att1 = Attendance(student_id=student_ids[0], discipline_group_id=dg1.id, date=datetime.date(2025, 1, 15), status='present')
        att2 = Attendance(student_id=student_ids[1], discipline_group_id=dg1.id, date=datetime.date(2025, 1, 15), status='present')
        att3 = Attendance(student_id=student_ids[2], discipline_group_id=dg1.id, date=datetime.date(2025, 1, 15), status='absent')
        att4 = Attendance(student_id=student_ids[0], discipline_group_id=dg2.id, date=datetime.date(2025, 1, 15), status='present')
        att5 = Attendance(student_id=student_ids[1], discipline_group_id=dg2.id, date=datetime.date(2025, 1, 15), status='late')
        db.add_all([att1, att2, att3, att4, att5])
        db.flush()

        # 18. Appeal for smirnov
        appeal = Appeal(
            student_id=student_ids[1],
            subject_id=subj_math.id,
            description="Несогласие с оценкой",
            status_id=status_pending.id
        )
        db.add(appeal)

        db.commit()
        print("[seed] Done! Test accounts:")
        print("  admin / admin123")
        print("  petrov / teacher123")
        print("  ivanov, smirnov, kuznetsov, popov / student123")
        print(f"  Students: {len(student_ids)}, Grades: 5")
        print("  kuznetsov enrolled in ИС-21 and ИС-22 simultaneously")
        print("  test_teacher / test123  (преподаватель)")
        print("  test_student / test123  (студент в 2 группах)")

    except Exception as e:
        db.rollback()
        print(f"[seed] Error: {e}")
        raise