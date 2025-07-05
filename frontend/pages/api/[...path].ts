import { createProxyMiddleware } from "http-proxy-middleware";
import type { NextApiRequest, NextApiResponse } from "next";
import { runMiddleware } from "@/lib/runMiddleware";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const apiProxy = createProxyMiddleware({
  target: "http://localhost:9000",
  changeOrigin: true,
  pathRewrite: {
    "^/api": "/api", // giữ nguyên /api path
  },
  secure: false, // nếu BE là https self-signed
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, apiProxy);
}
