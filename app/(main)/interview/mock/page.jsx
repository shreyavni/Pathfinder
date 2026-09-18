import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MockInterviewGenerator from "@/components/mock-interview-generator";

export default function MockInterviewPage() {
  return (
    <main className="page-shell">
      <div className="flex flex-col space-y-2 mx-2 mb-6">
        <Link href="/interview">
          <Button variant="ghost" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Interview Preparation
          </Button>
        </Link>

        <div>
          <h1 className="page-title">Mock Interview Generator</h1>
          <p className="page-subtitle">
            Generate tailored technical and behavioral interview questions with STAR rubrics and follow-up probes.
          </p>
        </div>
      </div>

      <MockInterviewGenerator />
    </main>
  );
}