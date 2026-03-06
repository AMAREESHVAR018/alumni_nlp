import api from '../api/axios';

const DEBUG = process.env.REACT_APP_DEBUG === 'true';

/**
 * REQUEST INTERCEPTOR
 * 
 * Behavior:
 * 1. Attach JWT token from localStorage to every request
 * 2. Log requests in debug mode
 * 3. Set Authorization header
 * 
 * Security:
 * ✓ Token automatically included in all API calls
 * ✓ Bearer token format (standard JWT authentication)
 * ✓ Token cleared on 401 Unauthorized
 * 
 * Future: HttpOnly cookie support
 * If backend sets httpOnly cookies, Axios will handle automatically
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (DEBUG) {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
  }
  
  return config;
});

/**
 * RESPONSE INTERCEPTOR
 * 
 * Behavior:
 * 1. Log successful responses in debug mode
 * 2. Catch errors and handle specific cases:
 *    - 401 Unauthorized: Token expired, clear storage and redirect to login
 *    - 403 Forbidden: Permission denied
 *    - 404 Not Found: Resource not found
 *    - 5xx Server Error: Display generic error message
 * 3. Preserve original error for caller to handle
 * 
 * Error handling:
 * ✓ 401: Auto logout and redirect to login
 * ✓ 4xx: Show error message from backend
 * ✓ 5xx: Show generic "Server error" message
 * 
 * Future enhancements:
 * ✓ Retry logic with exponential backoff
 * ✓ Circuit breaker for cascading failures
 * ✓ Error tracking (Sentry)
 * ✓ Request queuing (offline support)
 */
api.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
    const statusCode = error.response?.status;
    
    console.error(`[API Error] ${statusCode || 'Network'} - ${errorCode}: ${errorMessage}`);
    
    // Handle authentication errors (token expired or invalid)
    if (statusCode === 401) {
      console.warn('[API] Unauthorized - clearing session and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle permission errors
    if (statusCode === 403) {
      console.warn('[API] Forbidden - insufficient permissions');
    }
    
    // Handle not found errors
    if (statusCode === 404) {
      console.warn('[API] Resource not found');
    }
    
    // Handle server errors
    if (statusCode >= 500) {
      console.error('[API] Server error - backend unavailable');
    }
    
    // Return full error for caller to handle
    return Promise.reject(error);
  }
);

/**
 * ============================================
 * API ENDPOINTS
 * ============================================
 * 
 * Organized by feature domain
 * Each endpoint includes:
 * - Function name (self-documenting)
 * - Parameters (clear intent)
 * - Error handling (delegated to components)
 */

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  searchAlumni: (filters) => api.get('/auth/alumni/search', { params: filters }),
  getAlumni: (id) => api.get(`/auth/alumni/${id}`),
};

// Features APIs
export const featuresAPI = {
  stats: () => api.get('/features/stats'),
  activity: () => api.get('/features/activity'),
  trending: () => api.get('/features/trending'),
  notifications: () => api.get('/features/notifications'),
  aiAdvice: () => api.get('/features/ai-advice'),
  leaderboard: () => api.get('/features/leaderboard'),
  bookMentor: (data) => api.post('/features/book-mentor', data),
  bookings: () => api.get('/features/bookings'),
};

// Chat APIs
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId) => api.get(`/chat/${conversationId}`),
  sendMessage: (data) => api.post('/chat', data),
  markRead: (conversationId) => api.put(`/chat/${conversationId}/read`),
};

// Mentor APIs
export const mentorAPI = {
  getRecommendations: (userId) => api.get(`/mentors/recommendations/${userId}`),
};

// Question APIs
export const questionAPI = {
  ask: (data) => api.post('/questions', data),
  getQuestion: (id) => api.get(`/questions/${id}`),
  getAllQuestions: (filters) => api.get('/questions/all', { params: filters }),
  getMyQuestions: (filters) => api.get('/questions/my-questions', { params: filters }),
  answer: (id, data) => api.post(`/questions/${id}/answer`, data),
  assignQuestion: (id, data) => api.post(`/questions/${id}/assign`, data),
  markHelpful: (id) => api.post(`/questions/${id}/helpful`),
};

// Job APIs
export const jobAPI = {
  getAllJobs: (filters) => api.get('/jobs', { params: filters }),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  getMyJobs: (filters) => api.get('/jobs/my-jobs/list', { params: filters }),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  closeJob: (id) => api.post(`/jobs/${id}/close`),
  applyJob: (jobId, data) => api.post(`/jobs/${jobId}/apply`, data),
  getJobApplications: (jobId, filters) => api.get(`/jobs/${jobId}/applications`, { params: filters }),
  getMyApplications: (filters) => api.get('/jobs/applications/my-applications', { params: filters }),
  updateApplicationStatus: (appId, data) => api.put(`/jobs/applications/${appId}/status`, data),
};

/**
 * ============================================
 * SYSTEM HEALTH CHECK
 * ============================================
 * 
 * Used by frontend on startup to verify backend connectivity
 * Useful for offline detection and graceful degradation
 */
export const systemAPI = {
  health: () => api.get('/health'),
  readiness: () => api.get('/ready'),
};

export default api;
