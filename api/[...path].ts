import type { RequestHandler } from "express";
import { createApp } from "../server/index";

// Catch every /api/* request and pass it to the existing Express router.
// Keeping the initialized app in a promise allows Vercel to reuse it between
// warm invocations without creating duplicate middleware stacks.
const appPromise = createApp();

export default async function handler(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) {
  const app = await appPromise;
  return app(req, res);
}
