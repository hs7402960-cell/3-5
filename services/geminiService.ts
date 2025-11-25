import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a world-class Senior 3D Vision Engineer and Robotics Expert. 
Your specialty is Hand-Eye Calibration, Point Cloud Stitching, and 5-Axis CNC kinematics.
The user is a junior engineer asking for implementation details on mounting an RGB-D camera to a 5-axis laser head.

When answering:
1. Be highly technical but clear.
2. Use mathematical notation for transformations (e.g., T_base_tool).
3. Suggest specific algorithms (e.g., Tsai-Lenz for calibration, ICP for refinement).
4. Address the specific workflow: Calibration -> Trajectory -> Stitching.
`;

let aiInstance: GoogleGenAI | null = null;

const getAIClient = () => {
  if (aiInstance) return aiInstance;
  
  // Safe initialization
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in process.env");
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

export const getEngineeringAdvice = async (userPrompt: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 1024 } 
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
        return `Error: ${error.message}. Please check your API Key settings.`;
    }
    return "An error occurred while fetching advice. Please try again.";
  }
};