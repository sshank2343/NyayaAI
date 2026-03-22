// client/src/pages/Dashboard.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Scale, BookOpen } from 'lucide-react';
import api from '../services/api';

// Import our newly created components!
import ChatBox from '../components/ChatBox';
import CaseCard from '../components/CaseCard';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null); // Changed to an object to hold summary + cases
  const [isLoading, setIsLoading] = useState(false);
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Legal Intelligence System</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
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
    </div>
  );
};

export default Dashboard;