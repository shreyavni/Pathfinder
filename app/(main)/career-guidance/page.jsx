import CareerChat from "@/components/career-chat";

export default function CareerGuidancePage() {
  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Career Guidance</h1>
        <p className="page-subtitle">
          Chat with your AI career coach for personalized advice on resumes, interviews, skill development, and career strategy.
        </p>
      </div>
      <CareerChat />
    </main>
  );
}