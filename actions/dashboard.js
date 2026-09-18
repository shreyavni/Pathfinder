"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createFallbackIndustryInsights } from "@/lib/industry-insights";
import { getIndustryInsights as getMarketInsights } from "@/lib/market-data";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const start = cleanedText.indexOf("{");
    const end = cleanedText.lastIndexOf("}");
    const insights = JSON.parse(start >= 0 && end >= start ? cleanedText.slice(start, end + 1) : cleanedText);

    const salaryRanges = Array.isArray(insights.salaryRanges)
      ? insights.salaryRanges
          .map((range) => ({ ...range, min: Number(range.min), median: Number(range.median), max: Number(range.max) }))
          .filter((range) => range.role && Number.isFinite(range.min) && Number.isFinite(range.median) && Number.isFinite(range.max))
      : [];

    if (!salaryRanges.length) throw new Error("No valid salary data returned");
    return { ...createFallbackIndustryInsights(industry), ...insights, salaryRanges };
  } catch (error) {
    console.error("Industry insight generation failed; using fallback data:", error.message);
    return createFallbackIndustryInsights(industry);
  }
};

export async function getIndustryInsights() {
  const user = await requireUser();

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
    include: {
      industryInsight: true,
    },
  });

  if (!currentUser) throw new Error("User not found");

  // FIX: guard against unonboarded user (industry is null)
  if (!currentUser.industry) {
    throw new Error("Please complete onboarding before viewing insights");
  }

  // Get real market data
  const marketData = await getMarketInsights(currentUser.industry);

  // Generate missing insights and repair records created while AI data was unavailable.
  if (!currentUser.industryInsight) {
    const insights = await generateAIInsights(currentUser.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: currentUser.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Merge with real market data
    return { ...industryInsight, ...marketData };
  }

  if (!Array.isArray(currentUser.industryInsight.salaryRanges) || !currentUser.industryInsight.salaryRanges.length) {
    const insights = await generateAIInsights(currentUser.industry);
    return db.industryInsight.update({
      where: { id: currentUser.industryInsight.id },
      data: { ...insights, nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
  }

  // Merge stored data with fresh market data
  return { ...currentUser.industryInsight, ...marketData };
}

export async function getSalaryComparison(industry, experience) {
  const { getSalaryPercentiles } = await import("@/lib/market-data");
  return getSalaryPercentiles(industry, experience);
}

export async function getTechStackTrends(industry) {
  const { getTechStackTrends } = await import("@/lib/market-data");
  return getTechStackTrends(industry);
}

export async function getHiringVelocity(industry) {
  const { getHiringVelocity } = await import("@/lib/market-data");
  return getHiringVelocity(industry);
}