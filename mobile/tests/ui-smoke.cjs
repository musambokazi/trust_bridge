const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");
const root = path.resolve(__dirname, "../dist");
const server = http.createServer((req, res) => {
  let file = path.resolve(root, "." + decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, "index.html");
  const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".ttf": "font/ttf" };
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = []; p.on("pageerror", (error) => errors.push(error.message));
    const uid = "11111111-1111-4111-8111-111111111111", wid = "22222222-2222-4222-8222-222222222222";
    let profile = null, workspace = null, suppliers = [], results = [], offline = false, signups = 0;
    const user = { id: uid, email: "qa@example.com", aud: "authenticated", role: "authenticated", email_confirmed_at: new Date().toISOString(), app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: new Date().toISOString() };
    const token = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url") + "." + Buffer.from(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated", role: "authenticated" })).toString("base64url") + ".signature";
    await p.route("https://pbyquxpeizkumucvpcdk.supabase.co/**", async (route) => {
      if (offline) { await route.abort("internetdisconnected"); return; }
      const req = route.request(), url = new URL(req.url()), body = req.postDataJSON();
      let json = {}, status = 200;
      if (url.pathname === "/auth/v1/signup") { signups++; json = { user: { ...user, email_confirmed_at: null }, session: null }; }
      else if (url.pathname === "/auth/v1/token") json = { access_token: token, refresh_token: "test-refresh", expires_in: 3600, token_type: "bearer", user };
      else if (url.pathname === "/auth/v1/user") json = user;
      else if (url.pathname === "/auth/v1/logout") json = {};
      else if (url.pathname === "/rest/v1/profiles") {
        if (req.method() === "POST") profile = { ...body, created_at: new Date().toISOString() };
        if (req.method() === "PATCH") profile = { ...profile, ...body };
        json = profile ? [profile] : [];
      } else if (url.pathname === "/rest/v1/workspaces") {
        if (req.method() === "POST") workspace = { ...body, id: wid };
        json = workspace ? [workspace] : [];
      } else if (url.pathname === "/rest/v1/suppliers") {
        if (req.method() === "POST") suppliers.push({ ...body, id: "33333333-3333-4333-8333-333333333333" });
        json = suppliers;
      } else if (url.pathname === "/rest/v1/assessments") json = results.map((result) => ({ result }));
      else if (url.pathname === "/rest/v1/rpc/compare_invoice") {
        json = { id: body.request_id, supplierId: body.supplier, invoiceNumber: body.invoice_number, supplierName: body.invoice_name, amount: body.invoice_amount, date: new Date().toISOString(), level: "review", approvedReference: "1234", submittedReference: body.invoice_reference.slice(-4), findings: [{ field: "bank", title: "Bank reference changed", detail: "Compare with saved reference.", mismatch: true }] };
        if (!results.some((r) => r.id === json.id)) results.push(json);
      }
      await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(json) });
    });
    await p.goto("http://127.0.0.1:" + server.address().port);
    await p.waitForURL("**/welcome");
    for (let i = 0; i < 3; i++) await p.getByRole("button", { name: "Next", exact: true }).click();
    await p.getByRole("button", { name: "Continue to account" }).click();
    await p.getByRole("button", { name: "Create an account", exact: true }).click();
    const next = () => p.getByRole("button", { name: "Next", exact: true }).click();
    const fill = async (entries) => { for (const [label, value] of entries) await p.getByLabel(label, { exact: true }).filter({ visible: true }).fill(value); };
    await next();
    await fill([["First name", "Test"]]);
    await p.getByLabel("First name", { exact: true }).press("Enter");
    assert.equal(await p.getByLabel("Surname", { exact: true }).evaluate((el) => el === document.activeElement), true);
    await fill([["Surname", "Person"], ["Username", "test_person"]]);
    await next();
    await fill([["Email address", "qa@example.com"], ["Cell phone number", "0820000000"]]);
    await next();
    await p.getByLabel("Password", { exact: true }).filter({ visible: true }).focus();
    await p.getByRole("button", { name: "Show passwords", exact: true }).click();
    await p.waitForFunction(() => Array.from(document.querySelectorAll('input[aria-label="Password"]')).some(el => el.offsetParent !== null && el.type === "text"));
    assert.equal(await p.getByLabel("Confirm password", { exact: true }).evaluate(el => el.type), "password");
    await p.getByLabel("Confirm password", { exact: true }).focus();
    await p.waitForFunction(() => Array.from(document.querySelectorAll('input[aria-label="Password"]')).filter(el => el.offsetParent !== null).every(el => el.type === "password"));
    await p.getByRole("button", { name: "Hide passwords", exact: true }).click();
    await fill([["Password", "short"], ["Confirm password", "short"]]);
    await next(); await p.getByRole("alert").filter({ hasText: "Meet all four" }).waitFor();
    await fill([["Password", "StrongPass123!"], ["Confirm password", "StrongPass123!"]]);
    await next();
    await p.getByText("+27820000000", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Accept privacy notice and terms", exact: true }).click();
    await p.getByRole("button", { name: "Create account", exact: true }).click();
    await p.getByRole("button", { name: "Go to sign in" }).click();
    assert.equal(signups, 1);
    await fill([["Email address", "qa@example.com"], ["Password", "StrongPass123!"]]);
    await p.getByRole("button", { name: "Show password", exact: true }).click();
    await p.waitForFunction(() => Array.from(document.querySelectorAll('input[aria-label="Password"]')).some(el => el.offsetParent !== null && el.type === "text"));
    await p.getByRole("button", { name: "Hide password", exact: true }).click();
    await p.waitForFunction(() => Array.from(document.querySelectorAll('input[aria-label="Password"]')).filter(el => el.offsetParent !== null).every(el => el.type === "password"));
    await p.getByRole("button", { name: "Show password", exact: true }).click();
    await p.getByLabel("Email address", { exact: true }).filter({ visible: true }).focus();
    await p.waitForFunction(() => Array.from(document.querySelectorAll('input[aria-label="Password"]')).filter(el => el.offsetParent !== null).every(el => el.type === "password"));
    assert.equal(await p.getByLabel("Email address", { exact: true }).filter({ visible: true }).evaluate(el => el.type), "email");
    await p.getByRole("button", { name: "Sign in", exact: true }).click();
    await p.getByText("Good to see you, Test.", { exact: true }).waitFor();
    assert.equal(profile.phone, "+27820000000");
    assert.equal(workspace.kind, "individual");
    const tabs = () => p.getByRole("tablist").last();
    await tabs().getByRole("tab", { name: "Suppliers", exact: true }).click();
    await p.getByRole("button", { name: "Add supplier" }).click();
    await fill([["Supplier name", "QA Supplies"], ["Bank reference", "REF1234"]]);
    await p.getByRole("button", { name: "Save supplier" }).click();
    await p.getByRole("button", { name: /QA Supplies/ }).click();
    await p.getByRole("button", { name: "Check an invoice for this supplier" }).click();
    await p.getByRole("button", { name: "Import invoice photo, PDF or text", exact: true }).click();
    await p.getByRole("button", { name: "Paste invoice text", exact: true }).click();
    await p.getByLabel("Copied invoice text", { exact: true }).fill("Supplier: QA Supplies\nInvoice No: INV-QA\nTotal Due: R100.00\nBank reference: REF9999");
    await p.getByRole("button", { name: "Extract invoice fields", exact: true }).click();
    const applyImport = p.getByRole("button", { name: "Use reviewed invoice fields", exact: true });
    assert.equal(await applyImport.isDisabled(), true);
    assert.equal(await p.getByLabel("Extracted invoice number", { exact: true }).inputValue(), "INV-QA");
    await p.getByLabel("Extracted bank reference", { exact: true }).fill("REF9999");
    await p.getByRole("checkbox", { name: "I checked these details against the original invoice", exact: true }).click();
    await applyImport.click();
    await p.getByText("Reviewed fields added. Confirm the supplier record and compare when ready.", { exact: true }).waitFor();
    assert.equal(await p.getByLabel("Invoice number", { exact: true }).filter({ visible: true }).inputValue(), "INV-QA");
    assert.equal(await p.getByLabel("Amount (ZAR)", { exact: true }).filter({ visible: true }).inputValue(), "100.00");
    await p.getByRole("button", { name: "Compare invoice details" }).click();
    await p.getByText("Bank reference changed", { exact: true }).waitFor();
    assert.equal(results.length, 1);
    await p.getByRole("button", { name: "Back to assessment history" }).click();
    await tabs().getByRole("tab", { name: "Profile", exact: true }).click();
    await p.getByText("@test_person", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Account", exact: true }).click();
    await fill([["First name", "Updated"]]);
    await p.getByRole("button", { name: "Save profile", exact: true }).click();
    await p.getByText("Saved to your account.", { exact: true }).waitFor();
    assert.equal(profile.first_name, "Updated");
    await p.getByRole("button", { name: "Go back", exact: true }).click();
    await p.waitForURL("**/profile");
    offline = true;
    await p.reload();
    await p.getByText("@test_person", { exact: true }).waitFor();
    assert.equal(await p.getByRole("button", { name: "Sign in", exact: true }).count(), 0);
    await tabs().getByRole("tab", { name: "Check", exact: true }).click();
    await p.getByRole("button", { name: "Select supplier", exact: true }).click();
    await p.getByRole("button", { name: "QA Supplies", exact: true }).click();
    await fill([["Invoice number", "INV-OFFLINE"], ["Amount (ZAR)", "200"], ["Supplier name on invoice", "QA Supplies"], ["Bank reference on invoice", "REF7777"]]);
    await p.getByRole("button", { name: "Compare invoice details" }).click();
    await p.getByText("Waiting for server comparison", { exact: true }).waitFor();
    assert.equal(results.length, 1);
    await p.getByRole("button", { name: "Back to assessment history" }).click();
    await tabs().getByRole("tab", { name: "Home", exact: true }).click();
    offline = false;
    await p.getByRole("button", { name: "Sync now", exact: true }).click();
    await p.getByText("Synced with your account.", { exact: false }).waitFor();
    assert.equal(results.length, 2);
    await p.getByRole("button", { name: "Sync now", exact: true }).click();
    assert.equal(results.length, 2);
    for (const width of [320, 390, 768]) {
      await p.setViewportSize({ width, height: 844 });
      for (const name of ["Home", "Suppliers", "Check", "History", "Profile"]) {
        await tabs().getByRole("tab", { name, exact: true }).click();
        assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + " overflow");
      }
    }
    await p.goto("http://127.0.0.1:" + server.address().port + "/settings/security");
    await p.getByRole("button", { name: "Enable biometric unlock", exact: true }).click();
    await p.getByText("Biometric unlock is available in the installed mobile app.", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Go back", exact: true }).click();
    await tabs().getByRole("tab", { name: "Check", exact: true }).click();
    await tabs().getByRole("tab", { name: "Profile", exact: true }).click();
    if (process.env.UI_SCREENSHOT_DIR) { fs.mkdirSync(process.env.UI_SCREENSHOT_DIR, { recursive: true }); await p.screenshot({ path: path.join(process.env.UI_SCREENSHOT_DIR, "connected-profile.png") }); }
    assert.deepEqual(errors, []);
    console.log("PASS: mocked live signup/email confirmation/login, profile and workspace persistence, supplier creation, server comparison, session restoration offline, keyboard focus and responsive navigation. Real RLS is verified separately against Supabase.");
  } finally { if (browser) await browser.close(); await new Promise((resolve) => server.close(resolve)); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
