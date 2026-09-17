import { redirect } from "next/navigation";
import { getCurrentUser, signInUser } from "@/lib/auth";

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const redirectTo = typeof params?.redirect === "string" && params.redirect.startsWith("/") && !params.redirect.startsWith("//")
    ? params.redirect
    : "/dashboard";
  const message = params?.message;

  if (user) {
    redirect(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">Sign in</h1>
        <p className="mb-6 text-sm text-muted-foreground">Welcome back to PathFinder.</p>
        {message && (
          <p className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {message}
          </p>
        )}

        <form action={async (formData) => {
          'use server';
          const email = formData.get('email');
          const password = formData.get('password');
          await signInUser({ email, password });
          redirect(redirectTo);
        }} className="space-y-4">
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-md border px-3 py-2" />
          <input name="password" type="password" required placeholder="Password" className="w-full rounded-md border px-3 py-2" />
          <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Sign in</button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Need an account? <a href={`/sign-up?redirect=${encodeURIComponent(redirectTo)}`} className="font-semibold text-primary">Create one</a>
        </p>
      </div>
    </main>
  );
}
