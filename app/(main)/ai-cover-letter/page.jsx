import { getCoverLetters } from "@/actions/cover-letter";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUTTONS_MENUS } from "@/lib/constants";
import CoverLetterList from "./_components/cover-letter-list";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();

  return (
    <main className="page-shell">
      <div className="page-header">
        <h1 className="page-title">My Cover Letters</h1>
        <p className="page-subtitle">
          Create and manage AI-generated cover letters tailored to specific jobs and companies.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between mb-6">
        <Link href="/ai-cover-letter/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {BUTTONS_MENUS.CREATE_NEW}
          </Button>
        </Link>
      </div>

      <CoverLetterList coverLetters={coverLetters} />
    </main>
  );
}
