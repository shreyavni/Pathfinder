"use client";

import { useState } from "react";
import { askCareerQuestion } from "@/actions/career-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function CareerChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setLoading(true);
    try {
      const response = await askCareerQuestion(text);
      setMessages((current) => [...current, { question: text, answer: response.answer }]);
      setQuestion("");
    } catch (error) {
      setMessages((current) => [...current, { question: text, answer: error.message || "I could not answer that career question. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return <Card><CardHeader><CardTitle>Career guidance</CardTitle><CardDescription>Ask about jobs, resumes, interviews, skills, courses, workplace growth, or industry trends. This assistant does not answer unrelated questions.</CardDescription></CardHeader><CardContent className="space-y-5"><form onSubmit={submit} className="space-y-3"><Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: How can I tailor my resume for a junior data analyst role?" /><Button type="submit" disabled={loading}>{loading ? "Thinking..." : "Ask Career Guide"}</Button></form>{messages.map((message, index) => <div key={`${message.question}-${index}`} className="space-y-2 rounded-lg border p-4"><p className="font-medium">You: {message.question}</p><p className="whitespace-pre-wrap text-muted-foreground">Career Guide: {message.answer}</p></div>)}</CardContent></Card>;
}
