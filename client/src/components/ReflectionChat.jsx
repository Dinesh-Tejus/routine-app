import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, Sparkles, Flame } from 'lucide-react';
import { api } from '../services/api';

const ReflectionChat = ({ dailyLog, onUpdateLog, completedTasks = [], weeklyWins = [] }) => {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isProcessing]);

    useEffect(() => {
        // Clear messages if date changed to prevent leakage
        setMessages([]);

        // Load existing chat history if available
        if (dailyLog.chatHistory && dailyLog.chatHistory.length > 0) {
            setMessages(dailyLog.chatHistory);
        } else {
            // Check if there's organized data (excluding technical fields)
            const sectionKeys = ['workedOn', 'finished', 'feedback', 'tomorrowNotes'];
            const hasExistingData = sectionKeys.some(key =>
                dailyLog[key] && typeof dailyLog[key] === 'string' && dailyLog[key].trim()
            );

            if (!hasExistingData) {
                setMessages([{
                    type: 'bot',
                    text: "Hi! Tell me about your day - what you worked on, accomplishments, reflections, and tomorrow's plans. 📝"
                }]);
            } else {
                setMessages([
                    {
                        type: 'bot',
                        text: "Welcome back! Here's what you've reflected on today:"
                    },
                    {
                        type: 'organized',
                        sections: [
                            { label: 'Worked On', content: dailyLog.workedOn },
                            { label: 'Finished', content: dailyLog.finished },
                            { label: 'Reflections', content: dailyLog.feedback },
                            { label: 'Tomorrow', content: dailyLog.tomorrowNotes }
                        ].filter(s => s.content && s.content.trim())
                    }
                ]);
            }
        }
    }, [dailyLog.date]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isProcessing) return;

        const newMessage = { type: 'user', text: userInput };
        setMessages(prev => [...prev, newMessage]);
        const userText = userInput;
        setUserInput('');
        setIsProcessing(true);

        try {
            const res = await api.processReflection(userText, dailyLog);
            const data = res.data;

            const organizedSections = [
                { label: 'Worked On', content: data.workedOn },
                { label: 'Finished', content: data.finished },
                { label: 'Reflections', content: data.feedback },
                { label: 'Tomorrow', content: data.tomorrowNotes }
            ].filter(s => s.content && s.content.trim());

            const botMessages = [{
                type: 'bot',
                text: data.message || "Great! I've organized your reflection:"
            }];

            if (organizedSections.length > 0) {
                botMessages.push({
                    type: 'organized',
                    sections: organizedSections
                });
            }

            const allNewMessages = [...messages, newMessage, ...botMessages];
            setMessages(allNewMessages);

            await onUpdateLog({
                workedOn: data.workedOn || dailyLog.workedOn || '',
                finished: data.finished || dailyLog.finished || '',
                feedback: data.feedback || dailyLog.feedback || '',
                tomorrowNotes: data.tomorrowNotes || dailyLog.tomorrowNotes || '',
                chatHistory: allNewMessages
            });

        } catch (error) {
            console.error('Error processing reflection:', error);
            setMessages(prev => [...prev, {
                type: 'bot',
                text: "I had trouble processing that. Could you try rephrasing?"
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[650px]">
            {/* Left Side: Accomplishments/Wins */}
            <div className="md:col-span-4 space-y-4 h-full flex flex-col overflow-hidden">
                {/* Today's Highlights */}
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkles size={12} /> Today's Highlights
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {completedTasks.length > 0 ? completedTasks.map((task, i) => (
                            <span
                                key={i}
                                className="px-2 py-1 bg-indigo-500/10 text-indigo-200 border border-indigo-500/20 rounded-md text-[10px] font-medium"
                            >
                                {task}
                            </span>
                        )) : (
                            <p className="text-[10px] text-slate-500 italic">No tasks completed yet today.</p>
                        )}
                    </div>
                </div>

                {/* Weekly Wins */}
                <div className="flex-1 bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 flex flex-col overflow-hidden">
                    <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Flame size={12} className="fill-amber-500" /> Weekly Wins
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                        {weeklyWins.length > 0 ? weeklyWins.map((win, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                                <span className="text-xs text-slate-200 font-medium truncate pr-2">{win.text}</span>
                                {win.count > 1 && (
                                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded text-[10px] font-bold border border-amber-500/30 whitespace-nowrap">
                                        🔥 {win.count}x
                                    </span>
                                )}
                            </div>
                        )) : (
                            <p className="text-[10px] text-slate-500 italic">Your week is just getting started!</p>
                        )}
                    </div>
                    <p className="mt-3 text-[9px] text-amber-500/50 italic text-center uppercase tracking-tighter">Your consistency is paying off</p>
                </div>
            </div>

            {/* Right Side: Chat */}
            <div className="md:col-span-8 bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700/50 flex flex-col h-full overflow-hidden">
                <div className="mb-3">
                    <div className="flex items-center gap-2 mb-0.5">
                        <MessageCircle size={18} className="text-purple-400" />
                        <h2 className="text-base font-bold text-white">Reflections</h2>
                        <Sparkles size={14} className="text-yellow-400" />
                    </div>
                    <p className="text-[10px] text-purple-300/60 uppercase tracking-wider font-medium">Daily Journey</p>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto mb-3 space-y-3 pr-1 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {msg.type === 'bot' && (
                                <div className="flex justify-start">
                                    <div className="bg-purple-500/10 text-purple-100 px-3 py-2 rounded-2xl rounded-tl-none max-w-[90%] text-xs border border-purple-500/20 leading-relaxed shadow-sm">
                                        {msg.text}
                                    </div>
                                </div>
                            )}
                            {msg.type === 'user' && (
                                <div className="flex justify-end">
                                    <div className="bg-slate-700/40 text-slate-100 px-3 py-2 rounded-2xl rounded-tr-none max-w-[90%] text-xs border border-slate-600/30 whitespace-pre-wrap leading-relaxed shadow-sm">
                                        {msg.text}
                                    </div>
                                </div>
                            )}
                            {msg.type === 'organized' && msg.sections?.length > 0 && (
                                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-3 rounded-xl border border-purple-500/10 my-1">
                                    <div className="space-y-2">
                                        {msg.sections.map((section, i) => (
                                            <div key={i} className="border-l border-purple-500/20 pl-2">
                                                <p className="text-[9px] font-bold text-purple-400/70 uppercase tracking-tighter mb-0.5">{section.label}</p>
                                                <p className="text-[11px] text-slate-300 leading-snug">{section.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-purple-500/5 px-3 py-2 rounded-lg flex items-center gap-2 border border-purple-500/10">
                                <Loader2 size={12} className="text-purple-400 animate-spin" />
                                <span className="text-[10px] text-purple-300/70 italic">Organizing thoughts...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex gap-2 items-end">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Reflect on your day..."
                        className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-white placeholder-slate-500 resize-none min-h-[40px] max-h-[80px]"
                        rows="1"
                        disabled={isProcessing}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isProcessing || !userInput.trim()}
                        className="w-8 h-8 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mb-1"
                    >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReflectionChat;
