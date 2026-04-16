"""
Модели SQLAlchemy для системы отслеживания успеваемости студентов АГУ.
"""

from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base
import datetime


class UserRole(Base):
    __tablename__ = "user_role"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    def __repr__(self):
        return f"<UserRole {self.name}>"


class AppealStatus(Base):
    __tablename__ = "appeal_status"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    def __repr__(self):
        return f"<AppealStatus {self.name}>"


class Faculty(Base):
    __tablename__ = "faculty"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, nullable=True)

    groups = relationship("Group", back_populates="faculty")
    specializations = relationship("Specialization", back_populates="faculty")

    def __repr__(self):
        return f"<Faculty {self.name}>"


class Specialization(Base):
    __tablename__ = "specialization"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)

    faculty = relationship("Faculty", back_populates="specializations")
    groups = relationship("Group", back_populates="specialization")

    def __repr__(self):
        return f"<Specialization {self.name}>"


class EnrollmentReason(Base):
    __tablename__ = "enrollment_reason"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    def __repr__(self):
        return f"<EnrollmentReason {self.name}>"


class UserAccount(Base):
    __tablename__ = "user_account"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    role_id = Column(Integer, ForeignKey("user_role.id"), nullable=False)
    
    # ФИО пользователя
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    patronymic = Column(String, nullable=True)

    role = relationship("UserRole")
    student_link = relationship("UserStudentLink", back_populates="user_account", uselist=False)
    teacher_link = relationship("UserTeacherLink", back_populates="user_account", uselist=False)

    @property
    def full_name(self):
        """Возвращает полное ФИО пользователя."""
        parts = [self.last_name, self.first_name, self.patronymic]
        return " ".join(p for p in parts if p) or self.username

    def __repr__(self):
        return f"<UserAccount {self.username}>"


class Group(Base):
    __tablename__ = "group"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    course = Column(String)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    specialization_id = Column(Integer, ForeignKey("specialization.id"), nullable=False)

    faculty = relationship("Faculty", back_populates="groups")
    specialization = relationship("Specialization", back_populates="groups")
    subjects = relationship("GroupSubject", back_populates="group")

    def __repr__(self):
        return f"<Group {self.name}>"


class StudentGroup(Base):
    __tablename__ = "student_group"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("group.id"), nullable=False)
    reason_id = Column(Integer, ForeignKey("enrollment_reason.id"), nullable=False)
    enrollment_date = Column(Date, default=datetime.date.today)
    dropout_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False)

    student = relationship("Student", back_populates="group_links")
    group = relationship("Group")
    reason = relationship("EnrollmentReason")

    def __repr__(self):
        return f"<StudentGroup student={self.student_id} group={self.group_id}>"


class Student(Base):
    __tablename__ = "student"
    id = Column(Integer, primary_key=True, index=True)
    enrollment_year = Column(Integer, default=datetime.datetime.now().year)

    group_links = relationship("StudentGroup", back_populates="student")
    stats = relationship("StudentStats", back_populates="student", uselist=False)
    appeals = relationship("Appeal", back_populates="student")
    grades = relationship("Grade", back_populates="student")
    attendance = relationship("Attendance", back_populates="student")
    user_links = relationship("UserStudentLink", back_populates="student")

    @property
    def current_group(self):
        for link in self.group_links:
            if link.is_current:
                return link.group
        return None

    def __repr__(self):
        return f"<Student id={self.id}>"


class Teacher(Base):
    __tablename__ = "teacher"
    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, nullable=True)

    user_links = relationship("UserTeacherLink", back_populates="teacher")
    grades = relationship("Grade", back_populates="teacher")
    group_subjects = relationship("GroupSubject", back_populates="teacher")

    def __repr__(self):
        return f"<Teacher id={self.id}>"


class Subject(Base):
    __tablename__ = "subject"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    credits = Column(Float, default=0)

    groups = relationship("GroupSubject", back_populates="subject")

    def __repr__(self):
        return f"<Subject {self.code} - {self.name}>"


class ControlType(Base):
    __tablename__ = "control_type"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    def __repr__(self):
        return f"<ControlType {self.name}>"


class Semester(Base):
    __tablename__ = "semester"
    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    term = Column(String, nullable=False)
    is_current = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Semester {self.year} {self.term}>"


