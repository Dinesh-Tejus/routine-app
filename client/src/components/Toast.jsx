import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Toast = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border animate-in slide-in-from-bottom-4 fade-in duration-300 ${
                        toast.type === 'success'
                            ? 'bg-emerald-500/90 border-emerald-400/50 text-white'
                            : toast.type === 'error'
                            ? 'bg-red-500/90 border-red-400/50 text-white'
                            : 'bg-slate-800/90 border-slate-700/50 text-slate-200'
                    }`}
                >
                    {toast.type === 'success' && <CheckCircle size={18} />}
                    {toast.type === 'error' && <XCircle size={18} />}
                    <span className="text-sm font-medium">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toast;
