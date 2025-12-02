import React, { useMemo } from 'react';
import { GradingResult } from '../types';

interface ResultsTableProps {
  results: GradingResult[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  
  // Group results by Class Name
  const groupedResults = useMemo(() => {
    const grouped: Record<string, GradingResult[]> = {};
    results.forEach(r => {
      const key = r.className || "Unassigned";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
    // Sort keys
    return Object.keys(grouped).sort().reduce((acc, key) => {
      acc[key] = grouped[key].sort((a, b) => a.studentName.localeCompare(b.studentName));
      return acc;
    }, {} as Record<string, GradingResult[]>);
  }, [results]);

  const copyToClipboard = (className: string) => {
    const classResults = groupedResults[className];
    // Create TSV content for Excel
    const header = "학생명\t탐구 질문\t핵심 강점\t감점/피드백\t총점";
    const rows = classResults.map(r => 
      `${r.studentName}\t${r.inquiryQuestion}\t${r.keyStrengths}\t${r.deductionReason}\t${r.totalScore}`
    ).join('\n');
    
    const content = `${header}\n${rows}`;
    navigator.clipboard.writeText(content).then(() => {
      alert(`${className} 성적이 클립보드에 복사되었습니다. 엑셀에 붙여넣기 하세요.`);
    });
  };

  if (results.length === 0) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">채점 결과 (Class Results)</h2>
      
      {(Object.entries(groupedResults) as [string, GradingResult[]][]).map(([className, classResults]) => (
        <div key={className} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-700">{className} ({classResults.length}명)</h3>
            <button 
              onClick={() => copyToClipboard(className)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              엑셀용 복사 (Copy Table)
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-3 w-32">학생명</th>
                  <th className="px-6 py-3">탐구 질문</th>
                  <th className="px-6 py-3">핵심 강점</th>
                  <th className="px-6 py-3">감점 이유 / 피드백</th>
                  <th className="px-6 py-3 w-20 text-center">총점</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classResults.map((result, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {result.studentName}
                      <div className="text-xs text-slate-400 font-normal mt-1 truncate max-w-[100px]" title={result.fileName}>{result.fileName}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs break-keep">{result.inquiryQuestion}</td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs break-keep">{result.keyStrengths}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs break-keep">{result.deductionReason}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{result.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};