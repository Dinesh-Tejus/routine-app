import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
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
  deleteScheduled: (id) => axios.delete(`${API_BASE_URL}/scheduled/${id}`),
  
  getLog: (date) => axios.get(`${API_BASE_URL}/logs/${date}`),
  saveLog: (log) => axios.post(`${API_BASE_URL}/logs`, log),
};
