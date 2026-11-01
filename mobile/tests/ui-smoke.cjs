// Run after `npm run export:web`. Requires a Playwright browser installation,
// or set CHROMIUM_PATH to an existing Chromium executable.
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test",
);
const base = path.resolve(__dirname, "../dist");
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".png": "image/png",
};
const server = http.createServer((req, res) => {
  let file = path.resolve(
    base,
    "." + decodeURIComponent(req.url.split("?")[0]),
  );
  if (!file.startsWith(base + path.sep) && file !== base) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
    file = path.join(base, "index.html");
  res.setHeader(
    "Content-Type",
    types[path.extname(file)] || "application/octet-stream",
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {}),
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    const p = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    const origin = `http://127.0.0.1:${server.address().port}`;
    await p.goto(origin);
    await p.getByText("A second look.", { exact: false }).waitFor();
    await p.evaluate(() => document.fonts.ready);
    if (process.env.UI_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.UI_SCREENSHOT_DIR, { recursive: true });
      await p.screenshot({
        path: path.join(process.env.UI_SCREENSHOT_DIR, "home.png"),
      });
    }
    const tabs = () => p.getByRole("tablist").last();
    await tabs().getByRole("tab", { name: "Suppliers", exact: true }).click();
    await p.getByRole("textbox", { name: "Search suppliers" }).fill("karoo");
    await p.getByRole("button", { name: /Karoo Print Studio/ }).waitFor();
    assert.equal(
      await p.getByRole("button", { name: /Ubuntu Supplies/ }).count(),
      0,
    );
    await p.getByRole("textbox", { name: "Search suppliers" }).fill("");
    if (process.env.UI_SCREENSHOT_DIR)
      await p.screenshot({
        path: path.join(process.env.UI_SCREENSHOT_DIR, "suppliers.png"),
      });
    await p.getByRole("button", { name: /Ubuntu Supplies/ }).click();
    await p.getByText("•••• 4318", { exact: true }).waitFor();
    await p
      .getByRole("button", { name: "Check an invoice for this supplier" })
      .click();
    await p.getByRole("button", { name: "Compare demo details" }).click();
    await p
      .getByText("Enter an invoice number (up to 80 characters).", {
        exact: true,
      })
      .waitFor();
    await p.getByRole("button", { name: /Try an example/ }).click();
    await p
      .getByRole("textbox", { name: "Invoice number", exact: true })
      .fill("INV-SMOKE");
    if (process.env.UI_SCREENSHOT_DIR) {
      await p
        .getByText("Small details.", { exact: false })
        .scrollIntoViewIfNeeded();
      await p.screenshot({
        path: path.join(process.env.UI_SCREENSHOT_DIR, "check.png"),
      });
    }
    await p.getByRole("button", { name: "Compare demo details" }).click();
    await p.getByText("Pause.", { exact: false }).waitFor();
    await p.getByText("Bank reference changed", { exact: true }).waitFor();
    await p.getByText("•••• 7821", { exact: true }).waitFor();
    if (process.env.UI_SCREENSHOT_DIR)
      await p.screenshot({
        path: path.join(process.env.UI_SCREENSHOT_DIR, "assessment.png"),
      });
    await p.getByRole("button", { name: "Back to assessment history" }).click();
    await p
      .getByRole("textbox", { name: "Search assessments" })
      .fill("INV-SMOKE");
    assert.equal(await p.getByRole("button", { name: /INV-SMOKE/ }).count(), 1);
    await p.getByRole("tab", { name: "No discrepancies", exact: true }).click();
    await p.getByText("No assessments here yet.", { exact: true }).waitFor();
    await tabs().getByRole("tab", { name: "Profile", exact: true }).click();
    await p
      .getByRole("textbox", { name: "Preview display name" })
      .fill("Team member");
    await p.getByRole("button", { name: "Privacy in this preview" }).click();
    await p
      .getByText("This preview uses fictional supplier records.", {
        exact: false,
      })
      .waitFor();
    await p.getByRole("button", { name: "View sign-in design" }).click();
    await p
      .getByRole("textbox", { name: "Email address", exact: true })
      .fill("demo@example.com");
    const pass = p.getByLabel("Password", { exact: true });
    await pass.fill("FictionalOnly8!");
    assert.equal(await pass.evaluate((el) => el.type), "password");
    await p.getByRole("button", { name: "Show password", exact: true }).click();
    assert.equal(await pass.evaluate((el) => el.type), "text");
    await p.getByRole("button", { name: "Hide password", exact: true }).click();
    assert.equal(await pass.evaluate((el) => el.type), "password");
    await p.getByRole("button", { name: /Sign in \(preview\)/ }).click();
    await p
      .getByText("Live sign-in is not connected.", { exact: false })
      .waitFor();
    assert.equal(await pass.inputValue(), "");
    await p.getByRole("button", { name: "Explore demo workspace" }).click();
    await p
      .getByText("Good to see you, Team member.", { exact: true })
      .waitFor();
    await p.reload();
    await p.getByText("Good to see you, Thulane.", { exact: true }).waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await p.setViewportSize({ width, height: 844 });
      for (const tab of ["Home", "Suppliers", "Check", "History", "Profile"]) {
        await tabs().getByRole("tab", { name: tab, exact: true }).click();
        await tabs()
          .getByRole("tab", { name: tab, exact: true, selected: true })
          .waitFor();
        assert.ok(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `Horizontal overflow: ${tab} at ${width}`,
        );
      }
    }
    await p.emulateMedia({ reducedMotion: "reduce" });
    await tabs().getByRole("tab", { name: "Home", exact: true }).click();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: supplier search/detail, invoice validation, changed-reference result, session history/filtering, profile, password toggle, demo reset on reload, all five tabs at 320/390/768/1280px, reduced-motion mode and no browser exceptions.",
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
