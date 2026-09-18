"use server";

import { redirect } from "next/navigation";
import { signOutUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function signOut() {
  await signOutUser();
  revalidatePath("/", "layout");
  redirect("/");
}
