import { getCurrentUser } from "@/lib/auth";

export const checkUser = async () => {
  return await getCurrentUser();
};
