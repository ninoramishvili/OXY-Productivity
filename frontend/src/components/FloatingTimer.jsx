import { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, RotateCcw, Timer, Maximize2, Minimize2 } from 'lucide-react';
import './FloatingTimer.css';

function FloatingTimer({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(25);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playNotification();
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

  const playNotification = () => {
    // Simple notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: 'Your timer has finished.',
        icon: '🍅'
      });
    }
  };

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration * 60);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setTimeLeft(newDuration * 60);
    setIsRunning(false);
  };

  const handleModeChange = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    let newDuration;
    switch (newMode) {
      case 'shortBreak':
        newDuration = 5;
        break;
      case 'longBreak':
        newDuration = 30;
        break;
      default:
        newDuration = 25;
    }
    setDuration(newDuration);
    setTimeLeft(newDuration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'shortBreak':
        return { icon: '☕', color: '#10b981', label: 'Short Break' };
      case 'longBreak':
        return { icon: '🌴', color: '#3b82f6', label: 'Long Break' };
      default:
        return { icon: '🍅', color: '#ef4444', label: 'Focus' };
    }
  };

  const modeConfig = getModeConfig();
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className={`floating-timer ${isExpanded ? 'expanded' : 'compact'}`} data-mode={mode}>
      <div className="floating-timer-header">
        <div className="timer-icon" style={{ color: modeConfig.color }}>
          <span style={{ fontSize: '18px' }}>{modeConfig.icon}</span>
          <span style={{ fontSize: '12px', marginLeft: '4px' }}>{modeConfig.label}</span>
        </div>
        <button 
          className="btn-icon" 
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Minimize' : 'Expand'}
        >
          {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button className="btn-icon" onClick={onClose} title="Close">
          <X size={16} />
        </button>
      </div>

      <div className="floating-timer-body">
        {isExpanded && (
          <>
            <div className="mode-switcher">
              <button 
                className={`mode-btn ${mode === 'focus' ? 'active' : ''}`}
                onClick={() => handleModeChange('focus')}
                style={{ borderColor: mode === 'focus' ? '#ef4444' : undefined }}
              >
                🍅 Focus
              </button>
              <button 
                className={`mode-btn ${mode === 'shortBreak' ? 'active' : ''}`}
                onClick={() => handleModeChange('shortBreak')}
                style={{ borderColor: mode === 'shortBreak' ? '#10b981' : undefined }}
              >
                ☕ Break
              </button>
              <button 
                className={`mode-btn ${mode === 'longBreak' ? 'active' : ''}`}
                onClick={() => handleModeChange('longBreak')}
                style={{ borderColor: mode === 'longBreak' ? '#3b82f6' : undefined }}
              >
                🌴 Long
              </button>
            </div>
            
            {mode === 'focus' && (
              <div className="timer-presets">
                <button 
                  className={`preset-btn ${duration === 25 ? 'active' : ''}`}
                  onClick={() => handleDurationChange(25)}
                >
                  25m
                </button>
                <button 
                  className={`preset-btn ${duration === 15 ? 'active' : ''}`}
                  onClick={() => handleDurationChange(15)}
                >
                  15m
                </button>
                <button 
                  className={`preset-btn ${duration === 5 ? 'active' : ''}`}
                  onClick={() => handleDurationChange(5)}
                >
                  5m
                </button>
              </div>
            )}
          </>
        )}

        <div className="timer-display-compact">
          <div className="time-text-compact">{formatTime(timeLeft)}</div>
          {isExpanded && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: modeConfig.color 
                }}
              />
            </div>
          )}
        </div>

        <div className="timer-controls-compact">
          {!isRunning ? (
            <button className="btn-timer-compact primary" onClick={handleStart}>
              <Play size={14} />
            </button>
          ) : (
            <button className="btn-timer-compact" onClick={handlePause}>
              <Pause size={14} />
            </button>
          )}
          <button className="btn-timer-compact" onClick={handleReset}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default FloatingTimer;

