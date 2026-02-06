import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

axios.defaults.withCredentials = true;

export const api = {
  // Auth
  login: (credentials) => axios.post(`${API_BASE_URL}/auth/login`, credentials),
  register: (credentials) => axios.post(`${API_BASE_URL}/auth/register`, credentials),
  logout: () => axios.post(`${API_BASE_URL}/auth/logout`),
  checkAuth: () => axios.get(`${API_BASE_URL}/auth/me`),

  getTasks: () => axios.get(`${API_BASE_URL}/tasks`),
  createTask: (task) => axios.post(`${API_BASE_URL}/tasks`, task),
  updateTask: (id, task) => axios.put(`${API_BASE_URL}/tasks/${id}`, task),
  deleteTask: (id) => axios.delete(`${API_BASE_URL}/tasks/${id}`),

  // Date navigation
  getTasksForDate: (date) => axios.get(`${API_BASE_URL}/tasks/date/${date}`),
  createTaskForDate: (date, task) => axios.post(`${API_BASE_URL}/tasks/date/${date}`, task),

  // Incomplete tasks
  getIncompleteTasks: () => axios.get(`${API_BASE_URL}/tasks/incomplete`),
  completeTaskToday: (id, notes) => axios.post(`${API_BASE_URL}/tasks/${id}/complete-today`, { notes }),

  // Article management for reading tasks
  addArticleToTask: (taskId, article) => axios.post(`${API_BASE_URL}/tasks/${taskId}/articles`, article),
  updateArticleStatus: (taskId, articleIndex, status) => axios.patch(`${API_BASE_URL}/tasks/${taskId}/articles/${articleIndex}`, { status }),
  deleteArticle: (taskId, articleIndex) => axios.delete(`${API_BASE_URL}/tasks/${taskId}/articles/${articleIndex}`),

  getGoals: () => axios.get(`${API_BASE_URL}/goals`),
  createGoal: (goal) => axios.post(`${API_BASE_URL}/goals`, goal),
  updateGoal: (id, goal) => axios.put(`${API_BASE_URL}/goals/${id}`, goal),
  deleteGoal: (id) => axios.delete(`${API_BASE_URL}/goals/${id}`),

  getScheduled: () => axios.get(`${API_BASE_URL}/scheduled`),
  syncScheduled: () => axios.post(`${API_BASE_URL}/scheduled/sync`),
  createScheduled: (task) => axios.post(`${API_BASE_URL}/scheduled`, task),
  updateScheduled: (id, task) => axios.put(`${API_BASE_URL}/scheduled/${id}`, task),
  deleteScheduled: (id) => axios.delete(`${API_BASE_URL}/scheduled/${id}`),

  getLog: (date) => axios.get(`${API_BASE_URL}/logs/${date}`),
  saveLog: (log) => axios.post(`${API_BASE_URL}/logs`, log),

  searchArticles: (query) => axios.post(`${API_BASE_URL}/chat/search`, { query }),
  processReflection: (text, currentLog = {}) => axios.post(`${API_BASE_URL}/reflection/process`, { text, currentLog }),
  parseTasks: (text) => axios.post(`${API_BASE_URL}/planner/parse`, { text }),
  getWeeklyHistory: () => axios.get(`${API_BASE_URL}/tasks/history/weekly`),
  validateLockCriteria: (criteria, notes) => axios.post(`${API_BASE_URL}/tasks/validate-lock`, { criteria, notes }),

  // News Digest & QNA
  getNewsDigest: (topics) => axios.post(`${API_BASE_URL}/chat/news-digest`, { topics }),
  askQuestion: (question) => axios.post(`${API_BASE_URL}/chat/qna`, { question }),
  extractContent: (urls) => axios.post(`${API_BASE_URL}/chat/extract`, { urls }),

  // Research & Learning Paths
  generateLearningPath: (topic, depth = 'basic') => axios.post(`${API_BASE_URL}/research/learning-path`, { topic, depth }),
  mapSite: (url, maxDepth, limit) => axios.post(`${API_BASE_URL}/research/map-site`, { url, maxDepth, limit }),
  crawlSite: (url, options) => axios.post(`${API_BASE_URL}/research/crawl`, { url, ...options }),
  searchDomain: (query, domains, maxResults) => axios.post(`${API_BASE_URL}/research/search-domain`, { query, domains, maxResults }),

  // Research Data Persistence
  getResearchData: () => axios.get(`${API_BASE_URL}/research/data`),
  saveLearningPath: (learningPath, completedItems) => axios.post(`${API_BASE_URL}/research/save-learning-path`, { learningPath, completedItems }),
  updateLearningProgress: (completedItems) => axios.post(`${API_BASE_URL}/research/update-learning-progress`, { completedItems }),
  clearLearningPath: () => axios.post(`${API_BASE_URL}/research/clear-learning-path`),
  saveWeeklyDigest: (digest) => axios.post(`${API_BASE_URL}/research/save-weekly-digest`, { digest }),

  // Voice Transcription
  transcribeAudio: (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    return axios.post(`${API_BASE_URL}/voice/transcribe`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  checkVoiceHealth: () => axios.get(`${API_BASE_URL}/voice/health`),
};
