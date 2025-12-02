import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Student, GradingResult } from "../types";

// Changed to ARRAY type to support multiple students in one file
const RESPONSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING, description: "Name of the student identified in the report" },
      className: { type: Type.STRING, description: "Class name/number of the student (e.g. 1학년 1반)" },
      inquiryQuestion: { type: Type.STRING, description: "The main inquiry question or topic of the report" },
      keyStrengths: { type: Type.STRING, description: "Key strengths of the report (generous evaluation)" },
      deductionReason: { type: Type.STRING, description: "Reason for any point deductions, or 'None' if perfect" },
      totalScore: { type: Type.INTEGER, description: "Total score out of 100" },
    },
    required: ["studentName", "inquiryQuestion", "keyStrengths", "deductionReason", "totalScore"],
  }
};

export const analyzeReport = async (
  apiKey: string,
  base64Data: string,
  mimeType: string,
  fileName: string,
  studentList: Student[],
  rubric: string
): Promise<GradingResult[]> => {
  try {
    if (!apiKey) {
      throw new Error("API Key is missing. Please enter your Google Gemini API Key.");
    }

    // Initialize Gemini with the provided key
    const ai = new GoogleGenAI({ apiKey });

    const studentContext = studentList
      .map((s) => `- ${s.className} ${s.name}`)
      .join("\n");

    // Korean Prompt for multiple students processing
    const prompt = `
      당신은 학생들의 잠재력을 믿고 격려하는 따뜻하고 너그러운 선생님입니다.
      제공된 파일(PDF 또는 이미지)을 분석하여 포함된 **모든 학생**의 보고서를 채점하세요.

      [중요 요청사항]
      이 파일에는 **여러 명의 학생**의 보고서가 포함되어 있을 수 있습니다 (예: 페이지마다 다른 학생).
      문서의 처음부터 끝까지 모든 페이지를 꼼꼼히 확인하여, 발견되는 **모든 학생**에 대해 각각 채점 결과를 생성하세요.

      [수행 절차]
      1. **학생 식별 (전수 조사)**: 
         - 문서 내의 모든 페이지를 스캔하여 [학생 명단]에 있는 학생들을 모두 찾으세요.
         - 보고서에 적힌 이름, 학번, 필체를 확인하여 명단과 매칭하세요.
         - 한 명만 찾고 멈추지 마세요. 파일에 포함된 모든 학생을 리스트로 반환해야 합니다.
      
      [학생 명단]
      ${studentContext}

      2. **내용 분석 및 평가**: 각 학생의 보고서 내용을 텍스트로 인식하고 아래 [채점 기준]을 적용하세요.
      
      [채점 기준(루브릭)]
      ${rubric}

      [작성 지침]
      - **언어**: 모든 결과 값은 **한국어**로 작성하세요.
      - **점수 부여**: 매우 너그럽게 평가하세요. 학생의 노력과 장점을 최대한 반영하여 점수를 후하게 주세요.
      - **핵심 강점**: 구체적으로 칭찬하는 어조로 작성하세요.
      - **감점 사유**: 감점이 있다면 부드럽게 설명하고, 없다면 격려의 말을 적으세요.

      결과는 반드시 지정된 JSON 배열(Array) 형식으로 반환해야 합니다.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);
    
    // Ensure result is an array
    const resultsArray = Array.isArray(parsed) ? parsed : [parsed];

    if (resultsArray.length === 0) {
       // Return a dummy error result if valid JSON but empty array
       return [{
        fileName,
        status: 'error',
        errorMessage: "No students identified in the file.",
        studentName: "Unknown",
        className: "-",
        inquiryQuestion: "-",
        keyStrengths: "-",
        deductionReason: "-",
        totalScore: 0,
       }];
    }

    return resultsArray.map((result: any) => ({
      fileName,
      status: 'success',
      studentName: result.studentName || "Unknown",
      className: result.className || "Unknown",
      inquiryQuestion: result.inquiryQuestion,
      keyStrengths: result.keyStrengths,
      deductionReason: result.deductionReason,
      totalScore: result.totalScore,
    }));

  } catch (error) {
    console.error(`Error analyzing ${fileName}:`, error);
    return [{
      fileName,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      studentName: "Error",
      className: "-",
      inquiryQuestion: "-",
      keyStrengths: "-",
      deductionReason: "-",
      totalScore: 0,
    }];
  }
};