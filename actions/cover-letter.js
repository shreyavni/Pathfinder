"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function createFallbackLetter(data, user) {
  const skills = user.skills?.slice(0, 4).join(", ") || "relevant professional skills";
  return `Dear Hiring Team at ${data.companyName},

I am writing to express my interest in the ${data.jobTitle} position. With experience in ${user.industry || "my field"} and strengths in ${skills}, I am excited about the opportunity to contribute to ${data.companyName}.

My background has taught me to turn goals into clear, dependable results while collaborating closely with stakeholders. I would bring a ${data.tone || "professional"} approach, strong attention to detail, and a commitment to learning quickly from your team's priorities. The role's focus on ${data.jobDescription.slice(0, 220).replace(/\s+/g, " ")} especially appeals to me.

I would welcome the opportunity to discuss how my experience can support ${data.companyName}'s goals. Thank you for your time and consideration.

Sincerely,
${data.fullName}`;
}

export async function generateCoverLetter(data) {
  const user = await requireUser();

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!currentUser) throw new Error("User not found");

  const prompt = `
    Write a ${data.tone || "professional"} cover letter for a ${data.jobTitle} position at ${data.companyName
    }.

    Candidate Name: ${data.fullName || "The applicant"}
    Industry: ${currentUser.industry}
    Years of Experience: ${currentUser.experience}
    Skills: ${currentUser.skills?.join(", ")}
    Bio: ${currentUser.bio}

    Job Description:
    ${data.jobDescription}

    Requirements:
    - Tailor it to this job and company
    - Use a ${data.tone} tone
    - Max 400 words, markdown format
    - Highlight achievements with examples
    `;


  let content;
  try {
    const result = await model.generateContent(prompt);
    content = result.response.text().trim();
  } catch (error) {
    console.error("AI cover letter generation failed; using fallback:", error.message);
    content = createFallbackLetter(data, currentUser);
  }

  try {
    return await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: currentUser.id,
      },
    });
  } catch (error) {
    console.error("Error saving cover letter:", error.message);
    throw new Error("Unable to save the cover letter. Please try again.");
  }
}

export async function getCoverLetters() {
  const user = await requireUser();

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!currentUser) throw new Error("User not found");

  return await db.coverLetter.findMany({
    where: {
      userId: currentUser.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const user = await requireUser();

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!currentUser) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: currentUser.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const user = await requireUser();

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!currentUser) throw new Error("User not found");

  return await db.coverLetter.delete({
    where: {
      id,
      userId: currentUser.id,
    },
  });
}
