import { expect, test } from "@playwright/test";

test.describe("Text Analysis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the input form on load", async ({ page }) => {
    await expect(
      page.getByRole("textbox", { name: /user types text here/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /submit/i }),
    ).toBeVisible();
  });

  test("does not submit when textarea is empty", async ({ page }) => {
    await page.getByRole("button", { name: /submit/i }).click();
    await expect(
      page.getByRole("textbox", { name: /user types text here/i }),
    ).toBeVisible();
  });

  test("analyzes text and shows result", async ({ page }) => {
    const textarea = page.getByRole("textbox", {
      name: /user types text here/i,
    });
    await textarea.fill("hello world");
    await page.getByRole("button", { name: /submit/i }).click();

    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(textarea).not.toBeVisible();

    await expect(
      page.getByText("Your text consists of 2 words and 10 letters"),
    ).toBeVisible();
  });

  test("submits by tabbing to button and pressing Enter", async ({ page }) => {
    const textarea = page.getByRole("textbox", {
      name: /user types text here/i,
    });
    await textarea.fill("one two three");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("progressbar")).toBeVisible();
  });

  test("does not submit when pressing Enter in textarea", async ({ page }) => {
    const textarea = page.getByRole("textbox", {
      name: /user types text here/i,
    });
    await textarea.fill("some text");
    await page.keyboard.press("Enter");

    await expect(textarea).toBeVisible();
    await expect(page.getByRole("progressbar")).not.toBeVisible();
  });

  test("submits with Ctrl+Enter from textarea", async ({ page }) => {
    const textarea = page.getByRole("textbox", {
      name: /user types text here/i,
    });
    await textarea.fill("one two three");
    await page.keyboard.press("Control+Enter");

    await expect(page.getByRole("progressbar")).toBeVisible();
  });

  test("submits with Meta+Enter from textarea", async ({ page }) => {
    const textarea = page.getByRole("textbox", {
      name: /user types text here/i,
    });
    await textarea.fill("one two three");
    await page.keyboard.press("Meta+Enter");

    await expect(page.getByRole("progressbar")).toBeVisible();
  });
});
