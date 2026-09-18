"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { 
  fetchWithRetry, 
  filterJobsByRelevance, 
  extractSalary, 
  extractLocation, 
  cleanText, 
  getCachedData, 
  setCachedData,
  filterCoursesByQuality 
} from "@/lib/scraper";

// Job search using public APIs and search engines
export async function searchJobs(options = {}) {
  const { targetRole = "", location = "", experience = "", limit = 10 } = options;
  
  const cacheKey = `jobs-${targetRole}-${location}-${experience}-${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const profile = await getCurrentUser();
  const userSkills = profile?.skills || [];
  const userIndustry = profile?.industry || "";
  const userExperience = profile?.experience || 0;

  const searchRole = targetRole || (userSkills.length > 0 ? userSkills[0] : "software engineer");
  const searchLocation = location || "Remote";

  try {
    // Use Google Custom Search or a job board API
    // For now, we'll use a search API approach
    const jobs = await searchViaJobAPIs(searchRole, searchLocation, userExperience, userIndustry);

    // CRITICAL: When targetRole is provided, weight title match much higher than skill match
    const filtered = filterJobsByRelevance(jobs, searchRole, userSkills, !!targetRole).slice(0, limit);

    setCachedData(cacheKey, filtered);
    return filtered;
  } catch (error) {
    console.error("Job search failed:", error);
    return getFallbackJobs(searchRole, searchLocation, userSkills);
  }
}

async function searchViaJobAPIs(role, location, experience, industry) {
  // In production, integrate with:
  // - JSearch API (RapidAPI) - aggregates LinkedIn, Indeed, Glassdoor
  // - Indeed Publisher API
  // - LinkedIn Jobs API
  // - Google Jobs API
  // - Adzuna API
  
  // For now, generate realistic mock data that matches the expected structure
  // This would be replaced with actual API calls
  
  const jobTemplates = [
    {
      titlePatterns: [
        `${role}`,
        `Senior ${role}`,
        `Lead ${role}`,
        `${role} - ${industry}`,
        `Remote ${role}`,
      ],
      companies: [
        "TechCorp Solutions", "DataFlow Inc", "CloudNine Systems", 
        "Apex Digital", "Vertex Labs", "Nexus Technologies",
        "Quantum Analytics", "Pinnacle Software", "Horizon Apps",
      ],
      skillsByRole: {
        "frontend": ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
        "backend": ["Node.js", "Python", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
        "fullstack": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
        "data": ["Python", "SQL", "Pandas", "Tableau", "Machine Learning", "Spark"],
        "devops": ["AWS", "Terraform", "Kubernetes", "CI/CD", "Prometheus", "Grafana"],
        "mobile": ["React Native", "Swift", "Kotlin", "Firebase", "TypeScript"],
        "ml": ["Python", "PyTorch", "TensorFlow", "MLOps", "Kubeflow", "MLflow"],
      },
    },
  ];

  const template = jobTemplates[0];
  const roleLower = role.toLowerCase();
  let relevantSkills = ["JavaScript", "TypeScript", "Problem Solving"];
  
  for (const [key, skills] of Object.entries(template.skillsByRole)) {
    if (roleLower.includes(key)) {
      relevantSkills = skills;
      break;
    }
  }

  // Also add user skills
  const allSkills = [...new Set([...relevantSkills, ...Array.from(new Set([...relevantSkills]))].slice(0, 8))];

  const jobs = template.titlePatterns.slice(0, 8).map((titlePattern, i) => {
    const company = template.companies[i % template.companies.length];
    const salaryMin = 80000 + Math.floor(Math.random() * 80000);
    const salaryMax = salaryMin + 30000 + Math.floor(Math.random() * 50000);
    
    return {
      title: titlePattern,
      company,
      location,
      salaryRange: `$${(salaryMin/1000).toFixed(0)}k - $${(salaryMax/1000).toFixed(0)}k`,
      description: `We are looking for a ${titlePattern} to join our ${industry || "technology"} team. You will work with ${relevantSkills.slice(0, 3).join(", ")} and other modern technologies. ${experience > 0 ? `${experience}+ years of experience preferred.` : ""}`,
      requirements: allSkills.slice(0, 6),
      applyLink: `https://jobs.example.com/apply/${company.toLowerCase().replace(/\s+/g, "-")}-${titlePattern.toLowerCase().replace(/\s+/g, "-")}`,
      source: "aggregated",
      postedDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      experienceLevel: experience > 5 ? "senior" : experience > 2 ? "mid" : "junior",
      jobType: "full-time",
      remote: location.toLowerCase().includes("remote"),
    };
  });

  return jobs;
}

function getFallbackJobs(role, location, skills) {
  return [
    {
      title: role,
      company: "Leading Tech Company",
      location,
      salaryRange: "Competitive",
      description: `Join our team as a ${role}. We value expertise in ${skills.slice(0, 3).join(", ")}.`,
      requirements: skills.slice(0, 5),
      applyLink: "https://example.com/jobs",
      source: "fallback",
      postedDate: new Date().toISOString(),
    },
  ];
}

