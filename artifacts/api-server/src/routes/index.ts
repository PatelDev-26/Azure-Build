import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import imagesRouter from "./images";
import commentsRouter from "./comments";
import ratingsRouter from "./ratings";
import feedRouter from "./feed";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(usersRouter);
router.use(imagesRouter);
router.use(commentsRouter);
router.use(ratingsRouter);
router.use(feedRouter);

export default router;
