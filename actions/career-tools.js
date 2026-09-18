"use server";

import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { evaluateATS } from "@/lib/ats-engine";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function getProfile() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      industry: null,
      skills: [],
      experience: null,
      bio: null,
    };
  }

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { industry: true, skills: true, experience: true, bio: true },
  });

  return profile || {
    industry: null,
    skills: [],
    experience: null,
    bio: null,
  };
}

function parseJson(text) {
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned);
}

async function extractResumeText({ resumeText, file }) {
  if (!file) return String(resumeText || "").trim();

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Please upload a resume smaller than 5 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (["txt", "md"].includes(extension)) return buffer.toString("utf8").trim();
  
  if (extension === "pdf") {
    const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
    return (await pdfParse(buffer)).text.trim();
  }
  if (extension === "docx") {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ buffer })).value.trim();
  }

  throw new Error("Upload a PDF, DOCX, TXT, or Markdown resume.");
}

export async function analyzeResume(input) {
  const text = await extractResumeText(input || {});
  const jobTitle = String(input?.jobTitle || "").trim().slice(0, 200);
  const jobDescription = String(input?.jobDescription || "").trim().slice(0, 12000);

  if (text.length < 80) {
    throw new Error("Paste or upload at least a short resume before checking its ATS score.");
  }

  const evaluation = await evaluateATS(text, jobTitle, jobDescription);

  const { totalScore, breakdown, metrics, keywords, formattingIssues, lineSuggestions } = evaluation;

  // Build user-facing suggestions from issues and suggestions
  const suggestions = [];
  if (formattingIssues.length) {
    suggestions.push(...formattingIssues);
  }
  if (metrics.metricsCount < 2) {
    suggestions.push("Add at least two quantified achievements (percentages, dollar amounts, or scale metrics).");
  }
  if (metrics.actionVerbsCount < 3) {
    suggestions.push("Start more bullet points with strong action verbs (e.g., Built, Led, Optimized, Spearheaded).");
  }
  if (metrics.foundHeadings.length < 3) {
    suggestions.push("Add standard section headings like Experience, Skills, and Education.");
  }
  if (keywords.missing.length > 0) {
    suggestions.push(`Consider adding these missing keywords where truthful: ${keywords.missing.slice(0, 8).join(", ")}.`);
  }
  if (jobTitle && !text.toLowerCase().includes(jobTitle.toLowerCase())) {
    suggestions.push(`Mention the target role "${jobTitle}" in your summary if it accurately reflects your experience.`);
  }
  if (!suggestions.length) {
    suggestions.push("Your resume scores well on ATS signals. Tailor keywords for each specific job description before applying.");
  }

  return {
    score: totalScore,
    breakdown,
    metrics,
    suggestions,
    wordCount: metrics.wordCount,
    matchedKeywords: keywords.matched,
    missingKeywords: keywords.missing,
    keywordMatch: keywords.matched.length > 0 ? Math.round((keywords.matched.length / (keywords.matched.length + keywords.missing.length)) * 100) : null,
    targetRole: jobTitle || null,
    lineSuggestions,
    formattingIssues,
  };
}

export async function getCourseRecommendations(options = {}) {
  const profile = await getProfile();
  const skills = profile.skills?.length ? profile.skills : ["professional skills"];
  const learningGoal = String(options.learningGoal || "").trim().slice(0, 200);
  const experience = profile.experience || 0;

  // Determine appropriate level based on experience
  const levelByExp = experience <= 2 ? "Beginner" : experience <= 5 ? "Intermediate" : "Advanced";

  try {
    const result = await model.generateContent(`Return JSON only: {"courses":[{"title":"string","provider":"string","reason":"string","level":"Beginner|Intermediate|Advanced","url":"string"}]}. Suggest exactly 4 reputable online courses for a ${profile.industry || "general"} professional with ${experience} years of experience and skills: ${skills.join(", ")}. Their learning goal is: "${learningGoal || "career advancement"}". Match every course directly to that goal, their current skill level, and their experience. Recommend courses at the ${levelByExp} level or appropriate for someone with ${experience} years of experience. Include realistic course URLs or platform names (Coursera, edX, Udemy, etc.).`);
    const courses = parseJson(result.response.text()).courses;
    if (Array.isArray(courses) && courses.length) return courses.slice(0, 4);
  } catch (error) {
    console.error("Course recommendation generation failed:", error);
  }

  return skills.slice(0, 4).map((skill) => ({
    title: `${skill} Professional Certificate`,
    provider: "Coursera / edX",
    level: levelByExp,
    reason: `Strengthen your ${skill} capability for ${learningGoal || profile.industry || "your target industry"} roles. Recommended at ${levelByExp} level for ${experience} years of experience.`,
    url: "https://www.coursera.org",
  }));
}

export async function getProfileSummary() {
  const profile = await getProfile();
  const parts = [];
  if (profile.industry) parts.push(profile.industry);
  if (profile.experience) parts.push(`${profile.experience} years experience`);
  if (profile.skills?.length) parts.push(`skills: ${profile.skills.join(", ")}`);
  if (profile.bio) parts.push(profile.bio);
  return parts.join(" · ") || "No profile details yet — complete onboarding for personalized results.";
}

export async function getJobMatches(options = {}) {
  const profile = await getProfile();
  const skills = profile.skills?.length ? profile.skills : ["career development"];
  const targetRole = String(options.targetRole || "").trim().slice(0, 200);
  const location = String(options.location || "").trim().slice(0, 100);
  const experience = profile.experience || 0;

  try {
    const result = await model.generateContent(`Return JSON only: {"jobs":[{"title":"string","company":"string","reason":"string","skills":["string"],"location":"string","salaryRange":"string"}]}. You are matching a ${profile.industry || "general"} professional with ${experience} years of experience and skills: ${skills.join(", ")}. The user has specified a TARGET ROLE: "${targetRole || "not specified"}" and TARGET LOCATION: "${location || "not specified"}". CRITICAL: Every job title in your response MUST be directly related to or closely match the target role "${targetRole}". Do NOT suggest generic roles based only on skills. Rank by how well the title and required skills match the target role. For each job, explain why this specific role fits the target role and the candidate's background. For salary ranges, provide realistic estimates based on ${experience} years of experience in the ${profile.industry || "general"} industry. Include location that matches the preferred location or is Remote/Hybrid when not specified.`);
    const jobs = parseJson(result.response.text()).jobs;
    if (Array.isArray(jobs) && jobs.length) return jobs.slice(0, 5);
  } catch (error) {
    console.error("Job match generation failed:", error);
  }

  // Fallback: prioritize target role over skills
  const fallbackTitle = targetRole || skills[0] || "Specialist";
  return Array.from({ length: 5 }, (_, i) => {
    const skill = skills[i % skills.length] || fallbackTitle;
    return {
      title: i === 0 ? fallbackTitle : `${fallbackTitle} / ${skill}`,
      company: "Companies hiring in your industry",
      reason: `This role directly matches your target role "${fallbackTitle}" and leverages your ${skill} experience. Suitable for ${experience} years of experience${location ? ` in ${location}` : ""}.`,
      skills: [skill, ...skills.slice(0, 3)],
      location: location || "Remote",
      salaryRange: "Market rate",
    };
  });
}