# Page Navigation Tests

This directory contains comprehensive page navigation tests for the HollaEx platform.

## Test Coverage

The tests verify that all major pages load and render correctly:

- **Wallet Pages**: Deposit, Withdrawal, Addresses, Volume
- **History Pages**: Trades, Order history, Deposits, Withdrawals
- **Security Pages**: 2FA, Password, API Keys, Sessions, Login History
- **Verification Pages**: Email, Phone, Identity, Payment verification
- **Settings Pages**: Notification, Interface, Language, Audio Cues, Account
- **Stake Page**: Stake functionality
- **P2P Pages**: P2P main, Orders, Profile, Post Deal, My Deals
- **Apps Page**: Apps functionality
- **Core Pages**: Summary, Account, Markets, Trade, Prices

## Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env` file with test credentials:
```
ADMIN_USER=tech+admin@hollaex.com
ADMIN_PASS=bitholla123
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in headed mode (visible browser):
```bash
npm run test:headed
```

Run only page navigation tests:
```bash
npm run test:page-navigation
```

Run with UI mode:
```bash
npm run test:ui
```

## Test Structure

- `tests/page-navigation/page-navigation.spec.js` - Main test file
- `tests/utils/test-data.js` - Test data configuration
- `tests/utils/login-helper.js` - Login helper functions

## Notes

- Tests use admin credentials by default
- Tests wait 3 seconds after navigation for page load
- Tests verify URL patterns and page content visibility
- Tests do NOT perform sensitive operations (deposits, withdrawals, trading)

