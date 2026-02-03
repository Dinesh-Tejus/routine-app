// client/src/components/TasksColumn.jsx
import React, { useState } from 'react';
import { Check, Plus, X, Edit2, Save, Settings, Flame, Lock, Unlock, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const TasksColumn = ({
  dailyTasks,
  yesterdayNotes,
  onToggleComplete,
  onDeleteTask,
  onAddTask,
  onAddEverydayTask,
  onEditEverydayTask,
  onDeleteEverydayTask,
  onToggleLock,
  scheduleSection,
  currentDate,
  selectedDate,
  onNavigateDate,
  isViewingToday
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [editingEveryday, setEditingEveryday] = useState(false);
  const [editingEverydayId, setEditingEverydayId] = useState(null);
  const [editEverydayText, setEditEverydayText] = useState('');
  const [newEverydayTask, setNewEverydayTask] = useState('');

  const handleAddTask = () => {
    if (editingEveryday) {
      if (newEverydayTask.trim()) {
        onAddEverydayTask(newEverydayTask);
        setNewEverydayTask('');
      }
    } else {
      if (newTaskText.trim()) {
        onAddTask(newTaskText);
        setNewTaskText('');
      }
    }
  };

  const startEditEveryday = (task) => {
    setEditingEverydayId(task._id);
    setEditEverydayText(task.text);
  };

  const saveEditEveryday = (id) => {
    if (editEverydayText.trim()) {
      onEditEverydayTask(id, editEverydayText);
    }
    setEditingEverydayId(null);
    setEditEverydayText('');
  };

  const safeDailyTasks = dailyTasks || [];
  const completedCount = safeDailyTasks.filter(t => t.completed).length;

  // Parse date string correctly to avoid UTC/EST timezone issues
  // Add T12:00:00 to treat it as noon local time, avoiding day boundary issues
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // Use selectedDate if available, otherwise use currentDate (today)
  const displayDate = selectedDate || currentDate;

  const formattedDate = parseDate(displayDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York'
  });

  // Calculate if we're at navigation boundaries (±2 weeks)
  const todayDate = parseDate(currentDate);
  const viewingDate = parseDate(displayDate);
  const diffDays = Math.round((viewingDate - todayDate) / (1000 * 60 * 60 * 24));
  const canNavigateBack = diffDays > -14;
  const canNavigateForward = diffDays < 14;
  const isViewingPast = diffDays < 0;
  const isViewingFuture = diffDays > 0;

  // Header text based on what we're viewing
  const getHeaderText = () => {
    if (isViewingFuture) return 'Planned Tasks';
    if (isViewingPast) return 'Past Tasks';
    return "Today's Tasks";
  };

  // Sort tasks: Everyday tasks first, then today's tasks
  const sortedTasks = [...safeDailyTasks].sort((a, b) => {
    if (a.isEveryday === b.isEveryday) return 0;
    return a.isEveryday ? -1 : 1;
  });

  return (
    <div className="lg:col-span-3 space-y-3">
      {/* Date Display with Navigation */}
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm rounded-lg p-3 border border-indigo-500/20 shadow-md">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigateDate && onNavigateDate(-1)}
            disabled={!canNavigateBack || !onNavigateDate}
            className={`p-1.5 rounded-lg transition-all ${canNavigateBack && onNavigateDate
              ? 'hover:bg-white/10 text-white'
              : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Previous day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center flex-1">
            <h2 className="text-base font-bold text-white mb-0.5 leading-tight">{formattedDate}</h2>
            <p className="text-indigo-300 text-[10px] uppercase tracking-wider">
              {isViewingPast ? 'Historical view' : isViewingFuture ? 'Future planned' : 'Stay focused, stay consistent'}
            </p>
          </div>

          <button
            onClick={() => onNavigateDate && onNavigateDate(1)}
            disabled={!canNavigateForward || !onNavigateDate}
            className={`p-1.5 rounded-lg transition-all ${canNavigateForward && onNavigateDate
              ? 'hover:bg-white/10 text-white'
              : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Next day"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Back to Today button */}
        {!isViewingToday && onNavigateDate && (
          <button
            onClick={() => onNavigateDate(0)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs font-medium transition-all"
          >
            <RotateCcw size={12} />
            Back to Today
          </button>
        )}
      </div>

      {/* Tasks Card */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">{getHeaderText()}</h2>
            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-semibold border border-indigo-500/30">
              {completedCount}/{safeDailyTasks.length}
            </span>
            {isViewingPast && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-semibold border border-amber-500/30">
                Read Only
              </span>
            )}
            {isViewingFuture && (
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-semibold border border-blue-500/30">
                Scheduled
              </span>
            )}
          </div>
          {isViewingToday && (
            <button
              onClick={() => {
                setEditingEveryday(!editingEveryday);
                // Reset states when exiting edit mode
                if (editingEveryday) {
                  setEditingEverydayId(null);
                  setNewEverydayTask('');
                }
              }}
              className={`p-1 rounded hover:bg-indigo-500/20 transition-colors ${editingEveryday ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}
              title="Edit Everyday Tasks"
            >
              <Settings size={14} />
            </button>
          )}
        </div>

        <div className="space-y-1.5 mb-2">
          {sortedTasks.length === 0 && (
            <div className="text-center py-4 text-slate-500 text-sm">
              {isViewingPast ? 'No tasks recorded for this day' : isViewingFuture ? 'No tasks planned for this day' : 'No tasks yet'}
            </div>
          )}
          {sortedTasks.map(task => {
            // Everyday tasks are read-only on past dates
            const isReadOnly = isViewingPast && task.isEveryday;
            // All tasks on future dates are read-only (they're scheduled)
            const isFutureTask = isViewingFuture;

            return (
            <div
              key={task._id}
              className={`group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-all border border-transparent ${task.isEveryday ? 'hover:border-indigo-500/20' : 'hover:border-slate-600/30'
                } ${isReadOnly ? 'opacity-75' : ''}`}
            >
              <button
                onClick={() => !isReadOnly && !isFutureTask && onToggleComplete(task._id)}
                disabled={isReadOnly || isFutureTask}
                className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all mt-0.5 ${task.completed
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-indigo-500'
                  : 'border-slate-600 hover:border-indigo-500'
                  } ${(isReadOnly || isFutureTask) ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {task.completed && <Check size={10} className="text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                {editingEveryday && editingEverydayId === task._id ? (
                  <input
                    type="text"
                    value={editEverydayText}
                    onChange={(e) => setEditEverydayText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEditEveryday(task._id)}
                    className="w-full px-1.5 py-0.5 bg-slate-800 border border-indigo-500/30 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className={`text-sm leading-tight ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.text}
                    </p>
                    {task.isLocked && (
                      <Lock size={12} className="text-amber-400 flex-shrink-0" title={`Locked: ${task.unlockCriteria}`} />
                    )}
                    {task.isEveryday && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1 py-px bg-slate-800 text-slate-500 rounded border border-slate-700/50 uppercase tracking-tighter">
                          Daily
                        </span>
                        {task.streak > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1 py-px rounded border border-amber-500/20">
                            <Flame size={10} className="fill-amber-500" />
                            {task.streak}
                          </span>
                        )}
                      </div>
                    )}
                    {task.isScheduled && (
                      <span className="text-[9px] px-1 py-px bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 uppercase tracking-tighter">
                        Scheduled
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Only show action buttons when viewing today */}
              {isViewingToday && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingEveryday && task.isEveryday ? (
                    <>
                      {editingEverydayId === task._id ? (
                        <button
                          onClick={() => saveEditEveryday(task._id)}
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          <Save size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditEveryday(task)}
                          className="text-slate-500 hover:text-indigo-400"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteEverydayTask(task._id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Lock toggle button */}
                      <button
                        onClick={() => onToggleLock(task._id)}
                        className="text-slate-500 hover:text-amber-400 transition-all"
                        title={task.isLocked ? "Edit lock criteria" : "Add lock"}
                      >
                        {task.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                      {!task.isEveryday && (
                        <button
                          onClick={() => onDeleteTask(task._id)}
                          className="text-slate-500 hover:text-red-400 transition-all"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>

        {/* Add task form - shown for today and future dates */}
        {(isViewingToday || isViewingFuture) && (
          <div className="flex gap-2">
            <input
              type="text"
              value={editingEveryday ? newEverydayTask : newTaskText}
              onChange={(e) => editingEveryday ? setNewEverydayTask(e.target.value) : setNewTaskText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder={editingEveryday ? "Add everyday task..." : isViewingFuture ? "Schedule task for this day..." : "Add task details..."}
              className={`flex-1 px-2 py-1.5 bg-slate-800/50 border rounded-lg text-xs focus:outline-none focus:ring-1 text-white placeholder-slate-500 transition-colors ${editingEveryday
                ? 'border-indigo-500/30 focus:ring-indigo-500'
                : 'border-slate-700 focus:ring-slate-500'
                }`}
            />
            <button
              onClick={handleAddTask}
              className={`px-3 py-1.5 text-white rounded-lg transition-all shadow-sm ${editingEveryday
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
                : isViewingFuture
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                }`}
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        {/* Yesterday's Notes - only show when viewing today */}
        {isViewingToday && yesterdayNotes && (
          <div className="border-t border-slate-700/50 pt-2 mt-2">
            <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Yesterday's Notes</h3>
            <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{yesterdayNotes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Section */}
      {scheduleSection}
    </div>
  );
};

export default TasksColumn;