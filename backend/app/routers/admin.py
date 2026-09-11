import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

import json
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
    )
    from app.auth_utils import get_current_user, require_roles

router = APIRouter(prefix="/api/admin", tags=["Admin & Principal Portal"])


# 1. GET /api/admin/discipline-queue - List all discipline reviews pending principal approval
@router.get("/discipline-queue")
def get_discipline_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN_PRINCIPAL])),
):
    """
    Retrieves all discipline logs that are currently in 'PENDING_ADMIN_REVIEW' status.
    Only accessible by ADMIN_PRINCIPAL.
    """
    # Filter discipline reviews by PENDING_ADMIN_REVIEW status
    pending_reviews = (
        db.query(DisciplineReview)
        .filter(DisciplineReview.status == DisciplineStatus.PENDING_ADMIN_REVIEW)
        .all()
    )

    formatted_queue = []
    for review in pending_reviews:
        formatted_queue.append(
            {
                "id": review.id,
                "student_id": review.student_id,
                "student_name": review.student.user.full_name if review.student and review.student.user else "Unknown Student",
                "grade_level": review.student.grade_level if review.student else "",
                "logged_by_teacher_id": review.logged_by_teacher_id,
                "teacher_name": review.teacher.full_name if review.teacher else "Unknown Teacher",
                "incident_date": str(review.incident_date),
                "category": review.category,
                "description": review.description,
                "status": review.status.value,
            }
        )

    return formatted_queue


# 2. PATCH /api/admin/discipline/{id}/approve - Approve a pending discipline report and publish it
@router.patch("/discipline/{id}/approve")
def approve_discipline_review(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN_PRINCIPAL])),
):
    """
    Approves a discipline review, changing its status from PENDING_ADMIN_REVIEW to APPROVED_PUBLISHED.
    Once approved, the log becomes visible to the student's parent in the Parent Portal.
    """
    # Step 1: Find the discipline review by ID
    review = db.query(DisciplineReview).filter(DisciplineReview.id == id).first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discipline review with ID {id} not found.",
        )

    # Step 2: Check if already approved
    if review.status == DisciplineStatus.APPROVED_PUBLISHED:
        return {
            "message": "Discipline review is already published.",
            "id": review.id,
            "status": review.status.value,
        }

    # Step 3: Update status to APPROVED_PUBLISHED
    review.status = DisciplineStatus.APPROVED_PUBLISHED

    # Step 4: Commit changes to database
    db.commit()
    db.refresh(review)

    return {
        "message": "Discipline review successfully approved and published for parent view.",
        "discipline_review": {
            "id": review.id,
            "student_id": review.student_id,
            "student_name": review.student.user.full_name if review.student and review.student.user else "",
            "category": review.category,
            "status": review.status.value,
        },
    }


# 3. GET /api/admin/bio-change-requests - List all students with a pending profile edit request
@router.get("/bio-change-requests")
def get_bio_change_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN_PRINCIPAL])),
):
    """
    Notifies the principal of any student profile edit requests awaiting review.
    A student's StudentProfile.pending_bio_changes is non-null while a request is outstanding.
    """
    students_with_requests = (
        db.query(StudentProfile)
        .filter(StudentProfile.pending_bio_changes.isnot(None))
        .all()
    )

    formatted_requests = []
    for student in students_with_requests:
        try:
            requested_changes = json.loads(student.pending_bio_changes)
        except (json.JSONDecodeError, TypeError):
            requested_changes = None

        formatted_requests.append(
            {
                "student_id": student.id,
                "current_full_name": student.user.full_name if student.user else "",
                "current_email": student.user.email if student.user else "",
                "grade_level": student.grade_level,
                "requested_changes": requested_changes,
            }
        )

    return formatted_requests


# 4. PATCH /api/admin/bio-change/{student_id}/approve - Apply the student's requested profile edits
@router.patch("/bio-change/{student_id}/approve")
def approve_bio_change(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN_PRINCIPAL])),
):
    """
    Applies a student's pending profile change request to their actual User record,
    then clears pending_bio_changes so the notification disappears from the queue.
    """
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID {student_id} not found.",
        )

    if not student.pending_bio_changes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This student has no pending profile change request.",
        )

    try:
        requested_changes = json.loads(student.pending_bio_changes)
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stored pending change data is invalid and cannot be applied.",
        )

    # Apply the requested changes onto the student's User record
    if student.user:
        if requested_changes.get("full_name"):
            student.user.full_name = requested_changes["full_name"]
        if requested_changes.get("email"):
            student.user.email = requested_changes["email"]

    # Clear the pending request now that it has been applied
    student.pending_bio_changes = None

    db.commit()
    db.refresh(student)

    return {
        "message": "Profile change approved and applied.",
        "student_id": student.id,
        "full_name": student.user.full_name if student.user else "",
        "email": student.user.email if student.user else "",
    }


# 5. PATCH /api/admin/bio-change/{student_id}/reject - Dismiss a student's profile edit request
@router.patch("/bio-change/{student_id}/reject")
def reject_bio_change(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN_PRINCIPAL])),
):
    """
    Rejects a student's pending profile change request without applying it.
    The student's User record is left unchanged; pending_bio_changes is simply cleared.
    """
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID {student_id} not found.",
        )

    if not student.pending_bio_changes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This student has no pending profile change request.",
        )

    student.pending_bio_changes = None
    db.commit()

    return {
        "message": "Profile change request rejected.",
        "student_id": student.id,
    }
