import { redirect } from "next/navigation";
import { getCurrentUser, signUpUser } from "@/lib/auth";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const redirectTo = typeof params?.redirect === "string" && params.redirect.startsWith("/") && !params.redirect.startsWith("//")
    ? params.redirect
    : "/dashboard";

  if (user) {
    redirect(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">Create account</h1>
        <p className="mb-6 text-sm text-muted-foreground">Start building your career with PathFinder.</p>

        <form action={async (formData) => {
          'use server';
          const name = formData.get('name');
          const email = formData.get('email');
          const password = formData.get('password');
          try {
            await signUpUser({ name, email, password });
          } catch (error) {
            if (error.message === "An account with that email already exists") {
              redirect(`/sign-in?message=${encodeURIComponent("An account already exists for this email. Please sign in.")}&redirect=${encodeURIComponent(redirectTo)}`);
            }

            throw error;
          }
          redirect(redirectTo);
        }} className="space-y-4">
          <input name="name" type="text" required placeholder="Full name" className="w-full rounded-md border px-3 py-2" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-md border px-3 py-2" />
          <input name="password" type="password" required minLength={8} placeholder="Password" className="w-full rounded-md border px-3 py-2" />
          <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Create account</button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account? <a href="/sign-in" className="font-semibold text-primary">Sign in</a>
        </p>
      </div>
    </main>
  );
}
