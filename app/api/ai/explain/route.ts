// app/api/ai/explain/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured in .env.local" },
                { status: 500 },
            );
        }

        const { word, context, source } = await req.json();

        if (!word) {
            return NextResponse.json(
                { error: "Word is required" },
                { status: 400 },
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.6-flash",
            generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `
      You are a vocabulary and linguistic expert for a learning app called Leword.
      Explain the word or phrase: "${word}".
      ${context ? `Context where user encountered it: "${context}"` : ""}
      ${source ? `Source: "${source}"` : ""}

      Provide a clear, engaging explanation tailored to the context if available.

      Respond strictly with this JSON structure:
      {
        "word": "${word}",
        "partOfSpeech": "noun/verb/adjective/idiom/slang",
        "definition": "A concise, modern, easy-to-understand definition",
        "mnemonic": "A short, memorable 1-sentence mental hook or visual trick to never forget this word"
      }
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const parsedData = JSON.parse(text);

        return NextResponse.json(parsedData);
    } catch (error: any) {
        console.error("Gemini AI API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate AI explanation" },
            { status: 500 },
        );
    }
}
