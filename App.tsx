import React, { useState, useCallback, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { ResultsTable } from './components/ResultsTable';
import { analyzeReport } from './services/gemini';
import { Student, GradingResult, LoadingStatus } from './types';

// Default Data with Hakbeon format
const DEFAULT_STUDENT_LIST = `1101 김철수
1102 이영희
1103 박민수
1201 최지혜
1202 정우성
1203 강하늘`;

const DEFAULT_RUBRIC = `1. 탐구 질문의 명확성 (20점): 질문이 구체적이고 탐구 가능한가?
2. 자료 조사의 충실성 (30점): 다양한 자료를 활용하였는가?
3. 내용의 논리성 (30점): 근거를 들어 주장을 펼치고 있는가?
4. 표현의 창의성 (20점): 자신만의 생각이나 표현 방식이 있는가?

* 너그러운 평가: 학생의 잠재력을 칭찬하고, 작은 실수보다는 핵심 아이디어에 점수를 부여한다.`;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

function App() {
  const [apiKey, setApiKey] = useState('');
  const [studentListText, setStudentListText] = useState(DEFAULT_STUDENT_LIST);
  const [rubricText, setRubricText] = useState(DEFAULT_RUBRIC);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<GradingResult[]>([]);
  const [status, setStatus] = useState<LoadingStatus>(LoadingStatus.IDLE);
  const [processedCount, setProcessedCount] = useState(0);

  // Load API Key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const parseStudentList = (text: string): Student[] => {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(/\s+/);
        if (parts.length < 2) {
           return { className: '미배정', name: line };
        }
        
        const id = parts[0];
        const name = parts.slice(1).join(' ');

        // Check for Hakbeon (Student ID) format
        // 4 digits: GCNN (e.g. 1101 -> Grade 1 Class 1 No 01)
        // 5 digits: GCCNN (e.g. 11001 -> Grade 1 Class 10 No 01)
        
        let grade = '';
        let classNum = '';

        if (/^\d{4}$/.test(id)) {
           grade = id[0];
           classNum = id[1]; // 0-9
        } else if (/^\d{5}$/.test(id)) {
           grade = id[0];
           classNum = id.slice(1, 3); // 00-99
        }

        if (grade && classNum) {
          const classInt = parseInt(classNum, 10);
          return {
            className: `${grade}학년 ${classInt}반`,
            name: `${id} ${name}` // Keep ID in name for display/matching
          };
        }

        // Fallback: Use the first part as the class name if not a standard ID
        return { className: parts[0], name: parts.slice(1).join(' ') };
      });
  };

  const startAnalysis = useCallback(async () => {
    if (files.length === 0) return;
    if (!apiKey) {
      alert("API Key를 입력해주세요.");
      return;
    }

    setStatus(LoadingStatus.PROCESSING);
    setProcessedCount(0);
    setResults([]); // Clear previous results

    const students = parseStudentList(studentListText);

    // Process files one by one (or in small parallel batches) to avoid rate limits
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await fileToBase64(file);
        // analyzeReport now returns an Array of GradingResult
        const fileResults = await analyzeReport(
          apiKey,
          base64,
          file.type,
          file.name,
          students,
          rubricText
        );
        
        setResults(prev => [...prev, ...fileResults]);
      } catch (error) {
        console.error(`Failed to process ${file.name}`, error);
        setResults(prev => [...prev, {
          fileName: file.name,
          status: 'error',
          errorMessage: "Failed processing file",
          studentName: "Error",
          className: "Error",
          inquiryQuestion: "-",
          keyStrengths: "-",
          deductionReason: "-",
          totalScore: 0
        }]);
      }
      setProcessedCount(prev => prev + 1);
    }

    setStatus(LoadingStatus.COMPLETED);
  }, [files, studentListText, rubricText, apiKey]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight">Smart Grade AI</h1>
          </div>
          <div className="text-indigo-100 text-sm font-medium">
             Generous Grading System
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">보고서 채점 대시보드</h2>
          <p className="text-slate-600">
            손으로 쓴 보고서를 업로드하면 AI가 텍스트를 인식하고 루브릭에 맞춰 너그럽게 평가합니다.
            <br/>(PDF 하나에 여러 명의 학생 보고서가 포함되어 있어도 모두 찾아냅니다)
          </p>
        </div>

        <InputSection 
          apiKey={apiKey}
          setApiKey={handleApiKeyChange}
          studentListText={studentListText}
          setStudentListText={setStudentListText}
          rubricText={rubricText}
          setRubricText={setRubricText}
          files={files}
          setFiles={setFiles}
          onStartAnalysis={startAnalysis}
          status={status}
          processedCount={processedCount}
        />

        <ResultsTable results={results} />
      </main>
    </div>
  );
}

export default App;