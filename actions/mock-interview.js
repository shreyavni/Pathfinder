"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function parseJson(text) {
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned);
}

const fallbackInterview = (jobTitle, seniority, companyDomain, skills = []) => {
  const primarySkill = skills[0] || "core technologies";
  const secondarySkill = skills[1] || "system design";

  return {
    technicalQuestions: [
      {
        id: "tech-1",
        category: "Technical Scenario",
        question: `You're building a ${primarySkill} feature for a ${companyDomain} application. The stakeholder requirements are ambiguous and keep changing. How do you approach this situation to deliver a maintainable solution?`,
        expectedConcepts: [
          "Requirements clarification and stakeholder communication",
          "Iterative development with feedback loops",
          "Modular architecture for flexibility",
          "Documentation of decisions and trade-offs"
        ],
        rubric: {
          excellent: "Demonstrates structured approach: clarifies requirements, proposes MVP, designs for change, communicates trade-offs",
          good: "Mentions clarification and iterative approach but misses architectural considerations",
          needsImprovement: "Focuses only on coding without addressing ambiguity or stakeholder management"
        },
        followUpProbes: [
          "How would you handle a stakeholder who insists on a specific technical approach you disagree with?",
          "What metrics would you track to validate the feature meets business goals?"
        ],
        keyConcepts: ["Requirements Engineering", "Agile Development", "Software Architecture", "Stakeholder Management"]
      },
      {
        id: "tech-2",
        category: "Technical Scenario",
        question: `A critical ${secondarySkill} component works perfectly in your local environment but fails intermittently in production. Walk me through your debugging process.`,
        expectedConcepts: [
          "Systematic log analysis and correlation",
          "Environment parity verification (config, dependencies, data)",
          "Reproduction strategy: minimal reproducible case",
          "Monitoring and alerting for early detection"
        ],
        rubric: {
          excellent: "Structured debugging: compares environments, isolates variables, uses observability tools, proposes preventive measures",
          good: "Mentions logs and environment differences but lacks systematic isolation approach",
          needsImprovement: "Guesses solutions without data-driven investigation"
        },
        followUpProbes: [
          "How do you prevent this class of issue from recurring?",
          "What would you do if you cannot reproduce the issue locally?"
        ],
        keyConcepts: ["Debugging Methodology", "Observability", "DevOps", "Production Reliability"]
      },
      {
        id: "tech-3",
        category: "Technical Scenario",
        question: `You need to choose between two viable ${jobTitle} solutions: one uses established technology your team knows well, the other uses a newer approach with better long-term scalability. How do you decide?`,
        expectedConcepts: [
          "Decision matrix: requirements fit, team expertise, maintenance burden, scalability needs",
          "Risk assessment: technical debt, vendor lock-in, community support",
          "Proof of concept or spike to validate assumptions",
          "Team consensus and documentation of decision (ADR)"
        ],
        rubric: {
          excellent: "Uses structured evaluation framework, considers team context, proposes validation, documents decision",
          good: "Weighs pros/cons but misses team capability or long-term maintenance factors",
          needsImprovement: "Chooses based on personal preference or resume-driven development"
        },
        followUpProbes: [
          "How do you get buy-in from team members who prefer the other option?",
          "What would make you revisit this decision in 6 months?"
        ],
        keyConcepts: ["Technical Decision Making", "Architecture Trade-offs", "Team Dynamics", "Architecture Decision Records"]
      }
    ],
    behavioralQuestions: [
      {
        id: "behav-1",
        category: "Behavioral (STAR)",
        question: `Tell me about a time you had to deliver a complex ${jobTitle} project under a tight deadline. How did you prioritize and what was the outcome?`,
        starFramework: {
          situation: "Context: project scope, team size, deadline pressure, constraints",
          task: "Your specific role and responsibility",
          action: "Concrete steps you took: prioritization framework, stakeholder communication, technical decisions, trade-offs",
          result: "Quantifiable outcome: delivered on time, metrics improved, lessons learned"
        },
        rubric: {
          excellent: "Clear STAR structure with specific metrics, demonstrates ownership, proactive communication, and learning",
          good: "Follows STAR but lacks quantification or misses key actions taken",
          needsImprovement: "Vague situation, no clear ownership, or no measurable result"
        },
        followUpProbes: [
          "What would you do differently if faced with a similar situation?",
          "How did you communicate risks to stakeholders during the project?"
        ],
        keyConcepts: ["Project Management", "Prioritization", "Communication", "Delivery Under Pressure"]
      },
      {
        id: "behav-2",
        category: "Behavioral (STAR)",
        question: `Describe a situation where you disagreed with a senior team member or manager on a technical approach for a ${jobTitle} initiative. How did you handle it?`,
        starFramework: {
          situation: "The technical disagreement and its significance to the project",
          task: "Your position and why you believed it was better",
          action: "How you presented your case: data, prototypes, precedents, collaborative approach",
          result: "Resolution reached, team outcome, relationship maintained"
        },
        rubric: {
          excellent: "Respectful disagreement backed by evidence, seeks win-win, maintains relationship, learns from outcome",
          good: "Professional disagreement but may lack evidence or collaborative resolution",
          needsImprovement: "Avoids conflict, becomes defensive, or damages relationships"
        },
        followUpProbes: [
          "How do you ensure psychological safety when challenging ideas?",
          "What if the final decision went against your recommendation?"
        ],
        keyConcepts: ["Conflict Resolution", "Technical Leadership", "Influence Without Authority", "Team Collaboration"]
      }
    ]
  };
};

