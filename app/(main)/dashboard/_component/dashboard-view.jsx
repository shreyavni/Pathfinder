"use client";

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Brain,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BriefcaseBusiness,
  LineChart as LineChartIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";

const DashboardView = ({ insights }) => {
  // Transform salary data for the chart
  const salaryData = (insights.salaryRanges || []).map((range) => ({
    name: range.role,
    min: Number(range.min) / 1000,
    max: Number(range.max) / 1000,
    median: Number(range.median) / 1000,
    p25: range.min ? Number(range.min) / 1000 : null,
    p75: range.max ? Number(range.max) / 1000 : null,
  })).filter((range) => range.name && Number.isFinite(range.min) && Number.isFinite(range.median) && Number.isFinite(range.max));

  // Tech stack frequency data
  const techStackData = (insights.techStackFrequency || []).slice(0, 10).map((item, index) => ({
    name: item.name,
    frequency: item.frequency,
    fullName: item.name,
  }));

  // Hiring trajectory data
  const hiringData = (insights.hiringTrajectory || []).map((item) => ({
    month: item.month,
    volume: item.volume,
    yoyGrowth: item.yoyGrowth,
  }));

  const getDemandLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "very high":
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook?.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500", label: "Positive" };
      case "neutral":
        return { icon: Minus, color: "text-yellow-500", label: "Neutral" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500", label: "Negative" };
      default:
        return { icon: LineChartIcon, color: "text-gray-500", label: "Unknown" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(insights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(insights.marketOutlook).color;
  const outlookLabel = getMarketOutlookInfo(insights.marketOutlook).label;

  // Format dates using date-fns
  const lastUpdatedDate = insights.lastUpdated ? format(new Date(insights.lastUpdated), "MMM d, yyyy") : "Unknown";
  const nextUpdateDistance = insights.nextUpdate ? formatDistanceToNow(new Date(insights.nextUpdate), { addSuffix: true }) : "Unknown";

  // Calculate salary growth
  const salaryGrowth = salaryData.length >= 2
    ? ((salaryData[salaryData.length - 1].median - salaryData[0].median) / salaryData[0].median * 100).toFixed(1)
    : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}: ${item.value}K
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const HiringTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}: {item.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (!insights) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <GlassCard key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </GlassCard>
          ))}
        </div>
        <GlassCard>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </GlassCard>
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </GlassCard>
          <GlassCard>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="outline" className="text-sm">
            Last updated: {lastUpdatedDate}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Next refresh</span>
          <span className="font-medium">{nextUpdateDistance}</span>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <GlassCard className="glass-card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Outlook</CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{outlookLabel}</div>
              <Badge variant="outline" className={outlookColor.replace("text-", "border-").replace("text-", "text-")}>
                {insights.demandLevel} Demand
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next update {nextUpdateDistance}
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard className="glass-card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industry Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-green-500">
                +{insights.growthRate?.toFixed(1) || 0}%
              </div>
              <span className="text-xs text-muted-foreground">YoY projected</span>
            </div>
            <Progress value={Math.min(100, insights.growthRate || 0)} className="mt-2 h-1.5" />
          </CardContent>
        </GlassCard>

        <GlassCard className="glass-card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Level</CardTitle>
            <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{insights.demandLevel}</div>
              <div className={`h-2 w-16 rounded-full ${getDemandLevelColor(insights.demandLevel)}`} />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard className="glass-card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Median Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">
                ${salaryData[1] ? (salaryData[1].median / 1000).toFixed(0) : "—"}K
              </div>
              <span className={`text-xs ${salaryGrowth > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                {salaryGrowth > 0 ? `+${salaryGrowth}%` : "vs entry"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Mid-level median</p>
          </CardContent>
        </GlassCard>

        <GlassCard className="glass-card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {insights.topSkills?.slice(0, 5).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.topSkills?.length || 0} skills tracked
            </p>
          </CardContent>
        </GlassCard>
      </div>

      {/* Salary Ranges Chart */}
      <GlassCard className="glass-card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Salary Ranges by Role</CardTitle>
              <CardDescription>
                25th, 50th (median), and 75th percentile salaries in USD thousands
              </CardDescription>
            </div>
            {insights.dataSource && (
              <Badge variant="outline" className="text-xs">
                {insights.dataSource}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {salaryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${v}K`} />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  <Bar dataKey="min" fill="#94a3b8" name="25th Percentile" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="median" fill="#6366f1" name="Median (50th)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="max" fill="#475569" name="75th Percentile" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Salary data is being prepared. Refresh in a moment.
              </div>
            )}
          </div>
        </CardContent>
      </GlassCard>

      {/* Tech Stack Frequency & Hiring Trajectory */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tech Stack Frequency */}
        <GlassCard className="glass-card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>In-Demand Tech Stack</CardTitle>
                <CardDescription>
                  Frequency of skills in job postings (last 90 days)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {techStackData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={techStackData.reverse()} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{label}</p>
                              {payload.map((item) => (
                                <p key={item.name} className="text-sm flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                  {item.name}: {item.value}%
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="frequency"
                      fill="#6366f1"
                      name="Frequency %"
                      radius={[4, 0, 0, 4]}
                      maxBarSize={40}
                    >
                      {techStackData.map((entry, index) => (
                        <label key={index}>
                          {entry.frequency}%
                        </label>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Tech stack data loading...
                </div>
              )}
            </div>
          </CardContent>
        </GlassCard>

        {/* Hiring Volume Trajectory */}
        <GlassCard className="glass-card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hiring Volume Trend</CardTitle>
                <CardDescription>
                  Monthly job posting volume with YoY growth
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {hiringData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hiringData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={HiringTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 3 }}
                      name="Job Postings"
                    />
                    <Line
                      type="monotone"
                      dataKey="yoyGrowth"
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, strokeWidth: 2 }}
                      yAxisId="right"
                      name="YoY Growth %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Hiring trend data loading...
                </div>
              )}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Industry Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="glass-card-hover">
          <CardHeader>
            <CardTitle>Key Industry Trends</CardTitle>
            <CardDescription>Current trends shaping the industry</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.keyTrends?.map((trend, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <span className="text-sm mt-0.5 leading-relaxed">{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </GlassCard>

        <GlassCard className="glass-card-hover">
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider developing for career growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.recommendedSkills?.map((skill) => (
                <Badge key={skill} variant="outline" className="gap-1">
                  {skill}
                  <ArrowUpRight className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Emerging Roles */}
      {insights.emergingRoles && insights.emergingRoles.length > 0 && (
        <GlassCard className="glass-card-hover">
          <CardHeader>
            <CardTitle>Emerging Roles to Watch</CardTitle>
            <CardDescription>New and growing positions in this industry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.emergingRoles.map((role) => (
                <Badge key={role} variant="secondary" className="gap-1">
                  {role}
                  <TrendingUp className="h-3 w-3 text-green-500" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </GlassCard>
      )}
    </div>
  );
};

export default DashboardView;