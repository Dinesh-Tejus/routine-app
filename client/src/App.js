import React, { useState, useEffect } from 'react';
import TasksColumn from './components/TasksColumn';
import ReflectionColumn from './components/ReflectionColumn';
import GoalsColumn from './components/GoalsColumn';
import ScheduleSection from './components/ScheduleSection';
import NoteModal from './components/NoteModal';
import { api } from './services/api';

const App = () => {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [dailyLog, setDailyLog] = useState({
    workedOn: '',
    finished: '',
    feedback: '',
    tomorrowNotes: ''
  });
  const [yesterdayNotes, setYesterdayNotes] = useState('');
  const [activeNoteModal, setActiveNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const getYesterdayKey = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, goalsRes, scheduledRes, todayLogRes, yesterdayLogRes] = await Promise.all([
        api.getTasks(),
        api.getGoals(),
        api.getScheduled(),
        api.getLog(getTodayKey()),
        api.getLog(getYesterdayKey())
      ]);

      setDailyTasks(tasksRes.data);
      setWeeklyGoals(goalsRes.data);
      setScheduledTasks(scheduledRes.data);

      if (todayLogRes.data) {
        setDailyLog(todayLogRes.data);
      }

      if (yesterdayLogRes.data && yesterdayLogRes.data.tomorrowNotes) {
        setYesterdayNotes(yesterdayLogRes.data.tomorrowNotes);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

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
    } catch (error) {
      console.error('Error saving note:', error);
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

  const handleDeleteScheduled = async (id) => {
    try {
      await api.deleteScheduled(id);
      setScheduledTasks(scheduledTasks.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting scheduled task:', error);
    }
  };

  const handleUpdateLog = async (updatedLog) => {
    setDailyLog(updatedLog);
    try {
      await api.saveLog({ ...updatedLog, date: getTodayKey() });
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Daily Routine
          </h1>
          <p className="text-lg text-slate-400">Track your progress, reflect on your journey</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <TasksColumn
            dailyTasks={dailyTasks}
            yesterdayNotes={yesterdayNotes}
            onToggleComplete={handleToggleTaskComplete}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleAddTask}
            onAddEverydayTask={handleAddEverydayTask}
            onEditEverydayTask={handleEditEverydayTask}
            onDeleteEverydayTask={handleDeleteEverydayTask}
            currentDate={new Date()}
            scheduleSection={
              <ScheduleSection
                scheduledTasks={scheduledTasks}
                onAddScheduled={handleAddScheduled}
                onDeleteScheduled={handleDeleteScheduled}
              />
            }
          />

          <ReflectionColumn
            dailyLog={dailyLog}
            onUpdateLog={handleUpdateLog}
          />

          <GoalsColumn
            weeklyGoals={weeklyGoals}
            onToggleComplete={handleToggleGoalComplete}
            onAddGoal={handleAddGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        </div>
      </div>

      {activeNoteModal && (
        <NoteModal
          task={activeNoteModal}
          noteText={noteText}
          onNoteChange={setNoteText}
          onSave={handleSaveNote}
          onCancel={() => {
            setActiveNoteModal(null);
            setNoteText('');
          }}
        />
      )}
    </div>
  );
};

export default App;