export async function generateMockInterview(jobTitle, seniority, jobDescription, companyDomain) {
  const user = await requireUser();
  const currentUser = await db.user.findUnique({
    where: { id: user.id },
    select: { industry: true, skills: true, experience: true },
  });

  if (!currentUser) throw new Error("User not found");

  const prompt = `
Generate a structured mock interview for a ${jobTitle} position.

CONTEXT:
- Job Title: ${jobTitle}
- Seniority Level: ${seniority}
- Company Domain: ${companyDomain}
- Job Description: ${jobDescription || "Not provided"}
- Candidate Industry: ${currentUser.industry || "general"}
- Candidate Experience: ${currentUser.experience || 0} years
- Candidate Skills: ${currentUser.skills?.join(", ") || "general"}

Return ONLY a JSON object with this exact structure:
{
  "technicalQuestions": [
    {
      "id": "tech-1",
      "category": "Technical Scenario",
      "question": "string - specific scenario question relevant to the role and domain",
      "expectedConcepts": ["string", "string", "string", "string"],
      "rubric": {
        "excellent": "string - detailed criteria for excellent answer",
        "good": "string - criteria for good answer",
        "needsImprovement": "string - what indicates a weak answer"
      },
      "followUpProbes": ["string", "string"],
      "keyConcepts": ["string", "string", "string"]
    }
  ],
  "behavioralQuestions": [
    {
      "id": "behav-1",
      "category": "Behavioral (STAR)",
      "question": "string - behavioral question using STAR framework",
      "starFramework": {
        "situation": "string - what to look for in Situation",
        "task": "string - what to look for in Task",
        "action": "string - what to look for in Action",
        "result": "string - what to look for in Result"
      },
      "rubric": {
        "excellent": "string",
        "good": "string",
        "needsImprovement": "string"
      },
      "followUpProbes": ["string", "string"],
      "keyConcepts": ["string", "string", "string"]
    }
  ]
}

REQUIREMENTS:
- Exactly 3 technical scenario questions specific to the job title, seniority, and company domain
- Exactly 2 behavioral questions using STAR framework
- Questions must be distinct and cover different competencies
- Technical questions should reflect real challenges in ${companyDomain} for ${seniority} ${jobTitle}
- Behavioral questions should test competencies relevant to this seniority level
- Rubrics must be specific and actionable
- Follow-up probes should be natural extensions
`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = parseJson(result.response.text());
    
    // Validate structure
    if (!Array.isArray(parsed.technicalQuestions) || parsed.technicalQuestions.length !== 3) {
      throw new Error("Invalid technical questions count");
    }
    if (!Array.isArray(parsed.behavioralQuestions) || parsed.behavioralQuestions.length !== 2) {
      throw new Error("Invalid behavioral questions count");
    }

    return parsed;
  } catch (error) {
    console.error("Mock interview generation failed:", error);
    return fallbackInterview(jobTitle, seniority, companyDomain, currentUser.skills);
  }
}

export async function saveMockInterviewSession(sessionData) {
  const user = await requireUser();
  // In a real implementation, this would save to a database
  // For now, return success
  return { success: true, sessionId: `session-${Date.now()}` };
}