# Student LMS - Frontend Single Page Application

Modern, professional React SPA built with **Vite**, **React Router v6**, **Axios**, and **Vanilla CSS**.

## Features & Pages
- **Public**:
  - `Home`: Architectural showcase, 1-click demo credential filler, and featured courses.
  - `Course Catalog`: Database-level search, category/level filtering, and SQL pagination.
  - `Course Details`: Detailed syllabus outline, instructor profiles, and free student enrollment.
  - `Sign In / Register`: Authentication forms with automatic JWT storage and role routing.
- **Student**:
  - `Dashboard`: Enrolled course progress meters, upcoming deadlines, and recent grades.
  - `My Enrolled Courses`: Active course portfolio with live progress bars and drop controls.
  - `Course Syllabus Study View`: Module reader with interactive completion tracking.
  - `Coursework & Tasks`: Assignment submission modal with repository URL support and deadline status.
  - `Official Gradebook`: Cumulative grade average and teacher feedback comments.
- **Teacher**:
  - `Dashboard`: Instructor portfolio metrics, pending evaluation queue, and average class marks.
  - `My Teaching Courses`: Course manager with publish/unpublish and syllabus shortcuts.
  - `Course Editor`: Form for creating and editing courses with difficulty levels and categories.
  - `Syllabus Manager`: Add, modify, and reorder video lectures, articles, and PDF resources.
  - `Assignment Manager`: Configure assignment deadlines, instructions, and maximum marks.
  - `Submissions & Grading Queue`: Inspect student work and award marks with validation (`marks <= max_marks`).
- **Admin**:
  - `Institutional Overview`: Platform metrics, top courses leaderboard, and category distribution.
  - `User Management`: Paginated user list with role filters, user creation, and active status toggling.
  - `Course Management`: Reassign instructors, publish/archive courses, and cascade deletions.
  - `Category Taxonomy`: Create, edit, and delete course subjects.
  - `Enrollment Roster`: View course attendance, enroll students, and drop registrations.
  - `System Telemetry`: MySQL connection pool status and relational analytics.

## Running Locally
```bash
npm install
npm run dev
```
The application will launch at `http://localhost:5173`.
