"use client";

import { useState, useEffect } from "react";
import { generateMockInterview } from "@/actions/mock-interview";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCard as Card } from "@/components/ui/glass-card";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  HelpCircle,
  ChevronRight,
  Copy,
  Check,
  Star,
  Target,
  ClipboardCheck,
  ArrowLeft,
  Sparkles,
  FileText,
} from "lucide-react";

const SENIORITY_LEVELS = [
  { value: "junior", label: "Junior (0-2 years)" },
  { value: "mid", label: "Mid-level (2-5 years)" },
  { value: "senior", label: "Senior (5-8 years)" },
  { value: "lead", label: "Lead/Principal (8+ years)" },
  { value: "manager", label: "Engineering Manager" },
];

const COMPANY_DOMAINS = [
  { value: "fintech", label: "FinTech" },
  { value: "healthtech", label: "HealthTech" },
  { value: "ecommerce", label: "E-Commerce/Retail" },
  { value: "saas", label: "SaaS/B2B Software" },
  { value: "ai-ml", label: "AI/ML Platform" },
  { value: "crypto", label: "Crypto/Web3" },
  { value: "gaming", label: "Gaming/Entertainment" },
  { value: "edtech", label: "EdTech" },
  { value: "logistics", label: "Logistics/Supply Chain" },
  { value: "other", label: "Other" },
];

