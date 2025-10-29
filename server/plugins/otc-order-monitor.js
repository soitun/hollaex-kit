'use strict';

const toolsLib = require('hollaex-tools-lib');
const { loggerPlugin } = require('../config/logger');
const redisClient = require('../db/redis');
const { PRICE_HASH_KEY } = require('../constants');

// Keep a local cache of relevant open OTC orders by symbol
// Structure: { 'btc-usdt': [ { id, side, price, size, created_by, meta, ... }, ... ] }
let otcOpenOrdersBySymbol = {};
let initialized = false;

const getUsdtPriceForCoin = async (coin) => {
	const coinKey = String(coin || '').toLowerCase();
	if (coinKey === 'usdt') return 1;
	try {
		const value = await redisClient.hgetAsync(PRICE_HASH_KEY, coinKey);
		if (value == null) return null;
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	} catch (err) {
		return null;
	}
};

const getCurrentPriceForSymbol = async (marketSymbol) => {
	// Market symbol is base-quote (e.g., btc-usdt, ton-btc)
	// Price feed is per-coin in USDT; compute market price as base_usdt / quote_usdt
	if (!marketSymbol || typeof marketSymbol !== 'string' || !marketSymbol.includes('-')) return null;
	const [baseRaw, quoteRaw] = marketSymbol.split('-');
	const base = String(baseRaw).toLowerCase();
	const quote = String(quoteRaw).toLowerCase();
	const baseUsdt = await getUsdtPriceForCoin(base);
	const quoteUsdt = await getUsdtPriceForCoin(quote);
	if (baseUsdt == null || quoteUsdt == null || !Number.isFinite(baseUsdt) || !Number.isFinite(quoteUsdt) || quoteUsdt === 0) {
		return null;
	}
	return baseUsdt / quoteUsdt;
};

const refreshOtcOpenOrders = async () => {
	try {
		// Fetch exchange orders: status=open or open=true to get only open ones
		// We cap page size to a reasonable limit per call; if needed, iterate pages later
		const res = await toolsLib.order.getAllExchangeOrders(null, null, null, true, null, null, 'created_at', 'desc', null, null, 'all', {});
		const orders = (res && res.data) || [];
		loggerPlugin.verbose('plugins/otc-order-monitor refreshOtcOpenOrders length', orders.length);

		const grouped = {};
		for (const order of orders) {
			const meta = order.meta || {};
			if (meta.broker === 'otc') {
				if (!grouped[order.symbol]) grouped[order.symbol] = [];
				grouped[order.symbol].push(order);
			}
		}
		otcOpenOrdersBySymbol = grouped;
		loggerPlugin.verbose('plugins/otc-order-monitor refreshOtcOpenOrders', Object.keys(otcOpenOrdersBySymbol));

		// Immediately check prices for refreshed symbols
		for (const symbol of Object.keys(otcOpenOrdersBySymbol)) {
			try {
				await checkAndTriggerOtcOrdersForSymbol(symbol);
			} catch (err) {
				loggerPlugin.error('plugins/otc-order-monitor refresh check error', symbol, err.message);
			}
		}
	} catch (err) {
		loggerPlugin.error('plugins/otc-order-monitor refreshOtcOpenOrders error', err.message);
	}
};

const checkAndTriggerOtcOrdersForSymbol = async (symbol) => {
	const currentPrice = await getCurrentPriceForSymbol(symbol);
	if (currentPrice == null) return;
	const orders = otcOpenOrdersBySymbol[symbol] || [];
	for (const order of orders) {
		// Only consider limit orders that are still open
		if (order.status !== 'new' && order.status !== 'pfilled') continue;
		if (order.type && order.type !== 'limit') continue;

		const orderPrice = Number(order.price);
		if (!Number.isFinite(orderPrice)) continue;

		if (order.side === 'buy') {
			loggerPlugin.verbose('plugins/otc-order-monitor checkAndTriggerOtcOrdersForSymbol buy', { id: order.id, symbol, orderPrice, currentPrice });
			// Execute when market price <= order price
			if (currentPrice <= orderPrice) {
				loggerPlugin.verbose('plugins/otc-order-monitor match BUY', { id: order.id, symbol, orderPrice, currentPrice });
				// TODO: Execute the order
			}
		} else if (order.side === 'sell') {
			loggerPlugin.verbose('plugins/otc-order-monitor checkAndTriggerOtcOrdersForSymbol sell', { id: order.id, symbol, orderPrice, currentPrice });
			// Execute when market price >= order price
			if (currentPrice >= orderPrice) {
				loggerPlugin.verbose('plugins/otc-order-monitor match SELL', { id: order.id, symbol, orderPrice, currentPrice });
				// TODO: Execute the order
			}
		}
	}
};

const start = async () => {
	if (initialized) return;
	initialized = true;
	await refreshOtcOpenOrders();

	// Periodically refresh the open OTC orders list
	setInterval(refreshOtcOpenOrders, 2 * 60 * 1000);
	loggerPlugin.info('plugins/otc-order-monitor started');
};

start();

module.exports = { start };


