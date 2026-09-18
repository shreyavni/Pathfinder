import { AtsChecker } from "@/components/career-tools";

export default function AtsCheckerPage() {
  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">ATS Resume Checker</h1>
        <p className="page-subtitle">
          Get an AI-powered analysis of your resume against Applicant Tracking Systems with keyword matching, formatting health, and rewrite suggestions.
        </p>
      </div>
      <AtsChecker />
    </main>
  );
}