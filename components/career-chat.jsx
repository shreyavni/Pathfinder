"use client";

import { useState, useEffect, useRef } from "react";
import { askCareerQuestion } from "@/actions/career-chat";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCard as Card } from "@/components/ui/glass-card";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Send, Sparkles, Brain, Copy, Check } from "lucide-react";

const MessageBubble = ({ message, index }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div key={`${message.id || index}`} className="space-y-3 animate-fade-in-up">
      {/* User Question */}
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="text-sm font-medium">You</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">Your question</p>
          <p className="whitespace-pre-wrap text-foreground">{message.question}</p>
        </div>
      </div>

      {/* AI Answer */}
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
          <Brain className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-muted-foreground">Career Guide</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
              onClick={copyToClipboard}
              aria-label="Copy response"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
            {message.answer}
          </div>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-3 animate-fade-in-up">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
      <Brain className="h-4 w-4" />
    </div>
    <div className="flex items-center gap-1 p-3 rounded-lg bg-muted/40">
      <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

const SUGGESTED_QUESTIONS = [
  "How can I improve my ATS score?",
  "What skills should I learn for a data analyst role?",
  "How do I prepare for a behavioral interview?",
  "What's the best way to negotiate salary?",
  "Help me write a career summary for my resume",
  "What courses should I take to become a frontend developer?",
];

export default function CareerChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || loading) return;

    // Optimistically add user message
    const userMessage = { question: text, answer: "", id: Date.now() };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await askCareerQuestion(text, messages);
      setMessages((current) =>
        current.map((m) => (m.id === userMessage.id ? { ...m, answer: response.answer } : m))
      );
    } catch (error) {
      setMessages((current) =>
        current.map((m) =>
          m.id === userMessage.id
            ? { ...m, answer: error.message || "I could not answer that career question. Please try again." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(suggestion) {
    setQuestion(suggestion);
  }

  return (
    <ErrorBoundary>
      <GlassCard className="glass-card-hover flex flex-col h-[78vh] max-h-[78vh]">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Career Guidance Chat</CardTitle>
          </div>
          <CardDescription>
            Ask about jobs, resumes, interviews, skills, courses, workplace growth, ATS optimization, or industry trends.
            Your conversation history is remembered for context-aware answers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto scrollbar-thin space-y-6 p-4 pb-0">
          {messages.length === 0 && !loading ? (
            <div className="space-y-6">
              <EmptyState
                icon={Brain}
                title="Start a conversation"
                description="Ask me anything about your career journey — resume building, interview prep, skill gaps, job search strategy, or industry insights."
              />
              {/* Suggested Questions Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Suggested Questions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(q)}
                      className="text-left text-sm p-3 rounded-lg border border-border/60 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-colors duration-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble key={message.id || index} message={message} index={index} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Input Area */}
        <div className="border-t border-border/50 pt-4 mt-auto">
          <form onSubmit={submit} className="space-y-2">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: How can I tailor my resume for a senior data engineer role at a fintech company?"
              className="min-h-[100px] max-h-48 resize-none"
              disabled={loading}
              rows={3}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Powered by AI career coach • Your profile context is used for personalized advice
              </p>
              <Button type="submit" disabled={loading || !question.trim()} className="gap-2">
                {loading ? "Thinking..." : "Ask Career Guide"}
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </GlassCard>
    </ErrorBoundary>
  );
}