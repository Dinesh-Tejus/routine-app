// client/src/components/LockCriteriaModal.jsx
import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const LockCriteriaModal = ({ task, onSave, onCancel }) => {
  const [criteria, setCriteria] = useState(task?.unlockCriteria || '');

  const handleSave = () => {
    if (criteria.trim()) {
      onSave(criteria.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Lock className="text-amber-400" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {task?.isLocked ? 'Edit Lock Criteria' : 'Set Lock Criteria'}
            </h3>
            <p className="text-sm text-slate-400">
              For: {task?.text}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Define what must be accomplished to complete this task. The AI will validate your notes against these criteria.
        </p>

        {task?.isLocked && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
            <p className="text-amber-300 text-xs">
              Note: Once a lock is set, it cannot be removed. You can only modify the criteria.
            </p>
          </div>
        )}

        <textarea
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          placeholder="e.g., Read at least 3 articles, or Meditate for 5 minutes, or Complete 10 problems..."
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent mb-4 min-h-24 resize-none text-white placeholder-slate-500"
          autoFocus
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-slate-300 hover:bg-slate-800 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!criteria.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {task?.isLocked ? 'Update Lock' : 'Set Lock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockCriteriaModal;
