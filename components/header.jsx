import React from "react";
import { Button } from "./ui/button";
import { BUTTONS_MENUS } from "@/lib/constants";
import {
  PenBox,
  LayoutDashboard,
  FileText,
  GraduationCap,
  ChevronDown,
  StarsIcon,
  LogOut,
} from "lucide-react";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { signOut } from "@/actions/auth";
import { checkUser } from "@/lib/checkUser";
import ThemSwitch from "./theme-switch";

export default async function Header() {
  const user = await checkUser();
  const isSignedIn = !!user;

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/skill.png"
            alt="Pathfinder Logo"
            width={800}
            height={200}
            priority
            className="h-20 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center space-x-2 md:space-x-4">
          {isSignedIn && (
            <>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="hidden md:inline-flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {BUTTONS_MENUS.DASHBOARD_INSIGHTS}
                </Button>
                <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <StarsIcon className="h-4 w-4" />
                    <span className="hidden md:block">{BUTTONS_MENUS.GROWTH_TOOLS}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/resume" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {BUTTONS_MENUS.BUILD_RESUME}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/ai-cover-letter"
                      className="flex items-center gap-2"
                    >
                      <PenBox className="h-4 w-4" />
                      {BUTTONS_MENUS.COVER_LETTER}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/interview" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {BUTTONS_MENUS.INTERVIEW_PREP}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <form action={signOut}>
                <Button type="submit" variant="outline" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </>
          )}

          {!isSignedIn && (
            <Link href="/sign-in">
              <Button variant="outline">{BUTTONS_MENUS.SIGN_IN}</Button>
            </Link>
          )}

          <ThemSwitch />
        </div>
      </nav>
    </header>
  );
}
