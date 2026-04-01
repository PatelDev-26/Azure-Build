import { Router, type IRouter } from "express";
import { eq, like, or, sql, desc, asc } from "drizzle-orm";
import { db, imagesTable, usersTable, commentsTable, ratingsTable } from "@workspace/db";
import {
  CreateImageBody,
  GetImagesQueryParams,
  GetImagesResponse,
  GetImageParams,
  GetImageResponse,
  DeleteImageParams,
  DeleteImageResponse,
  SearchImagesQueryParams,
  SearchImagesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildImageWithStats(image: typeof imagesTable.$inferSelect) {
  const [creator] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, image.creatorId));

  const [ratingAgg] = await db
    .select({
      avg: sql<string>`AVG(${ratingsTable.rating})`,
      count: sql<string>`COUNT(${ratingsTable.id})`,
    })
    .from(ratingsTable)
    .where(eq(ratingsTable.imageId, image.id));

  const [commentAgg] = await db
    .select({
      count: sql<string>`COUNT(${commentsTable.id})`,
    })
    .from(commentsTable)
    .where(eq(commentsTable.imageId, image.id));

  return {
    id: image.id,
    url: image.url,
    thumbnailUrl: image.thumbnailUrl ?? null,
    title: image.title,
    caption: image.caption ?? null,
    location: image.location ?? null,
    tags: image.tags ?? [],
    creatorId: image.creatorId,
    creatorUsername: creator?.username ?? "unknown",
    creatorDisplayName: creator?.displayName ?? "Unknown",
    averageRating: ratingAgg?.avg ? parseFloat(ratingAgg.avg) : null,
    ratingCount: Number(ratingAgg?.count ?? 0),
    commentCount: Number(commentAgg?.count ?? 0),
    createdAt: image.createdAt.toISOString(),
  };
}

router.get("/images", async (req, res): Promise<void> => {
  const query = GetImagesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { limit = 20, offset = 0, creatorId } = query.data;

  let imagesQuery = db.select().from(imagesTable).orderBy(desc(imagesTable.createdAt));
  let countQuery = db.select({ count: sql<string>`COUNT(*)` }).from(imagesTable);

  if (creatorId) {
    const creatorIdNum = parseInt(String(creatorId), 10);
    imagesQuery = imagesQuery.where(eq(imagesTable.creatorId, creatorIdNum)) as typeof imagesQuery;
    countQuery = countQuery.where(eq(imagesTable.creatorId, creatorIdNum)) as typeof countQuery;
  }

  const images = await imagesQuery.limit(limit).offset(offset);
  const [{ count }] = await countQuery;

  const withStats = await Promise.all(images.map(buildImageWithStats));

  res.json(GetImagesResponse.parse({ images: withStats, total: Number(count) }));
});

router.post("/images", async (req, res): Promise<void> => {
  const parsed = CreateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [image] = await db
    .insert(imagesTable)
    .values({
      url: parsed.data.url,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      title: parsed.data.title,
      caption: parsed.data.caption ?? null,
      location: parsed.data.location ?? null,
      tags: parsed.data.tags ?? [],
      creatorId: parsed.data.creatorId,
    })
    .returning();

  const withStats = await buildImageWithStats(image);
  res.status(201).json(withStats);
});

router.get("/images/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetImageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [image] = await db
    .select()
    .from(imagesTable)
    .where(eq(imagesTable.id, params.data.id));

  if (!image) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  const [creator] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, image.creatorId));

  const [ratingAgg] = await db
    .select({
      avg: sql<string>`AVG(${ratingsTable.rating})`,
      count: sql<string>`COUNT(${ratingsTable.id})`,
    })
    .from(ratingsTable)
    .where(eq(ratingsTable.imageId, image.id));

  const commentRows = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.imageId, image.id))
    .orderBy(asc(commentsTable.createdAt));

  const comments = await Promise.all(
    commentRows.map(async (c) => {
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

  const result = {
    id: image.id,
    url: image.url,
    thumbnailUrl: image.thumbnailUrl ?? null,
    title: image.title,
    caption: image.caption ?? null,
    location: image.location ?? null,
    tags: image.tags ?? [],
    creatorId: image.creatorId,
    creatorUsername: creator?.username ?? "unknown",
    creatorDisplayName: creator?.displayName ?? "Unknown",
    creatorAvatarUrl: creator?.avatarUrl ?? null,
    averageRating: ratingAgg?.avg ? parseFloat(ratingAgg.avg) : null,
    ratingCount: Number(ratingAgg?.count ?? 0),
    commentCount: comments.length,
    comments,
    createdAt: image.createdAt.toISOString(),
  };

  res.json(GetImageResponse.parse(result));
});

router.delete("/images/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteImageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(imagesTable)
    .where(eq(imagesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  res.json(DeleteImageResponse.parse({ success: true, message: "Image deleted" }));
});

router.get("/search", async (req, res): Promise<void> => {
  const query = SearchImagesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { q, limit = 20, offset = 0 } = query.data;
  const searchTerm = `%${q}%`;

  const images = await db
    .select()
    .from(imagesTable)
    .where(
      or(
        like(imagesTable.title, searchTerm),
        like(imagesTable.caption, searchTerm),
        like(imagesTable.location, searchTerm)
      )
    )
    .orderBy(desc(imagesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<string>`COUNT(*)` })
    .from(imagesTable)
    .where(
      or(
        like(imagesTable.title, searchTerm),
        like(imagesTable.caption, searchTerm),
        like(imagesTable.location, searchTerm)
      )
    );

  const withStats = await Promise.all(images.map(buildImageWithStats));

  res.json(SearchImagesResponse.parse({ images: withStats, total: Number(count) }));
});

export default router;
