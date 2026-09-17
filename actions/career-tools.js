"use server";

import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  // These parsers rely on Node/browser globals that must not be evaluated while
  // Next builds the client reference for the tool pages. Load them only when a
  // user actually submits an uploaded file.
  if (extension === "pdf") {
    // Import the parser implementation rather than the package entry point.
    // `pdf-parse`'s entry point attempts to load its bundled test PDF.
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

  const headings = ["summary", "profile", "experience", "work experience", "education", "skills", "technical skills", "projects", "certifications", "achievements"];
  const foundHeadings = headings.filter((heading) => new RegExp(`\\b${heading}\\b`, "i").test(text));
  const actionVerbs = ["led", "built", "developed", "improved", "managed", "created", "delivered", "increased", "reduced", "designed", "implemented", "optimized", "automated", "analyzed", "launched", "collaborated"];
  const foundVerbs = actionVerbs.filter((verb) => new RegExp(`\\b${verb}\\b`, "i").test(text));
  const metricMatches = text.match(/\b\d+(?:\.\d+)?\s*%|\$\s*\d+[\d,.]*|\b\d+[+,]\s*(?:users|customers|projects|hours|days|team members|people)?/gi) || [];
  const hasMetrics = metricMatches.length >= 2;
  const hasContact = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const normalizedResume = text.toLowerCase();
  const stopWords = new Set(["about", "after", "also", "and", "are", "been", "being", "between", "business", "candidate", "company", "customer", "description", "experience", "for", "from", "have", "into", "job", "looking", "main", "more", "our", "position", "required", "responsibilities", "role", "skill", "skills", "that", "the", "their", "this", "through", "under", "using", "with", "work", "years", "your"]);
  const sourceTerms = `${jobTitle} ${jobDescription}`.toLowerCase().match(/[a-z][a-z0-9+#.\-/]{2,}/g) || [];
  const targetTerms = [...new Set(sourceTerms.filter((term) => !stopWords.has(term)))].slice(0, 40);
  const escapedTerm = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matchedKeywords = targetTerms.filter((term) => new RegExp(`(^|[^a-z0-9])${escapedTerm(term)}([^a-z0-9]|$)`, "i").test(normalizedResume));
  const missingKeywords = targetTerms.filter((term) => !matchedKeywords.includes(term));
  const keywordMatch = targetTerms.length ? Math.round((matchedKeywords.length / targetTerms.length) * 100) : null;
  const structureScore = Math.min(20, foundHeadings.length * 3 + (foundHeadings.includes("experience") || foundHeadings.includes("work experience") ? 2 : 0));
  const achievementScore = Math.min(20, foundVerbs.length * 2 + Math.min(8, metricMatches.length * 2));
  const contactScore = hasContact ? (hasLinkedIn ? 10 : 8) : 0;
  const lengthScore = wordCount >= 250 && wordCount <= 1200 ? 10 : wordCount >= 150 ? 6 : 2;
  const targetScore = targetTerms.length ? Math.round((matchedKeywords.length / targetTerms.length) * 25) : 15;
  const score = Math.min(100, Math.round(structureScore + achievementScore + contactScore + lengthScore + targetScore + 25));
  const suggestions = [];

  if (!hasContact) suggestions.push("Add an email address and other clear contact details.");
  if (!foundHeadings.includes("summary")) suggestions.push("Add a concise professional summary tailored to your target role.");
  if (!foundHeadings.includes("skills")) suggestions.push("Include a dedicated skills section with role-specific keywords.");
  if (!hasMetrics) suggestions.push("Quantify at least two achievements with percentages, time saved, revenue, project scale, or other measurable outcomes.");
  if (foundVerbs.length < 3) suggestions.push("Start experience bullets with strong action verbs such as Built, Led, or Improved.");
  if (wordCount < 250) suggestions.push("Add enough role-relevant detail for an ATS to identify your responsibilities, tools, and achievements.");
  if (wordCount > 1200) suggestions.push("Tighten the resume to its most relevant accomplishments so important keywords are easy to find.");
  if (targetTerms.length && missingKeywords.length) suggestions.push(`Add relevant job-description terms where truthful, especially: ${missingKeywords.slice(0, 8).join(", ")}.`);
  if (jobTitle && !normalizedResume.includes(jobTitle.toLowerCase())) suggestions.push(`Consider naming the target role, “${jobTitle}”, in your summary when it accurately reflects your experience.`);
  if (!suggestions.length) suggestions.push("Your resume covers the key ATS signals. Tailor keywords for each job description before applying.");

  return { score, foundHeadings, suggestions, wordCount, matchedKeywords: matchedKeywords.slice(0, 15), missingKeywords: missingKeywords.slice(0, 15), keywordMatch, targetRole: jobTitle || null };
}

export async function getCourseRecommendations(options = {}) {
  const profile = await getProfile();
  const skills = profile.skills?.length ? profile.skills : ["professional skills"];
  const learningGoal = String(options.learningGoal || "").trim().slice(0, 200);

  try {
    const result = await model.generateContent(`Return JSON only: {"courses":[{"title":"string","provider":"string","reason":"string","level":"Beginner|Intermediate|Advanced"}]}. Suggest exactly 4 reputable online courses for a ${profile.industry || "general"} professional with skills ${skills.join(", ")}. Their learning goal is: ${learningGoal || "career advancement"}. Match every course directly to that goal and current skill level. Do not invent URLs.`);
    const courses = parseJson(result.response.text()).courses;
    if (Array.isArray(courses) && courses.length) return courses.slice(0, 4);
  } catch (error) {
    console.error("Course recommendation generation failed:", error);
  }

  return skills.slice(0, 4).map((skill) => ({
    title: `${skill} Professional Certificate`,
    provider: "Coursera / edX",
    level: "Intermediate",
    reason: `Strengthen your ${skill} capability for ${learningGoal || profile.industry || "your target industry"} roles.`,
  }));
}

export async function getJobMatches(options = {}) {
  const profile = await getProfile();
  const skills = profile.skills?.length ? profile.skills : ["career development"];
  const targetRole = String(options.targetRole || "").trim().slice(0, 200);
  const location = String(options.location || "").trim().slice(0, 100);

  try {
    const result = await model.generateContent(`Return JSON only: {"jobs":[{"title":"string","company":"string","reason":"string","skills":["string"]}]}. Suggest exactly 5 realistic job-role matches, not job listings, for a ${profile.industry || "general"} professional with ${profile.experience || 0} years of experience and skills ${skills.join(", ")}. Preferred role: ${targetRole || "not specified"}. Preferred location: ${location || "not specified"}. Rank the roles by fit and explain the exact skills that make each one suitable.`);
    const jobs = parseJson(result.response.text()).jobs;
    if (Array.isArray(jobs) && jobs.length) return jobs.slice(0, 5);
  } catch (error) {
    console.error("Job match generation failed:", error);
  }

  return skills.slice(0, 5).map((skill) => ({
    title: `${skill} Specialist`,
    company: "Companies hiring in your industry",
    reason: `This role uses your ${skill} experience and aligns with ${targetRole || profile.industry || "your profile"}${location ? ` opportunities in ${location}` : ""}.`,
    skills: [skill],
  }));
}
