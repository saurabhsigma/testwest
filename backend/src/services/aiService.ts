import groq from "../config/ai";
import { Question } from "../models/Question";

interface GenerateOptions {
  board: string;
  grade: number;
  subject: string;
  chapter: string;
  topic: string;
  subtopic?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  count: number;
  types: string[];
}

export async function generateQuestions(options: GenerateOptions) {
  const prompt = `Generate ${options.count} educational questions for:
Board: ${options.board}
Grade: ${options.grade}
Subject: ${options.subject}
Chapter: ${options.chapter}
Topic: ${options.topic}
${options.subtopic ? `Subtopic: ${options.subtopic}` : ""}
Difficulty: ${options.difficulty}
Allowed Types: ${options.types.join(", ")}

Format the output strictly as a JSON object with a "questions" key containing an array of objects.
Each question object should have these fields:
- type (one of: MCQ, MSQ, Fill in the blanks, Short answer)
- body (the question text)
- options (REQUIRED FOR MCQ/MSQ: This must be an array of exactly 4 strings. Example: ["Option A", "Option B", "Option C", "Option D"])
- answer (MCQ: index of correct string in options array [0,1,2, or 3]. MSQ: array of indices. Others: string)
- explanation (why it's correct)
- difficulty (${options.difficulty})
- board, grade, subject, chapter, topic, subtopic (same as input)

Return ONLY the valid JSON object.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content || "[]";
    const data = JSON.parse(content);
    
    // The response might be wrapped in a key or just the array
    const questions = Array.isArray(data) ? data : (data.questions || []);

    // Save to DB and return
    const created = await Question.insertMany(questions);
    return created;
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    const errorMessage = error.response?.data?.error?.message || error.message || "Failed to generate questions using AI";
    throw new Error(errorMessage);
  }
}
