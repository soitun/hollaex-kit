'use strict';

const { loggerDeposits } = require('../../config/logger');
const { ROLES } = require('../../constants');
const { API_KEY_NOT_PERMITTED } = require('../../messages');
const toolsLib = require('hollaex-tools-lib');
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
		{
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
module.exports = {
	getAdminDeposits,
	getUserDeposits,
	downloadDepositsCsv
};
