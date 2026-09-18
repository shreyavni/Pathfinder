import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Known standard resume section headings
export const STANDARD_HEADINGS = [
  "summary",
  "professional summary",
  "executive summary",
  "objective",
  "experience",
  "work experience",
  "professional experience",
  "employment history",
  "education",
  "academic history",
  "skills",
  "technical skills",
  "core competencies",
  "projects",
  "key projects",
  "certifications",
  "licenses",
  "achievements",
  "awards",
  "languages",
];

// Common soft and hard skills dictionary
export const COMMON_SKILLS = {
  hard: [
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "sql", "html", "css", "react", "next.js", "vue", "angular", "node.js", "express", "django", "flask", "spring boot", "fastapi", "postgresql", "mysql", "mongodb", "redis", "dynamodb", "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "git", "github", "gitlab", "graphql", "rest api", "grpc", "system design", "microservices", "unit testing", "jest", "cypress", "playwright", "tailwind css", "machine learning", "deep learning", "pytorch", "tensorflow", "pandas", "numpy", "scikit-learn", "data analysis", "tableau", "power bi", "agile", "scrum", "jira"
  ],
  soft: [
    "leadership", "communication", "problem solving", "collaboration", "teamwork", "time management", "adaptability", "critical thinking", "conflict resolution", "mentorship", "stakeholder management", "project management", "creativity", "strategic planning", "negotiation"
  ]
};

// High-impact action verbs
export const ACTION_VERBS = [
  "built", "developed", "architected", "engineered", "designed", "implemented", "scaled", "optimized", "spearheaded", "orchestrated", "launched", "reduced", "increased", "boosted", "maximized", "cut", "automated", "streamlined", "transformed", "led", "managed", "mentored", "revamped", "modernized", "delivered", "executed", "formulated", "established"
];

/**
 * Text Normalization & Structural Extraction
 */
export function parseResumeSections(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections = {};
  let currentSection = "header";
  sections[currentSection] = [];

  for (const line of lines) {
    const cleanLower = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    const isHeading = STANDARD_HEADINGS.some(
      (h) => cleanLower === h || (cleanLower.startsWith(h) && cleanLower.length < h.length + 5)
    );

    if (isHeading) {
      currentSection = cleanLower;
      if (!sections[currentSection]) sections[currentSection] = [];
    } else {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(line);
    }
  }

  return {
    rawLines: lines,
    sections,
    foundHeadings: Object.keys(sections).filter((k) => k !== "header"),
  };
}

/**
 * Cosine Similarity calculation between token vectors
 */
