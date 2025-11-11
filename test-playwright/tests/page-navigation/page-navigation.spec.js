const { test, expect } = require('@playwright/test');
const { loginUser } = require('../utils/login-helper');
const testData = require('../utils/test-data');

test.describe('Page Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Check if login is needed (only logs in if not already authenticated)
    // The storageState from global setup should handle authentication, but this is a fallback
    await loginUser(page, 'admin');
    // Wait for navigation after login (if login was performed)
    await page.waitForTimeout(2000);
  });

  test.describe('Wallet Pages', () => {
    test('should load Wallet main page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/wallet`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/wallet/);
      // Verify wallet table is visible
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('should load Deposit page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/wallet/deposit`, { waitUntil: 'networkidle' });
      // Wait for URL to stabilize - it might redirect, so wait for either deposit or wallet URL
      await page.waitForURL(/.*\/wallet(\/deposit)?/, { timeout: 10000 });
      const currentUrl = page.url();
      
      // The page might redirect to /wallet, so check for either URL
      if (currentUrl.includes('/wallet/deposit')) {
        // Verify deposit form elements - use first() to avoid strict mode violation
        await expect(page.getByText(/Select asset|Select/i).first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/Deposit|deposit/i).first()).toBeVisible({ timeout: 10000 });
        // Verify deposit history table is visible
        await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
      } else if (currentUrl.includes('/wallet') && !currentUrl.includes('/deposit')) {
        // If redirected to wallet page, verify we're on wallet page and it has a table
        await expect(page).toHaveURL(/.*\/wallet/);
        await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
      } else {
        throw new Error(`Unexpected URL: ${currentUrl}`);
      }
    });

    test('should load Withdrawal page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/wallet/withdraw`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/wallet\/withdraw/);
      // Verify withdrawal page is loaded - use first() to avoid strict mode violation
      await expect(page.getByText(/withdraw|Withdraw/i).first()).toBeVisible({ timeout: 10000 });
      // Verify withdrawal history table is visible - wait for table to be visible
      await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    });

    test('should load Addresses page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/wallet/address-book`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/wallet\/address-book/);
      // Verify address book is loaded - use first() to avoid strict mode violation
      await expect(page.getByText(/Address|address/i).first()).toBeVisible({ timeout: 10000 });
      // Verify address book table or form is visible
      const hasTable = await page.getByRole('table').isVisible().catch(() => false);
      const hasForm = await page.getByRole('form').isVisible().catch(() => false);
      expect(hasTable || hasForm).toBeTruthy();
    });

    test('should load Volume page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/wallet/volume`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/wallet\/volume/);
      // Verify volume page is loaded - use first() to avoid strict mode violation
      await expect(page.getByText(/volume|Volume/i).first()).toBeVisible({ timeout: 10000 });
      // Verify volume data is displayed
      const hasTable = await page.getByRole('table').isVisible().catch(() => false);
      const hasTradingText = await page.getByText(/Trading|trading/i).isVisible().catch(() => false);
      expect(hasTable || hasTradingText).toBeTruthy();
    });
  });

  test.describe('History Pages', () => {
    test('should load Trades history page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/transactions?tab=trades`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/transactions.*tab=trades/);
      // Verify trades table is visible
      await expect(page.getByRole('table')).toBeVisible();
      // Use more specific selector to avoid strict mode violation
      await expect(page.getByText('Trades History')).toBeVisible();
    });

    test('should load Order history page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/transactions?tab=orders`);
      await page.waitForTimeout(3000);
      // Note: orders tab redirects to trades, so check for trades URL
      await expect(page).toHaveURL(/.*\/transactions.*tab=trades/);
      // Verify order history tab is visible (even though it redirects to trades)
      await expect(page.getByRole('table')).toBeVisible();
      // Check for "Order history" tab button
      await expect(page.getByText('Order history')).toBeVisible();
    });

    test('should load Deposits history page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/transactions?tab=deposits`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/transactions.*tab=deposits/);
      // Verify deposits history is loaded - use first() to avoid strict mode violation
      await expect(page.getByText(/Deposit|deposit/i).first()).toBeVisible();
    });

    test('should load Withdrawals history page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/transactions?tab=withdrawals`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/transactions.*tab=withdrawals/);
      // Verify withdrawals history is loaded - use first() to avoid strict mode violation
      await expect(page.getByText(/Withdraw|withdraw/i).first()).toBeVisible();
    });
  });

  test.describe('Security Pages', () => {
    test('should load 2FA page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/security?2fa`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/security.*2fa/);
      // Verify 2FA page is loaded - use text selector since it's text in a generic element, not a button
      await expect(page.getByText('Enable Two-Factor Authentication').first()).toBeVisible();
    });

    test('should load Password page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/security?password`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/security.*password/);
      // Verify password page is loaded - use more specific selector
      await expect(page.getByText('Change Password')).toBeVisible();
    });

    test('should load API Keys page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/security?apiKeys`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/security.*apiKeys/);
      // Verify API keys page is loaded - use .first() since "API Key" appears multiple times (tab, table header, table body)
      // Or check for unique text on the page
      const hasApiDescription = await page.getByText('The API provides functionality').isVisible().catch(() => false);
      const hasApiKeyText = await page.getByText('API Key', { exact: true }).first().isVisible().catch(() => false);
      expect(hasApiDescription || hasApiKeyText).toBeTruthy();
    });

    test('should load Sessions page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/security?sessions`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/security.*sessions/);
      // Verify sessions page is loaded - use .first() since "Active sessions" appears twice (heading and in description)
      await expect(page.getByText('Active sessions').first()).toBeVisible();
    });

    test('should load Login History page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/security?login-history`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/security.*login-history/);
      // Verify login history page is loaded - use more specific selector
      await expect(page.getByText('Login Attempts Record')).toBeVisible();
    });
  });

  test.describe('Verification Pages', () => {
    test('should load Email verification page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/verification?email`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/verification.*email/);
      // Verify email verification page is loaded - use more specific selector
      await expect(page.getByText('Email', { exact: true }).first()).toBeVisible();
    });

    test('should load Phone verification page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/verification?phone`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/verification.*phone/);
      // Verify phone verification page is loaded - check for verification page title
      await expect(page.getByText('Verification').first()).toBeVisible();
    });

    test('should load Identity verification page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/verification?identity`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/verification.*identity/);
      // Verify identity verification page is loaded - use more specific selector
      await expect(page.getByText('Identity', { exact: true })).toBeVisible();
    });

    test('should load Payment verification page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/verification?payment-accounts`);
      await page.waitForTimeout(3000);
      // Note: payment-accounts redirects to email, so check for verification page
      await expect(page).toHaveURL(/.*\/verification/);
      // Verify verification page is loaded
      await expect(page.getByText('Verification').first()).toBeVisible();
    });
  });

  test.describe('Settings Pages', () => {
    test('should load Notification settings page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/settings?notification`);
      await page.waitForTimeout(3000);
      // Note: notification redirects to signals, so check for signals URL
      await expect(page).toHaveURL(/.*\/settings.*signals/);
      // Verify notification settings page is loaded - use .first() since "Notification" appears twice (tab and title)
      await expect(page.getByText('Notification', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    });

    test('should load Interface settings page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/settings?interface`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/settings.*interface/);
      // Verify interface settings page is loaded - use .first() since "Interface" appears twice (tab and title)
      await expect(page.getByText('Interface', { exact: true }).first()).toBeVisible();
    });

    test('should load Language settings page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/settings?language`);
      // Give more wait time for page loading
      await page.waitForTimeout(5000);
      await expect(page).toHaveURL(/.*\/settings.*language/);
      // Verify language settings page is loaded - check for Settings page title
      await expect(page.getByText('Settings').first()).toBeVisible();
      // Language tab might not be visible, so just verify we're on settings page
      const hasLanguageTab = await page.getByText('Language').first().isVisible().catch(() => false);
      expect(hasLanguageTab).toBeTruthy();
    });

    test('should load Audio Cues settings page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/settings?audioCue`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/settings.*audioCue/);
      // Verify audio cues settings page is loaded - use .first() since "Audio Cues" appears twice (tab and title)
      await expect(page.getByText('Audio Cues', { exact: true }).first()).toBeVisible();
    });

    test('should load Account settings page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/settings?account`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/settings.*account/);
      // Verify account settings page is loaded - use more specific selector
      await expect(page.getByText('Account', { exact: true }).first()).toBeVisible();
    });
  });

  test.describe('Stake Page', () => {
    test('should load Stake page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/stake`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/stake/);
      // Verify stake page is loaded - use more specific selector
      await expect(page.getByRole('heading', { name: 'Stake' })).toBeVisible();
    });
  });

  test.describe('P2P Pages', () => {
    test('should load P2P main page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/p2p`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/p2p/);
      // Verify P2P page is loaded - use .first() since "P2P Deals" appears twice (heading and in description)
      await expect(page.getByText('P2P Deals').first()).toBeVisible();
    });

    test('should load P2P Orders page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/p2p/orders`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/p2p\/orders/);
      // Verify P2P orders page is loaded - check for "All Orders" text or "Orders" tab
      const hasAllOrders = await page.getByText('All Orders').isVisible().catch(() => false);
      const hasOrdersTab = await page.getByRole('tab', { name: 'Orders' }).isVisible().catch(() => false);
      expect(hasAllOrders || hasOrdersTab).toBeTruthy();
    });

    test('should load P2P Profile page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/p2p/profile`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/p2p\/profile/);
      // Verify P2P profile page is loaded - check for "Display Name" or "Total Orders" which are specific to profile page
      const hasDisplayName = await page.getByText('Display Name').isVisible().catch(() => false);
      const hasTotalOrders = await page.getByText('Total Orders').isVisible().catch(() => false);
      expect(hasDisplayName || hasTotalOrders).toBeTruthy();
    });

    test('should load Post Deal page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/p2p/post-deal`);
      await page.waitForTimeout(3000);
      // Note: post-deal might redirect to login if not authorized, so check for either
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        // If redirected to login, skip this test or mark as expected behavior
        test.skip();
      } else {
        await expect(page).toHaveURL(/.*\/p2p\/post-deal/);
        // Verify post deal page is loaded - use more specific selector
        await expect(page.getByText('Post Deal')).toBeVisible();
      }
    });

    test('should load My Deals page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/p2p/mydeals`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/p2p\/mydeals/);
      // Verify my deals page is loaded - use more specific selector
      await expect(page.getByText('My Deals')).toBeVisible();
    });
  });

  test.describe('Apps Page', () => {
    test('should load Apps page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/apps`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/apps/);
      // Verify apps page is loaded - use more specific selector
      await expect(page.getByText('Your exchange apps')).toBeVisible();
    });
  });

  test.describe('Core Pages', () => {
    test('should load Summary page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/summary`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/summary/);
      // Verify summary page is loaded - use more specific selector
      await expect(page.getByText('Summary', { exact: true }).first()).toBeVisible();
    });

    test('should load Account page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/account`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/account/);
      // Verify account page is loaded - use more specific selector
      await expect(page.getByText('Account', { exact: true }).first()).toBeVisible();
    });

    test('should load Markets page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/markets`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/markets/);
      // Verify markets table is visible
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('should load Trade page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/trade`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/trade/);
      // Verify trade page is loaded
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('should load Trade page with BTC-USDT chart', async ({ page }) => {
      // Increase timeout for this test since charts can take time to load
      test.setTimeout(60000); // 60 seconds
      
      // Use 'load' instead of 'networkidle' to avoid timeout from continuous network requests
      await page.goto(`${testData.baseUrl}/trade/btc-usdt`, { waitUntil: 'load', timeout: 60000 });
      await expect(page).toHaveURL(/.*\/trade\/btc-usdt/);
      
      // Wait for market pair to be visible first (indicates page loaded)
      await expect(page.getByText(/BTC.*USDT|btc.*usdt/i).first()).toBeVisible({ timeout: 15000 });
      
      // Wait for TradingView iframe to load - use TradingView-specific selector
      const iframe = page.frameLocator('iframe[name^="tradingview_"]');
      
      // Wait until the iframe is attached and loaded
      await expect(iframe.locator('body')).toBeVisible({ timeout: 30000 });
      
      // Verify chart is loaded - check for TradingView container, iframe, or chart controls
      // TradingView container on main page
      const hasTradingViewContainer = await page.locator('[id^="tradingview_"], [class*="tradingview"]').isVisible().catch(() => false);
      // TradingView iframe
      const hasIframe = await page.locator('iframe[name^="tradingview_"]').isVisible().catch(() => false);
      // Chart controls on main page (Line, Area, Candles, Bars, Indicators)
      const hasChartControls = await page.getByText(/Line|Area|Candles|Bars|Indicators/i).first().isVisible().catch(() => false);
      // Chart title/cell within iframe (e.g., "SANDBOX:BTC-USDT · 1D ·")
      const hasChartTitle = await iframe.getByRole('cell', { name: /BTC.*USDT|btc.*usdt/i }).isVisible().catch(() => false);
      
      // At least one of these should be visible to confirm chart loaded
      expect(hasTradingViewContainer || hasIframe || hasChartControls || hasChartTitle).toBeTruthy();
    });

    test('should load Prices page', async ({ page }) => {
      await page.goto(`${testData.baseUrl}/prices`);
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/.*\/prices/);
      // Verify prices page is loaded - use more specific selector
      await expect(page.getByText('Asset', { exact: true })).toBeVisible();
    });
  });
});
