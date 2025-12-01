from app.services.user_store import create_user

admin = create_user(
    username="admin",
    raw_password="change_me_123",  # pick a real password
    role="admin",
    display_name="Admin",
    job_title="Platform Admin",
    team_name="DevCell",
    rank=None,
    skills="system,admin"
)

print(admin)
