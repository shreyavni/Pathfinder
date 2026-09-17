export function createFallbackIndustryInsights(industry) {
  const label = String(industry || "Career").replace(/-/g, " ");
  return {
    salaryRanges: [
      { role: `Junior ${label} Specialist`, min: 45000, median: 60000, max: 75000, location: "Market average" },
      { role: `${label} Specialist`, min: 65000, median: 85000, max: 105000, location: "Market average" },
      { role: `Senior ${label} Specialist`, min: 90000, median: 115000, max: 140000, location: "Market average" },
      { role: `${label} Lead`, min: 110000, median: 140000, max: 170000, location: "Market average" },
      { role: `${label} Manager`, min: 125000, median: 155000, max: 190000, location: "Market average" },
    ],
    growthRate: 5,
    demandLevel: "Medium",
    topSkills: [],
    marketOutlook: "Neutral",
    keyTrends: ["Industry insights are being refreshed with current market data."],
    recommendedSkills: [],
  };
}
