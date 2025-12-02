import React, { ChangeEvent } from 'react';
import { LoadingStatus } from '../types';

interface InputSectionProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  studentListText: string;
  setStudentListText: (text: string) => void;
  rubricText: string;
  setRubricText: (text: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  onStartAnalysis: () => void;
  status: LoadingStatus;
  processedCount: number;
}

export const InputSection: React.FC<InputSectionProps> = ({
  apiKey,
  setApiKey,
  studentListText,
  setStudentListText,
  rubricText,
  setRubricText,
  files,
  setFiles,
  onStartAnalysis,
  status,
  processedCount
}) => {
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const isProcessing = status === LoadingStatus.PROCESSING;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Left Column: Configuration */}
      <div className="space-y-6">
        
        {/* API Key Input */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 ring-1 ring-indigo-50">
          <h2 className="text-lg font-bold mb-3 flex items-center text-indigo-700">
            <span className="mr-2">🔑</span> API Key 설정
          </h2>
          <p className="text-sm text-slate-500 mb-3">
            Google Gemini API Key를 입력해주세요. 입력한 키는 브라우저에만 저장됩니다.
          </p>
          <input
            type="password"
            className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-mono"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-slate-800">
            1. 학생 명단 (Student List)
          </h2>
          <p className="text-sm text-slate-500 mb-2">
            형식: [학번] [이름] (줄바꿈으로 구분)<br/>
            예: 1101 강현우 (1학년 1반 1번 강현우)
          </p>
          <textarea
            className="w-full h-40 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            placeholder="1101 강현우&#10;1102 김철수&#10;1201 이영희..."
            value={studentListText}
            onChange={(e) => setStudentListText(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-slate-800">
            2. 평가 루브릭 (Rubric)
          </h2>
          <p className="text-sm text-slate-500 mb-2">
            평가 기준을 상세히 입력해주세요. (너그러운 평가 기준)
          </p>
          <textarea
            className="w-full h-40 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            placeholder="예: 창의성(30점), 논리성(30점), 완성도(40점)... 핵심 아이디어가 포함되면 만점을 부여한다."
            value={rubricText}
            onChange={(e) => setRubricText(e.target.value)}
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Right Column: File Upload & Action */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-3 text-slate-800">
            3. 보고서 업로드 (PDF/Image)
          </h2>
          <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-8 text-center hover:bg-slate-100 transition-colors relative">
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-slate-600 font-medium">
              {files.length > 0 
                ? `${files.length}개의 파일 선택됨` 
                : "파일을 클릭하거나 드래그하여 업로드하세요"}
            </p>
            <p className="text-xs text-slate-400 mt-2">PDF, JPG, PNG 지원</p>
          </div>
          
          {files.length > 0 && (
            <div className="mt-4">
               <ul className="text-xs text-slate-500 max-h-32 overflow-y-auto border p-2 rounded bg-slate-50">
                 {files.map((f, i) => (
                   <li key={i} className="truncate">{f.name}</li>
                 ))}
               </ul>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={onStartAnalysis}
              disabled={files.length === 0 || isProcessing || !apiKey}
              className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-lg transform transition-all 
                ${files.length === 0 || isProcessing || !apiKey
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95'}`}
            >
              {!apiKey ? "API Key를 입력해주세요" : isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  분석 중... ({processedCount}/{files.length})
                </span>
              ) : (
                "AI 채점 시작하기"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};