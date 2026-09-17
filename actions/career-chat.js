"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-2.5-flash" });
const CAREER_TOPIC = /\b(career|job|work|resume|cv|cover letter|interview|salary|compensation|skill|course|certif|promotion|network|linkedin|application|recruit|role|profession|industry|workplace)\b/i;

function fallbackAnswer(question, profile) {
  return `For your ${profile.industry || "career"} background, start by defining the target role and comparing its requirements with your current skills (${profile.skills?.join(", ") || "add skills to your profile"}). For “${question}”, use concrete examples and measurable outcomes in your resume, then practice explaining those examples in an interview. If you share the role and job description, I can help you tailor the next step.`;
}

export async function askCareerQuestion(question) {
  const text = String(question || "").trim();
  if (text.length < 4) throw new Error("Please enter a career-related question.");
  if (!CAREER_TOPIC.test(text)) {
    return { allowed: false, answer: "I focus only on careers: job search, resumes, cover letters, interviews, skills, courses, workplace growth, and industry trends. Please ask a question in one of those areas." };
  }

  const user = await requireUser();
  const profile = await db.user.findUnique({ where: { id: user.id }, select: { industry: true, skills: true, experience: true } });
  if (!profile) throw new Error("Your profile could not be found.");

  try {
    const result = await model.generateContent(`You are PathFinder Career Guide. Answer ONLY career, job-search, education-for-career, interview, resume, cover-letter, workplace, or industry questions. Be accurate, concise, practical, and transparent about uncertainty. Never invent vacancies, salaries, certifications, laws, or sources. Use this user context only when useful: industry=${profile.industry || "not set"}; experience=${profile.experience ?? "not set"}; skills=${profile.skills?.join(", ") || "not set"}. User question: ${text}`);
    return { allowed: true, answer: result.response.text().trim() };
  } catch (error) {
    console.error("Career chat generation failed:", error.message);
    return { allowed: true, answer: fallbackAnswer(text, profile) };
  }
}
