import React, { useState, useEffect, useCallback } from 'react';
import TasksColumn from './components/TasksColumn';
import ReflectionChat from './components/ReflectionChat';
import GoalsColumn from './components/GoalsColumn';
import IncompleteTasks from './components/IncompleteTasks';
import { BookOpen, MessageSquare, CheckCircle2, Mic } from 'lucide-react';
import ScheduleSection from './components/ScheduleSection';
import NoteModal from './components/NoteModal';
import LockCriteriaModal from './components/LockCriteriaModal';
import ChatColumn from './components/ChatColumn';
import TaskPlannerChat from './components/TaskPlannerChat';
import ReadingList from './components/ReadingList';
import NewsDigest from './components/NewsDigest';
import LearningPath from './components/LearningPath';
import Login from './components/Login';
import Toast from './components/Toast';
import VoiceSettings from './components/VoiceSettings';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { VoiceProvider, useVoice } from './contexts/VoiceContext';
import { api } from './services/api';
import { LogOut, Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { showToast } = useToast();
  const { voiceEnabled } = useVoice();
  const [dailyTasks, setDailyTasks] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [dailyLog, setDailyLog] = useState({
    workedOn: '',
    finished: '',
    feedback: '',
    tomorrowNotes: '',
    chatHistory: [],
    searchHistory: []
  });
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [yesterdayNotes, setYesterdayNotes] = useState('');
  const [incompleteTasks, setIncompleteTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewingTasks, setViewingTasks] = useState([]);
  const [activeNoteModal, setActiveNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [validationState, setValidationState] = useState('idle');
  const [validationError, setValidationError] = useState('');
  const [lockEditModal, setLockEditModal] = useState(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  const fetchWeeklyHistory = async () => {
    try {
      const res = await api.getWeeklyHistory();
      setWeeklyHistory(res.data);
    } catch (error) {
      console.error('Error fetching weekly history:', error);
    }
  };

  // Get current time in EST timezone
  const getESTDate = (date = new Date()) => {
    const estString = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
    return new Date(estString);
  };

  const getAdjustedNow = () => {
    const now = getESTDate();
    // If it's before 12:30 AM EST, treat it as the previous day
    if (now.getHours() === 0 && now.getMinutes() < 30) {
      now.setDate(now.getDate() - 1);
    }
    return now;
  };

  const getTodayKey = () => {
    const now = getAdjustedNow();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getYesterdayKey = () => {
    const now = getAdjustedNow();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  };

  const loadData = useCallback(async () => {
    try {
      const todayKey = getTodayKey();
      const yesterdayKey = getYesterdayKey();

      const [tasksRes, goalsRes, scheduledRes, todayLogRes, yesterdayLogRes, incompleteRes] = await Promise.all([
        api.getTasks(),
        api.getGoals(),
        api.getScheduled(),
        api.getLog(todayKey),
        api.getLog(yesterdayKey),
        api.getIncompleteTasks()
      ]);

      setDailyTasks(tasksRes.data);
      setWeeklyGoals(goalsRes.data);

      // Sync scheduled tasks for today before setting state
      const { updatedScheduled, updatedDaily } = await syncScheduledToToday(scheduledRes.data, tasksRes.data);
      setScheduledTasks(updatedScheduled);
      setDailyTasks(updatedDaily);

      setDailyLog({
        workedOn: '',
        finished: '',
        feedback: '',
        tomorrowNotes: '',
        chatHistory: [],
        searchHistory: [],
        ...todayLogRes.data,
        date: todayKey
      });

      if (yesterdayLogRes.data && yesterdayLogRes.data.tomorrowNotes) {
        setYesterdayNotes(yesterdayLogRes.data.tomorrowNotes);
      }

      setIncompleteTasks(incompleteRes.data || []);

      // Reset selected date to today when loading data
      setSelectedDate(null);
      setViewingTasks([]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
      fetchWeeklyHistory();
    }
  }, [user, loadData]);

  // Date rollover check
  useEffect(() => {
    const checkDate = () => {
      const currentToday = getTodayKey();
      if (dailyLog.date && dailyLog.date !== currentToday) {
        console.log('Date changed (rollover), reloading data...');
        loadData();
      }
    };

    // Check on window focus and occasionally
    window.addEventListener('focus', checkDate);
    const interval = setInterval(checkDate, 300000); // 5 minutes

    return () => {
      window.removeEventListener('focus', checkDate);
      clearInterval(interval);
    };
  }, [dailyLog.date, loadData]);

  const handleToggleTaskComplete = async (id) => {
    const task = dailyTasks.find(t => t._id === id);
    if (!task.completed) {
      setActiveNoteModal({ ...task, type: 'daily' });
      setNoteText(task.notes || '');
    } else {
      try {
        const updated = await api.updateTask(id, { ...task, completed: false });
        setDailyTasks(dailyTasks.map(t => t._id === id ? updated.data : t));
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };

  const handleToggleGoalComplete = async (id) => {
    const goal = weeklyGoals.find(g => g._id === id);
    if (!goal.completed) {
      setActiveNoteModal({ ...goal, type: 'weekly' });
      setNoteText(goal.notes || '');
    } else {
      try {
        const updated = await api.updateGoal(id, { ...goal, completed: false });
        setWeeklyGoals(weeklyGoals.map(g => g._id === id ? updated.data : g));
      } catch (error) {
        console.error('Error updating goal:', error);
      }
    }
  };

  const handleSaveNote = async () => {
    try {
      if (activeNoteModal.type === 'daily') {
        const updated = await api.updateTask(activeNoteModal._id, {
          ...activeNoteModal,
          notes: noteText,
          completed: true
        });
        setDailyTasks(dailyTasks.map(t => t._id === activeNoteModal._id ? updated.data : t));
      } else {
        const updated = await api.updateGoal(activeNoteModal._id, {
          ...activeNoteModal,
          notes: noteText,
          completed: true
        });
        setWeeklyGoals(weeklyGoals.map(g => g._id === activeNoteModal._id ? updated.data : g));
      }
      setActiveNoteModal(null);
      setNoteText('');
      setValidationState('idle');
      setValidationError('');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleValidateAndComplete = async () => {
    const task = activeNoteModal;

    if (!task.isLocked) {
      await handleSaveNote();
      return;
    }

    setValidationState('validating');
    setValidationError('');

    try {
      const result = await api.validateLockCriteria(task.unlockCriteria, noteText);

      if (result.data.isValid) {
        setValidationState('valid');
        await handleSaveNote();
      } else {
        setValidationState('invalid');
        setValidationError(result.data.explanation);
      }
    } catch (error) {
      if (error.response?.data?.allowOverride) {
        setValidationState('error');
      } else {
        setValidationError('Validation failed. Please try again.');
        setValidationState('invalid');
      }
    }
  };

  const handleOverrideComplete = async () => {
    setValidationState('idle');
    await handleSaveNote();
  };

  const handleToggleLock = (taskId) => {
    const task = dailyTasks.find(t => t._id === taskId);
    if (task) {
      setLockEditModal({ taskId, task });
    }
  };

  const handleSaveLockCriteria = async (criteria) => {
    try {
      const task = dailyTasks.find(t => t._id === lockEditModal.taskId);
      const updated = await api.updateTask(lockEditModal.taskId, {
        ...task,
        isLocked: true,
        unlockCriteria: criteria
      });
      setDailyTasks(dailyTasks.map(t => t._id === lockEditModal.taskId ? updated.data : t));
      setLockEditModal(null);
    } catch (error) {
      console.error('Error saving lock criteria:', error);
    }
  };

  const handleAddTask = async (text) => {
    try {
      const newTask = await api.createTask({
        text,
        isEveryday: false,
        completed: false,
        notes: ''
      });
      setDailyTasks([...dailyTasks, newTask.data]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleAddEverydayTask = async (text) => {
    try {
      const newTask = await api.createTask({
        text,
        isEveryday: true,
        completed: false,
        notes: ''
      });
      setDailyTasks([...dailyTasks, newTask.data]);
    } catch (error) {
      console.error('Error adding everyday task:', error);
    }
  };

  const handleEditEverydayTask = async (id, text) => {
    try {
      const task = dailyTasks.find(t => t._id === id);
      const updated = await api.updateTask(id, { ...task, text });
      setDailyTasks(dailyTasks.map(t => t._id === id ? updated.data : t));
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await api.deleteTask(id);
      setDailyTasks(dailyTasks.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteEverydayTask = async (id) => {
    try {
      await api.deleteTask(id);
      setDailyTasks(dailyTasks.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting everyday task:', error);
    }
  };

  // Date navigation handlers
  const navigateDate = async (direction) => {
    const todayKey = getTodayKey();

    if (direction === 0) {
      // Go back to today
      setSelectedDate(null);
      setViewingTasks([]);
      return;
    }

    const currentDate = selectedDate || todayKey;
    const [year, month, day] = currentDate.split('-').map(Number);
    const currentDateObj = new Date(year, month - 1, day, 12, 0, 0);
    currentDateObj.setDate(currentDateObj.getDate() + direction);

    const newDateKey = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;

    // Check if new date is today
    if (newDateKey === todayKey) {
      setSelectedDate(null);
      setViewingTasks([]);
      return;
    }

    try {
      const res = await api.getTasksForDate(newDateKey);
      setSelectedDate(newDateKey);
      setViewingTasks(res.data);
    } catch (error) {
      console.error('Error loading tasks for date:', error);
      if (error.response?.data?.error) {
        showToast(error.response.data.error, 'error');
      }
    }
  };

  const handleAddTaskForDate = async (text) => {
    const dateKey = selectedDate || getTodayKey();
    const todayKey = getTodayKey();

    if (dateKey === todayKey) {
      // Use regular add task for today
      return handleAddTask(text);
    }

    try {
      const newTask = await api.createTaskForDate(dateKey, {
        text,
        isEveryday: false
      });
      setViewingTasks([...viewingTasks, newTask.data]);

      // If it's a future task, also add to scheduled tasks list
      const [year, month, day] = dateKey.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day, 12, 0, 0);
      const todayObj = new Date(todayKey + 'T12:00:00');

      if (dateObj > todayObj) {
        // Refresh scheduled tasks
        const scheduledRes = await api.getScheduled();
        setScheduledTasks(scheduledRes.data);
      }
    } catch (error) {
      console.error('Error adding task for date:', error);
    }
  };

  // Incomplete tasks handlers
  const handleCompletePastTask = async (taskId, notes) => {
    try {
      const result = await api.completeTaskToday(taskId, notes);

      // Remove from incomplete tasks
      setIncompleteTasks(incompleteTasks.filter(t => t._id !== taskId));

      // Add to daily tasks (it's now a completed task for today)
      setDailyTasks([...dailyTasks, result.data]);

      showToast('Task completed and moved to today', 'success');
    } catch (error) {
      console.error('Error completing past task:', error);
      showToast('Failed to complete task', 'error');
    }
  };

  const handleDeleteIncompleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      setIncompleteTasks(incompleteTasks.filter(t => t._id !== taskId));
      showToast('Task removed', 'success');
    } catch (error) {
      console.error('Error deleting incomplete task:', error);
    }
  };

  const handleAddGoal = async (text) => {
    try {
      const newGoal = await api.createGoal({
        text,
        completed: false,
        notes: ''
      });
      setWeeklyGoals([...weeklyGoals, newGoal.data]);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleEditGoal = async (id, text) => {
    try {
      const goal = weeklyGoals.find(g => g._id === id);
      const updated = await api.updateGoal(id, { ...goal, text });
      setWeeklyGoals(weeklyGoals.map(g => g._id === id ? updated.data : g));
    } catch (error) {
      console.error('Error editing goal:', error);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await api.deleteGoal(id);
      setWeeklyGoals(weeklyGoals.filter(g => g._id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleAddScheduled = async (text, date) => {
    try {
      const newTask = await api.createScheduled({ text, date });
      setScheduledTasks([...scheduledTasks, newTask.data]);
    } catch (error) {
      console.error('Error adding scheduled task:', error);
    }
  };

  const syncScheduledToToday = async (scheduledList, dailyList) => {
    const todayStr = getTodayKey();
    const toSync = scheduledList.filter(t => {
      const d = new Date(t.date);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === todayStr;
    });

    if (toSync.length === 0) return { updatedScheduled: scheduledList, updatedDaily: dailyList };

    let newDaily = [...dailyList];
    let newScheduled = scheduledList.filter(t => !toSync.find(ts => ts._id === t._id));

    for (const task of toSync) {
      try {
        // Create as daily task
        const newTask = await api.createTask({
          text: task.text,
          isEveryday: false,
          completed: false,
          notes: ''
        });
        newDaily.push(newTask.data);
        // Delete from scheduled
        await api.deleteScheduled(task._id);
      } catch (error) {
        console.error('Error syncing scheduled task:', error);
      }
    }

    return { updatedScheduled: newScheduled, updatedDaily: newDaily };
  };

  const handleDeleteScheduled = async (id) => {
    try {
      await api.deleteScheduled(id);
      setScheduledTasks(scheduledTasks.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting scheduled task:', error);
    }
  };

  const handleUpdateScheduledDate = async (id, text, date) => {
    try {
      const task = scheduledTasks.find(t => t._id === id);
      const updated = await api.updateScheduled(id, { ...task, text, date });

      // Check if new date is today
      const todayStr = getTodayKey();
      const d = new Date(date);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (dStr === todayStr) {
        // Immediate sync
        const { updatedDaily } = await syncScheduledToToday([updated.data], dailyTasks);
        // We need to merge this back into the main lists
        setScheduledTasks(scheduledTasks.filter(t => t._id !== id));
        setDailyTasks(updatedDaily);
      } else {
        setScheduledTasks(scheduledTasks.map(t => t._id === id ? updated.data : t));
      }
    } catch (error) {
      console.error('Error updating scheduled task:', error);
    }
  };

  const handleAddPlannedTasks = async (tasks) => {
    const todayStr = getTodayKey();

    for (const task of tasks) {
      if (task.date === todayStr) {
        // It's today, add to daily tasks
        await handleAddTask(task.text + (task.time ? ` @ ${task.time}` : ''));
      } else {
        // It's in the future, add to scheduled
        const [year, month, day] = task.date.split('-').map(Number);
        const scheduledDate = new Date(year, month - 1, day, 12, 0, 0, 0);
        await handleAddScheduled(task.text + (task.time ? ` @ ${task.time}` : ''), scheduledDate.toISOString());
      }
    }
  };

  const getWeeklyScheduledTasks = () => {
    const now = getAdjustedNow();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    return (scheduledTasks || []).filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    });
  };

  const handleUpdateLog = async (updatedData) => {
    try {
      const logToSave = {
        ...dailyLog,
        ...updatedData,
        date: getTodayKey()
      };

      const res = await api.saveLog(logToSave);
      setDailyLog(res.data);

      if (updatedData.finished) {
        fetchWeeklyHistory();
      }

      // Auto-schedule tomorrow's tasks if notes were updated
      if (updatedData.tomorrowNotes && updatedData.tomorrowNotes !== dailyLog.tomorrowNotes) {
        // Handle both comma-separated and line-separated tasks
        const lines = updatedData.tomorrowNotes
          .split(/[\n,]+/)
          .map(l => l.replace(/^[-*•]\s*/, '').trim())
          .filter(l => l.length > 1) // Avoid single chars
          .filter(l => !['none', 'n/a', 'nothing', 'no tasks', ''].includes(l.toLowerCase()));

        const tomorrow = new Date(getAdjustedNow());
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0); // Noon tomorrow

        for (const line of lines) {
          // Case-insensitive check and avoid duplicates
          const lowerLine = line.toLowerCase();
          const exists = (scheduledTasks || []).some(t =>
            t.text.toLowerCase() === lowerLine &&
            new Date(t.date).toDateString() === tomorrow.toDateString()
          );

          if (!exists) {
            console.log('Auto-scheduling tomorrow task:', line);
            await handleAddScheduled(line, tomorrow.toISOString());
          }
        }
      }
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  const handleSearchArticles = async (query) => {
    try {
      const response = await api.searchArticles(query);
      const data = response.data;

      const newHistoryItem = { query, result: data, timestamp: new Date().toISOString() };
      const currentSearchHistory = dailyLog.searchHistory || [];
      const updatedSearchHistory = [...currentSearchHistory, newHistoryItem];

      await handleUpdateLog({ searchHistory: updatedSearchHistory });

      return data;
    } catch (error) {
      console.error('Error searching articles:', error);
      throw error;
    }
  };

  const handleAddArticleToReadingTask = async (article, status = 'read') => {
    try {
      const targetTask = dailyTasks.find(t =>
        t.isEveryday && t.text.toLowerCase().includes('reading articles')
      );

      if (!targetTask) {
        showToast('Could not find an everyday task named "Reading Articles". Please create one first!', 'error');
        return { success: false };
      }

      // Use new articles array if available, otherwise fall back to notes
      if (targetTask.articles !== undefined) {
        const updated = await api.addArticleToTask(targetTask._id, {
          title: article.title,
          url: article.url,
          status
        });
        setDailyTasks(dailyTasks.map(t => t._id === targetTask._id ? updated.data : t));
      } else {
        // Legacy: append to notes
        const articleNote = `\n- ${article.title}: ${article.url}`;
        const newNotes = (targetTask.notes || '') + articleNote;

        const updated = await api.updateTask(targetTask._id, {
          ...targetTask,
          notes: newNotes
        });

        setDailyTasks(dailyTasks.map(t => t._id === targetTask._id ? updated.data : t));
      }

      const statusLabel = status === 'saved' ? 'Saved for Later' : 'Reading List';
      showToast(`Article added to ${statusLabel}`, 'success');
      return { success: true };
    } catch (error) {
      console.error('Error adding article to task:', error);
      showToast('Failed to add article to reading task.', 'error');
      return { success: false };
    }
  };

  const handleMoveArticle = async (articleIndex, newStatus) => {
    try {
      const targetTask = dailyTasks.find(t =>
        t.isEveryday && t.text.toLowerCase().includes('reading articles')
      );

      if (!targetTask) return;

      const updated = await api.updateArticleStatus(targetTask._id, articleIndex, newStatus);
      setDailyTasks(dailyTasks.map(t => t._id === targetTask._id ? updated.data : t));

      const statusLabel = newStatus === 'saved' ? 'Saved for Later' : 'Read';
      showToast(`Article moved to ${statusLabel}`, 'success');
    } catch (error) {
      console.error('Error moving article:', error);
      showToast('Failed to move article.', 'error');
    }
  };

  const handleDeleteArticle = async (articleIndex) => {
    try {
      const targetTask = dailyTasks.find(t =>
        t.isEveryday && t.text.toLowerCase().includes('reading articles')
      );

      if (!targetTask) return;

      const updated = await api.deleteArticle(targetTask._id, articleIndex);
      setDailyTasks(dailyTasks.map(t => t._id === targetTask._id ? updated.data : t));
      showToast('Article removed', 'success');
    } catch (error) {
      console.error('Error deleting article:', error);
      showToast('Failed to remove article.', 'error');
    }
  };

  const getReadingNotes = () => {
    const targetTask = (dailyTasks || []).find(t =>
      t.isEveryday && t.text.toLowerCase().includes('reading articles')
    );
    return targetTask ? targetTask.notes : '';
  };

  const getReadingArticles = () => {
    const targetTask = (dailyTasks || []).find(t =>
      t.isEveryday && t.text.toLowerCase().includes('reading articles')
    );
    return targetTask?.articles || [];
  };

  const getProcessedWeeklyWins = () => {
    const wins = {};
    (weeklyHistory || []).forEach(task => {
      const key = task.text;
      if (!wins[key]) {
        wins[key] = { text: task.text, count: 0, isEveryday: task.isEveryday };
      }
      wins[key].count += 1;
    });

    return Object.values(wins).sort((a, b) => {
      if (a.isEveryday !== b.isEveryday) return a.isEveryday ? -1 : 1;
      return b.count - a.count;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Daily Routine
            </h1>
            <p className="text-lg text-slate-400">Track your progress, reflect on your journey, {user.userId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoiceSettings(true)}
              className={`flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-indigo-500/10 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl transition-all text-sm font-medium ${
                voiceEnabled ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'
              }`}
              title="Voice Settings"
            >
              <Mic size={16} />
              Voice
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/30 rounded-xl text-slate-400 hover:text-red-400 transition-all text-sm font-medium"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <div className="flex justify-center mb-8">
          <div className="flex p-1 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl">
            {[
              { id: 'todos', label: 'To-Dos', icon: CheckCircle2 },
              { id: 'reading', label: 'Reading', icon: BookOpen },
              { id: 'logging', label: 'Logging', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main>
          {activeTab === 'todos' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="xl:col-span-3">
                <TaskPlannerChat onAddTasks={handleAddPlannedTasks} />
              </div>

              <div className="xl:col-span-6">
                <TasksColumn
                  dailyTasks={selectedDate ? viewingTasks : dailyTasks}
                  yesterdayNotes={yesterdayNotes}
                  onToggleComplete={handleToggleTaskComplete}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={selectedDate ? handleAddTaskForDate : handleAddTask}
                  onAddEverydayTask={handleAddEverydayTask}
                  onEditEverydayTask={handleEditEverydayTask}
                  onDeleteEverydayTask={handleDeleteEverydayTask}
                  onToggleLock={handleToggleLock}
                  currentDate={getTodayKey()}
                  selectedDate={selectedDate}
                  onNavigateDate={navigateDate}
                  isViewingToday={!selectedDate}
                  scheduleSection={
                    !selectedDate && (
                      <ScheduleSection
                        scheduledTasks={scheduledTasks}
                        onAddScheduled={handleAddScheduled}
                        onUpdateScheduled={handleUpdateScheduledDate}
                        onDeleteScheduled={handleDeleteScheduled}
                      />
                    )
                  }
                />
              </div>

              <div className="xl:col-span-3">
                <GoalsColumn
                  weeklyGoals={weeklyGoals}
                  onToggleComplete={handleToggleGoalComplete}
                  onDeleteGoal={handleDeleteGoal}
                  onAddGoal={handleAddGoal}
                  onEditGoal={handleEditGoal}
                />
                <IncompleteTasks
                  incompleteTasks={incompleteTasks}
                  onCompleteTask={handleCompletePastTask}
                  onDeleteTask={handleDeleteIncompleteTask}
                />
              </div>
            </div>
          )}

          {activeTab === 'reading' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Top row: Article Search and Reading List */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8">
                  <ChatColumn
                    onSearch={handleSearchArticles}
                    onAddArticle={handleAddArticleToReadingTask}
                    initialMessages={dailyLog.searchHistory?.map(h => [
                      { type: 'user', text: h.query },
                      { type: 'bot', ...h.result }
                    ]).flat() || []}
                  />
                </div>
                <div className="xl:col-span-4">
                  <ReadingList
                    notes={getReadingNotes()}
                    articles={getReadingArticles()}
                    onMoveArticle={handleMoveArticle}
                    onDeleteArticle={handleDeleteArticle}
                  />
                </div>
              </div>

              {/* Bottom row: News Digest and Learning Path */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <NewsDigest onAddArticle={handleAddArticleToReadingTask} />
                <LearningPath onAddArticle={handleAddArticleToReadingTask} />
              </div>
            </div>
          )}

          {activeTab === 'logging' && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReflectionChat
                dailyLog={dailyLog}
                onUpdateLog={handleUpdateLog}
                completedTasks={(dailyTasks || []).filter(t => t.completed).map(t => t.text)}
                weeklyWins={getProcessedWeeklyWins()}
              />
            </div>
          )}
        </main>

        {activeNoteModal && (
          <NoteModal
            task={activeNoteModal}
            noteText={noteText}
            onNoteChange={setNoteText}
            onSave={handleSaveNote}
            onCancel={() => {
              setActiveNoteModal(null);
              setNoteText('');
              setValidationState('idle');
              setValidationError('');
            }}
            isLocked={activeNoteModal.isLocked}
            unlockCriteria={activeNoteModal.unlockCriteria}
            validationState={validationState}
            validationError={validationError}
            onValidate={handleValidateAndComplete}
            onOverride={handleOverrideComplete}
          />
        )}

        {lockEditModal && (
          <LockCriteriaModal
            task={lockEditModal.task}
            onSave={handleSaveLockCriteria}
            onCancel={() => setLockEditModal(null)}
          />
        )}

        <VoiceSettings
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
        />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <VoiceProvider>
        <AppContent />
        <Toast />
      </VoiceProvider>
    </ToastProvider>
  );
};

export default App;