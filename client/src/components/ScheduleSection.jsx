// client/src/components/ScheduleSection.jsx
import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const ScheduleSection = ({ scheduledTasks, onAddScheduled, onUpdateScheduled, onDeleteScheduled }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduledTaskText, setScheduledTaskText] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');

  const safeScheduledTasks = scheduledTasks || [];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getTasksForDate = (date) => {
    return safeScheduledTasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleAddScheduled = () => {
    if (scheduledTaskText.trim() && selectedDate) {
      onAddScheduled(scheduledTaskText, selectedDate.toISOString());
      setScheduledTaskText('');
      setSelectedDate(null);
      setShowCalendar(false);
    }
  };

  const handleStartEdit = (task) => {
    setEditingId(task._id);
    setEditText(task.text);
    // Format date as YYYY-MM-DD for input[type="date"]
    const d = new Date(task.date);
    setEditDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const handleSaveEdit = (id) => {
    if (editText.trim() && editDate) {
      // Ensure we preserve the noon-time convention or just use the chosen date string
      const [year, month, day] = editDate.split('-').map(Number);
      const newDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      onUpdateScheduled(id, editText, newDate.toISOString());
    }
    setEditingId(null);
    setEditText('');
    setEditDate('');
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-white">This Week</h2>
          <p className="text-[10px] text-orange-400/60 uppercase tracking-wider font-medium">Schedule</p>
        </div>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`p-2 rounded-xl transition-all ${showCalendar ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'hover:bg-orange-500/20 text-orange-400'
            }`}
        >
          <Calendar size={18} />
        </button>
      </div>

      {showCalendar && (
        <div className="mb-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 rounded-md hover:bg-orange-500/20 text-orange-400"
            >
              <ChevronLeft size={16} />
            </button>
            <h3 className="font-bold text-orange-300 text-xs text-center min-w-[80px]">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 rounded-md hover:bg-orange-500/20 text-orange-400"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const tasksForDay = getTasksForDate(date);
              const isSelectedDate = selectedDate && date.toDateString() === selectedDate.toDateString();
              const isTodayDate = isToday(date);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square rounded-lg text-xs font-semibold transition-all relative ${isSelectedDate
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg'
                    : isTodayDate
                      ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/50'
                      : tasksForDay.length > 0
                        ? 'bg-slate-800 text-orange-400 hover:bg-slate-700'
                        : 'hover:bg-slate-800/50 text-slate-500'
                    }`}
                >
                  {day}
                  {tasksForDay.length > 0 && !isSelectedDate && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 w-0.5 rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="mb-4 p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-orange-300 uppercase tracking-wider">
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
            </p>
            <button onClick={() => setSelectedDate(null)} className="text-slate-500 hover:text-white">
              <X size={12} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={scheduledTaskText}
              onChange={(e) => setScheduledTaskText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddScheduled()}
              placeholder="Add to schedule..."
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-white placeholder-slate-600"
              autoFocus
            />
            <button
              onClick={handleAddScheduled}
              className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1 custom-scrollbar max-h-48 overflow-y-auto pr-1">
        {safeScheduledTasks.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-600 italic">No plans for this week</p>
          </div>
        ) : (
          safeScheduledTasks
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(task => {
              const taskDate = new Date(task.date);
              const isTaskToday = isToday(taskDate);

              return (
                <div
                  key={task._id}
                  className="group flex flex-col p-2 rounded-lg hover:bg-slate-800/30 transition-all border border-transparent hover:border-orange-500/10"
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isTaskToday ? 'bg-orange-500' : 'bg-slate-700'}`} />

                    <div className="flex-1 min-w-0">
                      {editingId === task._id ? (
                        <div className="space-y-2 py-1">
                          <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(task._id)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(task._id)}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <button
                              onClick={() => handleSaveEdit(task._id)}
                              className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded hover:bg-orange-500 hover:text-white transition-all uppercase font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          onClick={() => handleStartEdit(task)}
                          className={`text-sm cursor-text ${isTaskToday ? 'text-slate-100 font-medium' : 'text-slate-400'}`}
                        >
                          {task.text}
                        </p>
                      )}
                      <p className={`text-[10px] mt-0.5 font-bold uppercase tracking-tighter ${isTaskToday ? 'text-orange-500' : 'text-slate-600'}`}>
                        {isTaskToday ? 'Today' : taskDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteScheduled(task._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all rounded"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default ScheduleSection;