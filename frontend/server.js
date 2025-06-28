const { createServer } = require("https");
const { readFileSync } = require("fs");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  hostname: "challengeandwow.olym3.xyz", // thêm dòng này!
  port: 443,
});

const handle = app.getRequestHandler();

const httpsOptions = {
  key: readFileSync("./certs/key.pem"),
  cert: readFileSync("./certs/cert.pem"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    console.log("→ Request:", parsedUrl.pathname);
    handle(req, res, parsedUrl);
  }).listen(443, () => {
    console.log("✅ Server running at https://challengeandwow.olym3.xyz");
  });
});
