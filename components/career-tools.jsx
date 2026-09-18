"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { analyzeResume, getCourseRecommendations, getJobMatches } from "@/actions/career-tools";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCard as Card } from "@/components/ui/glass-card";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Target,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  BookOpen,
  Briefcase,
} from "lucide-react";

const ScoreBadge = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (score >= 60) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-3xl font-bold ${getColor().replace("border", "").replace("bg-", "").replace("text-", "")}`}>
        {score}
      </span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getColor()}`}>
        {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work"}
      </span>
    </div>
  );
};

const BreakdownBar = ({ label, score, weight }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{score}/100</span>
    </div>
    <Progress value={score} className="h-2" />
    <p className="text-xs text-muted-foreground">Weight: {weight}%</p>
  </div>
);

const SuggestionCard = ({ suggestion, index }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/40 border border-border/50">
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <HelpCircle className="h-4 w-4" />
    </div>
    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{suggestion}</p>
  </div>
);

const LineSuggestionCard = ({ item, index }) => (
  <div className="space-y-3 p-4 rounded-lg bg-muted/40 border border-border/50">
    <div className="flex items-center gap-2">
      <Badge variant="secondary">{index + 1}</Badge>
      <span className="text-xs text-muted-foreground">Rewrite Suggestion</span>
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Original</p>
        <p className="text-sm text-muted-foreground/80 italic line-clamp-2">{item.original}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Issue</p>
        <p className="text-sm text-destructive/90 line-clamp-2">{item.issue}</p>
      </div>
    </div>
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Rewrite</p>
      <p className="text-sm text-foreground font-medium">{item.suggestedRewrite}</p>
    </div>
  </div>
);

const KeywordTags = ({ keywords, label, color, icon: Icon }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      {Icon && <Icon className={`h-4 w-4 ${color}`} />}
      <span>{label} ({keywords.length})</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {keywords.length === 0 ? (
        <span className="text-xs text-muted-foreground/60">None detected</span>
      ) : (
        keywords.map((kw, i) => (
          <Badge key={`${label}-${i}`} variant="outline" className="gap-1">
            {kw}
            {color.includes("green") && <CheckCircle className="h-3 w-3 text-green-500" />}
            {color.includes("amber") && <AlertCircle className="h-3 w-3 text-amber-500" />}
          </Badge>
        ))
      )}
    </div>
  </div>
);

