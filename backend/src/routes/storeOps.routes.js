import {
  fetchPickerQueue,
  markOrderPacked,
} from "../services/storeOps/picker.service";
import { runAudit } from "../services/storeOps/audit.service";
import {
  migrateLocation,
} from "../services/storeOps/migration.service";
import { getPerformanceSnapshot } from "../services/storeOps/performance.service";

const wrap = (handler) => async (req, res, next) => {
  try {
    const result = await handler(req, res);
    if (res?.headersSent) return;
    res?.json ? res.json(result) : result;
  } catch (err) {
    if (next) return next(err);
    if (res?.status) {
      res.status(500).json({ message: err?.message || "storeops_error" });
    }
  }
};

export default function registerStoreOpsRoutes(router) {
  if (!router) throw new Error("router_required");

  router.get("/storeops/queue", wrap(() => fetchPickerQueue()));

  router.patch(
    "/storeops/order/:id/packed",
    wrap((req) =>
      markOrderPacked(req.params.id, req.body?.operatorId, req.body?.note)
    )
  );

  router.post(
    "/storeops/audit/run",
    wrap((req) => runAudit(req.body?.lines || [], req.body?.metadata))
  );

  router.patch(
    "/storeops/migrate/location",
    wrap((req) => migrateLocation(req.body || {}))
  );

  router.get(
    "/storeops/performance",
    wrap((req) =>
      getPerformanceSnapshot(
        req.query?.windowDays ? Number(req.query.windowDays) : 7
      )
    )
  );

  return router;
}
