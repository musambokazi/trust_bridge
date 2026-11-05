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
    await p.waitForURL("**/welcome");
    const advanceWelcome = () => p.getByRole("button", { name: "Next", exact: true }).click();
    await p.setViewportSize({ width: 320, height: 690 });
    await p.getByRole("heading", { name: "Check before you pay." }).waitFor();
    await advanceWelcome();
    await p.getByRole("heading", { name: "Start with a supplier you know." }).waitFor();
    await p.getByRole("button", { name: "Previous", exact: true }).click();
    await p.getByRole("heading", { name: "Check before you pay." }).waitFor();
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await p.setViewportSize({ width: 390, height: 844 });
    for (const title of ["Start with a supplier you know.", "See exactly what changed.", "Keep a record of your checks."]) {
      await advanceWelcome();
      await p.getByRole("heading", { name: title, exact: true }).waitFor();
    }
    await p.getByRole("button", { name: "Continue to account" }).click();
    const create = () => p.getByRole("button", { name: "Create an account", exact: true }).click();
    const next = p.getByRole("button", { name: "Next", exact: true });
    const fill = async (entries) => {
      for (const [label, value] of entries) await p.getByLabel(label, { exact: true }).fill(value);
    };
    await create();
    await p.getByRole("button", { name: "Company", exact: true }).click();
    await next.click();
    await fill([["Legal company name", "Sample Company"], ["Company registration number", "12345"], ["Company tax number", "98765"], ["Registered company address", "1 Example Road"], ["Country", "South Africa"]]);
    await next.click();
    await fill([["Authorised contact name", "Sample Member"], ["Your role", "Buyer"], ["Company email address", "sample@example.com"], ["Company phone number", "+27110000000"]]);
    await next.click();
    await fill([["Industry", "Retail"], ["Products or services provided", "Office supplies"]]);
    await next.click();
    await fill([["Password", "short"], ["Confirm password", "short"]]);
    await next.click();
    await p.getByRole("alert").filter({ hasText: "Meet all four" }).waitFor();
    await fill([["Password", "FictionalOnly8!"], ["Confirm password", "FictionalOnly9!"]]);
    await p.getByText("Password strength: Strong", { exact: true }).waitFor();
    await next.click();
    await p.getByRole("alert").filter({ hasText: "The passwords do not match" }).waitFor();
    await fill([["Confirm password", "FictionalOnly8!"]]);
    await next.click();
    await p.getByText("Sample Company", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Done", exact: true }).click();
    await create();
    await next.click();
    const first = p.getByLabel("First name", { exact: true });
    await first.fill("Sample");
    await first.press("Enter");
    assert.equal(await p.getByLabel("Surname", { exact: true }).evaluate((input) => document.activeElement === input), true);
    await fill([["Surname", "Member"]]);
    await next.click();
    await fill([["Email address", "sample@example.com"]]);
    await p.getByRole("button", { name: "Country code for Cell phone number" }).click();
    await p.getByLabel("Search countries or codes", { exact: true }).fill("44");
    await p.getByRole("button", { name: "United Kingdom +44", exact: true }).click();
    await p.getByText("Country: United Kingdom", { exact: true }).waitFor();
    await fill([["Cell phone number", "07700900123"]]);
    await next.click();
    await fill([["Password", "FictionalOnly8!"], ["Confirm password", "FictionalOnly8!"]]);
    await next.click();
    await p.getByText("Individual account", { exact: true }).waitFor();
    await p.getByText("+447700900123", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Done", exact: true }).click();
    await p.getByRole("button", { name: "Continue offline" }).click();

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
    await p.getByRole("button", { name: "Compare invoice details" }).click();
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
    await p.getByRole("button", { name: "Compare invoice details" }).click();
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
    await p.getByRole("button", { name: "Account", exact: true }).click();
    await p
      .getByRole("textbox", { name: "Display name" })
      .fill("Team member");
    await p.waitForURL("**/settings/account");
    await p.getByRole("button", { name: "Go back", exact: true }).click();
    await p.getByRole("heading", { name: "Team member", exact: true }).waitFor();
    await p.getByRole("button", { name: "Privacy and policy" }).click();
    await p.waitForURL("**/settings/privacy");
    for (const [id, title] of [["privacy-notice", "Privacy notice"], ["terms", "Terms of service"]]) {
      await p.getByRole("link", { name: title, exact: true }).click();
      await p.waitForURL(`**/settings/${id}`);
      await p.getByRole("heading", { name: /^35\./ }).waitFor();
      await p.getByRole("button", { name: "Go back", exact: true }).click();
    }
    await p.getByRole("button", { name: "Go back", exact: true }).click();
    for (const [id, title] of [
      ["workspace", "Your workspace"],
      ["security", "Security & access"],
      ["display", "Reading & display"],
      ["about", "About TrustBridge"],
    ]) {
      await p.getByRole("button", { name: title, exact: true }).click();
      await p.waitForURL(`**/settings/${id}`);
      await p.getByRole("heading", { name: title, exact: true }).waitFor();
      if (id === "display") {
        await p.getByRole("button", { name: "A+", exact: true }).click();
        await p.getByText("105%", { exact: true }).waitFor();
      }
      if (id === "workspace") {
        for (const [route, label] of [["workspace-type", "Company or individual"], ["team-access", "Team access"]]) {
          await p.getByRole("link", { name: label, exact: true }).click();
          await p.waitForURL(`**/settings/${route}`);
          await p.getByRole("button", { name: "Go back", exact: true }).click();
        }
        await p.getByRole("link", { name: "Supplier directory", exact: true }).click();
        await p.getByRole("textbox", { name: "Search suppliers" }).waitFor();
        await p.goBack();
        await p.waitForURL("**/settings/workspace");
      }
      await p.getByRole("button", { name: "Go back", exact: true }).click();
      await p.waitForURL("**/profile");
    }
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
      "PASS: supplier search/detail, invoice validation, changed-reference result, session history/filtering, profile, password toggle, welcome and signup, legal documents, workspace links, all five tabs at 320/390/768/1280px, reduced-motion mode and no browser exceptions.",
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
