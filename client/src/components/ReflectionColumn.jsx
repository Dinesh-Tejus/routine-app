import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const ReflectionColumn = ({ dailyLog, onUpdateLog }) => {
  const [localLog, setLocalLog] = useState(dailyLog);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLocalLog(dailyLog);
    setHasChanges(false);
  }, [dailyLog]);

  const handleChange = (field, value) => {
    setLocalLog({ ...localLog, [field]: value });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateLog(localLog);
    setIsSaving(false);
    setHasChanges(false);
    setSaveSuccess(true);

    // Hide success message after 2 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="lg:col-span-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Today's Reflection</h2>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-sm text-emerald-400 font-medium">
              ✓ Saved successfully
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${hasChanges && !isSaving
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center">
            <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></span>
            What I Worked On
          </h3>
          <textarea
            value={localLog.workedOn}
            onChange={(e) => handleChange('workedOn', e.target.value)}
            placeholder="List the tasks and projects you focused on today..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 text-slate-200 placeholder-slate-500"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center">
            <span className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-3"></span>
            What I Finished
          </h3>
          <textarea
            value={localLog.finished}
            onChange={(e) => handleChange('finished', e.target.value)}
            placeholder="Celebrate your completed tasks and accomplishments..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none h-24 text-slate-200 placeholder-slate-500"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center">
            <span className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3"></span>
            Feedback / Reflections
          </h3>
          <textarea
            value={localLog.feedback}
            onChange={(e) => handleChange('feedback', e.target.value)}
            placeholder="What went well? What could be improved? Any insights or learnings..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-32 text-slate-200 placeholder-slate-500"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center">
            <span className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full mr-3"></span>
            Tomorrow's Tasks / Notes
          </h3>
          <textarea
            value={localLog.tomorrowNotes}
            onChange={(e) => handleChange('tomorrowNotes', e.target.value)}
            placeholder="Plan ahead: What do you want to tackle tomorrow? Any important reminders..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none h-24 text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {hasChanges && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-sm text-amber-300">
            You have unsaved changes. Click <strong>Save</strong> to persist your reflections.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReflectionColumn;
