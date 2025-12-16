import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        const response = await ai.models.list();
        console.log("Response:", response);
        // for (const model of response.models) {
        //     console.log(`- ${model.name}`);
        // }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
