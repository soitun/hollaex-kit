'use strict';

const { loggerDeposits } = require('../../config/logger');
const toolsLib = require('hollaex-tools-lib');
const { errorMessageConverter } = require('../../utils/conversion');

// Admin: return travel-rule compliance records for a specific transaction (or user).
// Surfaces the counterparty classification (type/name/VASP), purpose, is_own_address,
// address, amounts and status collected at withdrawal/deposit time.
const getAdminTravelRule = (req, res) => {
	const { transaction_id, user_id } = req.swagger.params;

	loggerDeposits.verbose(
		req.uuid,
		'controllers/travelRule/getAdminTravelRule',
		'transaction_id', transaction_id.value,
		'user_id', user_id.value
	);

	toolsLib.travelRule.getTravelRuleRecords({
		transaction_id: transaction_id.value,
		user_id: user_id.value
	})
		.then((data) => {
			toolsLib.user.createAuditLog({ email: req?.auth?.sub?.email, session_id: req?.session_id }, req?.swagger?.apiPath, req?.swagger?.operationPath?.[2], req?.swagger?.params);
			return res.json(data);
		})
		.catch((err) => {
			loggerDeposits.error(req.uuid, 'controllers/travelRule/getAdminTravelRule', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

module.exports = {
	getAdminTravelRule
};
