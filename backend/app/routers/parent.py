import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

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


def format_course(course: Course) -> dict:
    """Shared formatter: builds a course + teacher contact card for the Course Load view."""
    teacher = course.teacher
    profile = teacher.teacher_profile if teacher else None

    return {
        "id": course.id,
        "name": course.name,
        "subject": course.subject,
        "grade_level": course.grade_level,
        "teacher": (
            {
                "id": teacher.id,
                "full_name": teacher.full_name,
                "email": teacher.email,
                "phone": profile.phone if profile else None,
                "contact_email": profile.contact_email if profile else None,
                "bio": profile.bio if profile else None,
            }
            if teacher
            else None
        ),
    }

router = APIRouter(prefix="/api/parent", tags=["Parent Portal"])


# 1. GET /api/parent/children - Retrieve all linked children for the logged-in parent
@router.get("/children")
def get_parent_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PARENT])),
):
    """
    Fetch all student profiles linked to the current logged-in parent user.
    Enforces data scoping: PARENT can ONLY view students linked via parent_id == current_user.id.
    """
    # Query student profiles where parent_id matches the logged-in parent's ID
    children = (
        db.query(StudentProfile)
        .filter(StudentProfile.parent_id == current_user.id)
        .all()
    )

    # Format response list with student details
    result = []
    for child in children:
        result.append(
            {
                "student_id": child.id,
                "user_id": child.user_id,
                "full_name": child.user.full_name if child.user else "Unknown",
                "email": child.user.email if child.user else "",
                "grade_level": child.grade_level,
                "pending_bio_changes": child.pending_bio_changes,
            }
        )

    return result


# 2. GET /api/parent/child/{student_id} - Retrieve details, report cards, and published discipline reviews for a child
@router.get("/child/{student_id}")
def get_child_details(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PARENT])),
):
    """
    Fetch a child's complete profile, report cards, and ONLY APPROVED_PUBLISHED discipline reviews.
    Includes strict if/else validation to return 403 Forbidden if the parent attempts to view a child not linked to them.
    """
    # Step 1: Query the student profile by student_id
    student_profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.id == student_id)
        .first()
    )

    # If student does not exist, return 404 Not Found error
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID {student_id} not found.",
        )

    # Step 2: Strict Authorization Check!
    # Verify if this student is actually linked to the logged-in parent
    if student_profile.parent_id != current_user.id:
        # Parent is attempting to access a student that isn't theirs -> raise HTTP 403 Forbidden!
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view records for this student.",
        )
    else:
        # Parent is authorized! Proceed to fetch data.
        pass

    # Step 3: Fetch Report Cards for the student
    report_cards = (
        db.query(ReportCard)
        .filter(ReportCard.student_id == student_id)
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

    # Step 4: Fetch ONLY APPROVED_PUBLISHED discipline reviews for parents
    discipline_reviews = (
        db.query(DisciplineReview)
        .filter(
            DisciplineReview.student_id == student_id,
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

    # Step 5: Construct and return response
    return {
        "student": {
            "student_id": student_profile.id,
            "full_name": student_profile.user.full_name if student_profile.user else "",
            "email": student_profile.user.email if student_profile.user else "",
            "grade_level": student_profile.grade_level,
            "pending_bio_changes": student_profile.pending_bio_changes,
        },
        "report_cards": formatted_report_cards,
        "discipline_reviews": formatted_discipline_reviews,
    }


# 3. GET /api/parent/child/{student_id}/courses - Retrieve a child's course load and teacher contact info
@router.get("/child/{student_id}/courses")
def get_child_courses(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.PARENT])),
):
    """
    Fetch the list of courses for the child's grade level, along with each course's
    teacher and their public contact info. Enforces the same parent/child scoping
    check as the other child-detail endpoints.
    """
    student_profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.id == student_id)
        .first()
    )

    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID {student_id} not found.",
        )

    if student_profile.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view records for this student.",
        )

    courses = (
        db.query(Course)
        .filter(Course.grade_level == student_profile.grade_level)
        .all()
    )

    return [format_course(c) for c in courses]
