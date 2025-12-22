'use client';

import { useState, useEffect, useRef } from 'react';
import { MdPlayArrow, MdStop, MdHistory, MdAlarm, MdDelete, MdRefresh, MdTimer } from 'react-icons/md';

export default function TimeTrackerPage() {
  // Simple Stopwatch state (no database)
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  // Project Tracker state (with database)
  const [trackerTime, setTrackerTime] = useState(0);
  const [isTrackerRunning, setIsTrackerRunning] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Alarm state
  const [alarmHours, setAlarmHours] = useState('0');
  const [alarmMinutes, setAlarmMinutes] = useState('0');
  const [alarmSeconds, setAlarmSeconds] = useState('0');
  const [alarmTime, setAlarmTime] = useState(0);
  const [isAlarmRunning, setIsAlarmRunning] = useState(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [alarmName, setAlarmName] = useState('');

  const stopwatchIntervalRef = useRef(null);
  const trackerIntervalRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const originalTitleRef = useRef('Time Tracker');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    originalTitleRef.current = document.title;
    
    // Create audio element for alarm sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZUQ4PWqzn7qdXFApFnt/yv24hBTKI0vLSgTMGH27B7+OZ');

    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      if (trackerIntervalRef.current) clearInterval(trackerIntervalRef.current);
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.title = originalTitleRef.current;
    };
  }, []);

  // Simple Stopwatch timer
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  // Project Tracker timer
  useEffect(() => {
    if (isTrackerRunning) {
      trackerIntervalRef.current = setInterval(() => {
        setTrackerTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (trackerIntervalRef.current) {
      clearInterval(trackerIntervalRef.current);
    }
    return () => {
      if (trackerIntervalRef.current) clearInterval(trackerIntervalRef.current);
    };
  }, [isTrackerRunning]);

  // Alarm timer
  useEffect(() => {
    if (isAlarmRunning && alarmTime > 0) {
      alarmIntervalRef.current = setInterval(() => {
        setAlarmTime((prev) => {
          if (prev <= 1) {
            triggerAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
    }
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [isAlarmRunning, alarmTime]);

  // Title flashing for alarm
  useEffect(() => {
    let titleInterval;
    if (isAlarmRinging) {
      let toggle = false;
      titleInterval = setInterval(() => {
        document.title = toggle ? '🔴 ALARM! 🔴' : originalTitleRef.current;
        toggle = !toggle;
      }, 500);
    } else {
      document.title = originalTitleRef.current;
    }
    return () => {
      if (titleInterval) clearInterval(titleInterval);
    };
  }, [isAlarmRinging]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Simple Stopwatch controls
  const startStopwatch = () => {
    setIsStopwatchRunning(true);
  };

  const stopStopwatch = () => {
    setIsStopwatchRunning(false);
  };

  const resetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
  };

  // Project Tracker controls
  const startTracker = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    try {
      const res = await fetch('/api/timetracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, notes }),
      });
      const data = await res.json();
      setCurrentSessionId(data._id);
      setIsTrackerRunning(true);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const stopTracker = async () => {
    if (!currentSessionId) return;

    try {
      await fetch('/api/timetracker', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: currentSessionId, 
          duration: trackerTime,
          endTime: new Date()
        }),
      });
      setIsTrackerRunning(false);
      setTrackerTime(0);
      setProjectName('');
      setNotes('');
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const resetTracker = () => {
    setIsTrackerRunning(false);
    setTrackerTime(0);
    setProjectName('');
    setNotes('');
    setCurrentSessionId(null);
  };

  const startAlarm = () => {
    const hours = parseInt(alarmHours) || 0;
    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds <= 0) {
      alert('Please set a valid alarm time');
      return;
    }

    setAlarmTime(totalSeconds);
    setIsAlarmRunning(true);
    setIsAlarmRinging(false);
  };

  const stopAlarm = () => {
    setIsAlarmRunning(false);
    setAlarmTime(0);
    setIsAlarmRinging(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const triggerAlarm = () => {
    setIsAlarmRunning(false);
    setIsAlarmRinging(true);

    // Play sound
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Alarm!', {
        body: alarmName || 'Your alarm is ringing!',
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }
  };

  const dismissAlarm = () => {
    setIsAlarmRinging(false);
    setAlarmHours('0');
    setAlarmMinutes('0');
    setAlarmSeconds('0');
    setAlarmName('');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen lg:ml-56 ml-0 p-4 md:p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-black">Time Management</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href="/projects"
              className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 border-2 border-black text-black rounded-md hover:bg-gray-100 justify-center"
            >
              <MdHistory size={20} />
              Projects
            </a>
            <a
              href="/timetracker-history"
              className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 justify-center"
            >
              <MdHistory size={20} />
              History
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Simple Stopwatch */}
          <div className="bg-white border-2 border-black rounded-lg p-3 md:p-4 flex flex-col items-center justify-center min-h-[280px] md:min-h-[320px]">
            <div className="flex items-center gap-1 md:gap-2 mb-3 md:mb-4">
              <MdTimer size={20} className="text-black md:w-6 md:h-6" />
              <h2 className="text-base md:text-lg font-semibold text-black">Stopwatch</h2>
            </div>
            
            <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-center mb-4 md:mb-6 text-black">
              {formatTime(stopwatchTime)}
            </div>

            <div className="flex gap-1 md:gap-2 w-full px-2">
              {!isStopwatchRunning ? (
                <button
                  onClick={startStopwatch}
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-black text-white rounded-md hover:bg-gray-800 text-sm md:text-base"
                >
                  <MdPlayArrow size={20} className="md:w-6 md:h-6" />
                  <span className="hidden sm:inline">Start</span>
                </button>
              ) : (
                <button
                  onClick={stopStopwatch}
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-black text-white rounded-md hover:bg-gray-800 text-sm md:text-base"
                >
                  <MdStop size={20} className="md:w-6 md:h-6" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              )}
              <button
                onClick={resetStopwatch}
                className="px-2 md:px-4 py-2 md:py-3 bg-white text-black border-2 border-black rounded-md hover:bg-gray-100"
              >
                <MdRefresh size={20} className="md:w-6 md:h-6" />
              </button>
            </div>
          </div>

          {/* Alarm Section */}
          <div className={`bg-white border-2 rounded-lg p-3 md:p-4 flex flex-col items-center justify-center min-h-[280px] md:min-h-[320px] ${isAlarmRinging ? 'border-red-600 animate-pulse' : 'border-black'}`}>
            <div className="flex items-center gap-1 md:gap-2 mb-3 md:mb-4">
              <MdAlarm size={20} className="text-black md:w-6 md:h-6" />
              <h2 className="text-base md:text-lg font-semibold text-black">Alarm</h2>
            </div>

            {isAlarmRinging && (
              <div className="bg-red-50 border-2 border-red-600 rounded-md p-2 md:p-3 mb-3 md:mb-4 text-center w-full max-w-sm">
                <p className="text-black font-bold text-base md:text-lg mb-2">🔴 ALARM! 🔴</p>
                <button
                  onClick={dismissAlarm}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm md:text-base"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-center mb-4 md:mb-6 text-black">
              {formatTime(alarmTime)}
            </div>

            <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 w-full max-w-sm">
              <input
                type="text"
                placeholder="Alarm name"
                value={alarmName}
                onChange={(e) => setAlarmName(e.target.value)}
                disabled={isAlarmRunning}
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base bg-white text-black border-2 border-black rounded-md focus:outline-none focus:border-gray-600"
              />
              
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="HH"
                  value={alarmHours}
                  onChange={(e) => setAlarmHours(e.target.value)}
                  disabled={isAlarmRunning}
                  className="w-full px-1 md:px-2 py-2 text-center bg-white text-black border-2 border-black rounded-md focus:outline-none focus:border-gray-600 text-sm md:text-base"
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="MM"
                  value={alarmMinutes}
                  onChange={(e) => setAlarmMinutes(e.target.value)}
                  disabled={isAlarmRunning}
                  className="w-full px-1 md:px-2 py-2 text-center bg-white text-black border-2 border-black rounded-md focus:outline-none focus:border-gray-600 text-sm md:text-base"
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="SS"
                  value={alarmSeconds}
                  onChange={(e) => setAlarmSeconds(e.target.value)}
                  disabled={isAlarmRunning}
                  className="w-full px-1 md:px-2 py-2 text-center bg-white text-black border-2 border-black rounded-md focus:outline-none focus:border-gray-600 text-sm md:text-base"
                />
              </div>
            </div>

            {!isAlarmRunning ? (
              <button
                onClick={startAlarm}
                className="w-full max-w-sm flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-black text-white rounded-md hover:bg-gray-800 text-sm md:text-base"
              >
                <MdAlarm size={18} className="md:w-5 md:h-5" />
                Start
              </button>
            ) : (
              <button
                onClick={stopAlarm}
                className="w-full max-w-sm flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-black text-white rounded-md hover:bg-gray-800 text-sm md:text-base"
              >
                <MdDelete size={18} className="md:w-5 md:h-5" />
                Cancel
              </button>
            )}
          </div>

          {/* Project Tracker Section */}
          <div className="bg-white border-2 border-black rounded-lg p-3 md:p-4 flex flex-col items-center justify-center min-h-[280px] md:min-h-[320px]">
            <div className="flex items-center gap-1 md:gap-2 mb-3 md:mb-4">
              <MdPlayArrow size={20} className="text-black md:w-6 md:h-6" />
              <h2 className="text-base md:text-lg font-semibold text-black">Project Tracker</h2>
            </div>
            
            <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-center mb-4 md:mb-6 text-black">
              {formatTime(trackerTime)}
            </div>

            <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 w-full max-w-sm">
              <input
                type="text"
                placeholder="Project Name *"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isTrackerRunning}
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base bg-white text-black border-2 border-black rounded-md focus:outline-none focus:border-gray-600"
              />
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isTrackerRunning}
                rows="2"
                className="w-full px-2 md:px-3 py-2 text-sm md:text-base bg-white text-black border-2 border-black rounded-md focus:outline-none focus:border-gray-600 resize-none"
              />
            </div>

            <div className="flex gap-1 md:gap-2 w-full max-w-sm">
              {!isTrackerRunning ? (
                <button
                  onClick={startTracker}
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-black text-white rounded-md hover:bg-gray-800 text-sm md:text-base"
                >
                  <MdPlayArrow size={20} className="md:w-6 md:h-6" />
                  <span className="hidden sm:inline">Start</span>
                </button>
              ) : (
                <button
                  onClick={stopTracker}
                  className="flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 bg-black text-white rounded-md hover:bg-gray-800 text-sm md:text-base"
                >
                  <MdStop size={20} className="md:w-6 md:h-6" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              )}
              <button
                onClick={resetTracker}
                className="px-2 md:px-4 py-2 md:py-3 bg-white text-black border-2 border-black rounded-md hover:bg-gray-100 text-sm md:text-base"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
