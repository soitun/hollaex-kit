'use strict';

const { loggerDeposits } = require('../../config/logger');
const { ROLES } = require('../../constants');
const { API_KEY_NOT_PERMITTED, TRAVEL_RULE_HOLD_NOT_FOUND, TRAVEL_RULE_INFO_REQUIRED } = require('../../messages');
const toolsLib = require('hollaex-tools-lib');
const { sendEmail } = require('../../mail');
const { MAILTYPE } = require('../../mail/strings');
const { errorMessageConverter } = require('../../utils/conversion');

const getAdminDeposits = (req, res) => {
	loggerDeposits.verbose(
		req.uuid,
		'controllers/deposit/getAdminDeposits auth',
		req.auth
	);

	const {
		user_id,
		currency,
		limit,
		page,
		order_by,
		order,
		start_date,
		end_date,
		status,
		dismissed,
		rejected,
		processing,
		waiting,
		onhold,
		transaction_id,
		address,
		description,
	} = req.swagger.params;


	toolsLib.wallet.getUserDepositsByKitId(
		user_id.value,
		currency.value,
		status.value,
		dismissed.value,
		rejected.value,
		processing.value,
		waiting.value,
		limit.value,
		page.value,
		order_by.value,
		order.value,
		start_date.value,
		end_date.value,
		transaction_id.value,
		address.value,
		description.value,
		null,
		{
			onhold: onhold.value,
			additionalHeaders: {
				'x-forwarded-for': req.headers['x-forwarded-for']
			}
		}
	)
		.then((data) => {
			toolsLib.user.createAuditLog({ email: req?.auth?.sub?.email, session_id: req?.session_id }, req?.swagger?.apiPath, req?.swagger?.operationPath?.[2], req?.swagger?.params);
			return res.json(data);
		})
		.catch((err) => {
			loggerDeposits.error(
				req.uuid,
				'controllers/deposit/getAdminDeposits',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getUserDeposits = (req, res) => {
	loggerDeposits.verbose(
		req.uuid,
		'controllers/deposit/getUserDeposits auth',
		req.auth.sub
	);
	const user_id = req.auth.sub.id;
	const {
		currency,
		limit,
		page,
		order_by,
		order,
		start_date,
		end_date,
		status,
		dismissed,
		rejected,
		processing,
		waiting,
		transaction_id,
		address,
		format
	} = req.swagger.params;

	toolsLib.wallet.getUserDepositsByKitId(
		user_id,
		currency.value,
		status.value,
		dismissed.value,
		rejected.value,
		processing.value,
		waiting.value,
		limit.value,
		page.value,
		order_by.value,
		order.value,
		start_date.value,
		end_date.value,
		transaction_id.value,
		address.value,
		null,
		format.value,
		{
			additionalHeaders: {
				'x-forwarded-for': req.headers['x-forwarded-for']
			}
		}
	)
		.then((data) => {
			if (format.value === 'csv') {
				res.setHeader('Content-disposition', `attachment; filename=${toolsLib.getKitConfig().api_name}-deposits.csv`);
				res.set('Content-Type', 'text/csv');
				return res.status(202).send(data);
			} else {
				return res.json(data);
			}
		})
		.catch((err) => {
			loggerDeposits.error('controllers/deposit/getUserDeposits', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};


const downloadDepositsCsv = (req, res) => {
	loggerDeposits.verbose(
		req.uuid,
		'controllers/deposit/downloadDepositsCsv auth',
		req.auth
	);

	const {
		user_id,
		currency,
		limit,
		page,
		order_by,
		order,
		start_date,
		end_date,
		status,
		dismissed,
		rejected,
		processing,
		waiting,
		onhold,
		transaction_id,
		address,
		description,
	} = req.swagger.params;

	toolsLib.wallet.getUserDepositsByKitId(
		user_id.value,
		currency.value,
		status.value,
		dismissed.value,
		rejected.value,
		processing.value,
		waiting.value,
		limit.value,
		page.value,
		order_by.value,
		order.value,
		start_date.value,
		end_date.value,
		transaction_id.value,
		address.value,
		description.value,
		'csv',
		{
			onhold: onhold.value,
			additionalHeaders: {
				'x-forwarded-for': req.headers['x-forwarded-for']
			}
		}
	)
		.then((data) => {
			toolsLib.user.createAuditLog({ email: req?.auth?.sub?.email, session_id: req?.session_id }, req?.swagger?.apiPath, req?.swagger?.operationPath?.[2], req?.swagger?.params);
			res.setHeader('Content-disposition', `attachment; filename=${toolsLib.getKitConfig().api_name}-users-deposits.csv`);
			res.set('Content-Type', 'text/csv');
			return res.status(202).send(data);
		})
		.catch((err) => {
			loggerDeposits.error(
				req.uuid,
				'controllers/deposit/downloadDepositsCsv',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};
// Travel rule: the user supplies source info for a deposit that was put on hold
// (>= threshold in native currency). If the only reason it is on hold is the travel
// rule (a pending TravelRule record exists) AND the deposit carries no KYT plugin
// marker (amlbot/scorechain), it is auto-released. Otherwise the info is saved and
// the deposit stays on hold for the KYT plugin / admin to resolve.
const submitDepositTravelRule = (req, res) => {
	const userId = req.auth.sub.id;
	const {
		transaction_id,
		is_own_address,
		purpose,
		source_address,
		counterparty_type,
		counterparty_name,
		vasp_name
	} = req.swagger.params.data.value;

	loggerDeposits.verbose(
		req.uuid,
		'controllers/deposit/submitDepositTravelRule',
		'user_id', userId,
		'transaction_id', transaction_id
	);

	// A pending TravelRule record is the positive proof that travel rule is what
	// holds this deposit — it is created only when checkDepositAddresses holds the
	// deposit for travel rule. No record => the hold has another cause (e.g. auto-
	// deposit disabled or blacklist) and this flow must NOT clear it.
	toolsLib.travelRule.findByTxid(transaction_id, { user_id: userId, type: 'deposit', status: 'pending' })
		.then(async (record) => {
			if (!record) {
				throw new Error(TRAVEL_RULE_HOLD_NOT_FOUND);
			}

			// Purpose is the only required field before the hold can be cleared; the
			// source address is read from the blockchain and the rest is optional.
			if (typeof purpose !== 'string' || purpose.trim().length === 0) {
				throw new Error(TRAVEL_RULE_INFO_REQUIRED);
			}

			// Persist the user-provided travel-rule info FIRST, while the deposit is
			// still on hold, so the compliance data is captured even if clearing the
			// hold (or anything after) fails. Status stays 'pending' until the release
			// outcome below is known.
			await toolsLib.travelRule.resolveDeposit(record, {
				address: source_address,
				is_own_address,
				purpose,
				counterparty_type,
				counterparty_name,
				vasp_name
			});

			// Now clear ONLY the travel_rule hold reason. The `onhold` flag is shared
			// by every hold mechanism, so the network is the gate: it deactivates the
			// travel_rule reason on the deposit note and credits/releases the deposit
			// only when no other reason remains active. This user flow can never clear
			// another reason (blacklist/KYT/etc) — those require an operator.
			const updated = await toolsLib.wallet.updatePendingMint(transaction_id, {
				clearHoldReason: 'travel_rule',
				additionalHeaders: {
					'x-forwarded-for': req.headers['x-forwarded-for']
				}
			});

			// the network cleared onhold => travel rule was the last active reason
			const released = updated && updated.onhold === false;

			if (released) {
				// finalize: travel rule was the last hold; the deposit is released
				await toolsLib.travelRule.resolveDeposit(record, { status: 'released', note: null });
				return res.json({ message: 'Success', released: true });
			}

			// other hold reason(s) remain — finalize the record with which reason(s)
			// still hold the deposit (from the structured note the network returned).
			const remaining = (updated && Array.isArray(updated.note) ? updated.note : [])
				.filter((e) => e && e.active)
				.map((e) => e.label || e.type);
			const remainingReason = remaining.length ? remaining.join(', ') : 'other hold';

			await toolsLib.travelRule.resolveDeposit(record, { status: 'kept', note: remainingReason });

			// notify operator that travel-rule info was provided but a hold remains
			try {
				sendEmail(
					MAILTYPE.ALERT,
					null,
					{
						type: 'Travel rule info submitted — deposit still on hold, please review',
						data: {
							message: `The user submitted the required travel rule information, but this deposit is still on hold and was NOT released because another hold reason is still active: "${remainingReason}". The travel rule requirement is now satisfied — please review this transaction and release it manually if the remaining hold is cleared.`,
							user_id: userId,
							transaction_id,
							currency: record.currency,
							amount: record.amount,
							remaining_hold_reason: remainingReason
						}
					},
					{}
				);
			} catch (err) {
				loggerDeposits.error(req.uuid, 'controllers/deposit/submitDepositTravelRule/alert', err.message);
			}

			return res.json({ message: 'Success', released: false });
		})
		.catch((err) => {
			loggerDeposits.error('controllers/deposit/submitDepositTravelRule', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

module.exports = {
	getAdminDeposits,
	getUserDeposits,
	downloadDepositsCsv,
	submitDepositTravelRule
};
