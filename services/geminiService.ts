
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
        description: 'The type of transaction, either "INCOME" or "EXPENSE".',
      },
    },
    required: ["date", "description", "amount", "type"],
  },
};

export const analyzeTransactionsFromFile = async (file: File): Promise<AITransaction[]> => {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = `
    You are an expert financial data parser. Analyze the following data from an image of a bank statement or financial document. 
    Extract all financial transactions. For each transaction, provide the date, description, amount, and classify it as 'INCOME' or 'EXPENSE'. 
    If a transaction is a withdrawal or payment, it is an 'EXPENSE'. If it's a deposit, it is an 'INCOME'.
    The current year is ${new Date().getFullYear()}. Use this to infer the year for dates like '07/25' or 'Jul 25'.
    Format the output as a JSON array following the provided schema. Do not include any explanatory text, comments, or markdown formatting.
    Just return the raw JSON array.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
        ],
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
    throw new Error("Failed to analyze the file. Please try again or check the file format.");
  }
};
