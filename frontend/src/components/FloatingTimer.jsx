import { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, RotateCcw, Timer, Maximize2, Minimize2 } from 'lucide-react';
import './FloatingTimer.css';

function FloatingTimer({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(25);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className={`floating-timer ${isExpanded ? 'expanded' : 'compact'}`}>
      <div className="floating-timer-header">
        <div className="timer-icon">
          <Timer size={16} />
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

        <div className="timer-display-compact">
          <div className="time-text-compact">{formatTime(timeLeft)}</div>
          {isExpanded && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
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

