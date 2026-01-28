// client/src/components/GoalsColumn.jsx
import React, { useState } from 'react';
import { Check, Plus, X, Edit2, Save } from 'lucide-react';

const GoalsColumn = ({
  weeklyGoals,
  onToggleComplete,
  onAddGoal,
  onEditGoal,
  onDeleteGoal
}) => {
  const [newGoalText, setNewGoalText] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalText, setEditGoalText] = useState('');

  const handleAddGoal = () => {
    if (newGoalText.trim()) {
      onAddGoal(newGoalText);
      setNewGoalText('');
    }
  };

  const startEditGoal = (goal) => {
    setEditingGoal(goal._id);
    setEditGoalText(goal.text);
  };

  const saveEditGoal = (id) => {
    if (editGoalText.trim()) {
      onEditGoal(id, editGoalText);
    }
    setEditingGoal(null);
    setEditGoalText('');
  };

  const safeGoals = weeklyGoals || [];
  const completedCount = safeGoals.filter(g => g.completed).length;

  // Calculate week range
  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = -dayOfWeek; // Sunday as start of week

    const sunday = new Date(today);
    sunday.setDate(today.getDate() + diff);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return `${formatDate(sunday)} - ${formatDate(saturday)}`;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-white">Weekly Goals</h2>
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold border border-blue-500/30">
            {completedCount}/{safeGoals.length}
          </span>
        </div>
        <p className="text-xs text-blue-300/60">Week of {getWeekRange()}</p>
      </div>

      <div className="space-y-1.5 mb-3">
        {safeGoals.map(goal => (
          <div
            key={goal._id}
            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-all border border-transparent hover:border-blue-500/20"
          >
            <button
              onClick={() => onToggleComplete(goal._id)}
              className={`flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 ${goal.completed
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-500'
                : 'border-slate-600 hover:border-blue-500'
                }`}
            >
              {goal.completed && <Check size={14} className="text-white" />}
            </button>

            <div className="flex-1 min-w-0">
              {editingGoal === goal._id ? (
                <input
                  type="text"
                  value={editGoalText}
                  onChange={(e) => setEditGoalText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveEditGoal(goal._id)}
                  className="w-full px-2 py-1 bg-slate-800 border border-blue-500/30 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  autoFocus
                />
              ) : (
                <>
                  <p className={`text-xs font-medium ${goal.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {goal.text}
                  </p>
                  {goal.notes && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{goal.notes}</p>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              {editingGoal === goal._id ? (
                <button
                  onClick={() => saveEditGoal(goal._id)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Save size={14} />
                </button>
              ) : (
                <button
                  onClick={() => startEditGoal(goal)}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Edit2 size={14} />
                </button>
              )}
              <button
                onClick={() => onDeleteGoal(goal._id)}
                className="text-slate-500 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
          placeholder="Add weekly goal..."
          className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
        />
        <button
          onClick={handleAddGoal}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

export default GoalsColumn;