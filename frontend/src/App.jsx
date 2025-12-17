import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Backlog from './pages/Backlog';
import Eisenhower from './pages/Eisenhower';
import Weekly from './pages/Weekly';
import Layout from './components/Layout';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is already logged in (token in localStorage or sessionStorage)
  useEffect(() => {
    // Check localStorage first (remember me), then sessionStorage
    let token = localStorage.getItem('token');
    let userData = localStorage.getItem('user');
    
    if (!token) {
      token = sessionStorage.getItem('token');
      userData = sessionStorage.getItem('user');
    }
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData, token, rememberMe = false) => {
    // Use localStorage for "remember me", sessionStorage otherwise
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Clear both storages first to avoid conflicts
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear both storages
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleRegister = (userData, token) => {
    // New registrations use sessionStorage by default
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/home" /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? 
            <Navigate to="/home" /> : 
            <Register onRegister={handleRegister} />
          } 
        />
        <Route 
          path="/home" 
          element={
            isAuthenticated ? 
            <Layout user={user} onLogout={handleLogout}>
              <Home user={user} />
            </Layout> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/backlog" 
          element={
            isAuthenticated ? 
            <Layout user={user} onLogout={handleLogout}>
              <Backlog />
            </Layout> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/eisenhower" 
          element={
            isAuthenticated ? 
            <Layout user={user} onLogout={handleLogout}>
              <Eisenhower />
            </Layout> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/weekly" 
          element={
            isAuthenticated ? 
            <Layout user={user} onLogout={handleLogout}>
              <Weekly />
            </Layout> : 
            <Navigate to="/login" />
          } 
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
