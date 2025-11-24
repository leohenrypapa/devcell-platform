# DevCell Platform – Dashboard

## 1. Purpose

The Dashboard is the main landing page of the DevCell Platform and serves as a **morning brief** view. It shows:

- What *you* are doing today.
- A snapshot of the entire unit’s activity.
- An AI-generated daily SITREP you can copy into briefs or emails.

---

## 2. Data Sources

The Dashboard relies on three backend endpoints:

1. **Standups by date**
   - `GET /api/standup/by-date?date=YYYY-MM-DD`  
   - Used to show:
     - Your standups today
     - Total standup count today

2. **Projects list**
   - `GET /api/projects`  
   - Used to show:
     - Your projects
     - Project counts by status (planned, active, blocked, done)

3. **Standup AI summary**
   - `GET /api/standup/summary`  
   - Used to generate the AI Unit SITREP for today.

---

## 3. Layout & Sections

Page: `DashboardPage.tsx`

### 3.1 My Today (Left Panel)

Shows information specific to the logged-in user:

- **Header**
  - Date (`YYYY-MM-DD`)
  - Signed-in username, if any

- **My Standups Today**
  - Filters today’s standups to `name === current_user.username`.
  - For each standup:
    - Project name (if any)
    - Today’s text
    - Blockers (if any)

- **My Projects**
  - Filters projects to `owner === current_user.username`.
  - For each project:
    - Name
    - Status (planned/active/blocked/done)
    - Description

If the user has no standups or projects, the section explains that rather than appearing empty.

### 3.2 Unit Snapshot (Right Panel)

Shows high-level information about the whole unit:

- **Total standups today**
  - Number of standup entries returned by `/by-date` for today.

- **Projects by Status**
  - Number of projects in each status:
    - Planned
    - Active
    - Blocked
    - Done

This gives leadership a quick sense of how many efforts are in progress, stuck, or completed.

### 3.3 AI Unit SITREP (Bottom Panel)

- Uses the same endpoint as the Standups page: `GET /api/standup/summary`.
- Shows:
  - “Based on N standup entries.”
  - The AI-generated summary text.

Controls:

- **Refresh Summary**
  - Calls the endpoint again to refresh the SITREP.
- **Copy SITREP**
  - Copies a formatted text block to the clipboard, such as:

    ```text
    Unit Daily Standup SITREP (today)
    Based on 7 standup entries.

    - Alpha project is progressing on API integration, minor blockers on environment.
    - Bravo project is blocked waiting for access to test systems.
    - One bugfix effort completed and marked as done.
    ```

The SITREP can be pasted directly into an email, chat, or slide.

---

## 4. Auth Behavior

- The Dashboard is an **authenticated** route.
- If the user is not logged in, they are redirected to `/login`.
- If a token expires, calls to the above endpoints will fail with 401, and the frontend should redirect to login as needed.

There is no additional role-based difference on the Dashboard: both users and admins see the same type of information, although admins can cross-check with Standups and Projects pages for details.

---

## 5. Operational Notes

- If the Dashboard appears empty:
  - Check that standups have actually been submitted for today.
  - Check that projects have been created.
  - Verify that the date on the server is correct.

- If the AI SITREP section is failing:
  - Check connectivity and configuration of the LLM server.
  - Look at backend logs for errors in the summary service.

- If project counts seem wrong:
  - Ensure that status values are valid (`planned`, `active`, `blocked`, `done`).
  - If needed, add UI filters in the Projects page or adjust status choices.

The Dashboard is meant to be a **quick briefing tool**, not a detailed analytics page, but it can be extended in the future (graphs, trend charts, etc.) if needed.