class DisciplineGroup(Base):
    """Связь дисциплины с группами и преподавателями."""
    __tablename__ = "discipline_group"
    id = Column(Integer, primary_key=True, index=True)
    discipline_id = Column(Integer, ForeignKey("subject.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("group.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher.id"), nullable=True)
    semester_id = Column(Integer, ForeignKey("semester.id"), nullable=False)
    academic_year = Column(String, nullable=True)

    discipline = relationship("Subject")
    group = relationship("Group")
    semester = relationship("Semester")
    teacher = relationship("Teacher")
    grades = relationship("Grade", back_populates="discipline_group")
    attendances = relationship("Attendance", back_populates="discipline_group")

    def __repr__(self):
        return f"<DisciplineGroup discipline={self.discipline_id} group={self.group_id}>"


class GroupSubject(Base):
    """Связь группы и дисциплины с указанием преподавателя и семестра."""
    __tablename__ = "group_subject"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("group.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subject.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semester.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher.id"), nullable=True)

    group = relationship("Group", back_populates="subjects")
    subject = relationship("Subject", back_populates="groups")
    semester = relationship("Semester")
    teacher = relationship("Teacher", back_populates="group_subjects")

    def __repr__(self):
        return f"<GroupSubject group={self.group.name if self.group else None} subject={self.subject.code if self.subject else None}>"


class Grade(Base):
    __tablename__ = "grade"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False)
    discipline_group_id = Column(Integer, ForeignKey("discipline_group.id"), nullable=False)
    control_type_id = Column(Integer, ForeignKey("control_type.id"), nullable=False)
    value = Column(Float, nullable=False)
    date = Column(Date, default=datetime.date.today)
    teacher_id = Column(Integer, ForeignKey("teacher.id"), nullable=True)

    student = relationship("Student", back_populates="grades")
    discipline_group = relationship("DisciplineGroup", back_populates="grades")
    control_type = relationship("ControlType")
    teacher = relationship("Teacher", back_populates="grades")
    history = relationship("GradeHistory", back_populates="grade", order_by="GradeHistory.changed_at.desc()")

    def __repr__(self):
        return f"<Grade student_id={self.student_id} discipline_group_id={self.discipline_group_id} value={self.value}>"


class GradeHistory(Base):
    """История изменений оценок."""
    __tablename__ = "grade_history"
    id = Column(Integer, primary_key=True, index=True)
    grade_id = Column(Integer, ForeignKey("grade.id"), nullable=False)
    old_value = Column(Float, nullable=True)
    new_value = Column(Float, nullable=False)
    changed_at = Column(DateTime, default=datetime.datetime.utcnow)
    changed_by_id = Column(Integer, ForeignKey("teacher.id"), nullable=True)  # Кто изменил
    reason = Column(String, nullable=True)  # Причина изменения

    grade = relationship("Grade", back_populates="history")
    changed_by = relationship("Teacher")

    def __repr__(self):
        return f"<GradeHistory grade_id={self.grade_id} old={self.old_value} new={self.new_value}>"


class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False)
    discipline_group_id = Column(Integer, ForeignKey("discipline_group.id"), nullable=False)
    date = Column(Date, default=datetime.date.today)
    status = Column(String, nullable=False)

    student = relationship("Student", back_populates="attendance")
    discipline_group = relationship("DisciplineGroup", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance student_id={self.student_id} date={self.date} status={self.status}>"


class Appeal(Base):
    __tablename__ = "appeal"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subject.id"), nullable=False)
    description = Column(String, nullable=False)
    status_id = Column(Integer, ForeignKey("appeal_status.id"), nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="appeals")
    subject = relationship("Subject")
    status = relationship("AppealStatus")

    def __repr__(self):
        return f"<Appeal id={self.id} student_id={self.student_id} status_id={self.status_id}>"


class StudentStats(Base):
    __tablename__ = "student_stats"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semester.id"), nullable=False)
    gpa = Column(Float, default=0.0)
    total_grades = Column(Integer, default=0)

    student = relationship("Student", back_populates="stats")
    semester = relationship("Semester")

    def __repr__(self):
        return f"<StudentStats student_id={self.student_id} semester_id={self.semester_id} gpa={self.gpa}>"


class Main(Base):
    __tablename__ = "main"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id"), nullable=False)
    discipline_group_id = Column(Integer, ForeignKey("discipline_group.id"), nullable=False)
    control_type_id = Column(Integer, ForeignKey("control_type.id"), nullable=False)
    value = Column(Float, nullable=False)
    date = Column(Date, default=datetime.date.today)
    teacher_id = Column(Integer, ForeignKey("teacher.id"), nullable=True)

    student = relationship("Student")
    discipline_group = relationship("DisciplineGroup")
    control_type = relationship("ControlType")
    teacher = relationship("Teacher")

    def __repr__(self):
        return f"<Main student_id={self.student_id} discipline_group_id={self.discipline_group_id} value={self.value}>"


class UserStudentLink(Base):
    __tablename__ = "user_student_link"
    id = Column(Integer, primary_key=True, index=True)
    user_account_id = Column(Integer, ForeignKey("user_account.id"), unique=True, nullable=False)
    student_id = Column(Integer, ForeignKey("student.id"), unique=True, nullable=False)

    user_account = relationship("UserAccount", back_populates="student_link")
    student = relationship("Student", back_populates="user_links")

    def __repr__(self):
        return f"<UserStudentLink user={self.user_account_id} student={self.student_id}>"


class UserTeacherLink(Base):
    __tablename__ = "user_teacher_link"
    id = Column(Integer, primary_key=True, index=True)
    user_account_id = Column(Integer, ForeignKey("user_account.id"), unique=True, nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher.id"), unique=True, nullable=False)

    user_account = relationship("UserAccount", back_populates="teacher_link")
    teacher = relationship("Teacher", back_populates="user_links")

    def __repr__(self):
        return f"<UserTeacherLink user={self.user_account_id} teacher={self.teacher_id}>"