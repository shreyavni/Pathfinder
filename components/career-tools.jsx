"use client";

import { useState } from "react";
import { toast } from "sonner";
import { analyzeResume, getCourseRecommendations, getJobMatches } from "@/actions/career-tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Check your ATS score</CardTitle>
          <CardDescription>Upload a PDF, DOCX, text, or Markdown resume—or paste its content—for an instant keyword and structure review.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <input type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" onChange={selectFile} />
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
            <Textarea value={resume} onChange={(event) => { setResume(event.target.value); setFile(null); }} placeholder="Or paste your resume here..." className="min-h-72" />
            <Input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Target job title (optional), e.g. Frontend Developer" />
            <Textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the job description (optional) for an ATS keyword match..." className="min-h-40" />
            <Button type="submit" disabled={loading}>{loading ? "Analyzing..." : "Check ATS Score"}</Button>
          </form>
        </CardContent>
      </Card>
      {result && <Card><CardHeader><CardTitle>ATS score: {result.score}/100</CardTitle><CardDescription>{result.wordCount} words · Sections found: {result.foundHeadings.join(", ") || "none"}</CardDescription></CardHeader><CardContent><ul className="list-disc space-y-2 pl-5">{result.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul></CardContent></Card>}
      {result && (result.keywordMatch !== null || result.targetRole) && <Card>
        <CardHeader>
          <CardTitle>Job-target match</CardTitle>
          <CardDescription>{result.keywordMatch !== null ? `${result.keywordMatch}% of detected target keywords appear in your resume.` : "Add a job description to compare role-specific keywords."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.targetRole && <p className="text-sm text-muted-foreground">Target role: {result.targetRole}</p>}
          {result.matchedKeywords.length > 0 && <div><h3 className="mb-1 font-medium">Matched keywords</h3><p className="text-sm text-muted-foreground">{result.matchedKeywords.join(", ")}</p></div>}
          {result.missingKeywords.length > 0 && <div><h3 className="mb-1 font-medium">Keywords to add if accurate</h3><p className="text-sm text-muted-foreground">{result.missingKeywords.join(", ")}</p></div>}
        </CardContent>
      </Card>}
    </div>
  );
}

export function RecommendationList({ type }) {
  const isCourses = type === "courses";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState("");
  const [location, setLocation] = useState("");

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
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{isCourses ? "Course recommendations" : "Job matches"}</CardTitle><CardDescription>{isCourses ? "Add a learning goal to receive courses tailored to your next career move." : "Add a target role and location for more precise role matches."}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Input value={target} onChange={(event) => setTarget(event.target.value)} placeholder={isCourses ? "Learning goal, e.g. become a data analyst" : "Target role, e.g. frontend developer"} />
          {!isCourses && <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Preferred location or Remote" />}
          <Button onClick={load} disabled={loading}>{loading ? "Finding matches..." : isCourses ? "Find Best Courses" : "Find Jobs"}</Button>
        </CardContent>
      </Card>
      {items.map((item) => <Card key={`${item.title}-${item.provider || item.company}`}><CardHeader><CardTitle className="text-xl">{item.title}</CardTitle><CardDescription>{item.provider || item.company} · {item.level || "Role match"}</CardDescription></CardHeader><CardContent className="space-y-3"><p>{item.reason}</p>{item.skills && <p className="text-sm text-muted-foreground">Relevant skills: {item.skills.join(", ")}</p>}{!isCourses && <a className="text-sm font-medium text-primary underline" target="_blank" rel="noreferrer" href={`https://www.google.com/search?q=${encodeURIComponent(`${item.title} jobs ${item.skills?.join(" ") || ""} ${location}`)}`}>Search current openings</a>}</CardContent></Card>)}
    </div>
  );
}
