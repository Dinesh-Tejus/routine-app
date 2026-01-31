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

  getGoals: () => axios.get(`${API_BASE_URL}/goals`),
  createGoal: (goal) => axios.post(`${API_BASE_URL}/goals`, goal),
  updateGoal: (id, goal) => axios.put(`${API_BASE_URL}/goals/${id}`, goal),
  deleteGoal: (id) => axios.delete(`${API_BASE_URL}/goals/${id}`),

  getScheduled: () => axios.get(`${API_BASE_URL}/scheduled`),
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
};
