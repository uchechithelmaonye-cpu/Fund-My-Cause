import { test, expect } from "./fixtures/wallet";

test.describe("Contribution Flow", () => {
  test("should display pledge button on campaign page", async ({ page }) => {
    await page.goto("/campaigns");
    
    // Click on first campaign
    const campaignLink = page.locator("a[href*='/campaigns/']").first();
    await campaignLink.click();
    
    // Should see pledge button
    await expect(page.locator("button:has-text('Pledge')")).toBeVisible();
  });

  test("should open pledge modal", async ({ page }) => {
    await page.goto("/campaigns");
    
    const campaignLink = page.locator("a[href*='/campaigns/']").first();
    await campaignLink.click();
    
    await page.click("button:has-text('Pledge')");
    
    // Modal should be visible
    await expect(page.locator("text=Pledge to")).toBeVisible();
  });

  test("should validate pledge amount", async ({ page }) => {
    await page.goto("/campaigns");
    
    const campaignLink = page.locator("a[href*='/campaigns/']").first();
    await campaignLink.click();
    
    await page.click("button:has-text('Pledge')");
    
    // Try to pledge without amount
    await page.click("button:has-text('Confirm Pledge')");
    
    // Should show error
    await expect(page.locator("text=Please enter a valid amount")).toBeVisible();
  });

  test("should submit pledge with valid amount", async ({ page }) => {
    await page.goto("/campaigns");
    
    const campaignLink = page.locator("a[href*='/campaigns/']").first();
    await campaignLink.click();
    
    await page.click("button:has-text('Pledge')");
    
    // Enter amount
    await page.fill("input[placeholder*='Amount']", "10");
    
    // Submit pledge
    await page.click("button:has-text('Confirm Pledge')");
    
    // Should show success message
    await expect(page.locator("text=Pledge submitted successfully")).toBeVisible({ timeout: 10000 });
  });

  test("should update progress bar after contribution", async ({ page }) => {
    await page.goto("/campaigns");
    
    const campaignLink = page.locator("a[href*='/campaigns/']").first();
    await campaignLink.click();
    
    // Get initial progress
    const initialProgress = await page.locator("[role='progressbar']").getAttribute("aria-valuenow");
    
    // Make a pledge
    await page.click("button:has-text('Pledge')");
    await page.fill("input[placeholder*='Amount']", "10");
    await page.click("button:has-text('Confirm Pledge')");
    
    // Wait for update
    await page.waitForTimeout(2000);
    
    // Progress should have increased
    const updatedProgress = await page.locator("[role='progressbar']").getAttribute("aria-valuenow");
    expect(parseInt(updatedProgress || "0")).toBeGreaterThan(parseInt(initialProgress || "0"));
  });

  test("should display contribution in leaderboard", async ({ page }) => {
    await page.goto("/campaigns");
    
    const campaignLink = page.locator("a[href*='/campaigns/']").first();
    await campaignLink.click();
    
    // Make a pledge
    await page.click("button:has-text('Pledge')");
    await page.fill("input[placeholder*='Amount']", "10");
    await page.click("button:has-text('Confirm Pledge')");
    
    // Wait for leaderboard update
    await page.waitForTimeout(2000);
    
    // Should see contribution in leaderboard
    await expect(page.locator("text=GMOCK")).toBeVisible();
  });
});
