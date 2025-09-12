
import { GoogleGenAI, Type } from "@google/genai";
import { AITransaction } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this environment, we assume it's set.
  console.warn("API_KEY environment variable is not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const transactionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: "Transaction date in YYYY-MM-DD format. Infer the year if missing.",
      },
      description: {
        type: Type.STRING,
        description: "A concise description of the transaction.",
      },
      amount: {
        type: Type.NUMBER,
        description: "The transaction amount as a positive number.",
      },
      type: {
        type: Type.STRING,
        description: 'The type of transaction: "INCOME" for deposits/earnings, "EXPENSE" for withdrawals/payments, or "TRANSFER" for account transfers/card payments/other movements.',
      },
      category: {
        type: Type.STRING,
        description: "Category of the transaction (e.g., Food, Transportation, Shopping, etc.). Use 'Uncategorized' if unclear.",
      },
      account: {
        type: Type.STRING,
        description: "Account or card name if available in the data (e.g., '우리카드 카드의정석', '신한은행', etc.). Leave empty if not specified.",
      },
      reference: {
        type: Type.STRING,
        description: "Transaction reference number or approval code if available. Leave empty if not found.",
      },
      installmentMonths: {
        type: Type.NUMBER,
        description: "Number of installment months if this is an installment purchase (e.g., 3, 6, 12). Use 1 for one-time payments.",
      },
      isInterestFree: {
        type: Type.BOOLEAN,
        description: "Whether this is an interest-free installment. Set to true if mentioned as '무이자할부' or 'interest-free'.",
      },
    },
    required: ["date", "description", "amount", "type"],
  },
};

export const analyzeTransactionsFromFile = async (file: File): Promise<AITransaction[]> => {
  // CSV 파일인 경우 텍스트로 처리하여 토큰 사용량 최적화
  const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
  
  let prompt: string;
  let contentParts: any[];

  if (isCSV) {
    // CSV 파일을 텍스트로 읽어서 처리
    const csvText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    prompt = `
      You are an expert financial data parser. Analyze the following CSV data from a financial document.
      Extract all financial transactions from this CSV content. For each transaction, provide:
      - date: Transaction date in YYYY-MM-DD format
      - description: A concise description of the transaction
      - amount: The transaction amount as a positive number
      - type: "INCOME" for deposits/earnings, "EXPENSE" for withdrawals/payments, or "TRANSFER" for account transfers/card payments/other movements
      - category: Categorize the transaction (Food, Transportation, Shopping, Entertainment, etc.)
      - account: Extract account/card name if present in the data (e.g., '우리카드 카드의정석', '신한은행')
      - reference: Transaction reference number or approval code if available
      - installmentMonths: Number of installment months (default 1 for one-time payments)
      - isInterestFree: Whether this is an interest-free installment (look for '무이자' keywords)
      
      Pay special attention to account/card information in column headers or data values.
      The current year is ${new Date().getFullYear()}. Use this to infer the year for dates like '07/25' or 'Jul 25'.
      Format the output as a JSON array following the provided schema. Do not include any explanatory text, comments, or markdown formatting.
      Just return the raw JSON array.
      
      CSV Data:
      ${csvText}
    `;
    
    contentParts = [{ text: prompt }];
  } else {
    // 이미지, PDF 등은 기존 방식으로 처리
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    prompt = `
      You are an expert financial data parser. Analyze the following data from an image of a bank statement or financial document. 
      Extract all financial transactions. For each transaction, provide the date, description, amount, and classify it as 'INCOME', 'EXPENSE', or 'TRANSFER'. 
      - Use 'INCOME' for deposits, earnings, or money coming in
      - Use 'EXPENSE' for withdrawals, purchases, or money going out
      - Use 'TRANSFER' for account transfers, card payments, or other internal movements
      The current year is ${new Date().getFullYear()}. Use this to infer the year for dates like '07/25' or 'Jul 25'.
      Format the output as a JSON array following the provided schema. Do not include any explanatory text, comments, or markdown formatting.
      Just return the raw JSON array.
    `;
    
    contentParts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      },
    ];
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: contentParts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
      },
    });

    const jsonString = response.text.trim();
    // Gemini with responseSchema might still wrap the JSON in ```json ... ```
    const cleanedJsonString = jsonString.replace(/^```json\s*|```$/g, '').trim();
    
    const parsedData = JSON.parse(cleanedJsonString);

    // Basic validation
    if (!Array.isArray(parsedData)) {
      throw new Error("AI response is not a JSON array.");
    }
    
    // Further validation can be added here to check object properties
    return parsedData as AITransaction[];

  } catch (error) {
    console.error("Error analyzing transactions with Gemini API:", error);
    
    // 더 구체적인 오류 메시지 제공
    if (error instanceof Error) {
      if (error.message.includes('503') || error.message.includes('overloaded')) {
        throw new Error("AI 서비스가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도하거나 CSV 로컬 처리를 이용해주세요.");
      } else if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error("API 키가 유효하지 않습니다. 환경설정을 확인해주세요.");
      } else if (error.message.includes('429')) {
        throw new Error("API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.");
      } else if (error.message.includes('400')) {
        throw new Error("파일 형식이 지원되지 않거나 손상되었습니다. 다른 파일을 시도해주세요.");
      }
    }
    
    throw new Error("파일 분석에 실패했습니다. CSV 로컬 처리를 시도해보세요.");
  }
};
