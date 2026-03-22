// client/src/components/ChatBox.jsx

import { Search, FileText } from 'lucide-react';

const ChatBox = ({ query, setQuery, handleSearch, isLoading }) => {
  return (
    <div className="flex flex-col p-6 border-r border-slate-200 bg-white h-full">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-500" />
        Case Description
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Describe the facts of your case, the charges, or the legal issue you are researching.
      </p>
      
      <textarea
        className="flex-1 w-full p-4 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
        placeholder="e.g., My client is accused of stealing a commercial vehicle under Section 379 IPC..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      <button
        onClick={handleSearch}
        disabled={isLoading || !query.trim()}
        className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
      >
        {isLoading ? (
          <span className="animate-pulse">Analyzing OpenNyAI Database...</span>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Find Precedents
          </>
        )}
      </button>
    </div>
  );
};

export default ChatBox;