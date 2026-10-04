import { test, expect } from '@playwright/test';

test.describe('Servilist Marketplace Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    // Clear storage to ensure pristine test run
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('Complete Marketplace Lifecycle: Post Auction, Bid, Post Request, Quote, Accept Quote to Escrow, Release OTP', async ({
    page,
  }) => {
    // Verify page title and listings container
    await expect(page).toHaveTitle(/Servilist/i);
    await expect(page.locator('#listingsContainer')).toBeVisible();

    // -------------------------------------------------------------
    // Step 1: Post an Auction Listing
    // -------------------------------------------------------------
    const openPostBtn = page.locator('#openPostModalBtn');
    await expect(openPostBtn).toBeVisible();
    await openPostBtn.click();

    const postModal = page.locator('#postModalOverlay');
    await expect(postModal).toBeVisible();

    // Ensure Sell tab is selected
    await page.locator('#modalTabSell').click();

    // Select 'auction' format radio
    await page.locator('input[name="postFormat"][value="auction"]').check();

    // Verify auction-specific controls are visible
    await expect(page.locator('#auctionDurationGroup')).toBeVisible();
    await expect(page.locator('#reservePriceGroup')).toBeVisible();

    // Fill auction details
    const auctionTitle = 'Toyota Land Cruiser Prado 2022 V6';
    await page.locator('#postTitle').fill(auctionTitle);
    await page.locator('#postCategory').selectOption('vehicles');
    await page.locator('#postCity').selectOption('Lagos, Nigeria');
    await page.locator('#postStartPrice').fill('35000000');
    await page.locator('#postDuration').selectOption('24');
    await page.locator('#postReservePrice').fill('36000000');
    await page
      .locator('#postImageUrl')
      .fill(
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
      );
    await page
      .locator('#postDescription')
      .fill(
        'Immaculate condition, full options, Nigerian duty paid, ready for inspection in Victoria Island.'
      );

    // Submit form
    await page.locator('#postListingForm button[type="submit"]').click();

    // Modal should close
    await expect(postModal).toBeHidden();

    // Listing should appear in listings container
    const auctionCard = page
      .locator('#listingsContainer .listing-card', { hasText: auctionTitle })
      .first();
    await expect(auctionCard).toBeVisible();

    // -------------------------------------------------------------
    // Step 2: Bid on the Auction Listing
    // -------------------------------------------------------------
    await auctionCard.click();

    const detailModal = page.locator('#detailModalOverlay');
    await expect(detailModal).toBeVisible();
    await expect(page.locator('#detailTitle')).toHaveText(auctionTitle);

    // Verify auction action box & bid form
    const bidForm = page.locator('#detailBidForm');
    await expect(bidForm).toBeVisible();

    const bidInput = page.locator('#detailBidInput');
    await expect(bidInput).toBeVisible();

    // Enter a valid higher bid
    const currentBidVal = await bidInput.inputValue();
    const newBidVal = Math.round(Number(currentBidVal) * 1.1 + 50000).toString();
    await bidInput.fill(newBidVal);

    // Submit bid
    await bidForm.locator('button.btn-place-bid').click();

    // Verify toast notification appears
    const toast = page.locator('#toastContainer .toast, .toast').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/Highest Bid placed/i);

    // Close detail modal
    await page.locator('#closeDetailModalBtn').click();
    await expect(detailModal).toBeHidden();

    // -------------------------------------------------------------
    // Step 3: Post a Buyer Request
    // -------------------------------------------------------------
    const openReqBtn = page.locator('#openRequestModalBtn');
    await expect(openReqBtn).toBeVisible();
    await openReqBtn.click();

    await expect(postModal).toBeVisible();
    await expect(page.locator('#postRequestForm')).toBeVisible();

    // Select service request type
    await page.locator('input[name="requestType"][value="service"]').check();

    const requestTitle = 'Need 10kVA Hybrid Solar Inverter + Lithium Battery';
    await page.locator('#reqTitle').fill(requestTitle);
    await page.locator('#reqCategory').selectOption('solar');
    await page.locator('#reqCity').selectOption('Lagos, Nigeria');
    await page.locator('#reqBudget').fill('2500000');
    await page
      .locator('#reqDescription')
      .fill(
        'Looking for verified solar technician to install complete 10kVA inverter and 15kWh lithium setup in Ikeja.'
      );

    // Submit request
    await page.locator('#postRequestForm button[type="submit"]').click();
    await expect(postModal).toBeHidden();

    // Switch to Buyer Requests pill to see requests
    await page.locator('.pill-btn[data-format="requests"]').click();

    // Locate the posted request card
    const requestCard = page
      .locator('#listingsContainer .listing-card', { hasText: requestTitle })
      .first();
    await expect(requestCard).toBeVisible();

    // -------------------------------------------------------------
    // Step 4: Quote on the Buyer Request
    // -------------------------------------------------------------
    await requestCard.click();
    await expect(detailModal).toBeVisible();
    await expect(page.locator('#detailTitle')).toHaveText(requestTitle);

    // Submit quote form inside detail action box
    const quoteForm = page.locator('#detailQuoteForm');
    await expect(quoteForm).toBeVisible();

    await page.locator('#quotePriceInput').fill('2400000');
    await page.locator('#quoteTimelineInput').fill('Available immediately, installation in 2 days');
    await page
      .locator('#quoteMessageInput')
      .fill('We supply certified Tier 1 inverter and CATL cells with 5-year replacement warranty.');

    // Submit quote
    await quoteForm.locator('button.btn-submit-quote').click();

    // Verify quote appears in proposals list
    await expect(page.locator('#detailQuotesList')).toBeVisible();
    const quoteItem = page.locator('.quote-item-card', { hasText: 'CATL cells' }).first();
    await expect(quoteItem).toBeVisible();

    // -------------------------------------------------------------
    // Step 5: Accept the Quote into Escrow
    // -------------------------------------------------------------
    const acceptOfferBtn = quoteItem.locator('.btn-detail-accept-quote');
    await expect(acceptOfferBtn).toBeVisible();
    await acceptOfferBtn.click();

    // Detail modal closes and separate Buyer dashboard modal opens to Order Tracking & Escrow tab
    const dashboardsModal = page.locator('#buyerDashboardModalOverlay, #dashboardsModalOverlay');
    await expect(dashboardsModal).toBeVisible();

    // Escrow panel should be active
    const escrowPanel = page.locator('#dashPanelEscrow');
    await expect(escrowPanel).toBeVisible();

    // Find the created escrow order
    const escrowOrder = page.locator('.escrow-order-card', { hasText: requestTitle }).first();
    await expect(escrowOrder).toBeVisible();
    await expect(escrowOrder).toContainText('Funds Locked in Escrow');

    // -------------------------------------------------------------
    // Step 6: Release Escrow with the correct OTP
    // -------------------------------------------------------------
    // Read the secret OTP from the order card
    const otpBadge = escrowOrder.locator('.otp-display-badge');
    await expect(otpBadge).toBeVisible();
    const rawOtp = (await otpBadge.textContent()) || '';
    const cleanOtp = rawOtp.trim();
    expect(cleanOtp.length).toBeGreaterThanOrEqual(6);

    // Input the OTP code
    const otpInput = escrowOrder.locator('.otp-input-field');
    await otpInput.fill(cleanOtp);

    // Click release payout
    const releaseBtn = escrowOrder.locator('.btn-release-escrow');
    await releaseBtn.click();

    // Assert payout released status
    await expect(escrowOrder).toContainText('Payout Released');
    await expect(escrowOrder).toContainText('successfully released');

    // Close buyer dashboard modal
    await page.locator('#closeBuyerDashboardModalBtn, #closeDashboardModalBtn').click();
    await expect(dashboardsModal).toBeHidden();
  });

  test('Navigation & Control Verification: Search, City/Currency, Sort, Grid/List, Converter Modal', async ({
    page,
  }) => {
    // 1. Grid/List view toggle
    const listingsContainer = page.locator('#listingsContainer');
    const viewListBtn = page.locator('#viewListBtn');
    const viewGridBtn = page.locator('#viewGridBtn');

    await viewListBtn.click();
    await expect(listingsContainer).toHaveClass(/list-mode/);

    await viewGridBtn.click();
    await expect(listingsContainer).toHaveClass(/grid-mode/);

    // 2. City & Currency selector sync
    const citySelector = page.locator('#citySelector');
    const currSelector = page.locator('#currencySelector');

    await citySelector.selectOption('Nairobi, Kenya');
    // Selecting Nairobi should switch active currency to KES
    await expect(currSelector).toHaveValue('KES');

    // 3. Search omnibar & Clear search
    const searchInput = page.locator('#searchInput');
    const clearSearchBtn = page.locator('#clearSearchBtn');

    await searchInput.fill('Solar');
    await page.locator('#searchSubmitBtn').click();
    await expect(clearSearchBtn).toBeVisible();

    await clearSearchBtn.click();
    await expect(searchInput).toHaveValue('');

    // 4. Reset filters
    const resetFiltersBtn = page.locator('#resetFiltersBtn');
    await resetFiltersBtn.click();

    // 5. Currency Converter Modal
    const openConverterBtn = page.locator('#openConverterBtn');
    await openConverterBtn.click();

    const convModal = page.locator('#converterModalOverlay');
    await expect(convModal).toBeVisible();
    await expect(page.locator('#convMainResultDisplay')).not.toBeEmpty();

    await page.locator('#closeConverterModalBtn').click();
    await expect(convModal).toBeHidden();
  });

  test('Mobile Phone-First Usability at 360px Width with Throttling & Accessibility', async ({
    page,
  }) => {
    // 1. Set small mobile screen size (360px width standard African Android phones)
    await page.setViewportSize({ width: 360, height: 640 });

    // 2. Simulate 3G throttled network connection via CDP
    try {
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150, // 150ms round-trip latency
        downloadThroughput: (750 * 1024) / 8, // ~750 kbps
        uploadThroughput: (250 * 1024) / 8, // ~250 kbps
      });
    } catch {
      // Non-CDP fallback if session not supported
    }

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 3. Assert no horizontal overflow occurs at 360px
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 4. Assert bottom navigation bar is visible and interactive
    const bottomNav = page.locator('#servilistBottomNav');
    await expect(bottomNav).toBeVisible();

    // Check bottom nav items
    await expect(page.locator('#bottomNavBrowse')).toBeVisible();
    await expect(page.locator('#bottomNavRequests')).toBeVisible();
    await expect(page.locator('#bottomNavPost')).toBeVisible();
    await expect(page.locator('#bottomNavBids')).toBeVisible();
    await expect(page.locator('#bottomNavDashboards')).toBeVisible();

    // 5. Test opening post sheet via mobile FAB
    await page.locator('#bottomNavPost').click();
    const postModal = page.locator('#postModalOverlay');
    await expect(postModal).toBeVisible();

    // Verify mobile sheet handle exists
    const dragHandle = postModal.locator('.sheet-drag-handle');
    await expect(dragHandle).toBeVisible();

    // Close using Escape key (accessibility keyboard support)
    await page.keyboard.press('Escape');
    await expect(postModal).toBeHidden();

    // 6. Test bottom nav navigation to Requests filter
    await page.locator('#bottomNavRequests').click();
    await expect(page.locator('.pill-btn[data-format="requests"]')).toHaveClass(/active/);
  });

  test('Independent Dashboards: Buyer, Seller, and Multi-Vendor Admin Dashboards are non-unified', async ({
    page,
  }) => {
    // 1. Buyer Dashboard Verification
    const openBuyerBtn = page.locator('#openBuyerDashBtn');
    await expect(openBuyerBtn).toBeVisible();
    await openBuyerBtn.click();

    const buyerModal = page.locator('#buyerDashboardModalOverlay');
    await expect(buyerModal).toBeVisible();
    await expect(page.locator('#sellerDashboardModalOverlay')).toBeHidden();
    await expect(page.locator('#adminDashboardModalOverlay')).toBeHidden();

    // Verify Buyer Sub-tabs
    await expect(page.locator('.dash-subnav-btn[data-buyer-tab="orders"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-buyer-tab="history"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-buyer-tab="wishlist"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-buyer-tab="communication"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-buyer-tab="settings"]')).toBeVisible();

    // Switch to Wishlist & Price Alerts tab
    await page.locator('.dash-subnav-btn[data-buyer-tab="wishlist"]').click();
    await expect(page.locator('.wishlist-item-card').first()).toBeVisible();

    // Switch to Account Settings
    await page.locator('.dash-subnav-btn[data-buyer-tab="settings"]').click();
    await expect(page.locator('.address-card').first()).toBeVisible();

    // Close Buyer Dashboard
    await page.locator('#closeBuyerDashboardModalBtn').click();
    await expect(buyerModal).toBeHidden();

    // 2. Seller Dashboard Verification
    const openSellerBtn = page.locator('#openSellerDashBtn');
    await expect(openSellerBtn).toBeVisible();
    await openSellerBtn.click();

    const sellerModal = page.locator('#sellerDashboardModalOverlay');
    await expect(sellerModal).toBeVisible();
    await expect(page.locator('#buyerDashboardModalOverlay')).toBeHidden();
    await expect(page.locator('#adminDashboardModalOverlay')).toBeHidden();

    // Verify Seller Sub-tabs
    await expect(page.locator('.dash-subnav-btn[data-seller-tab="analytics"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-seller-tab="inventory"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-seller-tab="fulfillment"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-seller-tab="support"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-seller-tab="finance"]')).toBeVisible();

    // Switch to Inventory Management
    await page.locator('.dash-subnav-btn[data-seller-tab="inventory"]').click();
    await expect(page.locator('.inventory-table')).toBeVisible();

    // Switch to Order Fulfillment
    await page.locator('.dash-subnav-btn[data-seller-tab="fulfillment"]').click();
    await expect(page.locator('.fulfillment-card').first()).toBeVisible();

    // Close Seller Dashboard
    await page.locator('#closeSellerDashboardModalBtn').click();
    await expect(sellerModal).toBeHidden();

    // 3. Multi-Vendor Admin Dashboard Verification
    const openAdminBtn = page.locator('#openAdminDashBtn');
    await expect(openAdminBtn).toBeVisible();
    await openAdminBtn.click();

    const adminModal = page.locator('#adminDashboardModalOverlay');
    await expect(adminModal).toBeVisible();
    await expect(page.locator('#buyerDashboardModalOverlay')).toBeHidden();
    await expect(page.locator('#sellerDashboardModalOverlay')).toBeHidden();

    // Verify mandatory admin statement
    await expect(adminModal).toContainText(
      'An admin dashboard must include platform-wide analytics, user and vendor management controls, dispute resolution tools, and system configuration settings to oversee the entire marketplace.'
    );

    // Verify Admin Sub-tabs
    await expect(page.locator('.dash-subnav-btn[data-admin-tab="analytics"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-admin-tab="compliance"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-admin-tab="finance"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-admin-tab="catalog"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-admin-tab="performance"]')).toBeVisible();
    await expect(page.locator('.dash-subnav-btn[data-admin-tab="settings"]')).toBeVisible();

    // Switch to Vendor Onboarding & KYC
    await page.locator('.dash-subnav-btn[data-admin-tab="compliance"]').click();
    await expect(page.locator('.compliance-table')).toBeVisible();

    // Switch to Split Payouts & VAT
    await page.locator('.dash-subnav-btn[data-admin-tab="finance"]').click();
    await expect(page.locator('#splitRouterSelect')).toBeVisible();

    // Switch to Catalog Oversight
    await page.locator('.dash-subnav-btn[data-admin-tab="catalog"]').click();
    await expect(page.locator('input[name="skuModeRadio"]').first()).toBeVisible();

    // Switch to Vendor Scorecards & Disputes
    await page.locator('.dash-subnav-btn[data-admin-tab="performance"]').click();
    await expect(page.locator('.scorecards-grid').first()).toBeVisible();

    // Close Admin Dashboard
    await page.locator('#closeAdminDashboardModalBtn').click();
    await expect(adminModal).toBeHidden();
  });
});
