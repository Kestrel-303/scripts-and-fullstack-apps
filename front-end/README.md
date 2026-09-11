# 🏫 School Management & Parent Portal System

A full-stack web application that connects parents, teachers, students, and school administrators on a single platform.

Parents get read-only, privacy-scoped visibility into their own child's academic progress and behavior record. Teachers log grades and discipline notes. Sensitive discipline reports go through a principal approval step before a parent ever sees them.

---

## 🌟 Key Features

* **🔒 Role-Based Access Control (RBAC)** — four roles: `ADMIN_PRINCIPAL`, `TEACHER`, `PARENT`, `STUDENT`. The login page asks "Who is logging in?" and cross-checks the selection against the account's real role before letting you in.
  * **Parents:** View report cards, a static list of extracurricular activities, teacher contact details, their child's **Course Load**, and **approved** daily discipline logs — scoped strictly to their own linked children (`StudentProfile.parent_id == current_user.id`).
  * **Teachers:** View the student roster with parent contact emails, draft discipline/behavior notes, submit/update term report card grades, and maintain their own public contact profile (phone, optional email, bio).
  * **Students:** Browse a static list of learning resources (PDFs, books, videos), view their own profile and **Course Load**, and submit profile edit requests that are held for admin approval rather than applied immediately.
  * **Principal / Admin:** Get notified of pending items on login (a badge count on the bell icon), review student profile change requests (approve to apply, or reject), and review/approve the discipline queue.

* **🛡️ Two-Tier Discipline Review Workflow:**
  Discipline logs move through `DRAFT` → `PENDING_ADMIN_REVIEW` → `APPROVED_PUBLISHED`. Teachers cannot publish directly — only a principal-approved log becomes visible on the Parent Dashboard.

* **🔔 Student Profile Change Notifications:**
  When a student submits an "Edit Details" request, it's stored as a pending change on their record. The next time a principal loads the Admin Dashboard (including right after logging in), a notification bell shows the pending count and a dedicated section lists every request with a before/after diff, an **Approve** button (applies the change to the student's real name/email) and a **Reject** button (discards it). This is implemented as a normal REST fetch on page load/login — no additional servers, message queues, or WebSocket infrastructure are required. The trade-off is that it's not instantaneous push: a principal who is already sitting on the dashboard when a student submits a request won't see it appear until they reload or re-navigate to the page. True real-time (no-refresh) notifications would require adding a WebSocket or Server-Sent Events connection — not implemented here to keep the stack simple, but a natural next step if needed.

* **📚 Course Load (Parent & Student):**
  Both the Parent Dashboard (per linked child) and Student Dashboard (their own) have a "Course Load" tab listing courses for that student's grade level, each showing the assigned teacher. Hovering a teacher's name shows a small preview of their bio; clicking it opens a full profile modal centered on screen with their bio, phone, and optional contact email. A course's teacher is resolved via `Course.grade_level == StudentProfile.grade_level` — courses aren't tied to individual students, they're shared by every student in that grade (kept simple; there's no per-student enrollment table). Course data itself is only seeded via `seed_data.py` — there's no UI yet for a principal/admin to manage the course catalog.

---

## 🛠️ Tech Stack

* **Backend:** Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2, JWT (`python-jose`), SQLite
* **Frontend:** React 19, Vite, Tailwind CSS v4, Axios, Lucide React Icons, React Router v7
* **Authentication:** Passlib (bcrypt password hashing, with a SHA-256 fallback if bcrypt is unavailable) + OAuth2 Password Bearer with JWT

---

## 📁 Project Structure

```text
school-system/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app instance, CORS, router registration
│   │   ├── database.py        # SQLAlchemy engine/session (SQLite by default)
│   │   ├── models.py          # User, StudentProfile, DisciplineReview, ReportCard, Course, TeacherProfile
│   │   ├── auth_utils.py      # JWT creation/validation, require_roles() dependency
│   │   ├── seed_data.py       # Populates demo users & sample records
│   │   └── routers/
│   │       ├── auth.py        # POST /token
│   │       ├── parent.py      # /api/parent/*
│   │       ├── teacher.py     # /api/teacher/* (roster, discipline, report cards, own profile)
│   │       ├── admin.py       # /api/admin/* (discipline approval + bio-change notifications)
│   │       └── student.py     # /api/student/* (own profile, bio-change, course load)
│   ├── requirements.txt
│   └── venv/                  # Local virtual environment (not committed via .gitignore)
├── front-end/                 # React SPA (Vite) — note the hyphen in the folder name
│   ├── src/
│   │   ├── api/api.js         # Axios instance; attaches JWT, clears it on 401
│   │   ├── context/AuthContext.jsx  # Global auth state (login/logout/session restore)
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── CourseLoad.jsx  # Shared course list + teacher hover/modal, used by Parent & Student
│   │   └── pages/              # Login, ParentDashboard, TeacherDashboard, AdminDashboard, StudentDashboard
│   └── package.json
└── README.md
```

> Note: there is also an empty, unused `back-end/` directory (hyphenated, no `app` code — just a stray `venv`) left over from initial scaffolding. It is not part of the running application and can be safely ignored or deleted.

There is **no separate `schemas.py`** — request/response Pydantic models are defined inline in each router file, and most responses are hand-built dicts rather than typed `response_model`s.

---

## ⚙️ Setup & Running Locally

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Seed demo users & sample data (skips automatically if the DB already has data)
python -m app.seed_data

# Run the API server
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs` and a health check at `http://localhost:8000/api/health`.

By default it uses a local SQLite file (`school_system.db`, created in the `backend/` directory). To use Postgres or another DB instead, set the `DATABASE_URL` environment variable before running. You can also override the JWT signing key with `SECRET_KEY` (a dev fallback is hardcoded — **set a real value before deploying**).

### 2. Frontend (React + Vite)

```bash
cd front-end
npm install
npm run dev
```

The app will be live at `http://localhost:5173` (Vite's default). It talks to the backend at the hardcoded base URL `http://localhost:8000` (`src/api/api.js`) — update that if your backend runs elsewhere.

### 3. School Logo

The login page displays the school seal from `front-end/src/assets/Alene.jpg`. A 1×1 placeholder image ships in the repo so the app builds and runs out of the box — **replace that file with the real seal image** (same filename, `Alene.jpg`) to have it show up correctly on the login screen.

### 4. Demo Login Credentials

`seed_data.py` creates the following accounts, all with password **`password123`**:

| Role      | Username     | Notes                          |
|-----------|--------------|---------------------------------|
| Principal | `principal1` | Dr. Arthur Vance                |
| Teacher   | `teacher1`   | Eleanor Vance                   |
| Teacher   | `teacher2`   | Marcus Reed                     |
| Parent    | `parent1`    | Robert Holland (parent of student1) |
| Parent    | `parent2`    | Sarah Jenkins (parent of student2)  |
| Student   | `student1`   | Lucas Holland, 10th Grade        |
| Student   | `student2`   | Mia Jenkins, 11th Grade          |

The login page has one-click buttons to autofill both the credentials and the matching "Who is logging in?" role selection for Student, Parent, Teacher, and Principal — so a demo button always logs in successfully. If you type credentials manually, make sure the role radio you select matches the account's actual role, or the login will be rejected with a mismatch error even though the password was correct.

---
