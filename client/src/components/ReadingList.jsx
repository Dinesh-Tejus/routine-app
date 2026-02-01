import React, { useState } from 'react';
import { BookOpen, ExternalLink, Bookmark, ArrowRight, ArrowLeft, Trash2, BookMarked } from 'lucide-react';

const ReadingList = ({ notes = '', articles = [], onMoveArticle, onDeleteArticle }) => {
    const [activeTab, setActiveTab] = useState('read');

    // Parse articles from notes string (format: "- Title: URL") for legacy support
    const parseArticlesFromNotes = (text) => {
        if (!text) return [];
        const lines = text.split('\n');
        return lines
            .filter(line => line.trim().startsWith('- '))
            .map(line => {
                const content = line.trim().substring(2); // Remove "- "
                const lastColonIndex = content.lastIndexOf(': http');
                if (lastColonIndex === -1) return null;

                const title = content.substring(0, lastColonIndex).trim();
                const url = content.substring(lastColonIndex + 1).trim();
                return { title, url, status: 'read' };
            })
            .filter(article => article !== null);
    };

    // Combine structured articles with legacy notes-based articles
    const allArticles = articles.length > 0 ? articles : parseArticlesFromNotes(notes);

    const readArticles = allArticles.filter(a => a.status === 'read');
    const savedArticles = allArticles.filter(a => a.status === 'saved');

    const currentArticles = activeTab === 'read' ? readArticles : savedArticles;

    const handleMove = (index) => {
        // Find the actual index in the full articles array
        const article = currentArticles[index];
        const actualIndex = allArticles.findIndex(a => a.url === article.url);
        if (actualIndex !== -1 && onMoveArticle) {
            const newStatus = activeTab === 'read' ? 'saved' : 'read';
            onMoveArticle(actualIndex, newStatus);
        }
    };

    const handleDelete = (index) => {
        const article = currentArticles[index];
        const actualIndex = allArticles.findIndex(a => a.url === article.url);
        if (actualIndex !== -1 && onDeleteArticle) {
            onDeleteArticle(actualIndex);
        }
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                    <Bookmark size={18} className="text-emerald-400" />
                    <h2 className="text-base font-bold text-white">Reading List</h2>
                </div>

                {/* Tab navigation */}
                <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
                    <button
                        onClick={() => setActiveTab('read')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            activeTab === 'read'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                    >
                        <BookOpen size={12} />
                        Read ({readArticles.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            activeTab === 'saved'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                    >
                        <BookMarked size={12} />
                        Saved ({savedArticles.length})
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {currentArticles.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
                        {activeTab === 'read' ? (
                            <>
                                <BookOpen size={40} className="text-slate-600 mb-2" />
                                <p className="text-sm text-slate-500">
                                    No articles read yet.<br />
                                    <span className="text-xs">Click the + button on articles to add them here!</span>
                                </p>
                            </>
                        ) : (
                            <>
                                <BookMarked size={40} className="text-slate-600 mb-2" />
                                <p className="text-sm text-slate-500">
                                    No articles saved for later.<br />
                                    <span className="text-xs">Double-click the + button to save articles!</span>
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    currentArticles.map((article, idx) => (
                        <div
                            key={article.url || idx}
                            className={`group p-3 border rounded-xl transition-all ${
                                activeTab === 'read'
                                    ? 'bg-slate-800/40 border-slate-700/40 hover:border-emerald-500/30'
                                    : 'bg-amber-900/10 border-amber-700/30 hover:border-amber-500/40'
                            }`}
                        >
                            <h3 className={`text-sm font-semibold mb-1 leading-tight transition-colors ${
                                activeTab === 'read'
                                    ? 'text-white group-hover:text-emerald-300'
                                    : 'text-amber-100 group-hover:text-amber-300'
                            }`}>
                                {article.title}
                            </h3>

                            <div className="flex items-center justify-between gap-2 mt-2">
                                <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                                    {(() => {
                                        try {
                                            return new URL(article.url).hostname;
                                        } catch {
                                            return 'Unknown';
                                        }
                                    })()}
                                </span>

                                <div className="flex items-center gap-1">
                                    {/* Move button */}
                                    {onMoveArticle && (
                                        <button
                                            onClick={() => handleMove(idx)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all border ${
                                                activeTab === 'read'
                                                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                                            }`}
                                            title={activeTab === 'read' ? 'Move to Saved' : 'Move to Read'}
                                        >
                                            {activeTab === 'read' ? (
                                                <>
                                                    <ArrowRight size={10} />
                                                    Save
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowLeft size={10} />
                                                    Read
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Delete button */}
                                    {onDeleteArticle && (
                                        <button
                                            onClick={() => handleDelete(idx)}
                                            className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="Remove article"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}

                                    {/* External link */}
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                                            activeTab === 'read'
                                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/10'
                                                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/10'
                                        }`}
                                    >
                                        Open
                                        <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReadingList;
