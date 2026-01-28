// client/src/components/NoteModal.jsx
import React from 'react';

const NoteModal = ({ task, noteText, onNoteChange, onSave, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">
          Completing: {task.text}
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Add any notes or details about this task (optional)
        </p>
        
        <textarea
          value={noteText}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="E.g., Article titles, key takeaways, thoughts..."
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4 min-h-32 resize-none text-white placeholder-slate-500"
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
            onClick={onSave}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg font-medium"
          >
            Complete Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;