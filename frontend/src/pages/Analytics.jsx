import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Target, 
  Flame,
  TrendingUp,
  Calendar,
  Zap,
  Award,
  Timer,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { tasksAPI, pomodoroAPI } from '../utils/api';
import './Analytics.css';

function Analytics() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'year'
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getTasks();
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getLocalDateString = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const today = getLocalDateString(new Date());
  
  const getStartOfWeek = (date, offset = 0) => {
    const d = new Date(date);
    d.setDate(d.getDate() + (offset * 7));
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
  };

  const getEndOfWeek = (startOfWeek) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + 6);
    return d;
  };

  const startOfWeek = getStartOfWeek(new Date(), weekOffset);
  const endOfWeek = getEndOfWeek(startOfWeek);
  
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  // Calculate statistics
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.completed);
    const todayTasks = tasks.filter(t => t.scheduled_date === today);
    const todayCompleted = todayTasks.filter(t => t.completed);
    
    // This week's tasks
    const weekTasks = tasks.filter(t => {
      if (!t.scheduled_date) return false;
      const taskDate = new Date(t.scheduled_date);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    });
    const weekCompleted = weekTasks.filter(t => t.completed);
    
    // This month's tasks
    const monthTasks = tasks.filter(t => {
      if (!t.scheduled_date) return false;
      const taskDate = new Date(t.scheduled_date);
      return taskDate >= startOfMonth;
    });
    const monthCompleted = monthTasks.filter(t => t.completed);
    
    // Quick wins (2-minute tasks)
    const quickWins = tasks.filter(t => t.estimated_minutes && t.estimated_minutes <= 2);
    const quickWinsCompleted = quickWins.filter(t => t.completed);
    
    // Pomodoro stats
    const totalPomodoros = tasks.reduce((sum, t) => sum + (t.pomodoro_count || 0), 0);
    const totalTimeSpent = tasks.reduce((sum, t) => sum + (t.time_spent || 0), 0);
    
    // Planning fallacy analysis
    const tasksWithEstimates = tasks.filter(t => t.estimated_minutes && t.time_spent > 0);
    let accurateCount = 0;
    let underestimatedCount = 0;
    let overestimatedCount = 0;
    
    tasksWithEstimates.forEach(t => {
      const actual = Math.floor(t.time_spent / 60);
      const estimated = t.estimated_minutes;
      if (actual <= estimated * 1.1) {
        accurateCount++;
      } else if (actual <= estimated * 1.5) {
        underestimatedCount++;
      } else {
        overestimatedCount++;
      }
    });
    
    // Frog tasks eaten
    const frogsEaten = tasks.filter(t => t.is_frog && t.completed).length;
    
    // Highlights completed
    const highlightsCompleted = tasks.filter(t => t.is_highlight && t.completed).length;
    
    // Daily breakdown for chart (last 7 days of selected week)
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayTasks = tasks.filter(t => t.scheduled_date === dateStr);
      const dayCompleted = dayTasks.filter(t => t.completed).length;
      const dayTotal = dayTasks.length;
      dailyData.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        completed: dayCompleted,
        total: dayTotal,
        rate: dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0
      });
    }
    
    // Streak calculation (consecutive days with completed tasks)
    let currentStreak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = getLocalDateString(checkDate);
      const dayTasks = tasks.filter(t => t.scheduled_date === dateStr);
      const dayCompleted = dayTasks.filter(t => t.completed).length;
      if (dayTasks.length > 0 && dayCompleted > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dayTasks.length === 0) {
        // Skip days with no tasks
        checkDate.setDate(checkDate.getDate() - 1);
        if (checkDate < startOfYear) break;
      } else {
        break;
      }
    }

    return {
      total: tasks.length,
      completed: completedTasks.length,
      todayTotal: todayTasks.length,
      todayCompleted: todayCompleted.length,
      weekTotal: weekTasks.length,
      weekCompleted: weekCompleted.length,
      monthTotal: monthTasks.length,
      monthCompleted: monthCompleted.length,
      quickWinsTotal: quickWins.length,
      quickWinsCompleted: quickWinsCompleted.length,
      totalPomodoros,
      totalTimeSpent,
      accurateCount,
      underestimatedCount,
      overestimatedCount,
      totalEstimated: tasksWithEstimates.length,
      frogsEaten,
      highlightsCompleted,
      dailyData,
      currentStreak,
      overallRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      weekRate: weekTasks.length > 0 ? Math.round((weekCompleted.length / weekTasks.length) * 100) : 0,
    };
  }, [tasks, today, startOfWeek, endOfWeek, startOfMonth, startOfYear]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getWeekLabel = () => {
    const start = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (weekOffset === 0) return `This Week (${start} - ${end})`;
    if (weekOffset === -1) return `Last Week (${start} - ${end})`;
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <div className="header-title">
          <BarChart3 className="header-icon" size={28} />
          <div>
            <h1>Analytics</h1>
            <p className="header-subtitle">Track your productivity journey</p>
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="stats-overview">
        {/* Completion Rate Circle */}
        <div className="stat-card hero-card">
          <div className="completion-ring-container">
            <svg className="completion-ring" viewBox="0 0 120 120">
              <circle 
                className="ring-bg" 
                cx="60" 
                cy="60" 
                r="52" 
                strokeWidth="12"
              />
              <circle 
                className="ring-progress" 
                cx="60" 
                cy="60" 
                r="52" 
                strokeWidth="12"
                strokeDasharray={`${stats.weekRate * 3.27} 327`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="ring-content">
              <span className="ring-value">{stats.weekRate}%</span>
              <span className="ring-label">This Week</span>
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-value">{stats.weekCompleted}</span>
              <span className="hero-label">Completed</span>
            </div>
            <div className="hero-divider"></div>
            <div className="hero-stat">
              <span className="hero-value">{stats.weekTotal}</span>
              <span className="hero-label">Total</span>
            </div>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="stat-card">
          <div className="stat-icon today">
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.todayCompleted}/{stats.todayTotal}</span>
            <span className="stat-label">Today's Tasks</span>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill today" 
                style={{ width: `${stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Month Progress */}
        <div className="stat-card">
          <div className="stat-icon month">
            <Calendar size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.monthCompleted}/{stats.monthTotal}</span>
            <span className="stat-label">This Month</span>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill month" 
                style={{ width: `${stats.monthTotal > 0 ? (stats.monthCompleted / stats.monthTotal) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="stat-card">
          <div className="stat-icon streak">
            <Flame size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.currentStreak}</span>
            <span className="stat-label">Day Streak</span>
            <div className="streak-flames">
              {[...Array(Math.min(stats.currentStreak, 7))].map((_, i) => (
                <span key={i} className="flame-icon">🔥</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="chart-section">
        <div className="section-header">
          <h2>
            <TrendingUp size={20} className="section-icon" />
            Weekly Activity
          </h2>
          <div className="week-navigation">
            <button 
              className="nav-btn"
              onClick={() => setWeekOffset(prev => prev - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="week-label">{getWeekLabel()}</span>
            <button 
              className="nav-btn"
              onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
              disabled={weekOffset >= 0}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="activity-chart">
          {stats.dailyData.map((day, index) => (
            <div key={index} className="chart-column">
              <div className="chart-bar-container">
                <div 
                  className="chart-bar"
                  style={{ 
                    height: `${Math.max(day.rate, 5)}%`,
                    opacity: day.total === 0 ? 0.3 : 1
                  }}
                >
                  {day.total > 0 && (
                    <span className="bar-tooltip">
                      {day.completed}/{day.total} ({day.rate}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="chart-label">
                <span className="day-name">{day.day}</span>
                <span className="day-date">{day.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Productivity Techniques Stats */}
      <div className="techniques-section">
        <h2>
          <Award size={20} className="section-icon" />
          Productivity Techniques
        </h2>
        
        <div className="techniques-grid">
          {/* Pomodoro Stats */}
          <div className="technique-card pomodoro">
            <div className="technique-header">
              <Timer size={24} className="technique-icon" />
              <h3>Pomodoro</h3>
            </div>
            <div className="technique-stats">
              <div className="technique-stat">
                <span className="value">{stats.totalPomodoros}</span>
                <span className="label">Sessions</span>
              </div>
              <div className="technique-stat">
                <span className="value">{formatTime(stats.totalTimeSpent)}</span>
                <span className="label">Focus Time</span>
              </div>
            </div>
            <div className="technique-insight">
              {stats.totalPomodoros > 0 
                ? `Avg ${Math.round(stats.totalTimeSpent / 60 / Math.max(stats.totalPomodoros, 1))}m per session`
                : 'Start a Pomodoro to track focus time'}
            </div>
          </div>

          {/* Quick Wins */}
          <div className="technique-card quickwins">
            <div className="technique-header">
              <Zap size={24} className="technique-icon" />
              <h3>Quick Wins</h3>
            </div>
            <div className="technique-stats">
              <div className="technique-stat">
                <span className="value">{stats.quickWinsCompleted}</span>
                <span className="label">Completed</span>
              </div>
              <div className="technique-stat">
                <span className="value">{stats.quickWinsTotal}</span>
                <span className="label">Total</span>
              </div>
            </div>
            <div className="technique-insight">
              2-minute tasks knocked out quickly
            </div>
          </div>

          {/* Eat That Frog */}
          <div className="technique-card frog">
            <div className="technique-header">
              <span className="technique-emoji">🐸</span>
              <h3>Eat That Frog</h3>
            </div>
            <div className="technique-stats">
              <div className="technique-stat large">
                <span className="value">{stats.frogsEaten}</span>
                <span className="label">Frogs Eaten</span>
              </div>
            </div>
            <div className="technique-insight">
              Hardest tasks completed first
            </div>
          </div>

          {/* Daily Highlight */}
          <div className="technique-card highlight">
            <div className="technique-header">
              <span className="technique-emoji">⭐</span>
              <h3>Daily Highlight</h3>
            </div>
            <div className="technique-stats">
              <div className="technique-stat large">
                <span className="value">{stats.highlightsCompleted}</span>
                <span className="label">Highlights Achieved</span>
              </div>
            </div>
            <div className="technique-insight">
              Most important tasks of the day
            </div>
          </div>
        </div>
      </div>

      {/* Planning Fallacy Analysis */}
      <div className="planning-section">
        <h2>
          <Target size={20} className="section-icon" />
          Planning Fallacy Analysis
        </h2>
        
        {stats.totalEstimated > 0 ? (
          <div className="planning-content">
            <div className="planning-chart">
              <div className="planning-ring-container">
                <svg className="planning-ring" viewBox="0 0 120 120">
                  {/* Accurate segment (green) */}
                  <circle 
                    className="segment accurate" 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    strokeWidth="20"
                    strokeDasharray={`${(stats.accurateCount / stats.totalEstimated) * 283} 283`}
                    transform="rotate(-90 60 60)"
                  />
                  {/* Slightly over segment (yellow) */}
                  <circle 
                    className="segment slightly-over" 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    strokeWidth="20"
                    strokeDasharray={`${(stats.underestimatedCount / stats.totalEstimated) * 283} 283`}
                    strokeDashoffset={`${-(stats.accurateCount / stats.totalEstimated) * 283}`}
                    transform="rotate(-90 60 60)"
                  />
                  {/* Over segment (red) */}
                  <circle 
                    className="segment over" 
                    cx="60" 
                    cy="60" 
                    r="45" 
                    strokeWidth="20"
                    strokeDasharray={`${(stats.overestimatedCount / stats.totalEstimated) * 283} 283`}
                    strokeDashoffset={`${-((stats.accurateCount + stats.underestimatedCount) / stats.totalEstimated) * 283}`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="planning-ring-center">
                  <span className="accuracy-percent">
                    {Math.round((stats.accurateCount / stats.totalEstimated) * 100)}%
                  </span>
                  <span className="accuracy-label">Accurate</span>
                </div>
              </div>
            </div>
            
            <div className="planning-breakdown">
              <div className="breakdown-item accurate">
                <div className="breakdown-color"></div>
                <div className="breakdown-info">
                  <span className="breakdown-label">On Target</span>
                  <span className="breakdown-value">{stats.accurateCount} tasks</span>
                </div>
                <span className="breakdown-hint">Within 10% of estimate</span>
              </div>
              <div className="breakdown-item slightly-over">
                <div className="breakdown-color"></div>
                <div className="breakdown-info">
                  <span className="breakdown-label">Slightly Over</span>
                  <span className="breakdown-value">{stats.underestimatedCount} tasks</span>
                </div>
                <span className="breakdown-hint">10-50% over estimate</span>
              </div>
              <div className="breakdown-item over">
                <div className="breakdown-color"></div>
                <div className="breakdown-info">
                  <span className="breakdown-label">Underestimated</span>
                  <span className="breakdown-value">{stats.overestimatedCount} tasks</span>
                </div>
                <span className="breakdown-hint">50%+ over estimate</span>
              </div>
            </div>
            
            <div className="planning-tip">
              <AlertCircle size={16} />
              <p>
                <strong>Tip:</strong> Most people underestimate by 25-50%. 
                Try adding a buffer to your estimates!
              </p>
            </div>
          </div>
        ) : (
          <div className="empty-planning">
            <Target size={48} className="empty-icon" />
            <p>Add time estimates to tasks and track with Pomodoro to see your planning accuracy</p>
          </div>
        )}
      </div>

      {/* All-Time Summary */}
      <div className="summary-section">
        <h2>
          <CheckCircle2 size={20} className="section-icon" />
          All-Time Summary
        </h2>
        
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-value">{stats.total}</span>
            <span className="summary-label">Total Tasks</span>
          </div>
          <div className="summary-item completed">
            <span className="summary-value">{stats.completed}</span>
            <span className="summary-label">Completed</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{stats.overallRate}%</span>
            <span className="summary-label">Completion Rate</span>
          </div>
          <div className="summary-item time">
            <span className="summary-value">{formatTime(stats.totalTimeSpent)}</span>
            <span className="summary-label">Total Focus Time</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;

