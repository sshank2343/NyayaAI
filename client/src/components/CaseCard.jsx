// client/src/components/CaseCard.jsx

import { Scale } from 'lucide-react';

const CaseCard = ({
  caseName,
  year,
  court,
  snippet,
  score,
  courtType,
  caseType,
  bench,
  judges,
  petitioner,
  respondent,
  citation,
  decisionDate,
  sourceUrl,
  excerpts = [],
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-500" />
            {caseName}
          </h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
            {court} • {year}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Similarity: {typeof score === 'number' ? score.toFixed(4) : 'N/A'}
          </p>
        </div>
      </div>
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 font-serif leading-relaxed italic">
        "{snippet}"
      </div>
      <div className="mt-3 text-xs text-slate-600 grid grid-cols-1 gap-1">
        <p><span className="font-semibold">Court Type:</span> {courtType || 'Unknown'}</p>
        <p><span className="font-semibold">Case Type:</span> {caseType || 'Unknown'}</p>
        <p><span className="font-semibold">Decision Date:</span> {decisionDate || 'Unknown'}</p>
        <p><span className="font-semibold">Bench:</span> {bench || 'Unknown'}</p>
        <p><span className="font-semibold">Judges:</span> {judges || 'Unknown'}</p>
        <p><span className="font-semibold">Parties:</span> {petitioner || 'Unknown'} vs {respondent || 'Unknown'}</p>
        <p><span className="font-semibold">Citation:</span> {citation || 'Unknown'}</p>
        {sourceUrl && sourceUrl !== 'Unavailable' ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
            View Full Judgment Source
          </a>
        ) : null}
      </div>
      {excerpts.length > 1 ? (
        <div className="mt-3 space-y-2">
          {excerpts.slice(1).map((text, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 font-serif leading-relaxed italic">
              "{text}"
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CaseCard;