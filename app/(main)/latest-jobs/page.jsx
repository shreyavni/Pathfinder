import { RecommendationList } from "@/components/career-tools";

export default function LatestJobsPage() {
  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Latest Jobs</h1>
        <p className="page-subtitle">
          Discover job opportunities tailored to your skills and preferences. Search by role, location, and experience level.
        </p>
      </div>
      <RecommendationList type="jobs" />
    </main>
  );
}