import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available (check both localStorage and sessionStorage)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication API calls
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Tasks API calls
export const tasksAPI = {
  getTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },
  
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },
  
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
  
  setHighlight: async (taskId, date) => {
    const response = await api.put(`/tasks/${taskId}/highlight`, { date });
    return response.data;
  },
  
  removeHighlight: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}/highlight`);
    return response.data;
  },
  
  setFrog: async (taskId) => {
    const response = await api.put(`/tasks/${taskId}/frog`);
    return response.data;
  },
  
  removeFrog: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}/frog`);
    return response.data;
  },
  
  reorderTasks: async (taskOrders) => {
    const response = await api.post('/tasks/reorder', { taskOrders });
    return response.data;
  },
  
  updateEisenhower: async (taskId, isUrgent, isImportant) => {
    const response = await api.put(`/tasks/${taskId}/eisenhower`, { isUrgent, isImportant });
    return response.data;
  },
  
  unprioritize: async (taskId) => {
    const response = await api.put(`/tasks/${taskId}/unprioritize`);
    return response.data;
  },
  
  scheduleAllToday: async (date) => {
    const response = await api.post('/tasks/schedule-all-today', { date });
    return response.data;
  },
};

// Pomodoro API
export const pomodoroAPI = {
  startSession: async (taskId, duration) => {
    const response = await api.post('/pomodoro/start', { taskId, duration });
    return response.data;
  },
  
  completeSession: async (sessionId, taskId, actualDuration) => {
    const response = await api.post('/pomodoro/complete', { sessionId, taskId, actualDuration });
    return response.data;
  },
  
  cancelSession: async (sessionId, taskId, actualDuration) => {
    const response = await api.post('/pomodoro/cancel', { sessionId, taskId, actualDuration });
    return response.data;
  },
  
  getHistory: async (taskId) => {
    const response = await api.get(`/pomodoro/history/${taskId}`);
    return response.data;
  },
  
  resetTaskPomodoro: async (taskId) => {
    const response = await api.delete(`/pomodoro/reset/${taskId}`);
    return response.data;
  },
};

// Tags API calls
export const tagsAPI = {
  getTags: async () => {
    const response = await api.get('/tags');
    return response.data;
  },
  
  createTag: async (tagData) => {
    const response = await api.post('/tags', tagData);
    return response.data;
  },
  
  deleteTag: async (tagId) => {
    const response = await api.delete(`/tags/${tagId}`);
    return response.data;
  },
};

export default api;

