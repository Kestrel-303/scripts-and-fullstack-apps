import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

import json
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from backend.app.database import get_db
    from backend.app.models import (
        User,
        UserRole,
        StudentProfile,
        DisciplineReview,
        DisciplineStatus,
        ReportCard,
        Course,
    )
    from backend.app.auth_utils import get_current_user, require_roles
    from backend.app.routers.parent import format_course
except ImportError:
    from app.database import get_db
    from app.models import (
        User,
        UserRole,
        StudentProfile,
        DisciplineReview,
        DisciplineStatus,
        ReportCard,
        Course,
    )
    from app.auth_utils import get_current_user, require_roles
    from app.routers.parent import format_course

router = APIRouter(prefix="/api/student", tags=["Student Portal"])


# Pydantic schema for a student's "Edit Details" request
class BioChangeRequest(BaseModel):
    full_name: str
    email: str


# 1. GET /api/student/me - Fetch the logged-in student's own profile, report cards, and published discipline reviews
@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
):
    """
    Fetch the profile, report cards, and ONLY APPROVED_PUBLISHED discipline reviews
    for the currently logged-in student. Data is scoped to student_profile.user_id == current_user.id.
    """
    # Step 1: Find the student profile linked to this logged-in user account
    student_profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )

    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this account.",
        )

    # Step 2: Fetch report cards for this student
    report_cards = (
        db.query(ReportCard)
        .filter(ReportCard.student_id == student_profile.id)
        .all()
    )

    formatted_report_cards = [
        {
            "id": rc.id,
            "term": rc.term,
            "subject": rc.subject,
            "grade": rc.grade,
            "teacher_comments": rc.teacher_comments,
            "status": rc.status.value,
        }
        for rc in report_cards
    ]

    # Step 3: Fetch ONLY APPROVED_PUBLISHED discipline reviews
    discipline_reviews = (
        db.query(DisciplineReview)
        .filter(
            DisciplineReview.student_id == student_profile.id,
            DisciplineReview.status == DisciplineStatus.APPROVED_PUBLISHED,
        )
        .all()
    )

    formatted_discipline_reviews = [
        {
            "id": dr.id,
            "incident_date": str(dr.incident_date),
            "category": dr.category,
            "description": dr.description,
            "logged_by_teacher": dr.teacher.full_name if dr.teacher else "Teacher",
            "status": dr.status.value,
        }
        for dr in discipline_reviews
    ]

    # Step 4: Parse any pending bio changes (stored as a JSON string) so the frontend gets a clean object
    pending_changes = None
    if student_profile.pending_bio_changes:
        try:
            pending_changes = json.loads(student_profile.pending_bio_changes)
        except (json.JSONDecodeError, TypeError):
            pending_changes = None

    return {
        "student": {
            "student_id": student_profile.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "grade_level": student_profile.grade_level,
            "pending_bio_changes": pending_changes,
        },
        "report_cards": formatted_report_cards,
        "discipline_reviews": formatted_discipline_reviews,
    }


# 2. PATCH /api/student/bio-change - Submit a profile edit request for admin approval
@router.patch("/bio-change")
def request_bio_change(
    data: BioChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
):
    """
    Saves the student's requested profile edits into the pending_bio_changes column.
    The change is NOT applied immediately - it waits for an admin to review and approve it.
    """
    # Step 1: Basic input validation
    clean_name = data.full_name.strip()
    clean_email = data.email.strip()

    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name cannot be empty.",
        )

    if "@" not in clean_email or "." not in clean_email.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    # Step 2: Find the student profile linked to this logged-in user account
    student_profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )

    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this account.",
        )

    # Step 3: Save requested changes as a JSON string in pending_bio_changes (awaiting admin approval)
    pending_data = {"full_name": clean_name, "email": clean_email}
    student_profile.pending_bio_changes = json.dumps(pending_data)

    db.commit()
    db.refresh(student_profile)

    return {
        "message": "Your profile changes have been submitted and are pending admin approval.",
        "pending_bio_changes": pending_data,
    }


# 3. GET /api/student/courses - Retrieve the logged-in student's own course load
@router.get("/courses")
def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
):
    """
    Fetch the list of courses for the logged-in student's grade level, along with
    each course's teacher and their public contact info.
    """
    student_profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )

    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this account.",
        )

    courses = (
        db.query(Course)
        .filter(Course.grade_level == student_profile.grade_level)
        .all()
    )

    return [format_course(c) for c in courses]
