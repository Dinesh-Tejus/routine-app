import React from 'react';
import { BookOpen, ExternalLink, Bookmark } from 'lucide-react';

const ReadingList = ({ notes = '' }) => {
    // Parse articles from notes string (format: "- Title: URL")
    const parseArticles = (text) => {
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
                return { title, url };
            })
            .filter(article => article !== null);
    };

    const articles = parseArticles(notes);

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    <Bookmark size={18} className="text-emerald-400" />
                    <h2 className="text-base font-bold text-white">Reading List</h2>
                </div>
                <p className="text-[10px] text-emerald-300/60 uppercase tracking-wider font-medium">Saved for later</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {articles.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
                        <BookOpen size={40} className="text-slate-600 mb-2" />
                        <p className="text-sm text-slate-500">Your reading list is empty.<br /><span className="text-xs">Find articles in the Finder and save them!</span></p>
                    </div>
                ) : (
                    articles.map((article, idx) => (
                        <div key={idx} className="group p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl hover:border-emerald-500/30 transition-all">
                            <h3 className="text-sm font-semibold text-white mb-1 leading-tight group-hover:text-emerald-300 transition-colors">
                                {article.title}
                            </h3>
                            <div className="flex items-center justify-between gap-2 mt-2">
                                <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{new URL(article.url).hostname}</span>
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/10"
                                >
                                    Check it out
                                    <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReadingList;
