// Server-side web scraping utilities for job and course aggregation
// Uses fetch with anti-blocking headers, rate limiting, and error handling

export const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
];

export const DEFAULT_HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "max-age=0",
};

export class RateLimiter {
  constructor(requestsPerSecond = 2) {
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }

  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
    }
    this.lastRequest = Date.now();
  }
}

// Global rate limiters for different sources
export const rateLimiters = {
  linkedin: new RateLimiter(1),     // 1 req/sec for LinkedIn
  indeed: new RateLimiter(2),       // 2 req/sec for Indeed
  glassdoor: new RateLimiter(1),    // 1 req/sec for Glassdoor
  coursera: new RateLimiter(2),     // 2 req/sec for Coursera
  udemy: new RateLimiter(2),        // 2 req/sec for Udemy
  edx: new RateLimiter(2),          // 2 req/sec for edX
  youtube: new RateLimiter(3),      // 3 req/sec for YouTube
  default: new RateLimiter(3),      // 3 req/sec default
};

export function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function fetchWithRetry(url, options = {}, retries = 3, source = "default") {
  const limiter = rateLimiters[source] || rateLimiters.default;
  await limiter.wait();

  const headers = {
    ...DEFAULT_HEADERS,
    "User-Agent": getRandomUserAgent(),
    ...options.headers,
  };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer and retry
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
        if (response.status >= 500) {
          // Server error - retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

export function extractSalary(text) {
  // Match various salary formats: $100k, $100,000, 100k-150k, etc.
  const patterns = [
    /\$\s*\d+(?:,\d{3})*(?:\.\d+)?\s*[kK]?\s*(?:-|to)\s*\$\s*\d+(?:,\d{3})*(?:\.\d+)?\s*[kK]?/g,
    /\$\s*\d+(?:,\d{3})*(?:\.\d+)?\s*[kK]?/g,
    /\d+(?:,\d{3})*(?:\.\d+)?\s*[kK]\s*(?:-|to)\s*\d+(?:,\d{3})*(?:\.\d+)?\s*[kK]/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }
  }
  return null;
}

export function extractLocation(text) {
  // Common location patterns
  const locationPatterns = [
    /(?:in|at|location:?)\s+([A-Za-z\s,]+(?:,\s*[A-Z]{2})?)/gi,
    /(?:Remote|Hybrid|On-site)/gi,
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}\b/g, // City, ST
  ];

  for (const pattern of locationPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return cleanText(matches[0]);
    }
  }
  return "Location not specified";
}

export function parseJobCard(html, source) {
  // Generic job card parsing - to be specialized per source
  return {
    title: "",
    company: "",
    location: "",
    salary: null,
    link: "",
    requirements: [],
    source,
    scrapedAt: new Date().toISOString(),
  };
}

export function filterJobsByRelevance(jobs, targetRole, skills = [], targetRoleProvided = false) {
  const targetLower = targetRole.toLowerCase();
  const targetWords = targetLower.split(/\s+/).filter(Boolean);
  const skillSet = new Set(skills.map((s) => s.toLowerCase()));

  // When a target role is explicitly provided, weight title matches much higher
  const titleWeight = targetRoleProvided ? 200 : 50;
  const partialTitleWeight = targetRoleProvided ? 100 : 25;
  const skillWeight = targetRoleProvided ? 5 : 10;

  return jobs
    .map((job) => {
      const titleLower = job.title.toLowerCase();
      const descLower = (job.description || "").toLowerCase();

      let relevanceScore = 0;

      // Title match — primary signal when targetRole is provided
      if (titleLower.includes(targetLower)) {
        relevanceScore += titleWeight;
        // Bonus for exact title match (not just substring)
        if (titleLower === targetLower) relevanceScore += 100;
      } else if (targetWords.some((word) => titleLower.includes(word))) {
        relevanceScore += partialTitleWeight;
      }

      // Skill matches — secondary signal
      const matchedSkills = skills.filter((skill) =>
        titleLower.includes(skill.toLowerCase()) || descLower.includes(skill.toLowerCase())
      );
      relevanceScore += matchedSkills.length * skillWeight;

      // Recency bonus (if available)
      if (job.postedDate) {
        const daysSincePosted = (Date.now() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePosted < 7) relevanceScore += 15;
        else if (daysSincePosted < 30) relevanceScore += 5;
      }

      return { ...job, relevanceScore, matchedSkills };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Course-specific utilities
export function extractCourseRating(text) {
  const ratingMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*5/);
  return ratingMatch ? parseFloat(ratingMatch[1]) : null;
}

export function extractCourseDuration(text) {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i,
    /(\d+(?:\.\d+)?)\s*(?:weeks?|months?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export function filterCoursesByQuality(courses, minRating = 4.5) {
  return courses
    .filter((course) => {
      if (course.rating !== null && course.rating !== undefined) {
        return course.rating >= minRating;
      }
      return true; // Keep if no rating available
    })
    .sort((a, b) => {
      // Sort by rating desc, then by relevance
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingA !== ratingB) return ratingB - ratingA;
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });
}

// Cache for scraped data (in-memory, resets on server restart)
const scrapeCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function getCachedData(key) {
  const entry = scrapeCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

export function setCachedData(key, data) {
  scrapeCache.set(key, { data, timestamp: Date.now() });
}

export function clearCache() {
  scrapeCache.clear();
}