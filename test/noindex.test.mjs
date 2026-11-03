import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import robotsMod from "../src/app/robots.ts";
import nextConfigMod from "../next.config.ts";

const robots = typeof robotsMod === "function" ? robotsMod : robotsMod.default;
const nextConfig = nextConfigMod?.default || nextConfigMod;

test("SEO & Security: layout metadata enforces noindex and nofollow", () => {
  const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  assert.match(content, /index:\s*false/, "layout.tsx must configure index: false");
  assert.match(content, /follow:\s*false/, "layout.tsx must configure follow: false");
});

test("SEO & Security: robots.txt disallows crawling of all routes", () => {
  assert.equal(typeof robots, "function", "robots should be a function");
  const robotsConfig = robots();
  assert.ok(robotsConfig.rules, "robots rules should be defined");
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
  const disallowsAll = rules.some((rule) => rule.userAgent === "*" && rule.disallow === "/");
  assert.ok(disallowsAll, "robots.txt must disallow all paths for all user agents");
});

test("SEO & Security: next.config.ts includes X-Robots-Tag header", async () => {
  assert.ok(typeof nextConfig.headers === "function", "headers function must be defined");
  const headersList = await nextConfig.headers();
  const wildcardRule = headersList.find((item) => item.source === "/:path*");
  assert.ok(wildcardRule, "Wildcard header rule for /:path* should exist");
  const robotsHeader = wildcardRule.headers.find(
    (h) => h.key.toLowerCase() === "x-robots-tag"
  );
  assert.ok(robotsHeader, "X-Robots-Tag header must be present");
  assert.match(robotsHeader.value, /noindex/i);
  assert.match(robotsHeader.value, /nofollow/i);
});

test("SEO & Security: middleware allows public access to /robots.txt with noindex headers", () => {
  const middlewarePath = path.resolve(process.cwd(), "src/middleware.ts");
  const content = fs.readFileSync(middlewarePath, "utf-8");

  assert.match(content, /"\/robots\.txt"/, "middleware PUBLIC_PATHS must include /robots.txt");
  assert.match(content, /X-Robots-Tag/, "middleware must attach X-Robots-Tag header");
});
