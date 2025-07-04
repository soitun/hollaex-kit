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
		rejected,
		created_at,
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
			if (rejected) {
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
				const depositData = {
					amount,
					currency: coinName,
					status: is_confirmed ? 'COMPLETED' : 'PENDING',
					address,
					transaction_id: txid,
					network,
					fee,
					fee_coin,
					description
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
			if (rejected) {
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

module.exports = {
	applyKitChanges,
	handleCurrencyDeposit,
	handleCurrencyWithdrawal
};
