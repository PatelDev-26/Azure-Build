import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, commentsTable, usersTable } from "@workspace/db";
import {
  CreateCommentBody,
  GetCommentsParams,
  GetCommentsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/comments", async (req, res): Promise<void> => {
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [comment] = await db.insert(commentsTable).values(parsed.data).returning();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, comment.userId));

  res.status(201).json({
    id: comment.id,
    imageId: comment.imageId,
    userId: comment.userId,
    username: user?.username ?? "unknown",
    displayName: user?.displayName ?? "Unknown",
    avatarUrl: user?.avatarUrl ?? null,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  });
});

router.get("/comments/:imageId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.imageId) ? req.params.imageId[0] : req.params.imageId;
  const params = GetCommentsParams.safeParse({ imageId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.imageId, params.data.imageId))
    .orderBy(commentsTable.createdAt);

  const userIds = [...new Set(comments.map((c) => c.userId))];
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(
        db.$count(usersTable.id) > 0
          ? eq(usersTable.id, userIds[0])
          : eq(usersTable.id, 0)
      )
    : [];

  const usersById: Record<number, typeof users[0]> = {};
  for (const u of users) {
    usersById[u.id] = u;
  }

  const result = await Promise.all(
    comments.map(async (c) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, c.userId));
      return {
        id: c.id,
        imageId: c.imageId,
        userId: c.userId,
        username: u?.username ?? "unknown",
        displayName: u?.displayName ?? "Unknown",
        avatarUrl: u?.avatarUrl ?? null,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      };
    })
  );

  res.json(GetCommentsResponse.parse(result));
});

export default router;
