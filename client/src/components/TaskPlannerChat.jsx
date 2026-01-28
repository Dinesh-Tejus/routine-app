import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Calendar, Clock, Check, Plus, X } from 'lucide-react';
import { api } from '../services/api';

const TaskPlannerChat = ({ onAddTasks }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hey! I can help you plan your day. Just tell me what you need to do, like "Buy milk today" or "Meeting tomorrow at 3pm".' }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingTasks, setPendingTasks] = useState([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isProcessing, pendingTasks]);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;

        const userMsg = { type: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const text = input;
        setInput('');
        setIsProcessing(true);

        try {
            const res = await api.parseTasks(text);
            const tasks = res.data;

            if (tasks && tasks.length > 0) {
                setPendingTasks(prev => [...prev, ...tasks]);
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: `Got it! I found ${tasks.length} task${tasks.length > 1 ? 's' : ''}. Check them below and click add to confirm.`
                }]);
            } else {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: "I couldn't find any specific tasks in that message. Could you try rephrasing?"
                }]);
            }
        } catch (error) {
            console.error('Error parsing tasks:', error);
            setMessages(prev => [...prev, { type: 'bot', text: "Sorry, I had trouble processing that. Take another shot?" }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmTasks = () => {
        onAddTasks(pendingTasks);
        setPendingTasks([]);
        setMessages(prev => [...prev, { type: 'bot', text: "Tasks added! Anything else on your mind?" }]);
    };

    const removePendingTask = (index) => {
        setPendingTasks(prev => prev.filter((_, i) => i !== index));
    };

    const updatePendingTask = (index, field, value) => {
        setPendingTasks(prev => prev.map((task, i) =>
            i === index ? { ...task, [field]: value } : task
        ));
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-orange-400" />
                        <h2 className="text-base font-bold text-white">AI Task Planner</h2>
                    </div>
                    <p className="text-[10px] text-orange-400/60 uppercase tracking-wider font-medium">Quick Scheduling</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.type === 'user'
                                ? 'bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700'
                                : 'bg-orange-500/10 text-orange-100 rounded-tl-none border border-orange-500/20'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-orange-500/5 px-3 py-2 rounded-lg flex items-center gap-2 border border-orange-500/10">
                            <Loader2 size={12} className="text-orange-400 animate-spin" />
                            <span className="text-[10px] text-orange-300/70 italic">Parsing tasks...</span>
                        </div>
                    </div>
                )}

                {/* Pending Tasks Preview */}
                {pendingTasks.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Verify & Edit Tasks</p>
                        <div className="space-y-2">
                            {pendingTasks.map((task, i) => (
                                <div key={i} className="p-3 bg-slate-800/40 border border-orange-500/20 rounded-xl space-y-2 group relative">
                                    <button
                                        onClick={() => removePendingTask(i)}
                                        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 transition-colors bg-slate-800/80 rounded"
                                    >
                                        <X size={12} />
                                    </button>

                                    {/* Task Text Input */}
                                    <input
                                        type="text"
                                        value={task.text}
                                        onChange={(e) => updatePendingTask(i, 'text', e.target.value)}
                                        placeholder="Task description..."
                                        className="w-full bg-transparent text-sm text-white font-medium border-b border-transparent focus:border-orange-500/50 focus:outline-none placeholder-slate-600 pb-0.5"
                                    />

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                        {/* Date Input */}
                                        <div className="flex items-center gap-1.5 text-orange-400/80">
                                            <Calendar size={12} />
                                            <input
                                                type="date"
                                                value={task.date}
                                                onChange={(e) => updatePendingTask(i, 'date', e.target.value)}
                                                className="bg-transparent text-[10px] focus:outline-none focus:text-orange-300 transition-colors cursor-pointer"
                                            />
                                        </div>

                                        {/* Time Input */}
                                        <div className="flex items-center gap-1.5 text-orange-400/80">
                                            <Clock size={12} />
                                            <input
                                                type="text"
                                                value={task.time || ''}
                                                onChange={(e) => updatePendingTask(i, 'time', e.target.value)}
                                                placeholder="Add time (optional)"
                                                className="bg-transparent text-[10px] focus:outline-none focus:text-orange-300 transition-colors placeholder-slate-600/50 w-24"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleConfirmTasks}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-red-400 transition-all active:scale-[0.98]"
                        >
                            <Plus size={16} />
                            Add all to List
                        </button>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700/50">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="e.g. Need to call the bank tomorrow morning"
                        className="w-full pl-4 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                        disabled={isProcessing}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isProcessing}
                        className="absolute right-2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskPlannerChat;
