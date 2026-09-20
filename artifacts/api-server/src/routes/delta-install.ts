import { Router, type IRouter } from "express";
import {
  GetDeltaInstallCountResponse,
  RecordDeltaInstallResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
let deltaInstallCount = 0;

router.get("/delta-install", (_req, res) => {
  res.json(GetDeltaInstallCountResponse.parse({ count: deltaInstallCount }));
});

router.post("/delta-install", (_req, res) => {
  deltaInstallCount += 1;
  res.json(RecordDeltaInstallResponse.parse({ count: deltaInstallCount }));
});

export default router;