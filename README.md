# FlowPulse — Personal Productivity, Learning & Habit Tracker

FlowPulse is a production-oriented, multi-user web application designed for personal productivity, learning tracking, habit formation, sleep monitoring, long-term goal management, and quick note capture.

Built with a **Django 5 + Django REST Framework** backend and a **React 19 + TypeScript + Vite + Tailwind CSS** frontend.

---

## 🌟 Key Features

### 1. 📊 Executive Dashboard
- **Overview Stat Cards:** Today's study duration, sleep hours, habit completion rate, and active goals count.
- **7-Day Study Trends:** Visual bar chart depicting daily learning volume.
- **Habit Quick-Check:** Instant toggle for today's habits directly from the home screen.
- **Daily Plan Checklist:** Interactive to-do items for the day with immediate status updates.
- **Active Goals Progress:** Visual progress bars and countdown pills to nearest target deadlines.

### 2. ⏱️ Study & Focus Tracker
- **Dual Mode Focus Timer:**
  - **Pomodoro Mode:** 25-minute focus intervals followed by 5-minute recovery breaks.
  - **Stopwatch Mode:** Open-ended deep work sessions.
- **Subject & Goal Tagging:** Associate focus time with subjects and long-term milestones.
- **Manual Study Logging:** Record offline learning sessions with date, subject, and duration.
- **Session History:** Historical log of focus sessions with duration aggregations.

### 3. 🌙 Sleep & Recovery Tracker
- **Duration Logging:** Log sleep hours and minutes with qualitative rest notes.
- **14-Day Sleep History Chart:** Visual area chart monitoring recovery consistency against the 7.5–8.5h target.
- **Recovery Metrics:** Average sleep duration and consistency rating.

### 4. ⚡ Habit Tracker & Streaks
- **7-Day Consistency Matrix:** Interactive grid displaying the past week with 1-click completion toggles.
- **Consecutive Streaks:** Real-time current streak and personal best streak counters.
- **Habit Management:** Add, describe, archive, or delete custom habits.

### 5. 🎯 Goals & Subtasks
- **Multi-Level Goal Tracking:** Categorized goals (Learning, Career, Health, Finance, Personal).
- **Milestones & Action Items:** Nested checklists per goal that dynamically recalculate goal completion percentage.
- **Deadline Countdowns:** Visual days-remaining indicators.

### 6. 📅 Structured Planning
- **Daily Agenda:** Prioritized task list for today with date navigation (Previous, Today, Next).
- **Monthly Themes & Yearly Vision:** Macro-level goal setting and strategic direction.
- **Task Rollover Support:** Carry forward unfinished items to the next day.

### 7. 📝 Quick Notes & Brain Dump
- **Fast Capture:** Global modal accessible anywhere in the app (`+ Quick Note`).
- **Tagging & Search:** Real-time filter by title, content, or tags.
- **Clipboard Sync:** 1-click copy for notes and summaries.

### 8. 📈 Analytics & Productivity Index
- **Productivity Index:** Weighted score reflecting study volume, habit streaks, sleep recovery, and goal progress.
- **Weekly & Monthly Trends:** Multi-metric breakdown of productivity vs rest.
- **Data Export:** Complete export of user records in JSON format.

### 9. ⚙️ Account & Customization
- **Profile Settings:** Display name, timezone configuration.
- **Dark / Light Theme:** Sleek dark mode by default with seamless toggle.
- **Notification Preferences:** Customizable alerts for study reminders and streak risks.

---

## 🛠️ Tech Stack

- **Backend:**
  - Python 3.11+
  - Django 5.0.6
  - Django REST Framework 3.15.2
  - django-allauth 64.2.1
  - WhiteNoise 6.7.0 (compressed static file serving)
  - SQLite (Local Dev) / PostgreSQL (Production)
- **Frontend:**
  - React 19.3
  - TypeScript 6.0
  - Vite 8.3
  - Tailwind CSS 3.4
  - Lucide React (modern icon suite)
  - Recharts (responsive data visualizations)
  - Axios (HTTP client with CSRF and JWT/session management)

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed sample demo data
python manage.py seed_data

# Run tests
python manage.py test

# Start the Django development server
python manage.py runserver
```

The backend API will run at `http://localhost:8000/`.
- **API Documentation (Swagger):** `http://localhost:8000/api/docs/`
- **Django Admin:** `http://localhost:8000/admin/`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Run build check
npm run build

# Start Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173/`.

---

## 🔑 Demo Account Credentials

When using `python manage.py seed_data`, a pre-populated test account is available:
- **Email:** `demo@example.com`
- **Password:** `Password123!`

*(The Login page also includes a "1-Click Instant Demo Login" button for instant testing)*.

---

## ☁️ Production Deployment on Render

This repository includes a turnkey `render.yaml` Blueprint:
1. Push this repository to GitHub.
2. In the Render Dashboard, click **New +** > **Blueprint**.
3. Select your repository.
4. Render will provision:
   - A managed PostgreSQL database (`flowpulse-db`).
   - A Django web service (`flowpulse-backend`).
   - A React static SPA site (`flowpulse-frontend`).
   - A daily cron job (`flowpulse-daily-reminders`) executing `python manage.py send_reminders`.