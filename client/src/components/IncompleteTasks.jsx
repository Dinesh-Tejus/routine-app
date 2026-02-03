// client/src/components/IncompleteTasks.jsx
import React, { useState } from 'react';
import { AlertCircle, Check, X, Calendar } from 'lucide-react';

const IncompleteTasks = ({
  incompleteTasks,
  onCompleteTask,
  onDeleteTask
}) => {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [noteText, setNoteText] = useState('');

  const safeTasks = incompleteTasks || [];

  if (safeTasks.length === 0) {
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York'
    });
  };

  const handleCompleteClick = (taskId) => {
    const task = safeTasks.find(t => t._id === taskId);
    setActiveTaskId(taskId);
    setNoteText(task?.notes || '');
  };

  const handleSubmitComplete = async () => {
    if (activeTaskId) {
      await onCompleteTask(activeTaskId, noteText);
      setActiveTaskId(null);
      setNoteText('');
    }
  };

  const handleCancel = () => {
    setActiveTaskId(null);
    setNoteText('');
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-amber-500/30 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={16} className="text-amber-400" />
        <h2 className="text-base font-bold text-white">Incomplete Tasks</h2>
        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-500/30">
          {safeTasks.length}
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        These tasks from previous days were not completed. Complete them now or remove them.
      </p>

      <div className="space-y-2">
        {safeTasks.map(task => (
          <div
            key={task._id}
            className="group flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-amber-500/10 hover:border-amber-500/30 transition-all"
          >
            {activeTaskId === task._id ? (
              // Note input mode
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-200">{task.text}</p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add completion notes (optional)..."
                  className="w-full px-2 py-1.5 bg-slate-900/50 border border-amber-500/30 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-white placeholder-slate-500 resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitComplete}
                    className="px-3 py-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ) : (
              // Normal display mode
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{task.text}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500">
                      {formatDate(task.date)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCompleteClick(task._id)}
                    className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 transition-all"
                    title="Complete now"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task._id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                    title="Delete task"
                  >
                    <X size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncompleteTasks;
