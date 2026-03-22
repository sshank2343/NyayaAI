// client/src/components/Citation.jsx

import { BookOpen } from 'lucide-react';

const Citation = ({ section }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold mx-1">
      <BookOpen className="w-3 h-3" />
      {section}
    </span>
  );
};

export default Citation;