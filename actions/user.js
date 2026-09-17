"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { createFallbackIndustryInsights } from "@/lib/industry-insights";

export async function updateUser(data) {
  const user = await requireUser();

  if (!data?.industry) throw new Error("Please select an industry");

  const fallbackInsights = createFallbackIndustryInsights(data.industry);

  try {
    const existingInsight = await db.industryInsight.findUnique({
      where: { industry: data.industry },
    });

    if (!existingInsight) {
      let insights = fallbackInsights;

      try {
        insights = await generateAIInsights(data.industry);
      } catch (error) {
        console.error("Could not generate industry insights:", error);
      }

      await db.industryInsight.upsert({
        where: { industry: data.industry },
        update: {},
        create: {
          industry: data.industry,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
        skills: data.skills || [],
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return updatedUser;
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile");
  }
}

export async function getUserOnboardingStatus() {
  const user = await requireUser();

  try {
    const currentUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        industry: true,
      },
    });

    if (!currentUser) throw new Error("User not found");

    return {
      isOnboarded: !!currentUser?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}
