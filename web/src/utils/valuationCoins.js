import { DEFAULT_COIN_DATA } from 'config/constants';
import { modifyCoinsData } from 'utils/reducer';

/**
 * Display-only "valuation currencies" (e.g. fiat such as usd/krw used purely for
 * price/valuation display). They are intentionally kept OUT of `state.app.coins`
 * so they never appear as wallet/market assets in the many places that enumerate
 * coins. This module mirrors that metadata in a module-level cache so it can be
 * consulted from pure util functions (which have no redux access) as well as from
 * components, when resolving the *display/base currency* coin data.
 *
 * The cache is populated once at app initialization (see src/index.js).
 */
let VALUATION_COINS = {};

export const setValuationCoinsCache = (coins = {}) => {
	try {
		VALUATION_COINS = modifyCoinsData({ ...(coins || {}) });
	} catch (err) {
		VALUATION_COINS = coins || {};
	}
};

export const getValuationCoins = () => VALUATION_COINS;

/**
 * Resolve coin metadata for a (display/base) currency, falling back to the
 * valuation-currency cache and finally to DEFAULT_COIN_DATA. Use this anywhere a
 * display/base currency may be a non-listed valuation currency.
 */
export const resolveDisplayCoin = (coins, symbol) =>
	(coins && coins[symbol]) || VALUATION_COINS[symbol] || DEFAULT_COIN_DATA;
