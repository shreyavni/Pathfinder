import { getAssessments } from "@/actions/interview";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { GlassCard, GlassCard as Card } from "@/components/ui/glass-card";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default async function InterviewPrepPage() {
  const assessments = await getAssessments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="page-title">Interview Preparation</h1>
        <Link href="/interview/mock">
          <Button className="gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Generate Mock Interview
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <PerformanceChart assessments={assessments} />
        <QuizList assessments={assessments} />
      </div>

      <GlassCard className="glass-card-hover">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Mock Interview Generator</CardTitle>
          </div>
          <CardDescription>
            Create tailored interview questions with technical scenarios, STAR behavioral questions, detailed rubrics, and follow-up probes based on your target role, seniority, and company domain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/interview/mock">
            <Button className="w-full sm:w-auto" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate New Mock Interview
            </Button>
          </Link>
        </CardContent>
      </GlassCard>
    </div>
  );
}