export function AtsChecker() {
  const [resume, setResume] = useState("");
  const [file, setFile] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      setResult(await analyzeResume({ resumeText: resume, file, jobTitle, jobDescription }));
    } catch (error) {
      toast.error(error.message || "Unable to analyze the resume.");
    } finally {
      setLoading(false);
    }
  }

  function selectFile(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!/\.(pdf|docx|txt|md)$/i.test(selected.name)) {
      toast.error("Upload a PDF, DOCX, TXT, or Markdown resume.");
      return;
    }
    setFile(selected);
    setResume("");
  }

  if (loading) {
    return (
      <ErrorBoundary fallback={<div className="space-y-4">Analyzing resume...</div>}>
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
    <ErrorBoundary>
      <div className="space-y-6 max-w-4xl">
        <GlassCard className="glass-card-hover">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>ATS Resume Analyzer</CardTitle>
            </div>
            <CardDescription>
              Upload your resume (PDF, DOCX, TXT, MD) or paste content. Optionally add a target job title and description for keyword matching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Upload Resume
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                  onChange={selectFile}
                  className="w-full rounded-lg border border-border/60 bg-card/50 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:px-3 file:py-1 file:font-medium hover:file:bg-primary/20 transition-colors"
                />
                {file && (
                  <p className="mt-2 text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Or Paste Resume Content
                </label>
                <Textarea
                  value={resume}
                  onChange={(event) => { setResume(event.target.value); setFile(null); }}
                  placeholder="Paste your full resume text here..."
                  className="min-h-72 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Target Job Title (Optional)
                </label>
                <Input
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="e.g., Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Job Description (Optional)
                </label>
                <Textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the job description for precise keyword matching..."
                  className="min-h-40 font-mono text-sm"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto" size="lg">
                {loading ? "Analyzing..." : "Analyze ATS Score"}
              </Button>
            </form>
          </CardContent>
        </GlassCard>

        {result && (
          <ErrorBoundary>
            <div className="space-y-6">
              {/* Score Overview Card */}
              <GlassCard className="glass-card-hover">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>ATS Score</CardTitle>
                    <CardDescription>
                      Overall compatibility with Applicant Tracking Systems
                    </CardDescription>
                  </div>
                  <ScoreBadge score={result.score} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {result.breakdown.map((item) => (
                      <BreakdownBar
                        key={item.label}
                        label={item.label}
                        score={item.score}
                        weight={item.weight}
                      />
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <h4 className="text-sm font-medium mb-3">Resume Metrics</h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-center">
                      <div className="p-3 rounded-lg bg-muted/40">
                        <p className="text-2xl font-bold">{result.metrics.wordCount}</p>
                        <p className="text-xs text-muted-foreground">Words</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40">
                        <p className="text-2xl font-bold text-green-500">{result.metrics.metricsCount}</p>
                        <p className="text-xs text-muted-foreground">Quantified Metrics</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40">
                        <p className="text-2xl font-bold text-blue-500">{result.metrics.actionVerbsCount}</p>
                        <p className="text-xs text-muted-foreground">Action Verbs</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40">
                        <p className="text-2xl font-bold text-purple-500">{result.metrics.foundHeadings.length}</p>
                        <p className="text-xs text-muted-foreground">Sections Found</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>

              {/* Keywords Match Card */}
              {result.keywordMatch !== null && (
                <GlassCard className="glass-card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <CardTitle>Job-Target Keyword Match</CardTitle>
                    </div>
                    <CardDescription>
                      {result.keywordMatch}% of target keywords found in your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.targetRole && (
                      <p className="text-sm text-muted-foreground">
                        Target Role: <span className="font-medium text-foreground">{result.targetRole}</span>
                      </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <KeywordTags
                        keywords={result.matchedKeywords}
                        label="Matched Keywords"
                        color="green"
                        icon={CheckCircle}
                      />
                      <KeywordTags
                        keywords={result.missingKeywords}
                        label="Missing Keywords"
                        color="amber"
                        icon={AlertCircle}
                      />
                    </div>
                  </CardContent>
                </GlassCard>
              )}

              {/* AI Line-by-Line Rewrite Suggestions */}
              {result.lineSuggestions && result.lineSuggestions.length > 0 && (
                <GlassCard className="glass-card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle>AI Rewrite Suggestions</CardTitle>
                    </div>
                    <CardDescription>
                      Specific line improvements following the STAR method (Situation, Task, Action, Result)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.lineSuggestions.map((item, index) => (
                      <LineSuggestionCard key={index} item={item} index={index} />
                    ))}
                  </CardContent>
                </GlassCard>
              )}

              {/* Actionable Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <GlassCard className="glass-card-hover">
                  <CardHeader>
                    <CardTitle>Priority Improvements</CardTitle>
                    <CardDescription>
                      Address these items to increase your ATS score
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.suggestions.map((suggestion, index) => (
                      <SuggestionCard key={index} suggestion={suggestion} index={index} />
                    ))}
                  </CardContent>
                </GlassCard>
              )}

              {/* Formatting Issues */}
              {result.formattingIssues && result.formattingIssues.length > 0 && (
                <GlassCard className="glass-card-hover border-destructive/20 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      Formatting Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.formattingIssues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                        <p className="text-sm text-destructive/90">{issue}</p>
                      </div>
                    ))}
                  </CardContent>
                </GlassCard>
              )}
            </div>
          </ErrorBoundary>
        )}

        {!result && !loading && (
          <EmptyState
            icon={FileText}
            title="Ready when you are"
            description="Upload or paste your resume to get an instant ATS analysis with keyword matching, formatting checks, and AI-powered rewrite suggestions."
            action={
              <Button variant="outline" className="w-full sm:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            }
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export function RecommendationList({ type }) {
  const isCourses = type === "courses";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState("");
  const [location, setLocation] = useState("");
  const [profileSummary, setProfileSummary] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const { getProfileSummary } = await import("@/actions/career-tools");
        const summary = await getProfileSummary();
        if (!cancelled) setProfileSummary(summary);
      } catch {
        // Profile not required — silently skip
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const results = isCourses
        ? await getCourseRecommendations({ learningGoal: target })
        : await getJobMatches({ targetRole: target, location });
      setItems(results);
    } catch (error) {
      toast.error(error.message || "Unable to generate recommendations.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <GlassCard className="glass-card-hover">
          <CardHeader>
            <CardTitle>{isCourses ? "Course Recommendations" : "Job Matches"}</CardTitle>
            <CardDescription>
              {isCourses
                ? "Add a learning goal to receive courses tailored to your career move."
                : "Add a target role and location for precise role matches."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder={isCourses ? "Learning goal, e.g. become a data analyst" : "Target role, e.g. frontend developer"}
            />
            {!isCourses && (
              <Input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Preferred location or Remote"
              />
            )}
            <Button onClick={load} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Finding matches..." : isCourses ? "Find Best Courses" : "Find Jobs"}
            </Button>
          </CardContent>
        </GlassCard>

        {profileSummary && !profileLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span><span className="font-medium text-foreground">Your profile:</span> {profileSummary}</span>
          </div>
        )}

        {items.length === 0 && !loading && (
          <EmptyState
            icon={isCourses ? BookOpen : Briefcase}
            title={isCourses ? "No courses found yet" : "No job matches yet"}
            description="Enter a learning goal or target role above to get personalized recommendations."
          />
        )}

        {items.map((item) => (
          <GlassCard key={`${item.title}-${item.provider || item.company}`} className="glass-card-hover">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                {item.title}
                {item.level && (
                  <Badge variant="secondary" className="ml-2">
                    {item.level}
                  </Badge>
                )}
                {item.rating && (
                  <Badge variant="outline" className="ml-2 gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {item.rating}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {item.provider || item.company} · {item.location ? `${item.location} · ` : ""}{item.salaryRange || "Role match"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">{item.reason}</p>
              {item.skills && (
                <div className="flex flex-wrap gap-2">
                  {item.skills.map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              )}
              {!isCourses && (
                <a
                  className="text-sm font-medium text-primary underline hover:no-underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${item.title} jobs ${item.skills?.join(" ") || ""} ${location}`)}`}
                >
                  Search current openings <ArrowUpRight className="h-3 w-3 inline ml-1" />
                </a>
              )}
              {isCourses && item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary underline hover:no-underline"
                >
                  View course <ArrowUpRight className="h-3 w-3 inline ml-1" />
                </a>
              )}
            </CardContent>
          </GlassCard>
        ))}
      </div>
    </ErrorBoundary>
  );
}