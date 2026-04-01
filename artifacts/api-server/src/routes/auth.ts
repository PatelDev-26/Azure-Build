import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db, usersTable } from "@workspace/db";
import { sendOtpEmail } from "../lib/email";
import { z } from "zod/v4";

const router: IRouter = Router();
const SALT_ROUNDS = 10;

function publicUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email ?? null,
    age: u.age ?? null,
    role: u.role,
    avatarUrl: u.avatarUrl ?? null,
    bio: u.bio ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const RegisterBody = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers and underscores"),
  displayName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6),
  age: z.number().int().min(13).max(120).optional(),
  role: z.enum(["creator", "consumer"]).default("consumer"),
});

const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const ForgotPasswordBody = z.object({
  email: z.string().email(),
});

const VerifyOtpBody = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const ResetPasswordBody = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6),
});

const UpdateProfileBody = z.object({
  displayName: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
  age: z.number().int().min(13).max(120).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { username, displayName, email, password, age, role } = parsed.data;

  const existing = await db
    .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email })
    .from(usersTable)
    .where(or(eq(usersTable.username, username), eq(usersTable.email, email)))
    .limit(1);

  if (existing.length > 0) {
    const conflict = existing[0].username === username ? "Username" : "Email";
    res.status(409).json({ error: `${conflict} is already taken.` });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({ username, displayName, email, passwordHash, age, role })
    .returning();

  req.session.userId = user.id;
  res.status(201).json(publicUser(user));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }
  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  req.session.userId = user.id;
  res.json(publicUser(user));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("photoshare.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Session invalid" });
    return;
  }
  res.json(publicUser(user));
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A valid email is required." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email))
    .limit(1);

  if (!user) {
    res.json({ ok: true, message: "If this email exists, an OTP has been sent." });
    return;
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db
    .update(usersTable)
    .set({ otpCode: otp, otpExpiresAt: expiresAt })
    .where(eq(usersTable.id, user.id));

  try {
    await sendOtpEmail(parsed.data.email, otp);
  } catch (err) {
    req.log.error({ err }, "Failed to send OTP email");
  }

  req.log.info({ userId: user.id, otp }, "OTP generated (also shown here for dev fallback)");
  res.json({ ok: true, message: "If this email exists, an OTP has been sent." });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and 6-digit OTP are required." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email))
    .limit(1);

  if (!user || !user.otpCode || !user.otpExpiresAt) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  if (user.otpCode !== parsed.data.otp || user.otpExpiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  res.json({ ok: true });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email, OTP, and new password are required." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email))
    .limit(1);

  if (!user || !user.otpCode || !user.otpExpiresAt) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  if (user.otpCode !== parsed.data.otp || user.otpExpiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired OTP." });
    return;
  }

  if (user.passwordHash) {
    const sameAsCurrent = await bcrypt.compare(parsed.data.newPassword, user.passwordHash);
    if (sameAsCurrent) {
      res.status(400).json({ error: "New password must be different from your current password." });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, SALT_ROUNDS);

  await db
    .update(usersTable)
    .set({ passwordHash, otpCode: null, otpExpiresAt: null })
    .where(eq(usersTable.id, user.id));

  res.json({ ok: true });
});

router.put("/auth/profile", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.age !== undefined) updates.age = parsed.data.age;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update." });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.session.userId))
    .returning();

  res.json(publicUser(user));
});

export default router;
