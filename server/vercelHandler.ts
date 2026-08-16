import type { RequestHandler } from "express";
import { createApp } from "./index";

const appPromise = createApp();

export default async function vercelHandler(
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
) {
  const app = await appPromise;
  return app(req, res);
}
