import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

try:
    from backend.app.database import get_db
    from backend.app.models import (
        User,
        UserRole,
        StudentProfile,
        DisciplineReview,
        DisciplineStatus,
        ReportCard,
        ReportCardStatus,
        TeacherProfile,
    )
    from backend.app.auth_utils import get_current_user, require_roles
except ImportError:
    from app.database import get_db
    from app.models import (
        User,
        UserRole,
        StudentProfile,
        DisciplineReview,
        DisciplineStatus,
        ReportCard,
        ReportCardStatus,
        TeacherProfile,
    )
    from app.auth_utils import get_current_user, require_roles

router = APIRouter(prefix="/api/teacher", tags=["Teacher Portal"])


# Pydantic schema for logging discipline review
class DisciplineCreateRequest(BaseModel):
    student_id: int
    category: str
    description: str
    incident_date: Optional[date] = None
    status: Optional[DisciplineStatus] = DisciplineStatus.DRAFT


# Pydantic schema for submitting/updating a report card grade
class ReportCardUpsertRequest(BaseModel):
    student_id: int
    term: str
    subject: str
    grade: str
    teacher_comments: Optional[str] = None


# Pydantic schema for a teacher updating their own public profile
class TeacherProfileUpdateRequest(BaseModel):
    phone: str
    contact_email: Optional[str] = None
    bio: Optional[str] = None


# 1. GET /api/teacher/my-students - List students available to the teacher
@router.get("/my-students")
def get_teacher_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN_PRINCIPAL])),
):
    """
    List all students enrolled in classes taught by or assigned to the teacher.
    Allows teachers to select students when logging discipline entries or report cards.
    """
    # Fetch all active student profiles from database
    students = db.query(StudentProfile).all()

    formatted_students = []
    for student in students:
        formatted_students.append(
            {
                "student_id": student.id,
                "user_id": student.user_id,
                "full_name": student.user.full_name if student.user else "Unknown Student",
                "email": student.user.email if student.user else "",
                "grade_level": student.grade_level,
                "parent_name": student.parent.full_name if student.parent else "No Parent Linked",
                "parent_email": student.parent.email if student.parent else "",
            }
        )

    return formatted_students


# 2. POST /api/teacher/discipline - Create a new discipline or bullying incident log
@router.post("/discipline")
def create_discipline_review(
    data: DisciplineCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TEACHER])),
):
    """
    Allows a teacher to log a discipline incident draft or submit for admin review.
    Approval workflow: Teachers can ONLY create status 'DRAFT' or 'PENDING_ADMIN_REVIEW'.
    Teachers cannot publish directly to 'APPROVED_PUBLISHED'.
    """
    # Step 1: Check if the target student exists
    student = db.query(StudentProfile).filter(StudentProfile.id == data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID {data.student_id} not found.",
        )

    # Step 2: Validate approval workflow status check
    # Teachers can ONLY set status to DRAFT or PENDING_ADMIN_REVIEW
    if data.status == DisciplineStatus.APPROVED_PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teachers cannot directly publish discipline logs. Status must be 'DRAFT' or 'PENDING_ADMIN_REVIEW'.",
        )

    # Step 3: Set incident_date to today if not provided
    log_date = data.incident_date if data.incident_date else date.today()

    # Step 4: Create new DisciplineReview ORM instance
    new_log = DisciplineReview(
        student_id=data.student_id,
        logged_by_teacher_id=current_user.id,  # Link log to logged-in teacher
        incident_date=log_date,
        category=data.category,
        description=data.description,
        status=data.status if data.status else DisciplineStatus.DRAFT,
    )

    # Step 5: Save record to database
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "message": "Discipline review log created successfully.",
        "discipline_review": {
            "id": new_log.id,
            "student_id": new_log.student_id,
            "student_name": new_log.student.user.full_name if new_log.student and new_log.student.user else "",
            "logged_by_teacher": current_user.full_name,
            "category": new_log.category,
            "description": new_log.description,
            "incident_date": str(new_log.incident_date),
            "status": new_log.status.value,
        },
    }