export function calculateCosineSimilarity(textA, textB) {
  const tokenize = (str) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  const freqA = {};
  const freqB = {};
  const vocabulary = new Set([...tokensA, ...tokensB]);

  tokensA.forEach((w) => (freqA[w] = (freqA[w] || 0) + 1));
  tokensB.forEach((w) => (freqB[w] = (freqB[w] || 0) + 1));

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  vocabulary.forEach((word) => {
    const countA = freqA[word] || 0;
    const countB = freqB[word] || 0;
    dotProduct += countA * countB;
    normA += countA * countA;
    normB += countB * countB;
  });

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Multi-Factor Scoring Engine
 */
export async function evaluateATS(resumeText, jobTitle = "", jobDescription = "") {
  const normalizedText = resumeText.toLowerCase();
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
  const { lines, sections, foundHeadings } = parseResumeSections(resumeText);

  // --- 1. Keyword & Skill Match (35%) ---
  const sourceTerms = `${jobTitle} ${jobDescription}`.toLowerCase().match(/[a-z][a-z0-9+#.\-/]{2,}/g) || [];
  const stopWords = new Set(["with", "and", "the", "for", "that", "this", "from", "have", "you", "are", "will", "our", "team", "work", "role", "looking"]);
  const targetKeywords = [...new Set(sourceTerms.filter((t) => !stopWords.has(t)))].slice(0, 35);

  const matchedKeywords = targetKeywords.filter((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalizedText);
  });
  const missingKeywords = targetKeywords.filter((t) => !matchedKeywords.includes(t));

  const keywordOverlapScore = targetKeywords.length
    ? (matchedKeywords.length / targetKeywords.length) * 100
    : 75;

  const semanticSimilarity = jobDescription
    ? calculateCosineSimilarity(resumeText, jobDescription) * 100
    : 80;

  const keywordSkillScore = Math.round(keywordOverlapScore * 0.6 + semanticSimilarity * 0.4);

  // --- 2. Format & Parsing Health (25%) ---
  const formattingIssues = [];
  let formatHealthPoints = 100;

  // Check for table indicators or multi-column spacing
  if (/\t|\s{5,}/.test(resumeText)) {
    formatHealthPoints -= 15;
    formattingIssues.push("Possible multi-column or table layout detected. Standard ATS parsers prefer linear text layout.");
  }

  // Missing essential standard sections
  const requiredSections = ["experience", "education", "skills"];
  const missingSections = requiredSections.filter((req) =>
    !foundHeadings.some((h) => h.includes(req))
  );
  if (missingSections.length > 0) {
    formatHealthPoints -= missingSections.length * 20;
    formattingIssues.push(`Missing standard section headings: ${missingSections.join(", ")}.`);
  }

  // Non-standard symbols or special unicode characters
  if (/[^\x00-\x7F\u2022\u2013\u2014]/g.test(resumeText)) {
    formatHealthPoints -= 10;
    formattingIssues.push("Non-standard characters or special symbols found. Use simple bullet points (•) and plain standard typography.");
  }

  const formatHealthScore = Math.max(0, formatHealthPoints);

  // --- 3. Quantifiable Impact & STAR Framework (20%) ---
  const metricMatches = resumeText.match(/\b\d+(?:\.\d+)?\s*%|\$\s*\d+[\d,.]*|\b\d+[+,]\s*(?:users|customers|projects|hours|days|team members|people|m|k)?/gi) || [];
  const verbMatches = ACTION_VERBS.filter((verb) =>
    new RegExp(`\\b${verb}\\b`, "i").test(normalizedText)
  );

  let impactPoints = 0;
  if (metricMatches.length >= 5) impactPoints += 50;
  else if (metricMatches.length >= 2) impactPoints += 30;
  else if (metricMatches.length === 1) impactPoints += 15;

  if (verbMatches.length >= 6) impactPoints += 50;
  else if (verbMatches.length >= 3) impactPoints += 30;
  else if (verbMatches.length > 0) impactPoints += 15;

  const quantifiableImpactScore = Math.min(100, impactPoints);

  // --- 4. Relevance & Brevity (20%) ---
  let brevityPoints = 100;
  if (wordCount < 200) brevityPoints -= 40;
  else if (wordCount < 350) brevityPoints -= 20;
  else if (wordCount > 1500) brevityPoints -= 30;
  else if (wordCount > 1000) brevityPoints -= 15;

  // Keyword stuffing check (over-repetition of any single word)
  const wordFreq = {};
  resumeText.toLowerCase().split(/\s+/).forEach((w) => {
    if (w.length > 3) wordFreq[w] = (wordFreq[w] || 0) + 1;
  });
  const maxRepetition = Math.max(...Object.values(wordFreq), 0);
  if (maxRepetition > wordCount * 0.05 && maxRepetition > 8) {
    brevityPoints -= 20;
    formattingIssues.push("Potential keyword stuffing detected. Ensure skills and terms fit naturally into achievements.");
  }

  const relevanceBrevityScore = Math.max(0, brevityPoints);

  // --- Total Composite Weighted Score ---
  const totalScore = Math.round(
    keywordSkillScore * 0.35 +
    formatHealthScore * 0.25 +
    quantifiableImpactScore * 0.20 +
    relevanceBrevityScore * 0.20
  );

  // Line-by-line rewrite suggestions using LLM where appropriate or structured rules
  let lineSuggestions = [];
  try {
    const prompt = `You are an expert ATS resume reviewer. Analyze this resume text and job requirement:
Job Title: ${jobTitle || "General Professional"}
Job Description: ${jobDescription || "Not provided"}

Resume Text:
${resumeText.slice(0, 3000)}

Return ONLY a JSON object:
{
  "lineSuggestions": [
    {
      "original": "exact weak line from resume",
      "issue": "why it needs improvement",
      "suggestedRewrite": "stronger, quantified, action-verb line following STAR method"
    }
  ],
  "categorizedErrors": {
    "formatting": ["issue 1"],
    "keywords": ["missing skill 1"],
    "impact": ["quantification tip 1"]
  }
}
Limit to top 3-4 specific line suggestions.`;

    const response = await model.generateContent(prompt);
    const cleaned = response.response.text().replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const parsed = JSON.parse(start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned);

    if (Array.isArray(parsed.lineSuggestions)) {
      lineSuggestions = parsed.lineSuggestions;
    }
  } catch (error) {
    console.error("AI line suggestion failed:", error.message);
  }

  return {
    totalScore,
    breakdown: [
      { score: keywordSkillScore, weight: 35, label: "Keyword & Skill Match" },
      { score: formatHealthScore, weight: 25, label: "Format & Parsing Health" },
      { score: quantifiableImpactScore, weight: 20, label: "Quantifiable Impact" },
      { score: relevanceBrevityScore, weight: 20, label: "Relevance & Brevity" },
    ],
    metrics: {
      wordCount,
      metricsCount: metricMatches.length,
      actionVerbsCount: verbMatches.length,
      foundHeadings,
    },
    keywords: {
      matched: matchedKeywords.slice(0, 15),
      missing: missingKeywords.slice(0, 15),
    },
    formattingIssues,
    lineSuggestions,
  };
}