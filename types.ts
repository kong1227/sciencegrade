export enum LoadingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface Student {
  className: string;
  name: string;
}

export interface GradingResult {
  fileName: string;
  studentName: string;
  className: string;
  inquiryQuestion: string;
  keyStrengths: string;
  deductionReason: string;
  totalScore: number;
  rawText?: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface AnalysisRequest {
  file: File;
  base64: string;
}