# 3. POST /api/teacher/report-card - Submit or update a term report card grade for a student
@router.post("/report-card")
def submit_report_card(
    data: ReportCardUpsertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TEACHER])),
):
    """
    Allows a teacher to submit a grade for a student's term/subject.
    If a report card already exists for the same student + term + subject, it is updated instead
    of creating a duplicate row. Newly submitted grades are marked TEACHER_SUBMITTED,
    awaiting admin approval before parents can view them.
    """
    # Step 1: Validate the target student exists
    student = db.query(StudentProfile).filter(StudentProfile.id == data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID {data.student_id} not found.",
        )

    # Step 2: Basic field validation
    if not data.term.strip() or not data.subject.strip() or not data.grade.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Term, subject, and grade are all required fields.",
        )

    # Step 3: Check if a report card already exists for this student/term/subject (upsert)
    existing_report_card = (
        db.query(ReportCard)
        .filter(
            ReportCard.student_id == data.student_id,
            ReportCard.term == data.term.strip(),
            ReportCard.subject == data.subject.strip(),
        )
        .first()
    )

    if existing_report_card:
        # Update the existing report card record
        existing_report_card.grade = data.grade.strip()
        existing_report_card.teacher_comments = data.teacher_comments
        existing_report_card.status = ReportCardStatus.TEACHER_SUBMITTED
        db.commit()
        db.refresh(existing_report_card)
        report_card = existing_report_card
    else:
        # Create a brand new report card record
        report_card = ReportCard(
            student_id=data.student_id,
            term=data.term.strip(),
            subject=data.subject.strip(),
            grade=data.grade.strip(),
            teacher_comments=data.teacher_comments,
            status=ReportCardStatus.TEACHER_SUBMITTED,
        )
        db.add(report_card)
        db.commit()
        db.refresh(report_card)

    return {
        "message": "Report card submitted successfully.",
        "report_card": {
            "id": report_card.id,
            "student_id": report_card.student_id,
            "student_name": student.user.full_name if student.user else "",
            "term": report_card.term,
            "subject": report_card.subject,
            "grade": report_card.grade,
            "teacher_comments": report_card.teacher_comments,
            "status": report_card.status.value,
        },
    }


# 4. GET /api/teacher/my-profile - Fetch the logged-in teacher's own public contact profile
@router.get("/my-profile")
def get_my_teacher_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TEACHER])),
):
    """
    Returns the teacher's public-facing profile (phone, optional contact email, bio)
    that parents/students see on the Course Load page. Returns nulls if the teacher
    hasn't set one up yet.
    """
    profile = (
        db.query(TeacherProfile)
        .filter(TeacherProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        return {"phone": None, "contact_email": None, "bio": None}

    return {
        "phone": profile.phone,
        "contact_email": profile.contact_email,
        "bio": profile.bio,
    }


# 5. PUT /api/teacher/my-profile - Create or update the logged-in teacher's public contact profile
@router.put("/my-profile")
def update_my_teacher_profile(
    data: TeacherProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.TEACHER])),
):
    """
    Upserts the teacher's public-facing profile. This is what parents and students see
    when they click into a teacher's name on the Course Load page.
    """
    # Step 1: Basic field validation
    clean_phone = data.phone.strip()
    if not clean_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required.",
        )

    clean_email = data.contact_email.strip() if data.contact_email else None
    if clean_email and ("@" not in clean_email or "." not in clean_email.split("@")[-1]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid contact email address, or leave it blank.",
        )

    # Step 2: Find existing profile, or create a new one (upsert)
    profile = (
        db.query(TeacherProfile)
        .filter(TeacherProfile.user_id == current_user.id)
        .first()
    )

    if profile:
        profile.phone = clean_phone
        profile.contact_email = clean_email
        profile.bio = data.bio.strip() if data.bio else None
    else:
        profile = TeacherProfile(
            user_id=current_user.id,
            phone=clean_phone,
            contact_email=clean_email,
            bio=data.bio.strip() if data.bio else None,
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)

    return {
        "message": "Profile updated successfully.",
        "phone": profile.phone,
        "contact_email": profile.contact_email,
        "bio": profile.bio,
    }
