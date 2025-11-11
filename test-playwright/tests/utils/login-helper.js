const testData = require('./test-data');

/**
 * Check if user is already authenticated by checking cookies and trying to access a protected page
 * Returns true if authenticated, false otherwise
 */
async function isAuthenticated(page) {
  try {
    // Check cookies first - if we have auth cookies, we're likely authenticated
    const cookies = await page.context().cookies();
    const hasAuthCookies = cookies.length > 0 && cookies.some(cookie => {
      const name = cookie.name.toLowerCase();
      return name.includes('token') || 
             name.includes('auth') || 
             name.includes('session') ||
             name.includes('access') ||
             name.includes('jwt') ||
             name.includes('cookie');
    });
    
    // If we have cookies (especially from storageState), try to verify by accessing a protected page
    if (hasAuthCookies || cookies.length > 0) {
      // Try navigating to a protected page to verify authentication
      try {
        // Use a short timeout to quickly check if we're authenticated
        await page.goto(`${testData.baseUrl}/wallet`, { waitUntil: 'domcontentloaded', timeout: 5000 });
        const url = page.url();
        // If we're not redirected to login, we're authenticated
        if (!url.includes('/login')) {
          return true;
        }
      } catch (error) {
        // If navigation times out or fails, check the current URL
        const url = page.url();
        if (url && !url.includes('/login') && !url.includes('about:blank')) {
          return true;
        }
      }
    }
    
    // If no cookies or check failed, check current page state
    const currentUrl = page.url();
    if (currentUrl && !currentUrl.includes('/login') && !currentUrl.includes('about:blank')) {
      // If we're on a protected page, we're likely authenticated
      if (currentUrl.includes('/account') || currentUrl.includes('/wallet') || currentUrl.includes('/trade')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    // If check fails, assume not authenticated
    return false;
  }
}

/**
 * Shared login helper to avoid repeated logins and handle common issues
 * Only logs in if authentication is not already valid
 */
async function loginUser(page, userType = 'admin') {
  // Check if already authenticated
  const authenticated = await isAuthenticated(page);
  if (authenticated) {
    console.log('✅ Already authenticated, skipping login');
    return;
  }
  
  console.log('🔐 Performing login...');
  const user = testData.users[userType];
  
  // Navigate to login page
  await page.goto(`${testData.baseUrl}/login`, { waitUntil: 'load', timeout: 10000 });
  
  // Check if we're redirected away from login (already authenticated)
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    console.log('✅ Already authenticated (redirected from login page)');
    return;
  }
  
  // Wait for login form to be visible
  await page.getByRole('textbox', { name: 'Type your Email address' }).waitFor({ state: 'visible', timeout: 10000 });
  
  // Fill login form
  await page.getByRole('textbox', { name: 'Type your Email address' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Type your password' }).fill(user.password);
  
  // Click login button
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Wait for successful login - check for account page or dashboard
  try {
    await page.waitForURL('**/account', { timeout: 15000 });
  } catch (error) {
    // If account page doesn't load, check if we're redirected to dashboard or other page
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // Verify we're not still on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }
  }
  
  // Verify login was successful by checking for user account elements
  try {
    await page.waitForSelector('[class*="account"], [class*="user"], [class*="deposit"]', { timeout: 5000 }).catch(() => {
      // If selector not found, check URL to ensure we're logged in
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('Login failed - redirected back to login page');
      }
    });
  } catch (error) {
    // If login verification fails, throw error
    if (error.message.includes('Login failed')) {
      throw error;
    }
  }
  
  // Wait for any loading indicators to disappear
  try {
    await page.waitForFunction(() => {
      const loaders = document.querySelectorAll('.loader_background, .loader_wrapper, .ant-spin');
      return loaders.length === 0 || Array.from(loaders).every(loader => loader.style.display === 'none');
    }, { timeout: 10000 });
  } catch (error) {
    // If page is closed or function fails, just continue
    if (!error.message.includes('Target page, context or browser has been closed')) {
      throw error;
    }
  }
  
  console.log('✅ Login successful');
}

/**
 * Navigate to a specific transaction page
 */
async function navigateToTransactionPage(page, tab) {
  const url = `${testData.baseUrl}/transactions?tab=${tab}`;
  await page.goto(url);
  
  // Wait for URL to contain the correct tab
  await page.waitForURL(`**/transactions?tab=${tab}`, { timeout: 15000 });
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading indicators to disappear
  try {
    await page.waitForFunction(() => {
      const loaders = document.querySelectorAll('.loader_background, .loader_wrapper, .ant-spin');
      return loaders.length === 0 || Array.from(loaders).every(loader => loader.style.display === 'none');
    }, { timeout: 10000 });
  } catch (error) {
    // If page is closed or function fails, just continue
    if (!error.message.includes('Target page, context or browser has been closed')) {
      throw error;
    }
  }
  
  // Additional wait to ensure the correct page content is loaded
  await page.waitForTimeout(2000);
}

/**
 * Wait for element to be clickable (not blocked by loaders)
 */
async function waitForClickableElement(page, locator, timeout = 10000) {
  await locator.waitFor({ state: 'visible', timeout });
  
  // Wait for any blocking loaders to disappear
  await page.waitForFunction(() => {
    const loaders = document.querySelectorAll('.loader_background, .loader_wrapper, .ant-spin');
    return loaders.length === 0 || Array.from(loaders).every(loader => loader.style.display === 'none');
  }, { timeout });
  
  // Additional wait to ensure element is stable
  await page.waitForTimeout(500);
}

/**
 * Safe click that handles loader interference and element interception
 */
async function safeClick(page, locator, timeout = 10000) {
  await waitForClickableElement(page, locator, timeout);
  
  try {
    await locator.click({ timeout: 5000 });
  } catch (error) {
    if (error.message.includes('intercepts pointer events')) {
      // Try clicking on the parent element or use force click
      try {
        await locator.click({ force: true, timeout: 5000 });
      } catch (forceError) {
        // If force click fails, try clicking on the parent element
        const parent = locator.locator('..');
        await parent.click({ timeout: 5000 });
      }
    } else {
      throw error;
    }
  }
}

/**
 * Click on dropdown by targeting the wrapper element instead of input
 */
async function clickDropdown(page, labelText) {
  // Try to click on the dropdown wrapper instead of the input
  const dropdownWrapper = page.locator(`[aria-label*="${labelText}"], [data-testid*="${labelText}"], .ant-select:has-text("${labelText}")`).first();
  
  if (await dropdownWrapper.isVisible()) {
    await safeClick(page, dropdownWrapper);
  } else {
    // Fallback to original method
    await safeClick(page, page.getByRole('combobox', { name: labelText }));
  }
}

module.exports = {
  loginUser,
  navigateToTransactionPage,
  waitForClickableElement,
  safeClick,
  clickDropdown
};

