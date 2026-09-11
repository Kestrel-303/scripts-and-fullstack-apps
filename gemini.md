# Project Context: School Management System (Parent & Student Portal)

## Architecture Overview
- **Backend:** FastAPI (Python 3.11/3.12) with SQLAlchemy & Alembic, Pydantic v2.
- **Frontend:** React + Vite, Tailwind CSS, Axios, Lucide React icons.
- **Database:** SQLite (local dev) or PostgreSQL.

## Core Authorization & Domain Rules
1. **Roles:** ADMIN_PRINCIPAL, TEACHER, PARENT, STUDENT.
2. **Data Scoping:** 
   - PARENT can ONLY view students linked via `StudentProfile.parent_id == current_user.id`.
   - TEACHER can ONLY view students enrolled in their assigned classes.
3. **Approval Workflows:**
   - **Discipline & Bullying Logs:** Teachers log drafts. Status must be `DRAFT` -> `PENDING_ADMIN_REVIEW` -> `APPROVED_PUBLISHED`. Parents ONLY see `APPROVED_PUBLISHED`.
   - **Report Cards:** Multi-signature flow (`TEACHER_SUBMITTED` -> `ADMIN_APPROVED`).

## Coding Guidelines
- **FastAPI:** Use async endpoints, proper HTTP status codes, and Pydantic schemas for request validation.
- **React:** Functional components, modular API calls in a dedicated `src/api` directory, Tailwind for clean UI layout.

## Code Style & Complexity Rules
- **Simplicity First:** Write clean, beginner-friendly Python and React code. 
- **No Over-Engineering:** Avoid complex abstractions, heavy design patterns, or overly deep directory structures. Use standard `if/else` logic, clear function names, and basic linear flows.
- **Detailed Comments:** Include frequent, student-friendly comments explaining key lines of code (e.g., `# Check if parent is linked to student`).
- **Core Security Must Remain Intact:** Even with simple code, ensure password hashing, JWT authentication, and strict parent/student permission checks are fully enforced.