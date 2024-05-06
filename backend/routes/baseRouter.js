import { Router } from "express";
export const baseRouter = Router();

/* Basic ping to test server response. */
baseRouter.get("/ping", function (req, res, next) {
  res.status(200).send();
});
