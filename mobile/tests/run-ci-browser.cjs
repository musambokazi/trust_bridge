// Pin the browser separately from app runtime dependencies. No tokens are used.
const { spawnSync } = require("node:child_process");
(async () => {
  const { default: chromium } = await import("@sparticuz/chromium");
  const binary = await chromium.executablePath();
  for (const duplicate of ["", "1"]) {
    const result = spawnSync(process.execPath, ["tests/ui-smoke.cjs"], {
      stdio: "inherit",
      env: { ...process.env, CHROMIUM_PATH: binary, UI_DUPLICATE_SIGNUP: duplicate },
      timeout: 150_000,
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
