import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "pathfinder_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_SECRET = process.env.AUTH_SECRET || "pathfinder-local-secret-change-me";

const encodeBase64Url = (value) =>
    Buffer.from(value)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

const decodeBase64Url = (value) =>
    Buffer.from(
        value.replace(/-/g, "+").replace(/_/g, "/") +
        "=".repeat((4 - (value.length % 4)) % 4),
        "base64"
    ).toString("utf8");

const signValue = (value) =>
    crypto.createHmac("sha256", AUTH_SECRET).update(value).digest("hex");

export function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, 100000, 64, "sha512")
        .toString("hex");

    return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
    if (!storedHash || typeof storedHash !== "string") {
        return false;
    }

    const [salt, hash] = storedHash.split(":");

    if (!salt || !hash) {
        return false;
    }

    const candidate = crypto
        .pbkdf2Sync(password, salt, 100000, 64, "sha512")
        .toString("hex");

    try {
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
    } catch {
        return false;
    }
}

export function createSessionCookieValue(userId) {
    const payload = {
        sub: userId,
        exp: Date.now() + SESSION_TTL_MS,
    };

    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signature = signValue(encodedPayload);

    return `${encodedPayload}.${signature}`;
}

export function parseSessionCookieValue(value) {
    if (!value || typeof value !== "string") {
        return null;
    }

    const [payloadPart, signaturePart] = value.split(".");

    if (!payloadPart || !signaturePart) {
        return null;
    }

    const expectedSignature = signValue(payloadPart);

    if (expectedSignature !== signaturePart) {
        return null;
    }

    try {
        const payload = JSON.parse(decodeBase64Url(payloadPart));

        if (!payload.sub || !payload.exp || Number(payload.exp) < Date.now()) {
            return null;
        }

        return { userId: payload.sub };
    } catch {
        return null;
    }
}

export async function setSessionCookie(userId) {
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, createSessionCookieValue(userId), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const session = parseSessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);

    if (!session) {
        return null;
    }

    const user = await db.user.findUnique({
        where: { id: session.userId },
    });

    if (!user) {
        await clearSessionCookie();
        return null;
    }

    return user;
}

export async function requireUser() {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    return user;
}

export async function signOutUser() {
    await clearSessionCookie();
}

export async function signInUser({ email, password }) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
        throw new Error("Email and password are required");
    }

    const user = await db.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
        throw new Error("Invalid email or password");
    }

    await setSessionCookie(user.id);
    return user;
}

export async function signUpUser({ name, email, password }) {
    const normalizedName = String(name || "").trim() || "Career Seeker";
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
        throw new Error("Email and password are required");
    }

    if (String(password).length < 8) {
        throw new Error("Password must be at least 8 characters long");
    }

    const existingUser = await db.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existingUser) {
        throw new Error("An account with that email already exists");
    }

    const user = await db.user.create({
        data: {
            name: normalizedName,
            email: normalizedEmail,
            clerkUserId: crypto.randomUUID(),
            passwordHash: hashPassword(password),
            skills: [],
        },
    });

    await setSessionCookie(user.id);
    return user;
}
