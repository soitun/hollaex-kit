'use strict';

const { loggerNotification } = require('../../config/logger');
const toolsLib = require('hollaex-tools-lib');
const { sendEmail } = require('../../mail');
const { MAILTYPE } = require('../../mail/strings');
const { publisher } = require('../../db/pubsub');
const { INIT_CHANNEL, WS_PUBSUB_DEPOSIT_CHANNEL, EVENTS_CHANNEL, WS_PUBSUB_WITHDRAWAL_CHANNEL } = require('../../constants');
const moment = require('moment');
const { errorMessageConverter } = require('../../utils/conversion');

const applyKitChanges = (req, res) => {
	const ip = req.headers ? req.headers['x-real-ip'] : undefined;
	const domain = req.headers['x-real-origin'];
	loggerNotification.verbose('controller/notification/applyKitChanges ip domain', ip, domain);

	toolsLib.security.verifyNetworkHmacToken(req)
		.then(() => {
			return publisher.publish(INIT_CHANNEL, JSON.stringify({ type: 'refreshInit' }));
		})
		.then(() => {
			return res.json({ message: 'Success' });
		})
		.catch((err) => {
			loggerNotification.verbose('controller/notification/applyKitChanges', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const handleCurrencyDeposit = (req, res) => {
	const ip = req.headers ? req.headers['x-real-ip'] : undefined;
	const domain = req.headers['x-real-origin'];
	loggerNotification.verbose('controller/notification/handleCurrencyDeposit ip domain', ip, domain);

	const currency = req.swagger.params.currency.value;
	const {
		user_id,
		amount,
		txid,
		address,
		is_confirmed,
		onhold,
		dismissed,
		rejected,
		created_at,
		updated_at,
		network,
		fee,
		description,
		fee_coin
	} = req.swagger.params.data.value;


	loggerNotification.verbose(
		'controller/notification/handleCurrencyDeposit data',
		'currency',
		currency,
		'user_id',
		user_id,
		'amount',
		amount,
		'txid',
		txid,
		'address',
		address,
		'is_confirmed',
		is_confirmed,
		'dismissed',
		dismissed,
		'rejected',
		rejected,
		'created_at',
		created_at,
		'network',
		network,
		'fee',
		fee,
		'description',
		description,
		'fee_coin',
		fee_coin
	);

	toolsLib.security.verifyNetworkHmacToken(req)
		.then(() => {
			if (!toolsLib.subscribedToCoin(currency)) {
				throw new Error('Invalid currency');
			}
			return toolsLib.user.getUserByNetworkId(user_id);
		})
		.then((user) => {
			let coinName = currency;
			if (toolsLib.getKitCoin(currency).display_name) {
				coinName = toolsLib.getKitCoin(currency).display_name;
			}
			if (rejected || dismissed) {
				// Live-push the cancellation so the user (and admin) socket reflects it
				// in real time, mirroring the confirmed-deposit path below. A distinct
				// status ('REJECTED'/'DISMISSED') plus the raw flags let the web tell a
				// cancellation apart from a successful deposit.
				const depositData = {
					amount,
					currency: coinName,
					status: rejected ? 'REJECTED' : 'DISMISSED',
					rejected: !!rejected,
					dismissed: !!dismissed,
					address,
					transaction_id: txid,
					network,
					fee,
					fee_coin,
					description,
					created_at,
					updated_at
				};

				publisher.publish(WS_PUBSUB_DEPOSIT_CHANNEL, JSON.stringify({
					topic: 'deposit',
					action: 'insert',
					user_id: user.id,
					user_network_id: user.network_id,
					data: depositData,
					time: moment().unix()
				}));

				publisher.publish(EVENTS_CHANNEL, JSON.stringify({
					type: 'deposit',
					data: {
						...depositData,
						user_id: user.id
					}
				}));

				sendEmail(
					MAILTYPE.DEPOSIT_CANCEL,
					user.email,
					{
						type: 'deposit',
						amount,
						currency: coinName,
						transaction_id: txid,
						date: created_at
					},
					user.settings,
					domain
				);
			} else {
				const shouldHold = !!onhold;
				const depositData = {
					amount,
					currency: coinName,
					status: (is_confirmed && !shouldHold) ? 'COMPLETED' : 'PENDING',
					address,
					transaction_id: txid,
					network,
					fee,
					fee_coin,
					description,
					created_at,
					updated_at
				};

				publisher.publish(WS_PUBSUB_DEPOSIT_CHANNEL, JSON.stringify({
					topic: 'deposit',
					action: 'insert',
					user_id: user.id,
					user_network_id: user.network_id,
					data: depositData,
					time: moment().unix()
				}));
				

				publisher.publish(EVENTS_CHANNEL, JSON.stringify({
					type: 'deposit',
					data: {
						...depositData,
						user_id: user.id
					}
				}));

				sendEmail(
					MAILTYPE.DEPOSIT,
					user.email,
					depositData,
					user.settings,
					domain
				);
			}
			return res.json({ message: 'Success' });
		})
		.catch((err) => {
			loggerNotification.error(
				req.uuid,
				'controller/notification/handleCurrencyDeposit',
				err.message
			);
			return res.status(err.statusCode || 400).json({ message: `Fail - ${errorMessageConverter(err, req?.auth?.sub?.lang)?.message}` });
		});
};

const handleCurrencyWithdrawal = (req, res) => {
	const ip = req.headers ? req.headers['x-real-ip'] : undefined;
	const domain = req.headers['x-real-origin'];
	loggerNotification.verbose('controller/notification/handleCurrencyWithdrawal ip domain', ip, domain);

	const currency = req.swagger.params.currency.value;
	const {
		user_id,
		amount,
		txid,
		address,
		is_confirmed,
		fee,
		dismissed,
		rejected,
		created_at,
		network,
		description,
		fee_coin
	} = req.swagger.params.data.value;

	toolsLib.security.verifyNetworkHmacToken(req)
		.then(() => {
			if (!toolsLib.subscribedToCoin(currency)) {
				throw new Error('Invalid currency');
			}
			return toolsLib.user.getUserByNetworkId(user_id);
		})
		.then((user) => {
			let coinName = currency;
			if (toolsLib.getKitCoin(currency).display_name) {
				coinName = toolsLib.getKitCoin(currency).display_name;
			}
			if (rejected || dismissed) {
				// Live-push the cancellation so the user (and admin) socket reflects it
				// in real time, mirroring the confirmed-withdrawal path below. A distinct
				// status ('REJECTED'/'DISMISSED') plus the raw flags let the web tell a
				// cancellation apart from a successful withdrawal.
				const withdrawalData = {
					amount,
					currency: coinName,
					status: rejected ? 'REJECTED' : 'DISMISSED',
					rejected: !!rejected,
					dismissed: !!dismissed,
					address,
					fee,
					fee_coin,
					transaction_id: txid,
					network,
					description
				};

				publisher.publish(WS_PUBSUB_WITHDRAWAL_CHANNEL, JSON.stringify({
					topic: 'withdrawal',
					action: 'insert',
					user_id: user.id,
					user_network_id: user.network_id,
					data: withdrawalData,
					time: moment().unix()
				}));

				publisher.publish(EVENTS_CHANNEL, JSON.stringify({
					type: 'withdrawal',
					data: {
						...withdrawalData,
						user_id: user.id
					}
				}));

				sendEmail(
					MAILTYPE.DEPOSIT_CANCEL,
					user.email,
					{
						type: 'withdrawal',
						amount,
						currency: coinName,
						transaction_id: txid,
						date: created_at
					},
					user.settings,
					domain
				);
			} else {
				const data = {
					amount,
					currency: coinName,
					status: is_confirmed ? 'COMPLETED' : 'PENDING',
					address,
					fee,
					fee_coin,
					transaction_id: txid,
					network,
					description
				};

				publisher.publish(WS_PUBSUB_WITHDRAWAL_CHANNEL, JSON.stringify({
					topic: 'withdrawal',
					action: 'insert',
					user_id: user.id,
					user_network_id: user.network_id,
					data: data,
					time: moment().unix()
				}));

				publisher.publish(EVENTS_CHANNEL, JSON.stringify({
					type: 'withdrawal',
					data: {
						...data,
						user_id: user.id
					}
				}));

				sendEmail(
					MAILTYPE.WITHDRAWAL,
					user.email,
					data,
					user.settings,
					domain
				);
			}

			return res.json({ message: 'Success' });
		})
		.catch((err) => {
			loggerNotification.error(
				req.uuid,
				'controller/notification/handleCurrencyWithdrawal',
				err.message
			);
			return res.status(err.statusCode || 400).json({ message: `Fail - ${errorMessageConverter(err, req?.auth?.sub?.lang)?.message}` });
		});
};

const checkDepositAddresses = (req, res) => {
	const { addresses, network, currency, amount, txid, user_id } = req.swagger.params.data.value;

	loggerNotification.verbose(
		'controller/notification/checkDepositAddresses data',
		'network',
		network,
		'currency',
		currency,
		'amount',
		amount,
		'txid',
		txid,
		'user_id',
		user_id,
		'addresses',
		Array.isArray(addresses) ? addresses.length : 0
	);

	toolsLib.security.verifyNetworkHmacToken(req)
		.then(async () => {
			const blacklisted = await toolsLib.wallet.areAddressesBlacklisted(addresses, network);
			if (blacklisted.length > 0) {
				loggerNotification.warn(
					'controller/notification/checkDepositAddresses blocked',
					'txid',
					txid,
					'user_id',
					user_id,
					'matched',
					blacklisted.join(',')
				);
				// kit owns operator alerting for blacklisted deposit sources (throttled)
				await toolsLib.wallet.alertBlacklistedDeposit(blacklisted, network, user_id);
				// `reason` tells the network which structured hold-reason type to record
				// on the deposit note (see ../hollaex-network holdReasons).
				return res.json({ allowed: false, blacklisted, reason: 'blacklist' });
			}

			// Travel rule: hold qualifying deposits (>= threshold in native currency) and
			// record a pending compliance row. No dedup — every qualifying deposit is held.
			// Blacklist takes precedence above and never reaches here, so blacklisted holds
			// never get a travel-rule record and can't be auto-released by the user flow.
			if (toolsLib.travelRule.isTravelRuleActive()) {
				const { above, amountNative } = await toolsLib.travelRule.isAboveThreshold(currency, amount);
				if (above) {
					try {
						const user = await toolsLib.user.getUserByNetworkId(user_id);
						await toolsLib.travelRule.createDepositHold({
							user_id: user && user.id,
							transaction_id: txid,
							address: addresses,
							network,
							currency,
							amount,
							amount_native: amountNative
						});
					} catch (err) {
						// Hold the deposit regardless; an admin can release manually if the
						// record could not be created.
						loggerNotification.error(
							'controller/notification/checkDepositAddresses/travelRule',
							err.message
						);
					}
					return res.json({ allowed: false, blacklisted: [], reason: 'travel_rule' });
				}
			}

			return res.json({ allowed: true, blacklisted: [] });
		})
		.catch((err) => {
			loggerNotification.error(
				req.uuid,
				'controller/notification/checkDepositAddresses',
				err.message
			);
			return res.status(err.statusCode || 400).json({ message: `Fail - ${errorMessageConverter(err, req?.auth?.sub?.lang)?.message}` });
		});
};

module.exports = {
	applyKitChanges,
	handleCurrencyDeposit,
	handleCurrencyWithdrawal,
	checkDepositAddresses
};
