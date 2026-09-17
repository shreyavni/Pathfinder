# 🚀 PathFinder – AI-Powered Career Coach

> A **cutting-edge AI-driven career platform** that provides **personalized job recommendations, AI resume reviews, and real-time career insights** to help users land their dream job.

## ✨ Features

- **🤖 AI Career Advisor** - Get personalized career guidance powered by artificial intelligence
- **📄 Smart Resume Builder** - Create ATS-optimized resumes with AI assistance
- **💼 AI Cover Letter Generator** - Generate tailored cover letters for job applications
- **🎯 Mock Interview Practice** - Practice with AI-powered interview questions
- **📊 Industry Insights** - Real-time salary trends and market analysis
- **🔍 ATS Score Checker** - Analyze resume compatibility with applicant tracking systems
- **🎓 Course Recommendations** - AI-suggested learning paths based on career goals
- **💼 Job Matching** - Personalized job opportunities from top platforms

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Clerk
- **AI**: Google Gemini AI
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Clerk account
- Google AI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shreyavni/PathFinder.git
cd PathFinder
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
DATABASE_URL="your-postgresql-url"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
CLERK_SECRET_KEY="your-clerk-secret"
GEMINI_API_KEY="your-gemini-api-key"
```

4. **Set up database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
PathFinder/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable components
├── data/                  # Static data files
├── lib/                   # Utility functions
├── actions/               # Server actions
└── prisma/               # Database schema
```

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `GEMINI_API_KEY` | Google Gemini AI API key |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powering our AI features
- Clerk for authentication services
- Vercel for hosting and deployment
- The open-source community for amazing tools and libraries

---

**Built with 💡 by the PathFinder Team**