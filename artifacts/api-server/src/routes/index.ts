import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deltaInstallRouter from "./delta-install";
import cocoXSignRouter from "./cocox-sign";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deltaInstallRouter);
router.use(cocoXSignRouter);

export default router;
