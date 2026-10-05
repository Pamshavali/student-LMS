import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401 Unauthorized
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      "An unexpected error occurred.";
    return Promise.reject(new Error(message));
  }
);

export const authService = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
};

export const courseService = {
  list: (params) => api.get("/courses", { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post("/courses", data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  publish: (id, status) => api.patch(`/courses/${id}/publish`, { status }),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const categoryService = {
  list: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const enrollmentService = {
  enroll: (courseId, studentId) =>
    api.post("/enrollments", { course_id: courseId, student_id: studentId }),
  getMyCourses: () => api.get("/enrollments/my-courses"),
  getCourseRoster: (courseId) => api.get(`/enrollments/course/${courseId}`),
  updateProgress: (id, progress, status) =>
    api.patch(`/enrollments/${id}/progress`, { progress, status }),
  drop: (id) => api.delete(`/enrollments/${id}`),
};

export const contentService = {
  listByCourse: (courseId) => api.get(`/courses/${courseId}/content`),
  create: (courseId, data) => api.post(`/courses/${courseId}/content`, data),
  update: (id, data) => api.put(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
};

export const assignmentService = {
  listByCourse: (courseId) => api.get(`/courses/${courseId}/assignments`),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (courseId, data) => api.post(`/courses/${courseId}/assignments`, data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
};

export const submissionService = {
  submit: (assignmentId, data) =>
    api.post(`/assignments/${assignmentId}/submissions`, data),
  listByAssignment: (assignmentId) =>
    api.get(`/assignments/${assignmentId}/submissions`),
  getMySubmissions: () => api.get("/submissions/my-submissions"),
  getById: (id) => api.get(`/submissions/${id}`),
  grade: (id, data) => api.put(`/submissions/${id}/grade`, data),
};

export const dashboardService = {
  getAdminStats: () => api.get("/dashboard/admin"),
  getTeacherStats: () => api.get("/dashboard/teacher"),
  getStudentStats: () => api.get("/dashboard/student"),
};

export const userService = {
  list: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  setStatus: (id, isActive) =>
    api.patch(`/users/${id}/status`, { is_active: isActive }),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
