import { getResume } from "@/actions/resume";
import ResumeBuilder from "./_components/resume-builder";

export default async function ResumePage() {
  const resume = await getResume();

  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">My Resume</h1>
        <p className="page-subtitle">
          Build, edit, and optimize your resume. Get an ATS score and AI-powered suggestions for improvement.
        </p>
      </div>
      <ResumeBuilder initialContent={resume?.content} />
    </main>
  );
}
