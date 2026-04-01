import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, imagesTable, usersTable, commentsTable, ratingsTable } from "@workspace/db";
import {
  GetFeedStatsResponse,
  GetTrendingImagesQueryParams,
  GetTrendingImagesResponse,
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

router.get("/feed/stats", async (_req, res): Promise<void> => {
  const [{ imageCount }] = await db
    .select({ imageCount: sql<string>`COUNT(*)` })
    .from(imagesTable);
  const [{ userCount }] = await db
    .select({ userCount: sql<string>`COUNT(*)` })
    .from(usersTable);
  const [{ commentCount }] = await db
    .select({ commentCount: sql<string>`COUNT(*)` })
    .from(commentsTable);
  const [{ ratingCount }] = await db
    .select({ ratingCount: sql<string>`COUNT(*)` })
    .from(ratingsTable);

  const topRatedRaw = await db
    .select({
      imageId: ratingsTable.imageId,
      avg: sql<string>`AVG(${ratingsTable.rating})`,
    })
    .from(ratingsTable)
    .groupBy(ratingsTable.imageId)
    .orderBy(desc(sql`AVG(${ratingsTable.rating})`))
    .limit(1);

  const mostCommentedRaw = await db
    .select({
      imageId: commentsTable.imageId,
      count: sql<string>`COUNT(${commentsTable.id})`,
    })
    .from(commentsTable)
    .groupBy(commentsTable.imageId)
    .orderBy(desc(sql`COUNT(${commentsTable.id})`))
    .limit(1);

  let topRatedImage = null;
  let mostCommentedImage = null;

  if (topRatedRaw.length > 0) {
    const [img] = await db
      .select()
      .from(imagesTable)
      .where(eq(imagesTable.id, topRatedRaw[0].imageId));
    if (img) topRatedImage = await buildImageWithStats(img);
  }

  if (mostCommentedRaw.length > 0) {
    const [img] = await db
      .select()
      .from(imagesTable)
      .where(eq(imagesTable.id, mostCommentedRaw[0].imageId));
    if (img) mostCommentedImage = await buildImageWithStats(img);
  }

  res.json(
    GetFeedStatsResponse.parse({
      totalImages: Number(imageCount),
      totalUsers: Number(userCount),
      totalComments: Number(commentCount),
      totalRatings: Number(ratingCount),
      topRatedImage,
      mostCommentedImage,
    })
  );
});

router.get("/feed/trending", async (req, res): Promise<void> => {
  const query = GetTrendingImagesQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 6) : 6;

  const images = await db
    .select()
    .from(imagesTable)
    .orderBy(desc(imagesTable.createdAt))
    .limit(limit * 3);

  const withStats = await Promise.all(images.map(buildImageWithStats));

  withStats.sort((a, b) => {
    const scoreA = (a.averageRating ?? 0) * 0.6 + (a.commentCount ?? 0) * 0.4;
    const scoreB = (b.averageRating ?? 0) * 0.6 + (b.commentCount ?? 0) * 0.4;
    return scoreB - scoreA;
  });

  res.json(
    GetTrendingImagesResponse.parse({
      images: withStats.slice(0, limit),
      total: withStats.length,
    })
  );
});

export default router;
