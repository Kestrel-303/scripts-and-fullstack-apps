import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import enum
from datetime import date
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    Enum as SQLEnum,
    ForeignKey,
)
from sqlalchemy.orm import relationship

try:
    from backend.app.database import Base
except ImportError:
    from app.database import Base




class UserRole(str, enum.Enum):
    ADMIN_PRINCIPAL = "ADMIN_PRINCIPAL"
    TEACHER = "TEACHER"
    PARENT = "PARENT"
    STUDENT = "STUDENT"


class DisciplineStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_ADMIN_REVIEW = "PENDING_ADMIN_REVIEW"
    APPROVED_PUBLISHED = "APPROVED_PUBLISHED"


class ReportCardStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    TEACHER_SUBMITTED = "TEACHER_SUBMITTED"
    ADMIN_APPROVED = "ADMIN_APPROVED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)

    # Relationships
    student_profile = relationship(
        "StudentProfile",
        foreign_keys="StudentProfile.user_id",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    children_profiles = relationship(
        "StudentProfile",
        foreign_keys="StudentProfile.parent_id",
        back_populates="parent",
    )
    discipline_reviews_logged = relationship(
        "DisciplineReview",
        foreign_keys="DisciplineReview.logged_by_teacher_id",
        back_populates="teacher",
    )
    courses_taught = relationship(
        "Course",
        back_populates="teacher",
    )
    teacher_profile = relationship(
        "TeacherProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    grade_level = Column(String, nullable=False)
    pending_bio_changes = Column(Text, nullable=True)

    # Relationships
    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="student_profile",
    )
    parent = relationship(
        "User",
        foreign_keys=[parent_id],
        back_populates="children_profiles",
    )
    discipline_reviews = relationship(
        "DisciplineReview",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    report_cards = relationship(
        "ReportCard",
        back_populates="student",
        cascade="all, delete-orphan",
    )


class DisciplineReview(Base):
    __tablename__ = "discipline_reviews"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    logged_by_teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    incident_date = Column(Date, default=date.today, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(
        SQLEnum(DisciplineStatus),
        default=DisciplineStatus.DRAFT,
        nullable=False,
    )

    # Relationships
    student = relationship(
        "StudentProfile",
        back_populates="discipline_reviews",
    )
    teacher = relationship(
        "User",
        foreign_keys=[logged_by_teacher_id],
        back_populates="discipline_reviews_logged",
    )


class ReportCard(Base):
    __tablename__ = "report_cards"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    term = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    teacher_comments = Column(Text, nullable=True)
    status = Column(
        SQLEnum(ReportCardStatus),
        default=ReportCardStatus.DRAFT,
        nullable=False,
    )

    # Relationships
    student = relationship(
        "StudentProfile",
        back_populates="report_cards",
    )


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    grade_level = Column(String, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    teacher = relationship(
        "User",
        foreign_keys=[teacher_id],
        back_populates="courses_taught",
    )


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String, nullable=False)
    contact_email = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    # Relationships
    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="teacher_profile",
    )
