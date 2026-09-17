import { Inngest } from "inngest";

// FIX: removed invalid `credentials` field — not a valid Inngest constructor option
export const inngest = new Inngest({
  id: "career-coach", // Unique app ID
  name: "Career Coach",
});
