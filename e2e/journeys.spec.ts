import { expect, test, type Page } from "@playwright/test";
import { expected } from "./expected";
import { searchProjects } from "../src/domain/portfolio";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

async function goVia(page: Page, label: string) {
  if (isMobile(page)) {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: label }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  } else {
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label }).click();
  }
}

test("overview shows owner, figures from the records and every project", async ({ page }) => {
  const e = await expected();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Project Portfolio" })).toBeVisible();
  await expect(page.getByText("An overview of current projects, responsibilities, progress and upcoming deliverables.")).toBeVisible();
  await expect(page.locator("main").getByText(e.profile.ownerName).first()).toBeVisible();

  const metrics = page.getByTestId("metric");
  await expect(metrics).toHaveCount(4);
  await expect(metrics.nth(0)).toContainText(String(e.metrics.activeProjects));
  await expect(metrics.nth(1)).toContainText(String(e.metrics.completedProjects));
  await expect(metrics.nth(2)).toContainText(String(e.metrics.inProgressProjects));
  await expect(metrics.nth(3)).toContainText(String(e.metrics.needsAttention));

  await expect(page.getByTestId("project-card")).toHaveCount(e.projects.length);
  await expect(page.getByTestId("attention-item")).toHaveCount(e.metrics.needsAttention);
  await expect(page.getByTestId("activity-entry").first()).toContainText(e.activity[0].title);
});

test("every navigation item opens its page and is marked active", async ({ page }) => {
  await page.goto("/");
  for (const [label, path, heading] of [
    ["All Projects", "/projects", "All Projects"],
    ["Activity & Updates", "/activity", "Activity & Updates"],
    ["Resources", "/resources", "Resources"],
    ["About", "/about", "About this report"],
    ["Overview", "/", "Project Portfolio"],
  ] as const) {
    await goVia(page, label);
    await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/$" : path}`));
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    if (!isMobile(page)) {
      await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    }
  }
});

test("a project card opens the right project with all sections", async ({ page }) => {
  const e = await expected();
  const project = e.projects[0];
  const b = e.breakdown(project.slug);
  await page.goto("/");
  await page.getByTestId("project-card").filter({ hasText: project.name }).click();
  await expect(page).toHaveURL(`/projects/${project.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: project.name })).toBeVisible();
  for (const title of ["Project overview", "Completed work", "Currently in progress", "Yet to be completed", "Issues and dependencies", "Resources and documents", "Activity timeline"]) {
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
  }
  await expect(page.getByTestId("completed-item")).toHaveCount(b.counts.completed);
  await expect(page.getByTestId("active-item")).toHaveCount(b.counts.inProgress);
  await expect(page.getByTestId("outstanding-item")).toHaveCount(b.counts.outstanding);
});

test("sections collapse and expand with a clear state", async ({ page }) => {
  const e = await expected();
  await page.goto(`/projects/${e.projects[0].slug}`);
  const trigger = page.locator("#completed").getByRole("button");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("completed-item").first()).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("completed-item").first()).toBeHidden();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("completed-item").first()).toBeVisible();
});

test("search across projects filters by task text and can be cleared", async ({ page }) => {
  await page.goto("/projects", { waitUntil: "networkidle" });
  const box = page.locator("#filter-q");
  await box.fill("redirects");
  await expect(page).toHaveURL(/q=redirects/);
  const cards = page.getByTestId("project-card");
  const e = await expected();
  const want = searchProjects(e.projects, { q: "redirects", status: null, category: null });
  await expect(cards).toHaveCount(want.length);
  for (const r of want) await expect(cards.filter({ hasText: r.project.name })).toContainText(`Matches · ${r.matches[0]}`);
  await box.fill("zzzz-nothing");
  await expect(page.getByText("No projects match")).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).first().click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(cards).toHaveCount((await expected()).projects.length);
});

test("sidebar search submits to All Projects", async ({ page }) => {
  test.skip(isMobile(page), "Desktop sidebar only");
  await page.goto("/about");
  const box = page.getByRole("searchbox", { name: "Search projects" }).first();
  await box.fill("barcodes");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/projects\?q=barcodes/);
  await expect(page.getByTestId("project-card")).toContainText(["Scrubness"]);
});

test("status filter chip shows only matching projects and is visibly selected", async ({ page }) => {
  const e = await expected();
  await page.goto("/projects");
  const chip = page.getByRole("list", { name: "Status" }).getByRole("link", { name: /In Progress/ });
  await chip.click();
  await expect(page).toHaveURL(/status=in_progress/);
  await expect(page.getByRole("list", { name: "Status" }).getByRole("link", { name: /In Progress/ })).toHaveAttribute("aria-current", "true");
  await expect(page.getByTestId("project-card")).toHaveCount(e.projects.filter((p) => p.status === "in_progress").length);
});

test("activity filters by category, project and date, with an empty state", async ({ page }) => {
  const e = await expected();
  await page.goto("/activity", { waitUntil: "networkidle" });
  await expect(page.getByTestId("activity-entry")).toHaveCount(e.activity.length);

  await page.getByRole("list", { name: "Category" }).getByRole("link", { name: /Decisions/ }).click();
  await expect(page).toHaveURL(/category=decisions/);
  await expect(page.getByTestId("activity-entry")).toHaveCount(e.activity.filter((a) => a.category === "decisions").length);

  await page.getByRole("link", { name: "Clear filters" }).first().click();
  await expect(page).toHaveURL(/\/activity$/);
  await page.getByRole("combobox", { name: "Project" }).selectOption("site-monitor");
  await expect(page).toHaveURL(/project=site-monitor/);
  await expect(page.getByTestId("activity-entry")).toHaveCount(e.activity.filter((a) => a.project.slug === "site-monitor").length);

  await page.goto("/activity?from=2020-01-01&to=2020-01-02");
  await expect(page.getByText("No updates match these filters")).toBeVisible();
});

test("resources open in a new tab and strategy documents are served", async ({ page, request }) => {
  const e = await expected();
  await page.goto("/resources");
  const links = page.locator("main a[target=_blank]");
  await expect(links).toHaveCount(e.resources.length);
  for (const link of await links.all()) await expect(link).toHaveAttribute("rel", /noopener/);

  // Every published document hosted by the site must be linked from its project and served as a PDF.
  for (const r of e.resources.filter((x) => x.url.startsWith("/documents/"))) {
    await page.goto(`/projects/${r.project.slug}`);
    await expect(page.locator(`#resources a[href="${r.url}"]`)).toBeVisible();
    const res = await request.get(r.url);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
  }
});

test("unknown projects show a helpful not-found page", async ({ page }) => {
  const res = await page.goto("/projects/does-not-exist");
  expect([200, 404]).toContain(res?.status());
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "All projects" }).last().click();
  await expect(page).toHaveURL(/\/projects$/);
});

test("keyboard users can skip to content", async ({ page }) => {
  test.skip(isMobile(page), "Keyboard journey on desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});
