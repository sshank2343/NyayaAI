// client/src/pages/Dashboard.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Scale, BookOpen, History, X, MessageSquarePlus, Trash2 } from 'lucide-react';
import api from '../services/api';

// Import our newly created components!
import ChatBox from '../components/ChatBox';
import CaseCard from '../components/CaseCard';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null); // Changed to an object to hold summary + cases
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResponse(null);

    try {
      const res = await api.post('/search', { text: query });
      setResponse({
        summary: res.data.response,
        retrievedCases: res.data.similar_cases || []
      });

      // Refresh history list so the latest chat appears immediately in the sidebar.
      const historyRes = await api.get('/search/history');
      setHistoryItems(historyRes.data.history || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setQuery('');
    setResponse(null);
    setHistoryError('');
    setIsHistoryOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('accessToken');
      navigate('/login');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    setIsHistoryLoading(true);
    setHistoryError('');

    try {
      const res = await api.get('/search/history');
      setHistoryItems(res.data.history || []);
    } catch (error) {
      setHistoryError(error.response?.data?.message || error.response?.data?.error || 'Failed to load history.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSelectHistory = (item) => {
    setQuery(item.query || '');
    setResponse({
      summary: item.response,
      retrievedCases: item.similarCases || []
    });
    setIsHistoryOpen(false);
  };

  const handleDeleteHistory = async (historyId) => {
    try {
      await api.delete(`/search/history/${historyId}`);
      setHistoryItems((prev) => prev.filter((item) => item._id !== historyId));
    } catch (error) {
      setHistoryError(error.response?.data?.message || error.response?.data?.error || 'Failed to delete history item.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Legal Intelligence System</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleNewChat} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600">
            <MessageSquarePlus className="w-4 h-4" /> New Chat
          </button>
          <button onClick={handleOpenHistory} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600">
            <History className="w-4 h-4" /> History
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* Left Column: Reusable ChatBox Component */}
        <div className="w-1/3">
          <ChatBox 
            query={query} 
            setQuery={setQuery} 
            handleSearch={handleSearch} 
            isLoading={isLoading} 
          />
        </div>

        {/* Right Column: AI Output */}
        <div className="w-2/3 flex flex-col bg-slate-50/50 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Synthesized Legal Research
          </h2>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <span className="animate-pulse">Retrieving vectors and drafting response...</span>
            </div>
          ) : response ? (
            <div className="space-y-6">
              {/* The AI Summary */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-700 leading-relaxed font-serif text-lg">
                {response.summary}
              </div>
              
              {/* The Retrieved Evidence (CaseCards) */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Supporting Precedents</h3>
                {response.retrievedCases.length > 0 ? response.retrievedCases.map((c, index) => (
                   <CaseCard 
                     key={index}
                     caseName={c.case_name}
                     year={c.year}
                     court={c.court}
                     snippet={c.matched_excerpts?.[0] || ''}
                     score={c.similarity_score}
                     courtType={c.court_type}
                     caseType={c.case_type}
                     bench={c.bench}
                     judges={c.judges}
                     petitioner={c.petitioner}
                     respondent={c.respondent}
                     citation={c.citation}
                     decisionDate={c.decision_date}
                     sourceUrl={c.source_url}
                     excerpts={c.matched_excerpts || []}
                   />
                )) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
                    No similar solved cases were returned for this query.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <Scale className="w-16 h-16 text-slate-300 mb-4" />
              <p>Your research results will appear here.</p>
            </div>
          )}
        </div>
        
      </main>

      {isHistoryOpen && (
        <>
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsHistoryOpen(false)} />
          <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-800">Your Chat History</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleNewChat} className="text-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
                  New Chat
                </button>
                <button onClick={() => setIsHistoryOpen(false)} className="text-slate-500 hover:text-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isHistoryLoading ? (
                <p className="text-sm text-slate-500">Loading history...</p>
              ) : historyError ? (
                <p className="text-sm text-red-600">{historyError}</p>
              ) : historyItems.length === 0 ? (
                <p className="text-sm text-slate-500">No chat history yet.</p>
              ) : (
                historyItems.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => handleSelectHistory(item)}
                    className="w-full text-left p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{item.query}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHistory(item._id);
                        }}
                        className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                        aria-label="Delete history item"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default Dashboard;