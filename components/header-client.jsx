"use client";

import React, { useState, useRef, useEffect } from "react";
import { BUTTONS_MENUS } from "@/lib/constants";
import {
  PenBox,
  LayoutDashboard,
  FileText,
  GraduationCap,
  ChevronDown,
  StarsIcon,
  LogOut,
  Briefcase,
  BookOpen,
  Brain,
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/actions/auth";
import ThemSwitch from "./theme-switch";

const NAV_LINKS = [
  { href: "/resume", label: BUTTONS_MENUS.BUILD_RESUME, icon: FileText },
  { href: "/ai-cover-letter", label: BUTTONS_MENUS.COVER_LETTER, icon: PenBox },
  { href: "/interview", label: BUTTONS_MENUS.INTERVIEW_PREP, icon: GraduationCap },
  { href: "/latest-jobs", label: "Latest Jobs", icon: Briefcase },
  { href: "/course-recommendations", label: "Courses", icon: BookOpen },
  { href: "/career-guidance", label: "Career Guide", icon: Brain },
];

const triggerCls =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4";

export default function HeaderClient({ isSignedIn }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl z-50 supports-[backdrop-filter]:bg-background/50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/skill.png"
            alt="Pathfinder Logo"
            width={800}
            height={200}
            priority
            className="h-14 w-auto object-contain"
          />
        </Link>

        {isSignedIn ? (
          <div className="flex items-center space-x-2 md:space-x-3">
            <Link href="/dashboard" className="hidden md:inline-flex">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 px-4"
              >
                <LayoutDashboard className="h-4 w-4" />
                {BUTTONS_MENUS.DASHBOARD_INSIGHTS}
              </button>
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className={triggerCls}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label={BUTTONS_MENUS.GROWTH_TOOLS}
                onClick={() => setIsOpen(!isOpen)}
              >
                <StarsIcon className="h-4 w-4" />
                <span className="hidden md:block">{BUTTONS_MENUS.GROWTH_TOOLS}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-popover p-1 shadow-lg border animate-in fade-in-0 zoom-in-95">
                  {NAV_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {link.label}
                      </Link>
                    );
                  })}
                  <hr className="my-1 border-border" />
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>

            <ThemSwitch />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 px-4"
              >
                {BUTTONS_MENUS.SIGN_IN}
              </button>
            </Link>
            <ThemSwitch />
          </div>
        )}
      </nav>
    </header>
  );
}