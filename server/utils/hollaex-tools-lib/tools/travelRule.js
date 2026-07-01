'use strict';

const { SERVER_PATH } = require('../constants');
const { getModel } = require('./database/model');
const { getKitConfig } = require('./common');
const { getNodeLib } = require(`${SERVER_PATH}/init`);
const { loggerWithdrawals } = require(`${SERVER_PATH}/config/logger`);
const { Op } = require('sequelize');

// Fixed purpose/source list offered to users. "Other" is always last and lets
// the user type a free-text value (stored as-is in the `purpose` column).
const TRAVEL_RULE_PURPOSES = [
	'Personal transfer',
	'Investment',
	'Purchase of goods/services',
	'Salary/income',
	'Gift',
	'Trading',
	'Other'
];

// Counterparty service-provider types offered to users. The user first picks one,
// then identifies the counterparty (name, and the VASP/provider name for exchanges).
const TRAVEL_RULE_COUNTERPARTY_TYPES = ['exchange_vasp', 'self_custody'];

const getTravelRuleConfig = () => getKitConfig()?.travel_rule || {};

const isTravelRuleActive = () => getTravelRuleConfig().active === true;

/**
 * Converts `amount` of `currency` into the exchange native currency. Returns the
 * converted value, or null when the conversion can't be determined (so callers
 * can skip the travel-rule check rather than block normal operations).
 */
const convertToNative = async (currency, amount) => {
	const nativeCurrency = getKitConfig().native_currency;
	if (!nativeCurrency || !currency) {
		return null;
	}
	if (currency === nativeCurrency) {
		return amount;
	}
	try {
		const converted = await getNodeLib().getOraclePrices([currency], {
			quote: nativeCurrency,
			amount
		});
		if (!converted || converted[currency] === -1 || converted[currency] == null) {
			loggerWithdrawals.warn(
				'tools/travelRule/convertToNative no conversion',
				'currency', currency,
				'native', nativeCurrency
			);
			return null;
		}
		return converted[currency];
	} catch (err) {
		loggerWithdrawals.error('tools/travelRule/convertToNative', err.message);
		return null;
	}
};

/**
 * True when the travel rule is active and the native-currency value of the given
 * amount is at or above the configured threshold. Returns the resolved native
 * amount alongside the verdict so callers can persist it.
 */
const isAboveThreshold = async (currency, amount) => {
	if (!isTravelRuleActive()) {
		return { above: false, amountNative: null };
	}
	// No usable amount (e.g. legacy network not sending it) — don't gate/hold.
	if (amount == null || !(Number(amount) > 0)) {
		return { above: false, amountNative: null };
	}
	const threshold = Number(getTravelRuleConfig().threshold);
	if (!Number.isFinite(threshold) || threshold <= 0) {
		return { above: false, amountNative: null };
	}
	const amountNative = await convertToNative(currency, amount);
	if (amountNative == null) {
		return { above: false, amountNative: null };
	}
	return { above: amountNative >= threshold, amountNative };
};

const recordWithdrawalCompliance = async ({
	user_id,
	transaction_id,
	address,
	network,
	currency,
	amount,
	amount_native,
	is_own_address,
	purpose,
	counterparty_type,
	counterparty_name,
	vasp_name
}) => {
	return getModel('travelRule').create({
		user_id,
		type: 'withdrawal',
		transaction_id,
		address,
		network,
		currency,
		amount,
		amount_native,
		is_own_address: is_own_address === undefined ? null : is_own_address,
		purpose: purpose || null,
		counterparty_type: counterparty_type || null,
		counterparty_name: counterparty_name || null,
		vasp_name: vasp_name || null,
		status: 'recorded'
	});
};

const createDepositHold = async ({
	user_id,
	transaction_id,
	address,
	network,
	currency,
	amount,
	amount_native
}) => {
	return getModel('travelRule').create({
		user_id,
		type: 'deposit',
		transaction_id,
		// `address` here is the source address(es); stored as-is (string or JSON-stringified)
		address: Array.isArray(address) ? JSON.stringify(address) : address,
		network,
		currency,
		amount,
		amount_native,
		status: 'pending'
	});
};

const findByTxid = async (transaction_id, opts = {}) => {
	const where = { transaction_id };
	if (opts.user_id != null) {
		where.user_id = opts.user_id;
	}
	if (opts.type) {
		where.type = opts.type;
	}
	if (opts.status) {
		where.status = opts.status;
	}
	return getModel('travelRule').findOne({ where });
};

/**
 * Admin: fetch travel-rule compliance records, optionally filtered by transaction
 * id and/or user id. Newest first. Used by the admin transactions detail view.
 */
const getTravelRuleRecords = async ({ transaction_id, user_id, type } = {}) => {
	const where = {};
	if (transaction_id) {
		where.transaction_id = transaction_id;
	}
	if (user_id != null) {
		where.user_id = user_id;
	}
	if (type) {
		where.type = type;
	}
	return getModel('travelRule').findAll({
		where,
		order: [['created_at', 'DESC']]
	});
};

/**
 * Resolves a pending deposit travel-rule record: persists the user-provided info
 * and flips the status ('released' or 'kept'). Returns the updated row.
 */
const resolveDeposit = async (record, { address, is_own_address, purpose, counterparty_type, counterparty_name, vasp_name, status, note }) => {
	if (address !== undefined && address !== null) {
		record.address = address;
	}
	if (is_own_address !== undefined) {
		record.is_own_address = is_own_address;
	}
	if (purpose !== undefined) {
		record.purpose = purpose || null;
	}
	if (counterparty_type !== undefined) {
		record.counterparty_type = counterparty_type || null;
	}
	if (counterparty_name !== undefined) {
		record.counterparty_name = counterparty_name || null;
	}
	if (vasp_name !== undefined) {
		record.vasp_name = vasp_name || null;
	}
	if (note !== undefined) {
		record.note = note || null;
	}
	if (status) {
		record.status = status;
	}
	await record.save();
	return record;
};

module.exports = {
	TRAVEL_RULE_PURPOSES,
	TRAVEL_RULE_COUNTERPARTY_TYPES,
	getTravelRuleConfig,
	isTravelRuleActive,
	convertToNative,
	isAboveThreshold,
	recordWithdrawalCompliance,
	createDepositHold,
	findByTxid,
	getTravelRuleRecords,
	resolveDeposit
};
