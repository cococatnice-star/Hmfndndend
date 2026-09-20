import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deltaInstallRouter from "./delta-install";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deltaInstallRouter);

export default router;
