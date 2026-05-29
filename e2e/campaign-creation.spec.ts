import { test, expect } from "./fixtures/wallet";

test.describe("Campaign Creation Flow", () => {
  test("should navigate to create campaign page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Create Campaign");
    await expect(page).toHaveURL(/\/create/);
  });

  test("should display campaign creation wizard", async ({ page }) => {
    await page.goto("/create");
    await expect(page.locator("text=Basic Info")).toBeVisible();
    await expect(page.locator("text=Media")).toBeVisible();
    await expect(page.locator("text=Review & Deploy")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/create");
    
    // Try to proceed without filling fields
    await page.click("button:has-text('Next')");
    
    // Should show validation errors
    await expect(page.locator("text=Title is required")).toBeVisible();
  });

  test("should fill campaign basic info", async ({ page }) => {
    await page.goto("/create");
    
    await page.fill("input[placeholder*='Campaign Title']", "Save the Rainforest");
    await page.fill("textarea[placeholder*='Description']", "Help us protect endangered species and their habitats");
    await page.fill("input[placeholder*='Goal']", "1000");
    await page.fill("input[placeholder*='Minimum']", "10");
    
    await page.click("button:has-text('Next')");
    
    // Should move to next step
    await expect(page.locator("text=Media")).toBeVisible();
  });

  test("should add media to campaign", async ({ page }) => {
    await page.goto("/create");
    
    // Fill basic info
    await page.fill("input[placeholder*='Campaign Title']", "Save the Rainforest");
    await page.fill("textarea[placeholder*='Description']", "Help us protect endangered species and their habitats");
    await page.fill("input[placeholder*='Goal']", "1000");
    await page.click("button:has-text('Next')");
    
    // Add image URL
    await page.fill("input[placeholder*='Image URL']", "https://example.com/image.jpg");
    
    await page.click("button:has-text('Next')");
    
    // Should move to FAQ step
    await expect(page.locator("text=FAQ")).toBeVisible();
  });

  test("should complete campaign creation", async ({ page }) => {
    await page.goto("/create");
    
    // Fill all required fields
    await page.fill("input[placeholder*='Campaign Title']", "Save the Rainforest");
    await page.fill("textarea[placeholder*='Description']", "Help us protect endangered species and their habitats");
    await page.fill("input[placeholder*='Goal']", "1000");
    await page.fill("input[placeholder*='Minimum']", "10");
    
    // Navigate through steps
    for (let i = 0; i < 4; i++) {
      await page.click("button:has-text('Next')");
      await page.waitForTimeout(500);
    }
    
    // Should reach review step
    await expect(page.locator("text=Review & Deploy")).toBeVisible();
  });
});
