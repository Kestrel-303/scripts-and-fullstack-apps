import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import hashlib
from datetime import date, timedelta
from sqlalchemy.orm import Session

try:
    from backend.app.database import engine, Base, SessionLocal
    from backend.app.models import (
        User,
        UserRole,
        StudentProfile,
        DisciplineReview,
        DisciplineStatus,
        ReportCard,
        ReportCardStatus,
        Course,
        TeacherProfile,
    )
except ImportError:
    from app.database import engine, Base, SessionLocal
    from app.models import (
        User,
        UserRole,
        StudentProfile,
        DisciplineReview,
        DisciplineStatus,
        ReportCard,
        ReportCardStatus,
        Course,
        TeacherProfile,
    )




def hash_password(password: str) -> str:
    """Hash password using passlib bcrypt if available, else SHA256 fallback."""
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)
    except Exception:
        # Fallback hash for test environment without passlib/bcrypt binaries
        return hashlib.sha256(password.encode("utf-8")).hexdigest()


def seed_data(db: Session):
    """Seed the database with initial data: 1 Principal, 2 Teachers, 2 Parents, 2 Students, and demo records."""
    # Reset / ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Check if data already seeded
    if db.query(User).first():
        print("Database already contains data. Skipping seeding.")
        return

    default_password_hash = hash_password("password123")

    # 1. Principal
    principal = User(
        username="principal1",
        password_hash=default_password_hash,
        full_name="Dr. Arthur Vance",
        email="principal@school.edu",
        role=UserRole.ADMIN_PRINCIPAL,
    )
    db.add(principal)

    # 2. Teachers
    teacher1 = User(
        username="teacher1",
        password_hash=default_password_hash,
        full_name="Eleanor Vance",
        email="evance@school.edu",
        role=UserRole.TEACHER,
    )
    teacher2 = User(
        username="teacher2",
        password_hash=default_password_hash,
        full_name="Marcus Reed",
        email="mreed@school.edu",
        role=UserRole.TEACHER,
    )
    db.add_all([teacher1, teacher2])

    # 3. Parents
    parent1 = User(
        username="parent1",
        password_hash=default_password_hash,
        full_name="Robert Holland",
        email="rholland@example.com",
        role=UserRole.PARENT,
    )
    parent2 = User(
        username="parent2",
        password_hash=default_password_hash,
        full_name="Sarah Jenkins",
        email="sjenkins@example.com",
        role=UserRole.PARENT,
    )
    db.add_all([parent1, parent2])

    # Flush users so we get IDs
    db.flush()

    # 4. Students
    student1_user = User(
        username="student1",
        password_hash=default_password_hash,
        full_name="Lucas Holland",
        email="lholland@student.school.edu",
        role=UserRole.STUDENT,
    )
    student2_user = User(
        username="student2",
        password_hash=default_password_hash,
        full_name="Mia Jenkins",
        email="mjenkins@student.school.edu",
        role=UserRole.STUDENT,
    )
    db.add_all([student1_user, student2_user])
    db.flush()

    # Create Student Profiles
    profile1 = StudentProfile(
        user_id=student1_user.id,
        parent_id=parent1.id,
        grade_level="10th Grade",
        pending_bio_changes=None,
    )
    profile2 = StudentProfile(
        user_id=student2_user.id,
        parent_id=parent2.id,
        grade_level="11th Grade",
        pending_bio_changes="Requested updated emergency contact phone number to 555-0199.",
    )
    db.add_all([profile1, profile2])
    db.flush()

    # 5. Demo Discipline Reviews
    disc1 = DisciplineReview(
        student_id=profile1.id,
        logged_by_teacher_id=teacher1.id,
        incident_date=date.today() - timedelta(days=5),
        category="Disruption",
        description="Disrupted chemistry lab session by handling equipment without safety goggles.",
        status=DisciplineStatus.DRAFT,
    )
    disc2 = DisciplineReview(
        student_id=profile2.id,
        logged_by_teacher_id=teacher2.id,
        incident_date=date.today() - timedelta(days=2),
        category="Bullying",
        description="Verbal altercation with classmate in cafeteria over seating arrangement.",
        status=DisciplineStatus.PENDING_ADMIN_REVIEW,
    )
    disc3 = DisciplineReview(
        student_id=profile1.id,
        logged_by_teacher_id=teacher1.id,
        incident_date=date.today() - timedelta(days=12),
        category="Tardiness",
        description="Accumulated 3 unexcused late arrivals to first period mathematics.",
        status=DisciplineStatus.APPROVED_PUBLISHED,
    )
    db.add_all([disc1, disc2, disc3])

    # 6. Demo Report Cards
    rc1 = ReportCard(
        student_id=profile1.id,
        term="Fall 2026",
        subject="Mathematics",
        grade="A-",
        teacher_comments="Demonstrates strong analytical thinking and excellent homework participation.",
        status=ReportCardStatus.ADMIN_APPROVED,
    )
    rc2 = ReportCard(
        student_id=profile1.id,
        term="Fall 2026",
        subject="Chemistry",
        grade="B+",
        teacher_comments="Good laboratory technique, needs to focus more during group discussions.",
        status=ReportCardStatus.TEACHER_SUBMITTED,
    )
    rc3 = ReportCard(
        student_id=profile2.id,
        term="Fall 2026",
        subject="English Literature",
        grade="A",
        teacher_comments="Exceptional essay writing and insightful commentary on set texts.",
        status=ReportCardStatus.ADMIN_APPROVED,
    )
    rc4 = ReportCard(
        student_id=profile2.id,
        term="Fall 2026",
        subject="Physics",
        grade="B",
        teacher_comments="Solid problem-solving foundation. Draft report under review.",
        status=ReportCardStatus.DRAFT,
    )
    db.add_all([rc1, rc2, rc3, rc4])

    # 7. Demo Courses (course load is grouped by grade level)
    course1 = Course(name="Algebra II", subject="Mathematics", grade_level="10th Grade", teacher_id=teacher1.id)
    course2 = Course(name="Chemistry Fundamentals", subject="Chemistry", grade_level="10th Grade", teacher_id=teacher1.id)
    course3 = Course(name="World History", subject="History", grade_level="10th Grade", teacher_id=teacher2.id)
    course4 = Course(name="English Literature", subject="English", grade_level="11th Grade", teacher_id=teacher2.id)
    course5 = Course(name="Physics I", subject="Physics", grade_level="11th Grade", teacher_id=teacher2.id)
    course6 = Course(name="Biology II", subject="Biology", grade_level="11th Grade", teacher_id=teacher1.id)
    db.add_all([course1, course2, course3, course4, course5, course6])

    # 8. Demo Teacher Profile (only teacher1 has filled one out, to demo the empty state for teacher2)
    teacher1_profile = TeacherProfile(
        user_id=teacher1.id,
        phone="555-0142",
        contact_email="evance.contact@school.edu",
        bio="Eleanor Vance has taught Mathematics and Science for over 12 years, specializing in "
        "hands-on lab work and college-prep coursework. She's available for office hours every "
        "Tuesday and Thursday afternoon.",
    )
    db.add(teacher1_profile)

    db.commit()
    print("Seed data successfully created!")
    print(f"Users created: Principal (1), Teachers (2), Parents (2), Students (2)")
    print(f"Discipline logs created: 3")
    print(f"Report Cards created: 4")
    print(f"Courses created: 6")
    print(f"Teacher profiles created: 1")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