// Course search using platform APIs
export async function searchCourses(options = {}) {
  const { learningGoal = "", skills = [], minRating = 4.5, limit = 8 } = options;
  
  const cacheKey = `courses-${learningGoal}-${skills.join(",")}-${minRating}-${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const courses = await searchCoursePlatforms(learningGoal, skills, minRating);
    const filtered = filterCoursesByQuality(courses, minRating).slice(0, limit);
    setCachedData(cacheKey, filtered);
    return filtered;
  } catch (error) {
    console.error("Course search failed:", error);
    return getFallbackCourses(learningGoal, skills);
  }
}

async function searchCoursePlatforms(learningGoal, skills, minRating) {
  // In production, integrate with:
  // - Coursera API
  // - edX API
  // - Udemy Affiliate API
  // - YouTube Data API for educational content
  // - Pluralsight API
  // - LinkedIn Learning API
  
  // Platform course templates
  const platforms = [
    {
      name: "Coursera",
      baseUrl: "https://www.coursera.org",
      courses: [
        { title: "Professional Certificate", skills: ["Data Analysis", "SQL", "Tableau", "Python"], level: "Beginner", duration: "6 months", rating: 4.8 },
        { title: "Specialization", skills: ["Machine Learning", "Python", "TensorFlow", "Deep Learning"], level: "Intermediate", duration: "4 months", rating: 4.9 },
        { title: "Professional Certificate", skills: ["Cloud Architecture", "AWS", "Terraform", "Kubernetes"], level: "Intermediate", duration: "5 months", rating: 4.7 },
        { title: "Specialization", skills: ["Full Stack Development", "React", "Node.js", "MongoDB"], level: "Beginner", duration: "7 months", rating: 4.8 },
      ],
    },
    {
      name: "edX",
      baseUrl: "https://www.edx.org",
      courses: [
        { title: "MicroMasters Program", skills: ["Data Science", "Python", "Statistics", "R"], level: "Advanced", duration: "12 months", rating: 4.7 },
        { title: "Professional Certificate", skills: ["Cybersecurity", "Network Security", "Ethical Hacking", "Compliance"], level: "Intermediate", duration: "8 months", rating: 4.6 },
        { title: "XSeries", skills: ["Product Management", "Agile", "User Research", "Analytics"], level: "Beginner", duration: "4 months", rating: 4.7 },
      ],
    },
    {
      name: "Udemy",
      baseUrl: "https://www.udemy.com",
      courses: [
        { title: "Complete Bootcamp", skills: ["Web Development", "React", "Node.js", "TypeScript", "PostgreSQL"], level: "Beginner", duration: "50 hours", rating: 4.7 },
        { title: "Masterclass", skills: ["System Design", "Microservices", "Kubernetes", "Distributed Systems"], level: "Advanced", duration: "20 hours", rating: 4.8 },
        { title: "Complete Guide", skills: ["DevOps", "CI/CD", "Docker", "GitHub Actions", "AWS"], level: "Intermediate", duration: "15 hours", rating: 4.6 },
      ],
    },
  ];

  const goalLower = learningGoal.toLowerCase();
  const skillSet = new Set(skills.map((s) => s.toLowerCase()));

  const courses = [];
  
  for (const platform of platforms) {
    for (const template of platform.courses) {
      // Calculate relevance
      let relevanceScore = 0;
      const templateSkillsLower = template.skills.map((s) => s.toLowerCase());
      
      // Match against learning goal
      if (goalLower) {
        const goalWords = goalLower.split(/\s+/);
        for (const word of goalWords) {
          if (templateSkillsLower.some((s) => s.includes(word)) || template.title.toLowerCase().includes(word)) {
            relevanceScore += 20;
          }
        }
      }
      
      // Match against user skills
      for (const skill of skillSet) {
        if (templateSkillsLower.some((s) => s.includes(skill))) {
          relevanceScore += 15;
        }
      }
      
      // Base relevance from rating
      relevanceScore += (template.rating - 4.0) * 50;

      courses.push({
        title: `${template.title} in ${template.skills[0]}`,
        provider: platform.name,
        platformUrl: platform.baseUrl,
        skills: template.skills,
        level: template.level,
        duration: template.duration,
        rating: template.rating,
        price: platform.name === "Udemy" ? "$19.99 - $129.99" : "Free to audit / Certificate fee",
        relevanceScore,
        description: `Master ${template.skills.slice(0, 3).join(", ")} with this ${template.level.toLowerCase()} level ${template.title.toLowerCase()} from ${platform.name}.`,
        url: `${platform.baseUrl}/search?query=${encodeURIComponent(template.title + " " + template.skills[0])}`,
      });
    }
  }

  return courses;
}

function getFallbackCourses(learningGoal, skills) {
  return [
    {
      title: `${learningGoal || "Professional"} Certificate`,
      provider: "Coursera / edX",
      skills: skills.slice(0, 4),
      level: "Intermediate",
      duration: "4-6 months",
      rating: 4.7,
      price: "Free to audit",
      relevanceScore: 80,
      description: `Build expertise in ${skills.slice(0, 3).join(", ")} for ${learningGoal || "career advancement"}.`,
      url: "https://www.coursera.org",
    },
  ];
}