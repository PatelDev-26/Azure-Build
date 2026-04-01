import { Router, type IRouter } from "express";
import { eq, and, avg, count } from "drizzle-orm";
import { db, ratingsTable } from "@workspace/db";
import {
  RateImageBody,
  GetImageRatingParams,
  GetImageRatingResponse,
  RateImageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/ratings", async (req, res): Promise<void> => {
  const parsed = RateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(ratingsTable)
    .where(
      and(
        eq(ratingsTable.imageId, parsed.data.imageId),
        eq(ratingsTable.userId, parsed.data.userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(ratingsTable)
      .set({ rating: parsed.data.rating })
      .where(eq(ratingsTable.id, existing[0].id));
  } else {
    await db.insert(ratingsTable).values(parsed.data);
  }

  res.json(RateImageResponse.parse({ success: true, message: "Rating saved" }));
});

router.get("/ratings/:imageId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.imageId) ? req.params.imageId[0] : req.params.imageId;
  const params = GetImageRatingParams.safeParse({ imageId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [agg] = await db
    .select({
      avgRating: avg(ratingsTable.rating),
      ratingCount: count(ratingsTable.id),
    })
    .from(ratingsTable)
    .where(eq(ratingsTable.imageId, params.data.imageId));

  res.json(
    GetImageRatingResponse.parse({
      imageId: params.data.imageId,
      averageRating: agg?.avgRating ? parseFloat(String(agg.avgRating)) : null,
      ratingCount: Number(agg?.ratingCount ?? 0),
    })
  );
});

export default router;
