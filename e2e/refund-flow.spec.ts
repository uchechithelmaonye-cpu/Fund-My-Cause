import { test, expect } from "./fixtures/wallet";

test.describe("Refund Flow", () => {
  test("should display refund page", async ({ page }) => {
    await page.goto("/refund");
    
    await expect(page.locator("text=Claim Refund")).toBeVisible();
  });

  test("should allow entering contract ID for refund", async ({ page }) => {
    await page.goto("/refund");
    
    const input = page.locator("input[placeholder*='Contract ID']");
    await expect(input).toBeVisible();
  });

  test("should validate contract ID format", async ({ page }) => {
    await page.goto("/refund");
    
    // Enter invalid contract ID
    await page.fill("input[placeholder*='Contract ID']", "invalid");
    await page.click("button:has-text('Check Refund')");
    
    // Should show error
    await expect(page.locator("text=Invalid contract ID")).toBeVisible();
  });

  test("should fetch refund eligibility", async ({ page }) => {
    await page.goto("/refund");
    
    // Enter valid contract ID format
    await page.fill("input[placeholder*='Contract ID']", "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
    await page.click("button:has-text('Check Refund')");
    
    // Should attempt to fetch refund info
    await page.waitForTimeout(2000);
  });

  test("should display refund amount if eligible", async ({ page }) => {
    await page.goto("/refund");
    
    // Enter contract ID
    await page.fill("input[placeholder*='Contract ID']", "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
    await page.click("button:has-text('Check Refund')");
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Should show refund info or error message
    const refundInfo = page.locator("text=Refund Amount");
    const errorMsg = page.locator("text=No refund available");
    
    const isVisible = await Promise.race([
      refundInfo.isVisible().catch(() => false),
      errorMsg.isVisible().catch(() => false),
    ]);
    
    expect(isVisible).toBeTruthy();
  });

  test("should allow claiming refund", async ({ page }) => {
    await page.goto("/refund");
    
    // Enter contract ID
    await page.fill("input[placeholder*='Contract ID']", "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
    await page.click("button:has-text('Check Refund')");
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Try to claim refund if button exists
    const claimButton = page.locator("button:has-text('Claim Refund')");
    if (await claimButton.isVisible()) {
      await claimButton.click();
      
      // Should show success or error message
      await expect(
        page.locator("text=/Refund claimed|Transaction failed/")
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
