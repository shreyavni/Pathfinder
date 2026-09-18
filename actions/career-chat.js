"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const CAREER_TOPIC = /\b(career|job|work|resume|cv|cover letter|interview|salary|compensation|skill|course|certif|promotion|network|linkedin|application|recruit|role|profession|industry|workplace|ats|mock interview)\b/i;

function fallbackAnswer(question, profile) {
  return `For your ${profile.industry || "career"} background, start by defining the target role and comparing its requirements with your current skills (${profile.skills?.join(", ") || "add skills to your profile"}). For "${question}", use concrete examples and measurable outcomes in your resume, then practice explaining those examples in an interview. If you share the role and job description, I can help you tailor the next step.`;
}

export async function askCareerQuestion(question, conversationHistory = []) {
  const text = String(question || "").trim();
  if (text.length < 4) throw new Error("Please enter a career-related question.");
  if (!CAREER_TOPIC.test(text)) {
    return { allowed: false, answer: "I focus only on careers: job search, resumes, cover letters, interviews, skills, courses, workplace growth, and industry trends. Please ask a question in one of those areas." };
  }

  const user = await requireUser();
  const profile = await db.user.findUnique({ where: { id: user.id }, select: { industry: true, skills: true, experience: true, bio: true } });
  if (!profile) throw new Error("Your profile could not be found.");

  // Build conversation context
  const recentHistory = conversationHistory.slice(-6); // Last 3 exchanges
  const historyText = recentHistory.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

  try {
    const systemPrompt = `You are PathFinder Career Guide, an expert AI career coach. Your role is to provide accurate, concise, practical career advice grounded in the user's profile and conversation history.

USER PROFILE:
- Industry: ${profile.industry || "not set"}
- Experience: ${profile.experience ?? "not set"} years
- Skills: ${profile.skills?.join(", ") || "not set"}
- Bio: ${profile.bio || "not set"}

CONVERSATION HISTORY (most recent first):
${historyText || "No previous conversation."}

GUIDELINES:
1. Answer ONLY career-related questions (job search, resumes, cover letters, interviews, skills, courses, workplace growth, industry trends, ATS optimization, mock interviews).
2. Be accurate, concise, practical, and transparent about uncertainty.
3. Never invent vacancies, salaries, certifications, laws, or sources.
4. Use the user's profile context when useful to personalize advice.
5. Reference previous conversation context naturally when relevant.
6. If the user asks for something outside career scope, politely redirect.
7. Use structured, actionable responses with specific next steps when appropriate.

Current user question: ${text}`;

    const result = await model.generateContent(systemPrompt);
    return { allowed: true, answer: result.response.text().trim() };
  } catch (error) {
    console.error("Career chat generation failed:", error.message);
    return { allowed: true, answer: fallbackAnswer(text, profile) };
  }
}