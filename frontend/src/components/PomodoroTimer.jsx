import { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Check, Clock } from 'lucide-react';
import { pomodoroAPI } from '../utils/api';
import './PomodoroTimer.css';

function PomodoroTimer({ task, onComplete, onCancel, onUpdateTask }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [duration, setDuration] = useState(25); // minutes
  const [showSettings, setShowSettings] = useState(true);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedSecondsRef = useRef(0);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    if (sessionId) {
      try {
        const actualDuration = duration * 60; // Full duration in seconds
        const response = await pomodoroAPI.completeSession(sessionId, task.id, actualDuration);
        if (response.success && response.task) {
          onUpdateTask(response.task);
        }
        onComplete();
      } catch (error) {
        console.error('Failed to complete pomodoro:', error);
      }
    }
  };

  const handleStart = async () => {
    if (!sessionId) {
      // Start new session
      try {
        const response = await pomodoroAPI.startSession(task.id, duration);
        if (response.success) {
          setSessionId(response.session.id);
          startTimeRef.current = Date.now();
          elapsedSecondsRef.current = 0;
          setShowSettings(false);
          setIsRunning(true);
        }
      } catch (error) {
        console.error('Failed to start pomodoro:', error);
      }
    } else {
      // Resume
      startTimeRef.current = Date.now() - (elapsedSecondsRef.current * 1000);
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    if (startTimeRef.current) {
      elapsedSecondsRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
    }
    setIsRunning(false);
  };

  const handleCancel = async () => {
    setIsRunning(false);
    
    if (sessionId) {
      try {
        // Calculate actual time spent
        let actualDuration = elapsedSecondsRef.current;
        if (isRunning && startTimeRef.current) {
          actualDuration += Math.floor((Date.now() - startTimeRef.current) / 1000);
        }
        
        const response = await pomodoroAPI.cancelSession(sessionId, task.id, actualDuration);
        if (response.success && response.task) {
          onUpdateTask(response.task);
        }
      } catch (error) {
        console.error('Failed to cancel pomodoro:', error);
      }
    }
    
    onCancel();
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setTimeLeft(newDuration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="pomodoro-timer">
      <div className="pomodoro-header">
        <div className="pomodoro-icon">🍅</div>
        <div className="pomodoro-task-info">
          <h3>{task.title}</h3>
          <div className="pomodoro-stats">
            <span className="stat">
              <Clock size={14} />
              {Math.floor((task.time_spent || 0) / 60)}m spent
            </span>
            <span className="stat">
              🍅 {task.pomodoro_count || 0} completed
            </span>
          </div>
        </div>
      </div>

      {showSettings && !sessionId ? (
        <div className="pomodoro-settings">
          <h4>Select Duration</h4>
          <div className="duration-options">
            <button 
              className={`duration-btn ${duration === 25 ? 'active' : ''}`}
              onClick={() => handleDurationChange(25)}
            >
              25 min
            </button>
            <button 
              className={`duration-btn ${duration === 15 ? 'active' : ''}`}
              onClick={() => handleDurationChange(15)}
            >
              15 min
            </button>
            <button 
              className={`duration-btn ${duration === 5 ? 'active' : ''}`}
              onClick={() => handleDurationChange(5)}
            >
              5 min
            </button>
          </div>
        </div>
      ) : null}

      <div className="pomodoro-display">
        <svg className="progress-ring" width="200" height="200">
          <circle
            className="progress-ring-bg"
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
          />
          <circle
            className="progress-ring-fill"
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 85}`}
            strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="time-display">
          <span className="time-text">{formatTime(timeLeft)}</span>
          <span className="time-label">{isRunning ? 'Focus Time' : 'Ready'}</span>
        </div>
      </div>

      <div className="pomodoro-controls">
        {!isRunning ? (
          <button className="btn-pomodoro primary" onClick={handleStart}>
            <Play size={20} />
            {sessionId ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button className="btn-pomodoro" onClick={handlePause}>
            <Pause size={20} />
            Pause
          </button>
        )}
        
        <button className="btn-pomodoro cancel" onClick={handleCancel}>
          <X size={20} />
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PomodoroTimer;

