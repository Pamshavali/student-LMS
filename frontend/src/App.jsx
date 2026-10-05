import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

// Public Pages
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import CourseList from "./pages/public/CourseList";
import CourseDetails from "./pages/public/CourseDetails";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import MyCourses from "./pages/student/MyCourses";
import StudentCourseView from "./pages/student/StudentCourseView";
import StudentAssignments from "./pages/student/StudentAssignments";
import Grades from "./pages/student/Grades";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import CourseEditor from "./pages/teacher/CourseEditor";
import CourseContentManager from "./pages/teacher/CourseContentManager";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import TeacherSubmissions from "./pages/teacher/TeacherSubmissions";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";
import SystemStatistics from "./pages/admin/SystemStatistics";

// Common
import Profile from "./pages/common/Profile";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public Accessible Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetails />} />

            {/* Student Protected Routes */}
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/courses"
              element={
                <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}>
                  <MyCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/courses/:id"
              element={
                <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}>
                  <StudentCourseView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}>
                  <StudentAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/grades"
              element={
                <ProtectedRoute allowedRoles={["STUDENT", "ADMIN"]}>
                  <Grades />
                </ProtectedRoute>
              }
            />

            {/* Teacher Protected Routes */}
            <Route
              path="/dashboard/teacher"
              element={
                <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses"
              element={
                <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                  <TeacherCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/new"
              element={
                <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                  <CourseEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                  <CourseEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/courses/:id/content"
              element={
                <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                  <CourseContentManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments"
              element={
                <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                  <TeacherAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/submissions"
              element={
                <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                  <TeacherSubmissions />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <CourseManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <CategoryManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/enrollments"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <EnrollmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/statistics"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <SystemStatistics />
                </ProtectedRoute>
              }
            />

            {/* Common Authenticated Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
