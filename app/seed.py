"""
Seed-данные для системы отслеживания успеваемости студентов АГУ.

Автоматически заполняет базу данных начальными тестовыми данными
при первом запуске приложения (только если таблицы пустые).
"""

import datetime
from sqlalchemy.orm import Session

from . import models
from .auth import get_password_hash


def seed_database(db: Session) -> None:
    """
    Заполняет базу данных начальными тестовыми данными.
    Создаёт данные только если таблица групп пуста (признак чистой БД).
    """
    if db.query(models.Group).first() is not None:
        print("[seed] Данные уже существуют, пропускаем инициализацию.")
        return

    print("[seed] Инициализация базы данных тестовыми данными...")

    try:
        # ═══════════════════════════════════════════════════════════════
        # 1. Роли пользователей
        # ═══════════════════════════════════════════════════════════════
        role_admin = models.UserRole(name="admin")
        role_teacher = models.UserRole(name="teacher")
        role_student = models.UserRole(name="student")
        db.add_all([role_admin, role_teacher, role_student])
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 2. Типы контроля
        # ═══════════════════════════════════════════════════════════════
        ct_exam = models.ControlType(name="Экзамен")
        ct_credit = models.ControlType(name="Зачёт")
        ct_coursework = models.ControlType(name="Курсовая")
        ct_practice = models.ControlType(name="Практика")
        ct_lab = models.ControlType(name="Лабораторная")
        ct_test = models.ControlType(name="Контрольная")
        db.add_all([ct_exam, ct_credit, ct_coursework, ct_practice, ct_lab, ct_test])
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 3. Семестры
        # ═══════════════════════════════════════════════════════════════
        sem_2023_fall = models.Semester(year=2023, term="Осенний")
        sem_2024_spring = models.Semester(year=2024, term="Весенний")
        sem_2024_fall = models.Semester(year=2024, term="Осенний")
        sem_2025_spring = models.Semester(year=2025, term="Весенний")
        sem_2025_fall = models.Semester(year=2025, term="Осенний")
        db.add_all([sem_2023_fall, sem_2024_spring, sem_2024_fall, sem_2025_spring, sem_2025_fall])
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 4. Группы
        # ═══════════════════════════════════════════════════════════════
        group_is21 = models.Group(name="ИС-21", course="2")
        group_is22 = models.Group(name="ИС-22", course="1")
        group_is23 = models.Group(name="ИС-23", course="1")
        group_pi21 = models.Group(name="ПИ-21", course="2")
        group_pi22 = models.Group(name="ПИ-22", course="1")
        group_pib21 = models.Group(name="ПИБ-21", course="3")
        db.add_all([group_is21, group_is22, group_is23, group_pi21, group_pi22, group_pib21])
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 5. Дисциплины
        # ═══════════════════════════════════════════════════════════════
        subj_math = models.Subject(code="MATH101", name="Высшая математика", credits=5.0)
        subj_prog = models.Subject(code="PROG101", name="Программирование", credits=4.0)
        subj_db = models.Subject(code="DB101", name="Базы данных", credits=3.5)
        subj_os = models.Subject(code="OS101", name="Операционные системы", credits=3.5)
        subj_net = models.Subject(code="NET101", name="Компьютерные сети", credits=3.0)
        subj_ai = models.Subject(code="AI101", name="Искусственный интеллект", credits=4.0)
        subj_se = models.Subject(code="SE101", name="Инженерия ПО", credits=3.5)
        subj_web = models.Subject(code="WEB101", name="Веб-технологии", credits=3.0)
        subj_algo = models.Subject(code="ALGO101", name="Алгоритмы и структуры данных", credits=4.0)
        subj_discrete = models.Subject(code="DISC101", name="Дискретная математика", credits=3.0)
        db.add_all([subj_math, subj_prog, subj_db, subj_os, subj_net, subj_ai, subj_se, subj_web, subj_algo, subj_discrete])
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 6. Преподаватели
        # ═══════════════════════════════════════════════════════════════
        teacher1 = models.Teacher(department="Информатики и вычислительной техники")
        teacher2 = models.Teacher(department="Прикладной математики")
        teacher3 = models.Teacher(department="Информационных систем")
        db.add_all([teacher1, teacher2, teacher3])
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 7. Студенты (20 студентов в 6 группах)
        # ═══════════════════════════════════════════════════════════════
        students = [
            models.Student(group_id=group_is21.id, enrollment_year=2023),  # 0: Иванов
            models.Student(group_id=group_is21.id, enrollment_year=2023),  # 1: Смирнов
            models.Student(group_id=group_is21.id, enrollment_year=2023),  # 2: Кузнецов
            models.Student(group_id=group_is21.id, enrollment_year=2023),  # 3: Попов
            models.Student(group_id=group_is22.id, enrollment_year=2024),  # 4: Новиков
            models.Student(group_id=group_is22.id, enrollment_year=2024),  # 5: Федоров
            models.Student(group_id=group_is22.id, enrollment_year=2024),  # 6: Лебедев
            models.Student(group_id=group_is23.id, enrollment_year=2025),  # 7: Орлов
            models.Student(group_id=group_is23.id, enrollment_year=2025),  # 8: Соколов
            models.Student(group_id=group_pi21.id, enrollment_year=2023),  # 9: Козлов
            models.Student(group_id=group_pi21.id, enrollment_year=2023),  # 10: Волков
            models.Student(group_id=group_pi21.id, enrollment_year=2023),  # 11: Смирнова
            models.Student(group_id=group_pi22.id, enrollment_year=2024),  # 12: Климов
            models.Student(group_id=group_pi22.id, enrollment_year=2024),  # 13: Зайцев
            models.Student(group_id=group_pib21.id, enrollment_year=2022),  # 14: Морозов
            models.Student(group_id=group_pib21.id, enrollment_year=2022),  # 15: Петренко
            models.Student(group_id=group_pib21.id, enrollment_year=2022),  # 16: Соловьев
            models.Student(group_id=group_is21.id, enrollment_year=2023),  # 17: Давыдов
            models.Student(group_id=group_pi21.id, enrollment_year=2023),  # 18: Жуков
            models.Student(group_id=group_is22.id, enrollment_year=2024),  # 19: Степанов
        ]
        db.add_all(students)
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 8. Учётные записи с ФИО
        # ═══════════════════════════════════════════════════════════════
        # Админ
        admin_user = models.UserAccount(
            username="admin", email="admin@asu.ru",
            password_hash=get_password_hash("admin123"), is_active=True, role_id=role_admin.id,
            last_name="Администратор", first_name="Системный",
        )
        db.add(admin_user)

        # Преподаватели
        teacher_user1 = models.UserAccount(
            username="petrov", email="petrov@asu.ru",
            password_hash=get_password_hash("teacher123"), is_active=True, role_id=role_teacher.id,
            last_name="Петров", first_name="Иван", patronymic="Александрович",
        )
        teacher_user2 = models.UserAccount(
            username="sidorova", email="sidorova@asu.ru",
            password_hash=get_password_hash("teacher123"), is_active=True, role_id=role_teacher.id,
            last_name="Сидорова", first_name="Елена", patronymic="Владимировна",
        )
        teacher_user3 = models.UserAccount(
            username="kuzmin", email="kuzmin@asu.ru",
            password_hash=get_password_hash("teacher123"), is_active=True, role_id=role_teacher.id,
            last_name="Кузьмин", first_name="Олег", patronymic="Николаевич",
        )
        db.add_all([teacher_user1, teacher_user2, teacher_user3])
        db.flush()

        # Студенты с ФИО
        student_data = [
            ("ivanov", "Иванов", "Игорь", "Сергеевич", "ivanov@stu.asu.ru"),
            ("smirnov", "Смирнов", "Алексей", "Петрович", "smirnov@stu.asu.ru"),
            ("kuznetsov", "Кузнецов", "Дмитрий", "Иванович", "kuznetsov@stu.asu.ru"),
            ("popov", "Попов", "Михаил", "Андреевич", "popov@stu.asu.ru"),
            ("novikov", "Новиков", "Андрей", "Владимирович", "novikov@stu.asu.ru"),
            ("fedorov", "Федоров", "Сергей", "Михайлович", "fedorov@stu.asu.ru"),
            ("lebedev", "Лебедев", "Павел", "Игоревич", "lebedev@stu.asu.ru"),
            ("orlov", "Орлов", "Денис", "Олегович", "orlov@stu.asu.ru"),
            ("sokolov", "Соколов", "Артур", "Дмитриевич", "sokolov@stu.asu.ru"),
            ("kozlov", "Козлов", "Владислав", "Александрович", "kozlov@stu.asu.ru"),
            ("volkov", "Волков", "Егор", "Петрович", "volkov@stu.asu.ru"),
            ("smirnova", "Смирнова", "Анна", "Ивановна", "smirnova@stu.asu.ru"),
            ("klimov", "Климов", "Иван", "Сергеевич", "klimov@stu.asu.ru"),
            ("zaitsev", "Зайцев", "Максим", "Андреевич", "zaitsev@stu.asu.ru"),
            ("morozov", "Морозов", "Николай", "Дмитриевич", "morozov@stu.asu.ru"),
            ("petrenko", "Петренко", "Виктор", "Степанович", "petrenko@stu.asu.ru"),
            ("solovev", "Соловьев", "Кирилл", "Вячеславович", "solovev@stu.asu.ru"),
            ("davydov", "Давыдов", "Роман", "Константинович", "davydov@stu.asu.ru"),
            ("zhukov", "Жуков", "Станислав", "Николаевич", "zhukov@stu.asu.ru"),
            ("stepanov", "Степанов", "Олег", "Васильевич", "stepanov@stu.asu.ru"),
        ]
        
        student_users = []
        for username, last, first, patr, email in student_data:
            u = models.UserAccount(
                username=username, email=email,
                password_hash=get_password_hash("student123"), is_active=True, role_id=role_student.id,
                last_name=last, first_name=first, patronymic=patr,
            )
            db.add(u)
            student_users.append(u)
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 9. Связи пользователей
        # ═══════════════════════════════════════════════════════════════
        db.add(models.UserTeacherLink(user_account_id=teacher_user1.id, teacher_id=teacher1.id))
        db.add(models.UserTeacherLink(user_account_id=teacher_user2.id, teacher_id=teacher2.id))
        db.add(models.UserTeacherLink(user_account_id=teacher_user3.id, teacher_id=teacher3.id))

        for i, su in enumerate(student_users):
            db.add(models.UserStudentLink(user_account_id=su.id, student_id=students[i].id))
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 10. Привязки дисциплин к группам с преподавателями
        # ═══════════════════════════════════════════════════════════════
        # Петров (teacher1): Программирование, БД, ОС, Алгоритмы
        # Сидорова (teacher2): Математика, Сети, ИИ, Дискретная математика
        # Кузьмин (teacher3): Веб-технологии, Инженерия ПО
        
        gs_list = [
            # ИС-21 (Петров)
            models.GroupSubject(group_id=group_is21.id, subject_id=subj_prog.id, semester_id=sem_2024_fall.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_is21.id, subject_id=subj_db.id, semester_id=sem_2024_spring.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_is21.id, subject_id=subj_algo.id, semester_id=sem_2024_fall.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_is21.id, subject_id=subj_math.id, semester_id=sem_2024_fall.id, teacher_id=teacher2.id),
            models.GroupSubject(group_id=group_is21.id, subject_id=subj_web.id, semester_id=sem_2025_spring.id, teacher_id=teacher3.id),
            
            # ИС-22 (Петров)
            models.GroupSubject(group_id=group_is22.id, subject_id=subj_prog.id, semester_id=sem_2025_fall.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_is22.id, subject_id=subj_os.id, semester_id=sem_2025_fall.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_is22.id, subject_id=subj_algo.id, semester_id=sem_2025_fall.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_is22.id, subject_id=subj_math.id, semester_id=sem_2025_fall.id, teacher_id=teacher2.id),
            
            # ИС-23 (Петров)
            models.GroupSubject(group_id=group_is23.id, subject_id=subj_prog.id, semester_id=sem_2025_spring.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_is23.id, subject_id=subj_math.id, semester_id=sem_2025_spring.id, teacher_id=teacher2.id),
            
            # ПИ-21 (Сидорова)
            models.GroupSubject(group_id=group_pi21.id, subject_id=subj_math.id, semester_id=sem_2024_fall.id, teacher_id=teacher2.id),
            models.GroupSubject(group_id=group_pi21.id, subject_id=subj_db.id, semester_id=sem_2024_fall.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_pi21.id, subject_id=subj_ai.id, semester_id=sem_2024_spring.id, teacher_id=teacher2.id),
            models.GroupSubject(group_id=group_pi21.id, subject_id=subj_discrete.id, semester_id=sem_2024_fall.id, teacher_id=teacher2.id),
            models.GroupSubject(group_id=group_pi21.id, subject_id=subj_se.id, semester_id=sem_2025_spring.id, teacher_id=teacher3.id),
            
            # ПИ-22 (Кузьмин)
            models.GroupSubject(group_id=group_pi22.id, subject_id=subj_web.id, semester_id=sem_2025_fall.id, teacher_id=teacher3.id),
            models.GroupSubject(group_id=group_pi22.id, subject_id=subj_prog.id, semester_id=sem_2025_fall.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_pi22.id, subject_id=subj_math.id, semester_id=sem_2025_fall.id, teacher_id=teacher2.id),
            
            # ПИБ-21 (Сидорова/Петров)
            models.GroupSubject(group_id=group_pib21.id, subject_id=subj_net.id, semester_id=sem_2024_fall.id, teacher_id=teacher2.id),
            models.GroupSubject(group_id=group_pib21.id, subject_id=subj_os.id, semester_id=sem_2024_fall.id, teacher_id=teacher1.id),
            models.GroupSubject(group_id=group_pib21.id, subject_id=subj_ai.id, semester_id=sem_2024_spring.id, teacher_id=teacher2.id),
            models.GroupSubject(group_id=group_pib21.id, subject_id=subj_se.id, semester_id=sem_2024_spring.id, teacher_id=teacher3.id),
        ]
        db.add_all(gs_list)
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 11. Оценки (0-5)
        # ═══════════════════════════════════════════════════════════════
        grades = []
        
        # Оценки для ИС-21 (студенты 0-3, 17)
        # Программирование (Петров, gs_list[0])
        grade_records = [
            (0, subj_prog.id, ct_exam.id, 4.5, teacher1.id),   # Иванов - отлично
            (0, subj_prog.id, ct_lab.id, 5.0, teacher1.id),    # Иванов - отлично
            (1, subj_prog.id, ct_exam.id, 3.5, teacher1.id),   # Смирнов - хорошо
            (1, subj_prog.id, ct_coursework.id, 4.0, teacher1.id), # Смирнов - хорошо
            (2, subj_prog.id, ct_exam.id, 5.0, teacher1.id),   # Кузнецов - отлично
            (2, subj_prog.id, ct_lab.id, 4.5, teacher1.id),    # Кузнецов - отлично
            (3, subj_prog.id, ct_exam.id, 4.0, teacher1.id),  # Попов - хорошо
            (17, subj_prog.id, ct_exam.id, 3.0, teacher1.id),  # Давыдов - удовл.
            
            # Базы данных (Петров, gs_list[1])
            (0, subj_db.id, ct_exam.id, 4.0, teacher1.id),    # Иванов - хорошо
            (0, subj_db.id, ct_lab.id, 4.5, teacher1.id),    # Иванов - отлично
            (1, subj_db.id, ct_exam.id, 3.5, teacher1.id),   # Смирнов - хорошо
            (2, subj_db.id, ct_exam.id, 4.5, teacher1.id),   # Кузнецов - отлично
            (3, subj_db.id, ct_exam.id, 5.0, teacher1.id),   # Попов - отлично
            (3, subj_db.id, ct_coursework.id, 5.0, teacher1.id), # Попов - отлично
            (17, subj_db.id, ct_exam.id, 2.5, teacher1.id),  # Давыдов - удовл.
            
            # Математика (Сидорова, gs_list[3])
            (0, subj_math.id, ct_exam.id, 4.0, teacher2.id),  # Иванов - хорошо
            (1, subj_math.id, ct_exam.id, 3.0, teacher2.id), # Смирнов - удовл.
            (1, subj_math.id, ct_test.id, 3.5, teacher2.id), # Смирнов - хорошо
            (2, subj_math.id, ct_exam.id, 4.5, teacher2.id), # Кузнецов - отлично
            
            # Алгоритмы (Петров, gs_list[2])
            (0, subj_algo.id, ct_exam.id, 4.5, teacher1.id),  # Иванов - отлично
            (2, subj_algo.id, ct_exam.id, 5.0, teacher1.id),  # Кузнецов - отлично
            (3, subj_algo.id, ct_exam.id, 3.5, teacher1.id),  # Попов - хорошо
            (17, subj_algo.id, ct_exam.id, 3.0, teacher1.id),  # Давыдов - удовл.
            
            # Веб-технологии (Кузьмин, gs_list[4])
            (0, subj_web.id, ct_coursework.id, 4.5, teacher3.id), # Иванов
            (1, subj_web.id, ct_coursework.id, 4.0, teacher3.id), # Смирнов
            (2, subj_web.id, ct_coursework.id, 5.0, teacher3.id), # Кузнецов
        ]
        
        # Оценки для ИС-22 (студенты 4-6, 19)
        is22_grades = [
            (4, subj_prog.id, ct_exam.id, 4.0, teacher1.id),  # Новиков
            (4, subj_algo.id, ct_exam.id, 4.5, teacher1.id),  # Новиков
            (5, subj_prog.id, ct_exam.id, 3.5, teacher1.id),  # Федоров
            (5, subj_os.id, ct_exam.id, 4.0, teacher1.id),   # Федоров
            (6, subj_prog.id, ct_exam.id, 5.0, teacher1.id),  # Лебедев - отлично
            (6, subj_prog.id, ct_coursework.id, 5.0, teacher1.id),  # Лебедев - курсовая
            (19, subj_prog.id, ct_exam.id, 3.0, teacher1.id), # Степанов
            (19, subj_math.id, ct_exam.id, 4.0, teacher2.id), # Степанов
        ]
        grade_records.extend(is22_grades)
        
        # Оценки для ПИ-21 (студенты 9-11, 18)
        pi21_grades = [
            (9, subj_math.id, ct_exam.id, 4.5, teacher2.id),  # Козлов
            (9, subj_db.id, ct_exam.id, 4.0, teacher1.id),    # Козлов
            (10, subj_math.id, ct_exam.id, 3.5, teacher2.id), # Волков
            (10, subj_db.id, ct_exam.id, 3.0, teacher1.id),   # Волков
            (11, subj_math.id, ct_exam.id, 5.0, teacher2.id), # Смирнова - отлично
            (11, subj_ai.id, ct_exam.id, 4.5, teacher2.id),  # Смирнова
            (18, subj_math.id, ct_exam.id, 2.0, teacher2.id), # Жуков - неуд.
            (18, subj_db.id, ct_exam.id, 3.5, teacher1.id),    # Жуков
        ]
        grade_records.extend(pi21_grades)
        
        # Оценки для ПИБ-21 (студенты 14-16)
        pib21_grades = [
            (14, subj_net.id, ct_exam.id, 4.5, teacher2.id),  # Морозов
            (14, subj_net.id, ct_practice.id, 4.0, teacher2.id), # Морозов
            (14, subj_os.id, ct_exam.id, 4.0, teacher1.id),   # Морозов
            (14, subj_ai.id, ct_exam.id, 4.5, teacher2.id),  # Морозов
            (15, subj_net.id, ct_exam.id, 3.5, teacher2.id), # Петренко
            (15, subj_se.id, ct_coursework.id, 4.0, teacher3.id), # Петренко
            (16, subj_net.id, ct_exam.id, 4.0, teacher2.id),  # Соловьев
            (16, subj_ai.id, ct_exam.id, 3.5, teacher2.id),   # Соловьев
        ]
        grade_records.extend(pib21_grades)
        
        # Создаём оценки
        for sid, subjid, ctid, val, tid in grade_records:
            grade = models.Grade(
                student_id=students[sid].id,
                subject_id=subjid,
                control_type_id=ctid,
                value=val,
                date=datetime.date(2025, 1, 15),
                teacher_id=tid,
            )
            db.add(grade)
            grades.append(grade)
        db.flush()

        # ═══════════════════════════════════════════════════════════════
        # 12. История изменений оценок
        # ═══════════════════════════════════════════════════════════════
        history_records = [
            # Иванов - математика: 3.5 → 4.0 (пересчёт баллов)
            models.GradeHistory(
                grade_id=grades[14].id, old_value=3.5, new_value=4.0,
                changed_at=datetime.datetime(2025, 1, 20, 10, 0),
                changed_by_id=teacher2.id,
                reason="Пересчёт баллов за контрольную работу"
            ),
            # Жуков - математика: 3.0 → 2.0 (списывание)
            models.GradeHistory(
                grade_id=grades[27].id, old_value=3.0, new_value=2.0,
                changed_at=datetime.datetime(2025, 1, 25, 14, 30),
                changed_by_id=teacher2.id,
                reason="Обнаружено списывание на экзамене"
            ),
            # Попов - БД: 4.0 → 5.0 (защита курсовой)
            models.GradeHistory(
                grade_id=grades[13].id, old_value=4.0, new_value=5.0,
                changed_at=datetime.datetime(2025, 2, 1, 9, 0),
                changed_by_id=teacher1.id,
                reason="Дополнительные баллы за защиту курсовой работы"
            ),
            # Смирнов - математика: 2.5 → 3.0 (апелляция)
            models.GradeHistory(
                grade_id=grades[15].id, old_value=2.5, new_value=3.0,
                changed_at=datetime.datetime(2025, 2, 5, 11, 0),
                changed_by_id=teacher2.id,
                reason="Удовлетворена апелляция студента"
            ),
            # Лебедев - программирование: 4.5 → 5.0 (олимпиада)
            models.GradeHistory(
                grade_id=grades[22].id, old_value=4.5, new_value=5.0,
                changed_at=datetime.datetime(2025, 2, 10, 15, 0),
                changed_by_id=teacher1.id,
                reason="Победитель олимпиады по программированию"
            ),
        ]
        db.add_all(history_records)

        # ═══════════════════════════════════════════════════════════════
        # 13. Посещаемость (за разные даты)
        # ═══════════════════════════════════════════════════════════════
        att_dates_sept = [
            datetime.date(2024, 9, 2), datetime.date(2024, 9, 9),
            datetime.date(2024, 9, 16), datetime.date(2024, 9, 23), datetime.date(2024, 9, 30),
        ]
        att_dates_oct = [
            datetime.date(2024, 10, 7), datetime.date(2024, 10, 14),
            datetime.date(2024, 10, 21), datetime.date(2024, 10, 28),
        ]
        
        # ИС-21 на программировании (gs_list[0])
        for i, s in enumerate([0, 1, 2, 3, 17]):
            for j, d in enumerate(att_dates_sept):
                status = "present"
                if j == 2 and s in [1, 17]:  # Пропустили 16 сентября
                    status = "absent"
                elif j == 4 and s == 2:  # Опоздал
                    status = "late"
                db.add(models.Attendance(
                    student_id=students[s].id,
                    group_subject_id=gs_list[0].id,
                    date=d, status=status,
                ))
        
        # ПИ-21 на математике (gs_list[11])
        for i, s in enumerate([9, 10, 11, 18]):
            for j, d in enumerate(att_dates_oct):
                status = "present"
                if j == 1 and s == 18:  # Пропустил
                    status = "absent"
                elif j == 3 and s in [10, 18]:  # Пропустили
                    status = "absent"
                db.add(models.Attendance(
                    student_id=students[s].id,
                    group_subject_id=gs_list[11].id,
                    date=d, status=status,
                ))
        
        # ПИБ-21 на сетях (gs_list[19])
        for j, d in enumerate(att_dates_sept):
            status = "present" if j != 4 else "late"
            db.add(models.Attendance(
                student_id=students[14].id,
                group_subject_id=gs_list[19].id,
                date=d, status=status,
            ))

        # ═══════════════════════════════════════════════════════════════
        # 14. Статистика студентов
        # ═══════════════════════════════════════════════════════════════
        stats_data = [
            (0, 4.4, 12),   # Иванов - 12 оценок
            (1, 3.5, 10),   # Смирнов - 10 оценок
            (2, 4.7, 8),    # Кузнецов - 8 оценок
            (3, 4.2, 8),    # Попов - 8 оценок
            (4, 4.2, 6),    # Новиков
            (5, 3.7, 6),    # Федоров
            (6, 5.0, 4),    # Лебедев - 4 оценки
            (7, 0, 0),      # Орлов - новый
            (8, 0, 0),      # Соколов - новый
            (9, 4.2, 8),    # Козлов
            (10, 3.2, 6),   # Волков
            (11, 4.7, 6),   # Смирнова
            (12, 0, 0),     # Климов - новый
            (13, 0, 0),     # Зайцев - новый
            (14, 4.2, 10),  # Морозов
            (15, 3.7, 6),   # Петренко
            (16, 3.7, 6),   # Соловьев
            (17, 2.8, 8),   # Давыдов - слабый, 8 оценок
            (18, 2.8, 6),   # Жуков - слабый, 6 оценок
            (19, 3.5, 6),   # Степанов
        ]
        for sid, gpa, total_grades in stats_data:
            db.add(models.StudentStats(student_id=students[sid].id, gpa=gpa, total_grades=total_grades))

        # ═══════════════════════════════════════════════════════════════
        # 15. Апелляции (с комментариями)
        # ═══════════════════════════════════════════════════════════════
        appeals = [
            # На рассмотрении
            models.Appeal(
                student_id=students[1].id, subject_id=subj_math.id,
                description="Некорректно подсчитан балл за контрольную работу",
                status="pending",
            ),
            # Одобрена
            models.Appeal(
                student_id=students[18].id, subject_id=subj_math.id,
                description="Запрос на пересдачу экзамена по уважительной причине (болезнь)",
                status="approved",
                comment="Разрешена пересдача 15 февраля 2025 года, аудитория 301",
            ),
            # Отклонена
            models.Appeal(
                student_id=students[17].id, subject_id=subj_db.id,
                description="Несогласие с оценкой за экзамен по базам данных",
                status="rejected",
                comment="Оценка подтверждена. Ошибок в подсчёте баллов не обнаружено. Работа содержит плагиат.",
            ),
            # Одобрена
            models.Appeal(
                student_id=students[5].id, subject_id=subj_prog.id,
                description="Прошу пересмотреть оценку за экзамен",
                status="approved",
                comment="После проверки работы баллы были скорректированы.",
            ),
            # На рассмотрении
            models.Appeal(
                student_id=students[10].id, subject_id=subj_ai.id,
                description="Считаю, что мой ответ был оценён неверно",
                status="pending",
            ),
        ]
        db.add_all(appeals)

        # ═══════════════════════════════════════════════════════════════
        # Коммит
        # ═══════════════════════════════════════════════════════════════
        db.commit()
        print("[seed] Тестовые данные успешно загружены!")
        print("[seed]")
        print("[seed] === Учётные записи ===")
        print("[seed]   Администратор:  admin / admin123")
        print("[seed]   Преподаватели:  petrov / teacher123, sidorova / teacher123, kuzmin / teacher123")
        print("[seed]   Студенты:       ivanov, smirnov, kuznetsov, popov, novikov, fedorov,")
        print("[seed]                   lebedev, orlov, sokolov, kozlov, volkov, smirnova,")
        print("[seed]                   klimov, zaitsev, morozov, petrenko, solovev, davydov, zhukov, stepanov")
        print("[seed]                   (пароль: student123)")
        print("[seed]")
        print("[seed] === Группы и дисциплины ===")
        print("[seed]   ИС-21: Петров → Программирование, БД, Алгоритмы")
        print("[seed]   ИС-21: Сидорова → Математика")
        print("[seed]   ИС-21: Кузьмин → Веб-технологии")
        print("[seed]   ИС-22: Петров → Программирование, ОС, Алгоритмы")
        print("[seed]   ИС-22: Сидорова → Математика")
        print("[seed]   ПИ-21: Сидорова → Математика, ИИ, Дискретная математика")
        print("[seed]   ПИ-21: Петров → Базы данных")
        print("[seed]   ПИ-21: Кузьмин → Инженерия ПО")
        print("[seed]   ПИБ-21: Сидорова → Компьютерные сети, ИИ")
        print("[seed]   ПИБ-21: Петров → Операционные системы")
        print("[seed]   ПИБ-21: Кузьмин → Инженерия ПО")
        print("[seed]")
        print("[seed] === Количество данных ===")
        print(f"[seed]   Студентов: {len(students)}")
        print(f"[seed]   Оценок: {len(grades)}")
        print(f"[seed]   GroupSubject: {len(gs_list)}")

    except Exception as e:
        db.rollback()
        print(f"[seed] Ошибка при загрузке данных: {e}")
        raise