const RubricBadge = ({ level, children }) => {
  const colors = {
    excellent: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    good: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    needsImprovement: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
  return (
    <Badge variant="outline" className={colors[level]}>
      {level.charAt(0).toUpperCase() + level.slice(1)}: {children}
    </Badge>
  );
};

const QuestionCard = ({ question, index, type, onCopy, copiedId }) => (
  <div className="space-y-4 p-5 rounded-xl border border-border/60 bg-card/50">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{question.category}</Badge>
          {question.keyConcepts && (
            <div className="flex flex-wrap gap-1">
              {question.keyConcepts.slice(0, 3).map((concept, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {concept}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <p className="text-foreground font-medium leading-relaxed">{question.question}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
        onClick={() => onCopy(question.id || `q-${type}-${index}`)}
        aria-label="Copy question"
      >
        {copiedId === (question.id || `q-${type}-${index}`) ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>

    {type === "technical" && (
      <>
        <div className="pl-13 space-y-2 border-l-2 border-primary/20">
          <p className="text-sm font-medium text-muted-foreground">Key concepts to cover:</p>
          <div className="flex flex-wrap gap-2">
            {question.expectedConcepts.map((concept, i) => (
              <Badge key={i} variant="outline" className="text-xs">{concept}</Badge>
            ))}
          </div>
        </div>

        <div className="pl-13 space-y-2 border-l-2 border-primary/20">
          <p className="text-sm font-medium text-muted-foreground">Evaluation Rubric:</p>
          <div className="space-y-1">
            <RubricBadge level="excellent">{question.rubric.excellent}</RubricBadge>
            <RubricBadge level="good">{question.rubric.good}</RubricBadge>
            <RubricBadge level="needsImprovement">{question.rubric.needsImprovement}</RubricBadge>
          </div>
        </div>

        {question.followUpProbes && question.followUpProbes.length > 0 && (
          <div className="pl-13 space-y-2 border-l-2 border-primary/20">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Follow-up probes:
            </p>
            <ul className="space-y-1">
              {question.followUpProbes.map((probe, i) => (
                <li key={i} className="text-sm text-muted-foreground/80 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/50" /> {probe}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    )}

    {type === "behavioral" && (
      <>
        <div className="pl-13 space-y-3 border-l-2 border-purple-500/20">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <Star className="h-3 w-3" /> STAR Framework Guide:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Situation</p>
              <p className="text-xs text-muted-foreground mt-0.5">{question.starFramework.situation}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Task</p>
              <p className="text-xs text-muted-foreground mt-0.5">{question.starFramework.task}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Action</p>
              <p className="text-xs text-muted-foreground mt-0.5">{question.starFramework.action}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Result</p>
              <p className="text-xs text-muted-foreground mt-0.5">{question.starFramework.result}</p>
            </div>
          </div>
        </div>

        <div className="pl-13 space-y-2 border-l-2 border-purple-500/20">
          <p className="text-sm font-medium text-muted-foreground">Evaluation Rubric:</p>
          <div className="space-y-1">
            <RubricBadge level="excellent">{question.rubric.excellent}</RubricBadge>
            <RubricBadge level="good">{question.rubric.good}</RubricBadge>
            <RubricBadge level="needsImprovement">{question.rubric.needsImprovement}</RubricBadge>
          </div>
        </div>

        {question.followUpProbes && question.followUpProbes.length > 0 && (
          <div className="pl-13 space-y-2 border-l-2 border-purple-500/20">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Follow-up probes:
            </p>
            <ul className="space-y-1">
              {question.followUpProbes.map((probe, i) => (
                <li key={i} className="text-sm text-muted-foreground/80 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500/50" /> {probe}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    )}
  </div>
);

const GenerationForm = ({ onGenerate }) => {
  const [jobTitle, setJobTitle] = useState("");
  const [seniority, setSeniority] = useState("mid");
  const [companyDomain, setCompanyDomain] = useState("saas");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    setLoading(true);
    try {
      await onGenerate(jobTitle, seniority, jobDescription, companyDomain);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="glass-card-hover">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Generate Mock Interview</CardTitle>
        </div>
        <CardDescription>
          Create a tailored interview with technical scenarios, behavioral STAR questions, rubrics, and follow-up probes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Target Job Title
              </label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Backend Engineer"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Seniority Level
              </label>
              <Select value={seniority} onValueChange={setSeniority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select seniority" />
                </SelectTrigger>
                <SelectContent>
                  {SENIORITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Company Domain
              </label>
              <Select value={companyDomain} onValueChange={setCompanyDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_DOMAINS.map((domain) => (
                    <SelectItem key={domain.value} value={domain.value}>
                      {domain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Job Description (Optional)
            </label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description for even more tailored questions..."
              className="min-h-40 font-mono text-sm"
              rows={6}
            />
          </div>

          <Button type="submit" disabled={loading || !jobTitle.trim()} className="w-full sm:w-auto" size="lg">
            {loading ? "Generating..." : "Generate Interview"}
          </Button>
        </form>
      </CardContent>
    </GlassCard>
  );
};

const InterviewResults = ({ interview, onNew }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Mock Interview Generated</h2>
              <p className="text-muted-foreground">
                {interview.technicalQuestions.length} Technical Scenarios · {interview.behavioralQuestions.length} Behavioral (STAR)
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onNew} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            New Interview
          </Button>
        </div>

        <div className="space-y-6">
          <GlassCard className="glass-card-hover">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Technical Scenario Questions</CardTitle>
              </div>
              <CardDescription>
                3 domain-specific scenarios testing problem-solving, architecture, and technical judgment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {interview.technicalQuestions.map((q, i) => (
                <QuestionCard
                  key={q.id || `tech-${i}`}
                  question={q}
                  index={i}
                  type="technical"
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              ))}
            </CardContent>
          </GlassCard>

          <GlassCard className="glass-card-hover">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                <CardTitle>Behavioral Questions (STAR Framework)</CardTitle>
              </div>
              <CardDescription>
                2 competency-based questions with detailed STAR evaluation guides
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {interview.behavioralQuestions.map((q, i) => (
                <QuestionCard
                  key={q.id || `behav-${i}`}
                  question={q}
                  index={i}
                  type="behavioral"
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              ))}
            </CardContent>
          </GlassCard>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" onClick={onNew} className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Another
          </Button>
          <Button onClick={onNew} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Try Different Role
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default function MockInterviewGenerator() {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (jobTitle, seniority, jobDescription, companyDomain) => {
    try {
      const result = await generateMockInterview(jobTitle, seniority, jobDescription, companyDomain);
      setInterview(result);
    } catch (error) {
      console.error("Failed to generate interview:", error);
    }
  };

  const handleNew = () => {
    setInterview(null);
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6 animate-pulse">
          <GlassCard>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-44 w-full" />
            </CardContent>
          </GlassCard>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {interview ? (
        <InterviewResults interview={interview} onNew={handleNew} />
      ) : (
        <GenerationForm onGenerate={handleGenerate} />
      )}
    </div>
  );
}