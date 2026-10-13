import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deltaInstallRouter from "./delta-install";
import cocoXSignRouter from "./cocox-sign";
import authRouter from "./auth";
import cocoXInstallRouter from "./cocox-installs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deltaInstallRouter);
router.use(cocoXSignRouter);
router.use(authRouter);
router.use(cocoXInstallRouter);

export default router;
