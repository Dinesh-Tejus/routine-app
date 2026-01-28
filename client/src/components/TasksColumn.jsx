// client/src/components/TasksColumn.jsx
import React, { useState } from 'react';
import { Check, Plus, X, Edit2, Save, Settings, Flame } from 'lucide-react';

const TasksColumn = ({
  dailyTasks,
  yesterdayNotes,
  onToggleComplete,
  onDeleteTask,
  onAddTask,
  onAddEverydayTask,
  onEditEverydayTask,
  onDeleteEverydayTask,
  scheduleSection,
  currentDate
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
  const formattedDate = new Date(currentDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Sort tasks: Everyday tasks first, then today's tasks
  const sortedTasks = [...safeDailyTasks].sort((a, b) => {
    if (a.isEveryday === b.isEveryday) return 0;
    return a.isEveryday ? -1 : 1;
  });

  return (
    <div className="lg:col-span-3 space-y-3">
      {/* Date Display */}
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm rounded-lg p-3 border border-indigo-500/20 shadow-md">
        <h2 className="text-base font-bold text-white mb-0.5 leading-tight">{formattedDate}</h2>
        <p className="text-indigo-300 text-[10px] uppercase tracking-wider">Stay focused, stay consistent</p>
      </div>

      {/* Tasks Card */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Today's Tasks</h2>
            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-semibold border border-indigo-500/30">
              {completedCount}/{dailyTasks.length}
            </span>
          </div>
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
        </div>

        <div className="space-y-1.5 mb-2">
          {sortedTasks.map(task => (
            <div
              key={task._id}
              className={`group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-all border border-transparent ${task.isEveryday ? 'hover:border-indigo-500/20' : 'hover:border-slate-600/30'
                }`}
            >
              <button
                onClick={() => onToggleComplete(task._id)}
                className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all mt-0.5 ${task.completed
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-indigo-500'
                  : 'border-slate-600 hover:border-indigo-500'
                  }`}
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
                  </div>
                )}
              </div>

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
                  !task.isEveryday && (
                    <button
                      onClick={() => onDeleteTask(task._id)}
                      className="text-slate-500 hover:text-red-400 transition-all"
                    >
                      <X size={12} />
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={editingEveryday ? newEverydayTask : newTaskText}
            onChange={(e) => editingEveryday ? setNewEverydayTask(e.target.value) : setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder={editingEveryday ? "Add everyday task..." : "Add task details..."}
            className={`flex-1 px-2 py-1.5 bg-slate-800/50 border rounded-lg text-xs focus:outline-none focus:ring-1 text-white placeholder-slate-500 transition-colors ${editingEveryday
              ? 'border-indigo-500/30 focus:ring-indigo-500'
              : 'border-slate-700 focus:ring-slate-500'
              }`}
          />
          <button
            onClick={handleAddTask}
            className={`px-3 py-1.5 text-white rounded-lg transition-all shadow-sm ${editingEveryday
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
              : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
              }`}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Yesterday's Notes */}
        {yesterdayNotes && (
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