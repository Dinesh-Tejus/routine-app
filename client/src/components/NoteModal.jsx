// client/src/components/NoteModal.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const NoteModal = ({
  task,
  noteText,
  onNoteChange,
  onSave,
  onCancel,
  isLocked,
  unlockCriteria,
  validationState,
  validationError,
  onValidate,
  onOverride
}) => {
  // validationState: 'idle' | 'validating' | 'valid' | 'invalid' | 'error'
  const isValidating = validationState === 'validating';
  const showValidateButton = isLocked && validationState !== 'valid';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">
          Completing: {task.text}
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Add any notes or details about this task (optional)
        </p>

        {/* Unlock criteria hint for locked tasks */}
        {isLocked && unlockCriteria && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
            <p className="text-amber-300 text-sm font-medium">Unlock Criteria:</p>
            <p className="text-amber-200/80 text-sm">{unlockCriteria}</p>
          </div>
        )}

        {/* Validation error display */}
        {validationState === 'invalid' && validationError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">{validationError}</p>
          </div>
        )}

        {/* API error with override option */}
        {validationState === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm mb-2">Validation service unavailable</p>
            <button
              onClick={onOverride}
              className="text-amber-400 text-sm underline hover:text-amber-300 transition-colors"
            >
              Override and complete anyway
            </button>
          </div>
        )}

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
            disabled={isValidating}
          >
            Cancel
          </button>
          <button
            onClick={showValidateButton ? onValidate : onSave}
            disabled={isValidating}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Validating...
              </>
            ) : showValidateButton ? (
              'Validate & Complete'
            ) : (
              'Complete Task'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
