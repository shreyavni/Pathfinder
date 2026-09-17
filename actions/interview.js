"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const fallbackQuiz = (industry, skills = []) => {
  const role = industry || "technical";
  const primarySkill = skills[0] || role;
  const secondarySkill = skills[1] || "the core technology";
  const scenarios = [
    [`A stakeholder request for a ${role} feature is ambiguous. What should you do first?`, "Clarify the user goal, acceptance criteria, constraints, and success metric before proposing a solution.", "requirements analysis"],
    [`A ${primarySkill} implementation works locally but fails in production. What is the best first investigation?`, "Compare logs, configuration, environment variables, and the smallest reproducible difference between environments.", "systematic debugging"],
    [`How should you choose between two viable ${role} solutions?`, "Evaluate both against requirements, reliability, maintainability, cost, and the team's constraints, then document the trade-off.", "technical trade-offs"],
    [`Before releasing a change that uses ${primarySkill}, what provides the strongest confidence?`, "Test the critical user flow, edge cases, and integration points against clear acceptance criteria.", "testing and validation"],
    [`A ${role} workflow becomes slow as usage grows. What is the most useful next step?`, "Measure the bottleneck with profiling or monitoring data before selecting and validating an optimization.", "performance analysis"],
    [`What is the safest approach when handling sensitive data in a ${role} project?`, "Apply least privilege, validate input, protect secrets, and review the data flow for exposure risks.", "security practices"],
    [`A teammate disagrees with your approach to ${secondarySkill}. How should you respond?`, "Share evidence and trade-offs, listen to their constraints, and agree on a testable decision with the team.", "collaboration"],
    [`Why is documentation important after solving a difficult ${role} problem?`, "It records the decision, assumptions, and operating steps so others can maintain and troubleshoot the solution.", "documentation"],
    [`What is a responsible way to deploy a high-impact ${role} change?`, "Use a staged rollout with monitoring, a rollback plan, and clear ownership of post-release checks.", "deployment safety"],
    [`After a ${role} incident is resolved, what should the team do next?`, "Run a blameless review, identify root causes and preventive actions, then track those actions to completion.", "incident improvement"],
  ];

  return scenarios.map(([question, correctAnswer, topic]) => {
    return {
      question,
      options: [
        correctAnswer,
        "Skip validation to deliver as quickly as possible.",
        "Use the same solution without considering the project context.",
        "Avoid sharing progress or assumptions with stakeholders.",
      ],
      correctAnswer,
      explanation: `This tests ${topic}, a distinct competency that interviewers expect in ${role} work.`,
    };
  });
};

const parseQuiz = (text) => {
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const quiz = JSON.parse(start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned);

  if (!Array.isArray(quiz.questions) || quiz.questions.length < 1) {
    throw new Error("The AI response did not include questions");
  }

  const seenQuestions = new Set();
  const questions = quiz.questions.filter(
    (question) =>
      typeof question.question === "string" &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.options.includes(question.correctAnswer) &&
      (() => {
        const normalized = question.question.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!normalized || seenQuestions.has(normalized)) return false;
        seenQuestions.add(normalized);
        return true;
      })()
  );

  if (questions.length < 1) throw new Error("The AI returned invalid questions");
  return questions.slice(0, 10);
};

export async function generateQuiz() {
  const user = await requireUser();

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!currentUser) throw new Error("User not found");

  const prompt = `
    Generate exactly 10 DISTINCT technical interview questions for a ${currentUser.industry
    } professional${currentUser.skills?.length ? ` with expertise in ${currentUser.skills.join(", ")}` : ""
    }.
    
    Each question should be multiple choice with 4 options. Every question must test a different skill, concept, scenario, or interview competency. Do not reword, repeat, or use variations of the same question. Cover a balanced range of relevant topics such as fundamentals, practical implementation, debugging, trade-offs, performance, security, collaboration, and project decisions when applicable.
    
    Return exactly 10 questions. Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const questions = parseQuiz(result.response.text());
    if (questions.length !== 10) throw new Error("The AI did not return 10 unique questions");
    return questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    return fallbackQuiz(currentUser.industry, currentUser.skills);
  }
}

export async function saveQuizResult(questions, answers, score) {
  const user = await requireUser();

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!currentUser) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${currentUser.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const user = await requireUser();

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!currentUser) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}
