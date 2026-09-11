import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
try:
    from backend.app.main import app
    from backend.app.database import SessionLocal
    from backend.app.seed_data import seed_data
except ImportError:
    from app.main import app
    from app.database import SessionLocal
    from app.seed_data import seed_data


def test_api_routes():
    # 0. Ensure seed data exists
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

    client = TestClient(app)
    print("\n--- STARTING API ROUTE TESTS ---")

    # 1. Login as Principal
    res = client.post("/token", json={"username": "principal1", "password": "password123"})
    assert res.status_code == 200, f"Principal login failed: {res.text}"
    principal_token = res.json()["access_token"]
    principal_headers = {"Authorization": f"Bearer {principal_token}"}
    print("PASS: Principal login (/token)")

    # 2. Login as Teacher 1
    res = client.post("/token", json={"username": "teacher1", "password": "password123"})
    assert res.status_code == 200, f"Teacher login failed: {res.text}"
    teacher_token = res.json()["access_token"]
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
    print("PASS: Teacher login (/token)")

    # 3. Login as Parent 1 (Robert Holland - parent of Lucas, student_id=1)
    res = client.post("/token", json={"username": "parent1", "password": "password123"})
    assert res.status_code == 200, f"Parent1 login failed: {res.text}"
    parent1_token = res.json()["access_token"]
    parent1_headers = {"Authorization": f"Bearer {parent1_token}"}
    print("PASS: Parent 1 login (/token)")

    # 4. Login as Parent 2 (Sarah Jenkins - parent of Mia, student_id=2)
    res = client.post("/token", json={"username": "parent2", "password": "password123"})
    assert res.status_code == 200, f"Parent2 login failed: {res.text}"
    parent2_token = res.json()["access_token"]
    parent2_headers = {"Authorization": f"Bearer {parent2_token}"}
    print("PASS: Parent 2 login (/token)")

    # 5. GET /api/parent/children for Parent 1
    res = client.get("/api/parent/children", headers=parent1_headers)
    assert res.status_code == 200
    children = res.json()
    assert len(children) == 1
    assert children[0]["full_name"] == "Lucas Holland"
    print("PASS: GET /api/parent/children returns parent's linked children")

    # 6. GET /api/parent/child/1 (Lucas - own child)
    res = client.get("/api/parent/child/1", headers=parent1_headers)
    assert res.status_code == 200
    data = res.json()
    # Check that ONLY APPROVED_PUBLISHED discipline logs are present
    for disc in data["discipline_reviews"]:
        assert disc["status"] == "APPROVED_PUBLISHED"
    print("PASS: GET /api/parent/child/1 returns own child details & ONLY APPROVED_PUBLISHED discipline logs")

    # 7. GET /api/parent/child/2 (Mia - OTHER parent's child!) -> Strict 403 Forbidden check!
    res = client.get("/api/parent/child/2", headers=parent1_headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"
    assert "Access forbidden" in res.json()["detail"]
    print("PASS: GET /api/parent/child/2 correctly returns HTTP 403 Forbidden for unlinked student")

    # 8. GET /api/teacher/my-students
    res = client.get("/api/teacher/my-students", headers=teacher_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 2
    print("PASS: GET /api/teacher/my-students returns student list")

    # 9. POST /api/teacher/discipline (Teacher creates pending discipline log for student 2)
    res = client.post(
        "/api/teacher/discipline",
        json={
            "student_id": 2,
            "category": "Disruption",
            "description": "Talking loudly during silent reading period.",
            "status": "PENDING_ADMIN_REVIEW",
        },
        headers=teacher_headers,
    )
    assert res.status_code == 200
    new_disc_id = res.json()["discipline_review"]["id"]
    print(f"PASS: POST /api/teacher/discipline created log ID={new_disc_id} in PENDING_ADMIN_REVIEW state")

    # 10. GET /api/admin/discipline-queue (Principal views pending queue)
    res = client.get("/api/admin/discipline-queue", headers=principal_headers)
    assert res.status_code == 200
    queue = res.json()
    assert any(item["id"] == new_disc_id for item in queue)
    print("PASS: GET /api/admin/discipline-queue lists pending review items")

    # 11. PATCH /api/admin/discipline/{id}/approve (Principal approves log)
    res = client.patch(f"/api/admin/discipline/{new_disc_id}/approve", headers=principal_headers)
    assert res.status_code == 200
    assert res.json()["discipline_review"]["status"] == "APPROVED_PUBLISHED"
    print("PASS: PATCH /api/admin/discipline/{id}/approve publishes log")

    # 12. GET /api/parent/child/2 (Parent 2 views Mia's profile and sees newly approved log)
    res = client.get("/api/parent/child/2", headers=parent2_headers)
    assert res.status_code == 200
    disc_ids = [d["id"] for d in res.json()["discipline_reviews"]]
    assert new_disc_id in disc_ids
    print("PASS: Parent 2 can now view newly approved discipline log for child 2")

    print("\nALL API ROUTE TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_api_routes()
