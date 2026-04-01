import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import imagesRouter from "./images";
import commentsRouter from "./comments";
import ratingsRouter from "./ratings";
import feedRouter from "./feed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(imagesRouter);
router.use(commentsRouter);
router.use(ratingsRouter);
router.use(feedRouter);

export default router;
