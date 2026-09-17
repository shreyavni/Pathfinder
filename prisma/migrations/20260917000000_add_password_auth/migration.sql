-- Add password credentials for PathFinder's local session-based authentication.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
