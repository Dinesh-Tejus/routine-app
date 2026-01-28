// client/src/components/ScheduleSection.jsx
import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const ScheduleSection = ({ scheduledTasks, onAddScheduled, onDeleteScheduled }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduledTaskText, setScheduledTaskText] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    return scheduledTasks.filter(task => {
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

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-white">Schedule</h2>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="p-2 rounded-xl hover:bg-orange-500/20 text-orange-400 transition-colors"
        >
          <Calendar size={18} />
        </button>
      </div>
      
      {showCalendar && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1 rounded-md hover:bg-orange-500/20 text-orange-400"
            >
              <ChevronLeft size={16} />
            </button>
            <h3 className="font-bold text-orange-300 text-xs">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1 rounded-md hover:bg-orange-500/20 text-orange-400"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 py-1">
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
                  className={`aspect-square rounded-lg text-xs font-medium transition-all relative ${
                    isSelectedDate
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
                      : isTodayDate
                      ? 'bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/50'
                      : tasksForDay.length > 0
                      ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                      : 'hover:bg-slate-800/50 text-slate-400'
                  }`}
                >
                  {day}
                  {tasksForDay.length > 0 && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {tasksForDay.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-orange-400" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {selectedDate && (
        <div className="mb-4 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
          <p className="text-xs font-semibold text-orange-300 mb-2">
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={scheduledTaskText}
              onChange={(e) => setScheduledTaskText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddScheduled()}
              placeholder="Add task..."
              className="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-slate-500"
            />
            <button
              onClick={handleAddScheduled}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {scheduledTasks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-3">No scheduled tasks</p>
        ) : (
          scheduledTasks
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(task => {
              const taskDate = new Date(task.date);
              return (
                <div
                  key={task._id}
                  className="group flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-all border border-transparent hover:border-orange-500/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{task.text}</p>
                    <p className="text-xs text-orange-400 mt-0.5">
                      {taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteScheduled(task._id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default ScheduleSection;