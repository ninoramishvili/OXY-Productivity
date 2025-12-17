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

  // Check if user is already logged in (token in localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleRegister = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
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
