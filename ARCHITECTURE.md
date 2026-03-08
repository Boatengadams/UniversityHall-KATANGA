# 1. System Architecture

## Frontend
- Multi-page web app on Firebase Hosting.
- Core pages: `index.html` (login/register), `Lane1annexkatanga.html` (student portal), `maintenance.html`, `staff.html`, `admin.html`.
- Refactored modular client logic under `app/`:
  - `app/lib`: business constants and domain trees.
  - `app/utils`: validation and sanitization helpers.
  - `app/components`: reusable UI wiring (searchable fields).
  - `app/services`: Firebase auth/profile access layer.
  - `app/hooks`: theme state and persistence.

## Backend
- Firebase Authentication for identity.
- Firestore for operational data.
- Cloud Functions (`functions/index.js`) for secured server-side routes:
  - `/api/health`
  - `/api/v1/auth/validate-student-email`
  - `/api/v1/maintenance/assign`
  - `/api/v1/reports/status`
- Role checks are enforced by token claims + user profile role.
- Rate-limiting middleware protects API routes.

## Data Flow
1. User signs up/signs in via Firebase Auth.
2. Profile metadata is written to `users/{uid}` in Firestore.
3. Students submit reports to nested report collections.
4. Admin routes assign maintenance and update statuses.
5. Firestore triggers log report-create events.

# 2. Folder Structure

```text
/app
  /components
    searchableSelect.js
  /hooks
    useTheme.js
  /lib
    catalogs.js
  /services
    authService.js
    profileService.js
  /styles
  /utils
    validation.js
/functions
  index.js
  notifications.js
  package.json
/.github/workflows
  firebase-deploy.yml
index.html
auth.js
script.js
styles.css
firestore.rules
firestore.indexes.json
firebase.json
ARCHITECTURE.md
```

# 3. Firebase Firestore Database Schema

## `users/{uid}`
- `name: string`
- `email: string`
- `login: string`
- `role: "student" | "maintenance_technician" | "staff" | "admin" | "super_admin"`
- `approved: boolean`
- `studentId: string` (8 digits)
- `idNumber: string`
- `wing, wingLabel, lane, laneLabel, room, gender: string` (students)
- `college, department, program: string` (students)
- `maintenanceType, maintenanceLabel, allowedFaultTypes[]` (technicians)
- `staffRank` (staff)
- `createdAt, updatedAt: timestamp`

## `rooms/{roomId}`
- Room metadata container.

## `rooms/{roomId}/students/{studentUid}/reports/{reportId}`
- `room, area, areaLabel, subdivision, subdivisionLabel, locationText`
- `faults: string[]`
- `faultTypes: string[]`
- `imageUrls: string[]`
- `status: "pending" | "assigned" | "in_progress" | "resolved" | "rejected"`
- `assignmentStatus: string`
- `assignedTechnicianUid: string`
- `student: { uid, name, id, login }`
- `createdBy: string`
- `createdAt, updatedAt: timestamp`

## `maintenanceAssignments/{assignmentId}`
- `reportPath: string`
- `technicianUid: string`
- `faultType: string`
- `wing, lane, room: string`
- `status: "assigned" | "in_progress" | "resolved"`
- `notes: string`
- `assignedBy: string`
- `assignedAt: timestamp`

## `adminActivity/{activityId}` and `auditLogs/{logId}`
- Audit trail for admin actions.

## Relationships
- `users/{uid}` 1:N `reports` (through room/student nesting).
- `maintenanceAssignments.reportPath` references a report document path.
- Admin activity references actor UID and target entity IDs.

# 4. Security Rules

- Auth required for all protected reads.
- Admin-only writes for high-risk collections.
- Students can create only their own room reports and only when approved.
- User self-update blocked from privilege fields.
- Default deny fallback (`match /{document=**}`) applied.

Rules file: `firestore.rules`.

# 5. Frontend Design System

- Glassmorphism auth card with responsive layout.
- Transparent PNG branding/logo.
- Removed frontend security labels from login UX.
- Form system now includes:
  - Rounded corners
  - Soft shadows
  - Hover/focus states
  - Accessible focus outline
  - Inline real-time errors
- Added dark/light mode support with persisted preference.
- Searchable hierarchical academic selection:
  - College -> Department -> Program
- Student validation rules:
  - Email must match `@st.knust.edu.gh`
  - Student ID exactly 8 numeric digits
  - Confirm password must match
  - Wing auto-sets gender
  - Location uses Wing -> Lane -> Room

# 6. Backend API Structure

Base path: `/api`

- `GET /health`
  - Health check.
- `POST /v1/auth/validate-student-email`
  - Validates student email pattern.
- `POST /v1/maintenance/assign`
  - Admin-only assignment creation.
- `PATCH /v1/reports/status`
  - Admin-only report status update.

Cross-cutting controls:
- Bearer token verification (`firebase-admin auth`).
- RBAC by custom claims + user profile role.
- Request rate limiting middleware.
- JSON payload size cap.

# 7. Deployment Guide

## Local Setup
1. Install dependencies:
   - `npm ci`
   - `npm --prefix functions ci`
2. Login to Firebase:
   - `npx firebase login`
3. Run emulators:
   - `npm run serve`

## Firebase Setup
1. Create Firebase project.
2. Enable Authentication (Email/Password).
3. Create Firestore database.
4. Deploy rules/indexes:
   - `npx firebase deploy --only firestore:rules,firestore:indexes`
5. Deploy full stack:
   - `npm run deploy`

## GitHub CI/CD
- Workflow file: `.github/workflows/firebase-deploy.yml`
- Required secret: `FIREBASE_TOKEN`
- Pipeline runs lint on PR/push and deploys on `main`.

# 8. Performance & Scaling Strategy

- Firestore composite indexes for report dashboards and assignment tracking.
- Paginate report queries using `createdAt` cursor.
- Lazy-load heavy views/modules where possible.
- Use immutable caching for JS/CSS and short cache for HTML.
- Service worker shell caching for low-latency repeat visits.
- Minimize Firestore reads by:
  - Scoping queries by role/location
  - Using collection-group indexes
  - Avoiding unbounded listeners
- Designed for ~300 to 10,000 concurrent users with:
  - Stateless APIs in Cloud Functions
  - Horizontal function scaling (`maxInstances`)
  - Rate limiting on API endpoints
  - Security rules enforcing least privilege
