# TaskSutra

TaskSutra is a full-stack task management platform built for teams that need clear ownership, execution visibility, and lightweight admin control.

Instead of treating task tracking as a basic CRUD app, this project focuses on the operational side of teamwork: role-based access, task distribution, progress tracking, analytics dashboards, and exportable reports.



## Why This Project Stands Out

- Built as a production-style MERN application with separate frontend and backend layers
- Supports role-based workflows for `admin` and `member` users
- Includes dashboard analytics, task status summaries, and reporting flows
- Handles real team-management concerns like assignment, progress, due dates, and checklist completion
- Designed with room for future AI-assisted task prioritization and team load balancing

## Recruiter Snapshot

This project demonstrates:

- Full-stack product thinking, not just component building
- Secure authentication with JWT and protected routes
- Role-aware UX for different user journeys
- Data modeling with MongoDB and Mongoose
- REST API design for tasks, users, auth, and reports
- Visualization using Recharts for operational insights
- File upload support for profile images and task attachments

## Core Features

### Admin Experience
- Create, update, and delete tasks
- Assign tasks to one or many team members
- Track overall progress through dashboard cards and charts
- View recent tasks and workload summaries
- Manage users and review member-level task distribution
- Export task and user reports in Excel format

### Member Experience
- View assigned tasks in a dedicated dashboard
- Update task status as work progresses
- Work through checklist items tied to each task
- Track pending, completed, and overdue work
- View detailed task information with deadlines and priority

### Platform Features
- JWT-based authentication
- Role-based route protection
- Profile image upload support
- RESTful backend structure
- Responsive React frontend with reusable dashboard components

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Tailwind CSS 4
- Recharts
- Framer Motion
- Axios

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Multer
- ExcelJS

## System Design

TaskSutra follows a clean split between client and server:

- `frontend/`: React app for authentication, dashboards, task views, and admin panels
- `backend/`: Express API for auth, users, tasks, reporting, and uploads

Key backend route groups:

- `/api/auth` for registration, login, profile, and image upload
- `/api/users` for member lookup and admin-side user management
- `/api/tasks` for task lifecycle, dashboard stats, and task updates
- `/api/reports` for exporting Excel reports

## Current Product Scope

Implemented today:

- Admin and member login/signup flows
- Protected routing by role
- Admin dashboard
- Member dashboard
- Task CRUD operations
- Multi-user task assignment
- Task status tracking
- Checklist-based progress updates
- Report export endpoints

Planned next:

- AI-based smart assignment
- Workload-aware prioritization
- Better notification flow
- Deployment and public demo

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd TaskSutra
```

### 2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside `backend/` with values similar to:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_INVITE_TOKEN=your_admin_invite_token
```

### 4. Start the backend

```bash
cd backend
npm run dev
```

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

## What I Focused On As A Developer

- Building a recruiter-worthy full-stack project with real product depth
- Structuring the app around role-based team workflows
- Making dashboards useful, not decorative
- Keeping the code modular enough to support future AI features

## What This Project Says About My Profile

TaskSutra reflects strength in:

- MERN stack development
- API design and backend structuring
- authentication and access control
- dashboard and admin panel implementation
- data visualization for business use cases
- building practical products instead of tutorial clones

## Notes

- The project is under active development
- Some advanced AI capabilities are part of the roadmap, not the current release
- The README is intentionally written to reflect implemented functionality honestly while showing product direction

## Author

Built by Virendra Suryawanshi.

If you are a recruiter, hiring manager, or collaborator, this project is meant to showcase product-oriented full-stack engineering with a clear path toward smarter team productivity tooling.
