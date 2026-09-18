import { RecommendationList } from "@/components/career-tools";

export default function CourseRecommendationsPage() {
  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Course Recommendations</h1>
        <p className="page-subtitle">
          Find top-rated courses from Coursera, edX, Udemy, and more — matched to your learning goals and skill gaps.
        </p>
      </div>
      <RecommendationList type="courses" />
    </main>
  );
}