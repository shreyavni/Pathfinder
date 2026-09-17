"use server";

import { redirect } from "next/navigation";
import { signOutUser } from "@/lib/auth";

export async function signOut() {
  await signOutUser();
  redirect("/");
}
