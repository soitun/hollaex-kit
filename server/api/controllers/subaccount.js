'use strict';

const toolsLib = require('hollaex-tools-lib');
const { errorMessageConverter } = require('../../utils/conversion');
const { loggerUser } = require('../../config/logger');
const { USER_NOT_FOUND, NOT_AUTHORIZED } = require('../../messages');

const getUserSubaccounts = async (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/subaccount/getUserSubaccounts auth', req.auth);

	try {
		const masterId = req?.auth?.sub?.id;

		const master = await toolsLib.user.getUserByKitId(masterId, false);
		if (!master) {
			throw new Error(USER_NOT_FOUND);
		}
		if (master.is_subaccount) {
			throw new Error(NOT_AUTHORIZED);
		}

		const result = await toolsLib.database.findAndCountAll('subaccount', {
			where: { master_id: masterId },
			include: [
				{
					model: toolsLib.database.models.User,
					as: 'sub',
					attributes: ['id', 'email', 'username', 'verification_level', 'is_subaccount', 'network_id', 'created_at']
				}
			],
			order: [['id', 'DESC']]
		});

		// Normalize to { count, data }
		const count = result.count || (Array.isArray(result) ? result.length : 0);
		const rows = result.rows || result || [];

		const data = rows.map((row) => {
			const user = row.sub || {};
			return {
				id: user.id,
				email: user.email,
				username: user.username,
				verification_level: user.verification_level,
				is_subaccount: user.is_subaccount,
				network_id: user.network_id,
				created_at: user.created_at
			};
		});

		return res.json({ count, data });
	} catch (err) {
		loggerUser.error(req.uuid, 'controllers/subaccount/getUserSubaccounts', err.message);
		const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
		return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
	}
};

const createSubaccount = async (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/subaccount/createSubaccount auth', req.auth);

	try {
		const masterId = req?.auth?.sub?.id;
		const { email, password } = req.swagger.params.data.value;

		const master = await toolsLib.user.getUserByKitId(masterId, false);
		if (!master) throw new Error(USER_NOT_FOUND);
		if (master.is_subaccount) throw new Error(NOT_AUTHORIZED);

		const sub = await toolsLib.user.createSubaccount(masterId, { email, password });
		return res.status(201).json(sub);
	} catch (err) {
		loggerUser.error(req.uuid, 'controllers/subaccount/createSubaccount', err.message);
		const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
		return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
	}
};

const transferBetweenAccounts = async (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/subaccount/transferBetweenAccounts auth', req.auth);

	try {
		const masterId = req?.auth?.sub?.id;
		const { subaccount_id, currency, amount, direction, description } = req.swagger.params.data.value;

		const result = await toolsLib.user.transferBetweenMasterAndSub({
			masterKitId: masterId,
			subKitId: subaccount_id,
			currency,
			amount,
			direction,
			description: description || 'Subaccount Transfer'
		});

		return res.json({ message: 'Success' });
	} catch (err) {
		loggerUser.error(req.uuid, 'controllers/subaccount/transferBetweenAccounts', err.message);
		const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
		return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
	}
};

const getSubaccountAuthToken = async (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/subaccount/getSubaccountAuthToken auth', req.auth);

	try {
		const masterId = req?.auth?.sub?.id;
		const ip = req.headers['x-real-ip'];
		const { subaccount_id } = req.swagger.params.data.value;

		const master = await toolsLib.user.getUserByKitId(masterId, false);
		if (!master) throw new Error(USER_NOT_FOUND);
		if (master.is_subaccount) throw new Error(NOT_AUTHORIZED);

		const sub = await toolsLib.user.getUserByKitId(subaccount_id, false);
		if (!sub) throw new Error(USER_NOT_FOUND);
		if (!sub.is_subaccount) throw new Error(NOT_AUTHORIZED);

		const link = await toolsLib.database.findOne('subaccount', { where: { master_id: master.id, sub_id: sub.id } });
		if (!link) throw new Error(NOT_AUTHORIZED);

		const token = await toolsLib.security.issueToken(
			sub.id,
			sub.network_id,
			sub.email,
			ip,
			undefined,
			sub.settings?.language
		);

		await toolsLib.user.registerUserLogin(
			sub.id,
			ip,
			{
				device: req.headers['user-agent'],
				domain: req.headers['x-real-origin'],
				origin: req.headers.origin,
				referer: req.headers.referer,
				token,
				status: true
			}
		);

		return res.json({ token });
	} catch (err) {
		loggerUser.error(req.uuid, 'controllers/subaccount/getSubaccountAuthToken', err.message);
		const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
		return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
	}
};

module.exports = {
	getUserSubaccounts,
	createSubaccount,
	transferBetweenAccounts,
	getSubaccountAuthToken
};