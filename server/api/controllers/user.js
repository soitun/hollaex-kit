'use strict';

const { isEmail, isUUID } = require('validator');
const toolsLib = require('hollaex-tools-lib');
const crypto = require('crypto');
const { sendEmail } = require('../../mail');
const { MAILTYPE } = require('../../mail/strings');
const { loggerUser } = require('../../config/logger');
const { errorMessageConverter } = require('../../utils/conversion');
const randomString = require('random-string');
const {
	USER_VERIFIED,
	PROVIDE_VALID_EMAIL_CODE,
	USER_REGISTERED,
	USER_NOT_FOUND,
	USER_EMAIL_NOT_VERIFIED,
	VERIFICATION_EMAIL_MESSAGE,
	TOKEN_REMOVED,
	INVALID_CREDENTIALS,
	USER_NOT_VERIFIED,
	USER_NOT_ACTIVATED,
	SIGNUP_NOT_AVAILABLE,
	PROVIDE_VALID_EMAIL,
	INVALID_PASSWORD,
	USER_EXISTS,
	VERIFICATION_CODE_EXPIRED,
	INVALID_VERIFICATION_CODE,
	LOGIN_NOT_ALLOW,
	NO_IP_FOUND,
	INVALID_OTP_CODE,
	OTP_CODE_NOT_FOUND,
	INVALID_CAPTCHA
} = require('../../messages');
const { DEFAULT_ORDER_RISK_PERCENTAGE, EVENTS_CHANNEL, API_HOST, DOMAIN, TOKEN_TIME_NORMAL, TOKEN_TIME_LONG, HOLLAEX_NETWORK_BASE_URL, NUMBER_OF_ALLOWED_ATTEMPTS, GET_KIT_SECRETS } = require('../../constants');
const { all } = require('bluebird');
const { each, isInteger, isArray } = require('lodash');
const { publisher } = require('../../db/pubsub');
const { isDate } = require('moment');
const moment = require('moment');
const DeviceDetector = require('node-device-detector');
const uuid = require('uuid/v4');
const geoip = require('geoip-lite');
const SMTP_SERVER = () => GET_KIT_SECRETS()?.smtp?.server;

const VERIFY_STATUS = {
	EMPTY: 0,
	PENDING: 1,
	REJECTED: 2,
	COMPLETED: 3
};

const detector = new DeviceDetector({
	clientIndexes: true,
	deviceIndexes: true,
	deviceAliasCode: false,
});


const INITIAL_SETTINGS = () => {
	return {
		notification: {
			popup_order_confirmation: true,
			popup_order_completed: true,
			popup_order_partially_filled: true,
			popup_order_new: true,
			popup_order_canceled: true
		},
		interface: {
			order_book_levels: 10,
			theme: toolsLib.getKitConfig().defaults.theme
		},
		language: toolsLib.getKitConfig().defaults.language,
		audio: {
			order_completed: true,
			order_partially_completed: true,
			public_trade: false
		},
		risk: {
			order_portfolio_percentage: DEFAULT_ORDER_RISK_PERCENTAGE
		},
		chat: {
			set_username: false
		}
	};
};


const signUpUser = (req, res) => {
	const {
		password,
		captcha,
		referral
	} = req.swagger.params.signup.value;

	let { email } = req.swagger.params.signup.value;
	const ip = req.headers['x-real-ip'];
	loggerUser.debug(
		req.uuid,
		'controllers/user/signUpUser',
		req.swagger.params.signup.value,
		ip
	);

	email = email.toLowerCase().trim();

	toolsLib.security.checkIp(ip)
		.then(() => {
			return toolsLib.security.checkCaptcha(captcha, ip);
		})
		.then(() => toolsLib.user.signUpUser(email, password, { referral }))
		.then(() => res.status(201).json({ message: USER_REGISTERED }))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/signUpUser', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getVerifyUser = (req, res) => {
	let email = req.swagger.params.email.value;
	const resendEmail = req.swagger.params.resend.value;
	const domain = req.headers['x-real-origin'];
	let promiseQuery;

	if (email && typeof email === 'string' && isEmail(email)) {
		email = email.toLowerCase();
		promiseQuery = toolsLib.database.findOne('user', {
			where: { email },
			attributes: ['id', 'email', 'email_verified']
		}).then(async (user) => {
			if (user.email_verified) {
				throw new Error(USER_VERIFIED);
			}
			if (resendEmail) {
				const verificationCode = uuid();
				toolsLib.user.storeVerificationCode(user, verificationCode);

				sendEmail(
					MAILTYPE.SIGNUP,
					email,
					verificationCode,
					{},
					domain
				);
			}
			return res.json({
				email,
				message: VERIFICATION_EMAIL_MESSAGE
			});
		});
	} else {
		return res.status(400).json({
			message: PROVIDE_VALID_EMAIL_CODE
		});
	}

	promiseQuery
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/getVerifyUser', err.message);
			// obfuscate the error message
			let errorMessage = VERIFICATION_EMAIL_MESSAGE;
			return res.status(err.statusCode || 400).json({ message: errorMessage });
		});
};

const verifyUser = (req, res) => {
	const { verification_code, email } = req.swagger.params.data.value;
	const domain = req.headers['x-real-origin'];

	toolsLib.user.verifyUser(email, verification_code, domain)
		.then(() => {
			return res.json({ message: USER_VERIFIED });
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/verifyUser', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};



const createAttemptMessage = (loginData, user, domain) => {
	const currentNumberOfAttemps = NUMBER_OF_ALLOWED_ATTEMPTS - loginData.attempt;
	if (currentNumberOfAttemps === NUMBER_OF_ALLOWED_ATTEMPTS - 1) { return ''; }
	else if (currentNumberOfAttemps === 0) {
		sendEmail(
			MAILTYPE.LOCKED_ACCOUNT,
			user.email,
			{},
			user.settings,
			domain);

		return ' ' + LOGIN_NOT_ALLOW;
	}
	return ` You have ${currentNumberOfAttemps} more ${currentNumberOfAttemps === 1 ? 'attempt' : 'attempts'} left`;
};

const loginPost = (req, res) => {
	const {
		password,
		otp_code,
		captcha,
		service,
		long_term
	} = req.swagger.params.authentication.value;
	let {
		email
	} = req.swagger.params.authentication.value;

	const ip = req.headers['x-real-ip'];
	let device;

	if (req.headers['custom-device']) {
		device = req.headers['user-agent'];
	} else {
		const userAgent = req.headers['user-agent'];
		const result = detector.detect(userAgent);

		const truncate = (str, maxLen = 100) => {
			if (!str || typeof str !== 'string') return '';
			return str.substring(0, maxLen);
		};

		let deviceParts = [
			truncate(result.device.brand, 100),
			truncate(result.device.model, 100),
			truncate(result.device.type, 100),
			truncate(result.client.name, 100),
			truncate(result.client.type, 100),
			truncate(result.os.name, 100)
		].filter(Boolean);

		device = deviceParts.join(' ').trim();

		const encoder = new TextEncoder();
		while (encoder.encode(device).length > 1000 && deviceParts.length > 1) {
			deviceParts.pop();
			device = deviceParts.join(' ').trim();
		}


	}

	const domain = req.headers['x-real-origin'];
	const origin = req.headers.origin;
	const referer = req.headers.referer;
	const time = new Date();

	loggerUser.verbose(
		req.uuid,
		'controllers/user/loginPost',
		'email',
		email,
		'otp_code',
		otp_code,
		'captcha',
		captcha,
		'service',
		service,
		'long_term',
		long_term,
		'ip',
		ip,
		'device',
		device,
		'domain',
		domain,
		'origin',
		origin,
		'referer',
		referer
	);


	if (!email || typeof email !== 'string' || !isEmail(email)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/loginPost invalid email',
			email
		);
		return res.status(400).json({ message: 'Invalid Email' });
	}

	email = email.toLowerCase().trim();

	toolsLib.security.checkIp(ip)
		.then(() => {
			return toolsLib.user.getUserByEmail(email);
		})
		.then(async (user) => {
			if (!user) {
				throw new Error(USER_NOT_FOUND);
			}
			if (user.verification_level === 0) {
				throw new Error(USER_NOT_VERIFIED);
			} else if (toolsLib.getKitConfig().email_verification_required && !user.email_verified) {
				throw new Error(USER_EMAIL_NOT_VERIFIED);
			} else if (!user.activated) {
				throw new Error(USER_NOT_ACTIVATED);
			}

			const loginData = await toolsLib.user.findUserLatestLogin(user, false);
			if (loginData && loginData.attempt === NUMBER_OF_ALLOWED_ATTEMPTS && loginData.status == false) {
				throw new Error(LOGIN_NOT_ALLOW);
			}

			return all([
				user,
				toolsLib.security.validatePassword(user.password, password)
			]);
		})
		.then(async ([user, passwordIsValid]) => {
			if (!passwordIsValid) {
				await toolsLib.user.createUserLogin(user, ip, device, domain, origin, referer, null, long_term, false);
				const loginData = await toolsLib.user.findUserLatestLogin(user, false);
				const message = createAttemptMessage(loginData, user, domain);
				throw new Error(INVALID_CREDENTIALS + message);
			}

			const lastLogins = await toolsLib.user.findUserLastLogins(user);
			let suspiciousLogin = false;

			const successfulRecords = lastLogins.filter(login => login.status);

			// if (isArray(lastLogins) && lastLogins.length > 0 && !successfulRecords?.find(login => login.device === device)) {
			// 	suspiciousLogin = true;
			// }


			const geo = geoip.lookup(ip);

			const country = geo?.country || '';

			if (isArray(lastLogins) && lastLogins.length > 0 && !successfulRecords?.find(login => login.country === country)) {
				loggerUser.verbose(
					req.uuid,
					'controllers/user/loginPost suspicious login detected',
					'user id',
					user.id,
					'country',
					country,
					'login records length',
					lastLogins.length,
					'successful records length',
					successfulRecords.length
				);
				suspiciousLogin = true;
			}


			const suspiciousLoginEnabled = toolsLib?.getKitConfig()?.suspicious_login?.active;

			if (suspiciousLoginEnabled && suspiciousLogin && SMTP_SERVER()?.length > 0) {
				const verification_code = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);

				const loginData = await toolsLib.user.createSuspiciousLogin(user, ip, device, country, domain, origin, referer, null, long_term);

				const data = {
					id: loginData.id,
					email,
					verification_code,
					ip,
					time,
					device,
					country,
					user_id: user.id
				};
				await toolsLib.database.client.setexAsync(`user:confirm-login:${verification_code}`, 5 * 60, JSON.stringify(data));
				await toolsLib.database.client.setexAsync(`user:freeze-account:${verification_code}`, 60 * 60 * 6, JSON.stringify(data));

				sendEmail(MAILTYPE.SUSPICIOUS_LOGIN, email, data, user.settings, domain);
				throw new Error('Suspicious login detected, please check your email.');
			}

			if (!user.otp_enabled) {
				return all([user, toolsLib.security.checkCaptcha(captcha, ip), country]);
			} else {
				return all([
					user,
					toolsLib.security.verifyOtpBeforeAction(user.id, otp_code)
						.then(async () => {
							return toolsLib.security.checkCaptcha(captcha, ip);
						})
						.catch(async (err) => {
							if (!otp_code) {
								throw new Error(INVALID_OTP_CODE);
							}
							await toolsLib.user.createUserLogin(user, ip, device, domain, origin, referer, null, long_term, false);
							const loginData = await toolsLib.user.findUserLatestLogin(user, false);
							const message = createAttemptMessage(loginData, user, domain);

							if (err.message === INVALID_CAPTCHA) {
								throw new Error(err.message);
							} else {
								throw new Error(err.message + message);
							}
						}),
					country
				]);
			}
		})
		.then(async ([user, otp, country]) => {
			const data = {
				ip,
				time,
				device,
				country
			};

			publisher.publish(EVENTS_CHANNEL, JSON.stringify({
				type: 'user',
				data: {
					action: 'login',
					user_id: user.id
				}
			}));

			if (!service) {
				sendEmail(MAILTYPE.LOGIN, email, data, user.settings, domain);
			}

			let userRole
			if (user.role) {
				const roles = toolsLib.getRoles();
				userRole = roles.find(role => role.role_name === user.role);
			}

			return all([
				user,
				toolsLib.security.issueToken(
					user.id,
					user.network_id,
					email,
					ip,
					long_term ? TOKEN_TIME_LONG : TOKEN_TIME_NORMAL,
					user.settings.language,
					userRole?.permissions,
					userRole?.configs,
					user.role
				)
			]);
		})
		.then(async ([user, token]) => {
			if (!ip) {
				throw new Error(NO_IP_FOUND);
			}
			await toolsLib.user.createUserLogin(user, ip, device, domain, origin, referer, token, long_term, true);
			return res.status(201).json({ token });
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/loginPost catch', err.message);
			return res.status(err.statusCode || 401).json({ message: errorMessageConverter(err, req?.auth?.sub?.lang)?.message, lang: errorMessageConverter(err, req?.auth?.sub?.lang)?.lang, code: errorMessageConverter(err, req?.auth?.sub?.lang)?.code });
		});
};


const confirmLogin = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/confirmLogin auth',
		req.auth
	);

	toolsLib.user.confirmUserLogin(req.swagger.params.data.value.token)
		.then(() => {
			return res.json({ message: 'Success' });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/confirmLogin err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const freezeUserByCode = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/freezeUserByCode auth',
		req.auth
	);

	toolsLib.user.freezeUserByCode(req.swagger.params.data.value.token)
		.then(() => {
			return res.json({ message: 'Success' });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/freezeUserByCode err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const verifyToken = (req, res) => {
	loggerUser.debug(req.uuid, 'controllers/user/verifyToken', req.auth.sub);
	return res.json({ message: 'Valid Token' });
};

function requestEmailConfirmation(req, res) {
	loggerUser.verbose(req.uuid, 'controllers/user/requestEmailConfirmation auth', req.auth.sub);
	let email = req.auth.sub.email;
	const ip = req.headers['x-real-ip'];
	const domain = req.headers['x-real-origin'];
	loggerUser.verbose(req.uuid, 'controllers/user/requestEmailConfirmation ip', ip, domain);

	if (!email || typeof email !== 'string' || !isEmail(email)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/requestEmailConfirmation invalid email',
			email
		);
		return res.status(400).json({ message: `Invalid email: ${email}` });
	}

	email = email.toLowerCase();

	toolsLib.security.sendConfirmationEmail(req.auth.sub.id, domain)
		.then(() => {
			return res.json({ message: `Confirmation email sent to: ${email}` });
		})
		.catch((err) => {
			let errorMessage = errorMessageConverter(err, req?.auth?.sub?.lang)?.message;

			if (errorMessage === USER_NOT_FOUND) {
				errorMessage = 'User not found';
			}

			loggerUser.error(
				req.uuid,
				'controllers/user/requestEmailConfirmation',
				err.message
			);
			return res.status(err.statusCode || 400).json({ message: errorMessage });
		});
}

const requestResetPassword = (req, res) => {
	let email = req.swagger.params.email.value;
	const ip = req.headers['x-real-ip'];
	const domain = req.headers['x-real-origin'];

	loggerUser.info(
		req.uuid,
		'controllers/user/requestResetPassword',
		email,
		'email',
		'ip',
		ip,
		'domain',
		domain
	);

	if (!email || typeof email !== 'string' || !isEmail(email)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/requestResetPassword invalid email',
			email
		);
		return res.status(400).json({ message: `Password request sent to: ${email}` });
	}

	email = email.toLowerCase();

	toolsLib.security.sendResetPasswordCode(email, null, ip, domain)
		.then(() => {
			return res.json({ message: `Password request sent to: ${email}` });
		})
		.catch((err) => {
			let errorMessage = errorMessageConverter(err, req?.auth?.sub?.lang)?.message;

			if (errorMessage === USER_NOT_FOUND) {
				errorMessage = `Password request sent to: ${email}`;
			}
			loggerUser.error(req.uuid, 'controllers/user/requestResetPassword', err.message);
			return res.status(err.statusCode || 400).json({ message: errorMessage });
		});
};

const resetPassword = (req, res) => {
	const { code, new_password } = req.swagger.params.data.value;

	toolsLib.security.resetUserPassword(code, new_password)
		.then(() => {
			return res.json({ message: 'Password updated.' });
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/resetPassword', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getUser = (req, res) => {
	loggerUser.debug(req.uuid, 'controllers/user/getUser', req.auth.sub);
	const id = req.auth.sub.id;

	toolsLib.user.getUserByKitId(id, true, true, {
		additionalHeaders: {
			'x-forwarded-for': req.headers['x-forwarded-for']
		}
	})
		.then((user) => {
			if (!user) {
				throw new Error(USER_NOT_FOUND);
			}
			const roles = toolsLib.getRoles();
			const userRole = roles.find(role => role.role_name === user.role);
			if (userRole) {
				user.configs = userRole?.configs;
				user.permissions = userRole?.permissions;
				user.restrictions = userRole?.restrictions;
			}
			return res.json(toolsLib.user.omitUserFields(user));
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/getUser', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const updateSettings = (req, res) => {
	loggerUser.debug(req.uuid, 'controllers/user/updateSettings', req.auth.sub);
	const email = req.auth.sub.email;
	loggerUser.debug(
		req.uuid,
		'controllers/user/updateSettings',
		req.swagger.params.data.value
	);
	const data = req.swagger.params.data.value;

	toolsLib.user.updateUserSettings({ email }, data)
		.then((user) => res.json(user))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/updateSettings', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const changePassword = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/changePassword', req.auth.sub);
	const email = req.auth.sub.email;
	const { old_password, new_password, otp_code } = req.swagger.params.data.value;
	const ip = req.headers['x-real-ip'];
	const domain = API_HOST + HOLLAEX_NETWORK_BASE_URL;

	loggerUser.verbose(
		req.uuid,
		'controllers/user/changePassword',
		ip,
		otp_code
	);

	toolsLib.security.changeUserPassword(email, old_password, new_password, ip, domain, otp_code)
		.then(() => res.json({ message: `Verification email to change password is sent to: ${email}` }))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/changePassword', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const confirmChangePassword = (req, res) => {
	const code = req.swagger.params.code.value;
	const ip = req.headers['x-real-ip'];

	loggerUser.verbose(
		req.uuid,
		'controllers/user/changePassword',
		code,
		ip
	);

	toolsLib.security.confirmChangeUserPassword(code)
		.then(() => res.redirect(301, `${DOMAIN}/change-password-confirm/${code}?isSuccess=true`))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/confirmChangeUserPassword', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const setUsername = (req, res) => {
	loggerUser.debug(req.uuid, 'controllers/user/setUsername auth', req.auth.sub);

	const { id } = req.auth.sub;
	const { username } = req.swagger.params.data.value;

	toolsLib.user.setUsernameById(id, username)
		.then(() => res.json({ message: 'Username successfully changed' }))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/setUsername', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getUserLogins = (req, res) => {
	loggerUser.debug(req.uuid, 'controllers/user/getUserLogins auth', req.auth.sub);

	const user_id = req.auth.sub.id;
	const { limit, status, page, order_by, order, start_date, end_date, format } = req.swagger.params;

	if (start_date.value && !isDate(start_date.value)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/getUserLogins invalid start_date',
			start_date.value
		);
		return res.status(400).json({ message: 'Invalid start date' });
	}

	if (end_date.value && !isDate(end_date.value)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/getUserLogins invalid end_date',
			end_date.value
		);
		return res.status(400).json({ message: 'Invalid end date' });
	}

	if (order_by.value && typeof order_by.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/getUserLogins invalid order_by',
			order_by.value
		);
		return res.status(400).json({ message: 'Invalid order by' });
	}

	toolsLib.user.getUserLogins({
		userId: user_id,
		status: status.value,
		limit: limit.value,
		page: page.value,
		orderBy: order_by.value,
		order: order.value,
		startDate: start_date.value,
		endDate: end_date.value,
		format: format.value
	})
		.then((data) => {
			if (format.value === 'csv') {
				res.setHeader('Content-disposition', `attachment; filename=${toolsLib.getKitConfig().api_name}-logins.csv`);
				res.set('Content-Type', 'text/csv');
				return res.status(202).send(data);
			} else {
				return res.json(data);
			}
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/getUserLogins', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const affiliationCount = (req, res) => {
	loggerUser.debug(req.uuid, 'controllers/user/affiliationCount auth', req.auth.sub);

	const user_id = req.auth.sub.id;

	const { limit, page, order_by, order, start_date, end_date } = req.swagger.params;


	toolsLib.user.getAffiliationCount(user_id, {
		limit: limit.value,
		page: page.value,
		order_by: order_by.value,
		order: order.value,
		start_date: start_date.value,
		end_date: end_date.value
	})
		.then((data) => {
			loggerUser.verbose(req.uuid, 'controllers/user/affiliationCount count', data.count);
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/affiliationCount', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getUserBalance = (req, res) => {
	loggerUser.debug(req.uuid, 'controllers/user/getUserBalance auth', req.auth.sub);
	const user_id = req.auth.sub.id;

	toolsLib.wallet.getUserBalanceByKitId(user_id, {
		additionalHeaders: {
			'x-forwarded-for': req.headers['x-forwarded-for']
		}
	})
		.then((balance) => {
			return res.json(balance);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/getUserBalance', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const deactivateUser = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/deactivateUser/auth',
		req.auth
	);
	const { id, email } = req.auth.sub;

	toolsLib.user.freezeUserById(id)
		.then(() => {
			return res.json({ message: `Account ${email} deactivated` });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/deactivateUser',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const createCryptoAddress = (req, res) => {
	loggerUser.debug(
		req.uuid,
		'controllers/user/createCryptoAddress',
		req.auth.sub
	);

	const { id } = req.auth.sub;
	const { crypto, network } = req.swagger.params;

	loggerUser.info(
		req.uuid,
		'controllers/user/createCryptoAddress',
		'crypto',
		crypto.value,
		'network',
		network.value
	);

	if (!crypto.value || !toolsLib.subscribedToCoin(crypto.value)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/createCryptoAddress',
			`Invalid crypto: "${crypto.value}"`
		);
		return res.status(404).json({ message: `Invalid crypto: "${crypto.value}"` });
	}

	toolsLib.user.createUserCryptoAddressByKitId(id, crypto.value, {
		network: network.value,
		additionalHeaders: {
			'x-forwarded-for': req.headers['x-forwarded-for']
		}
	})
		.then((data) => {
			return res.status(201).json(data);
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/createCryptoAddress',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getHmacToken = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/getHmacToken auth', req.auth.sub);

	const { id } = req.auth.sub;

	toolsLib.security.getUserKitHmacTokens(id)
		.then((tokens) => {
			return res.json(tokens);
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/getHmacToken err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const createHmacToken = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/createHmacToken auth',
		req.auth.sub
	);

	const { id: userId } = req.auth.sub;
	const ip = req.headers['x-real-ip'];
	const { name, otp_code, email_code, role, whitelisted_ips } = req.swagger.params.data.value;

	loggerUser.verbose(
		req.uuid,
		'controllers/user/createHmacToken data',
		name,
		otp_code,
		email_code,
		ip,
		role,
		whitelisted_ips
	);

	whitelisted_ips?.forEach((ip) => {
		if (!toolsLib.validateIp(ip)) {
			return res.status(400).json({ message: 'IP address is not valid.' });
		}
	});

	toolsLib.security.confirmByEmail(userId, email_code)
		.then((confirmed) => {
			if (confirmed) {
				// TODO check for the name duplication
				return toolsLib.security.createUserKitHmacToken(userId, otp_code, ip, name, role, whitelisted_ips);
			} else {
				throw new Error(INVALID_VERIFICATION_CODE);
			}
		})
		.then((token) => {
			return res.json(token);
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/createHmacToken',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

function updateHmacToken(req, res) {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/updateHmacToken auth',
		req.auth.sub
	);

	const { id: userId } = req.auth.sub;
	const ip = req.headers['x-real-ip'];
	const { token_id, name, otp_code, email_code, permissions, whitelisted_ips, whitelisting_enabled } = req.swagger.params.data.value;

	loggerUser.verbose(
		req.uuid,
		'controllers/user/updateHmacToken data',
		token_id,
		name,
		otp_code,
		email_code,
		permissions,
		whitelisted_ips,
		whitelisting_enabled,
		ip,
	);

	whitelisted_ips?.forEach((ip) => {
		if (!toolsLib.validateIp(ip)) {
			return res.status(400).json({ message: 'IP address is not valid.' });
		}
	});

	toolsLib.security.confirmByEmail(userId, email_code)
		.then((confirmed) => {
			if (confirmed) {
				return toolsLib.security.updateUserKitHmacToken(userId, otp_code, ip, token_id, name, permissions, whitelisted_ips, whitelisting_enabled);
			} else {
				throw new Error(INVALID_VERIFICATION_CODE);
			}
		})
		.then((token) => {
			return res.json(token);
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/updateHmacToken',
				err.message,
				err.stack
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
}

const deleteHmacToken = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/deleteHmacToken auth',
		req.auth.sub
	);

	const { id: userId } = req.auth.sub;
	const { token_id, otp_code, email_code } = req.swagger.params.data.value;
	const ip = req.headers['x-real-ip'];

	loggerUser.verbose(
		req.uuid,
		'controllers/user/deleteHmacToken data',
		token_id,
		otp_code,
		email_code,
		ip
	);

	toolsLib.security.confirmByEmail(userId, email_code)
		.then((confirmed) => {
			if (confirmed) {
				return toolsLib.security.deleteUserKitHmacToken(userId, otp_code, token_id);
			} else {
				throw new Error(INVALID_VERIFICATION_CODE);
			}
		})
		.then(() => {
			return res.json({ message: TOKEN_REMOVED });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/deleteHmacToken',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getUserStats = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/getUserStats',
		req.auth.sub
	);
	const user_id = req.auth.sub.id;

	toolsLib.user.getUserStatsByKitId(user_id, {
		additionalHeaders: {
			'x-forwarded-for': req.headers['x-forwarded-for']
		}
	})
		.then((stats) => {
			return res.json(stats);
		})
		.catch((err) => {
			loggerUser.error('controllers/user/getUserStats', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const userCheckTransaction = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/userCheckTransaction auth',
		req.auth
	);

	const {
		currency,
		transaction_id,
		address,
		network,
		is_testnet
	} = req.swagger.params;

	if (!currency.value || typeof currency.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/userCheckTransaction invalid currency',
			currency.value
		);
		return res.status(400).json({ message: 'Invalid currency' });
	}

	if (!transaction_id.value || typeof transaction_id.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/userCheckTransaction invalid transaction_id',
			transaction_id.value
		);
		return res.status(400).json({ message: 'Invalid Transaction Id' });
	}

	if (!address.value || typeof address.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/userCheckTransaction invalid address',
			address.value
		);
		return res.status(400).json({ message: 'Invalid address' });
	}

	if (!network.value || typeof network.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/userCheckTransaction invalid network',
			network.value
		);
		return res.status(400).json({ message: 'Invalid network' });
	}

	toolsLib.wallet.checkTransaction(currency.value, transaction_id.value, address.value, network.value, is_testnet.value, {
		additionalHeaders: {
			'x-forwarded-for': req.headers['x-forwarded-for']
		}
	})
		.then((transaction) => {
			return res.json({ message: 'Success', transaction });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/userCheckTransaction catch',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const addUserBank = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/addUserBank auth',
		req.auth
	);
	let email = req.auth.sub.email;
	let data = req.swagger.params.data.value;

	if (!data.type) {
		return res.status(400).json({ message: 'No type is selected' });
	}

	let bank_account = {};

	toolsLib.user.getUserByEmail(email, false)
		.then(async (user) => {
			if (!user) {
				throw new Error('User not found');
			}

			if (!toolsLib.getKitConfig().user_payments) {
				throw new Error('Payment system fields are not defined yet');
			}

			if (!toolsLib.getKitConfig().user_payments[data.type]) {
				throw new Error('Payment system fields are not defined yet');
			}

			each(toolsLib.getKitConfig().user_payments[data.type].data, ({ required, key }) => {
				if (required && !Object.prototype.hasOwnProperty.call(data, key)) {
					throw new Error(`Missing field: ${key}`);
				}
				if (Object.prototype.hasOwnProperty.call(data, key)) {
					bank_account[key] = data[key];
				}
			});

			if (Object.keys(bank_account).length === 0) {
				throw new Error('No payment system fields to add');
			}

			bank_account.id = crypto.randomBytes(8).toString('hex');
			bank_account.status = VERIFY_STATUS.PENDING;

			let newBank = user.bank_account;
			newBank.push(bank_account);

			const updatedUser = await user.update(
				{ bank_account: newBank },
				{ fields: ['bank_account'] }
			);

			sendEmail(
				MAILTYPE.ALERT,
				null,
				{
					type: 'New bank added by a user',
					data: `<div><p>User email ${email} just added a new bank.<br>Details:<br>${Object.keys(bank_account).map(key => {
						return `${key}: ${bank_account[key]} <br>`;
					}).join('')}</div></p>`
				},
				{}
			);


			return res.json(updatedUser.bank_account);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/addUserBank catch', err.message);
			return res.status(err.status || 400).json({ message: err.message });
		});
};

const getUserSessions = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/getUserSessions/auth', req.auth);

	const { limit, status, page, order_by, order, start_date, end_date, format } = req.swagger.params;

	const user_id = req.auth.sub.id;

	if (order_by.value && typeof order_by.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/getUserSessions invalid order_by',
			order_by.value
		);
		return res.status(400).json({ message: 'Invalid order by' });
	}

	toolsLib.user.getExchangeUserSessions({
		user_id: user_id,
		status: status.value,
		limit: limit.value,
		page: page.value,
		order_by: order_by.value,
		order: order.value,
		start_date: start_date.value,
		end_date: end_date.value,
		format: format.value
	}
	)
		.then((data) => {
			if (format.value === 'csv') {
				res.setHeader('Content-disposition', `attachment; filename=${toolsLib.getKitConfig().api_name}-logins.csv`);
				res.set('Content-Type', 'text/csv');
				return res.status(202).send(data);
			} else {
				return res.json(data);
			}
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/getUserSessions', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const revokeUserSession = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/revokeUserSession/auth', req.auth);

	const { session_id } = req.swagger.params.data.value;

	const user_id = req.auth.sub.id;

	toolsLib.user.revokeExchangeUserSession(session_id, user_id)
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/revokeUserSession', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const userLogout = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/userLogout/auth', req.auth);

	const user_id = req.auth.sub.id;

	const bearer = req.headers['authorization'];
	const tokenString = bearer.split(' ')[1];

	toolsLib.security.findSession(tokenString)
		.then((session) => {
			return toolsLib.user.revokeExchangeUserSession(session.id, user_id);
		})
		.then(() => {
			return res.json({ message: 'Success' });
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/userLogout', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const userDelete = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/userDelete/auth', req.auth);

	const { email_code, otp_code } = req.swagger.params.data.value;
	const user_id = req.auth.sub.id;

	loggerUser.verbose(
		req.uuid,
		'controllers/user/userDelete',
		'user_id',
		user_id,
		'email_code',
		email_code
	);
	toolsLib.security.verifyOtpBeforeAction(user_id, otp_code)
		.then((validOtp) => {
			if (!validOtp) {
				throw new Error(INVALID_OTP_CODE);
			}

			return toolsLib.security.confirmByEmail(user_id, email_code);
		})
		.then((confirmed) => {
			if (confirmed) {
				return toolsLib.user.deleteKitUser(user_id);
			} else {
				throw new Error(INVALID_VERIFICATION_CODE);
			}
		})
		.then(() => {
			return res.json({ message: 'Success' });
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/userDelete', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getUserBalanceHistory = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/getUserBalanceHistory/auth',
		req.auth
	);
	const user_id = req.auth.sub.id;
	const { limit, page, order_by, order, start_date, end_date, format } = req.swagger.params;

	if (start_date.value && !isDate(start_date.value)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/getUserBalanceHistory invalid start_date',
			start_date.value
		);
		return res.status(400).json({ message: 'Invalid start date' });
	}

	if (end_date.value && !isDate(end_date.value)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/getUserBalanceHistory invalid end_date',
			end_date.value
		);
		return res.status(400).json({ message: 'Invalid end date' });
	}

	if (order_by.value && typeof order_by.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/getUserBalanceHistory invalid order_by',
			order_by.value
		);
		return res.status(400).json({ message: 'Invalid order by' });
	}

	if (!user_id || !isInteger(user_id)) {
		loggerUser.error(
			req.uuid,
			'controllers/user/getUserBalanceHistory invalid user_id',
			user_id
		);
		return res.status(400).json({ message: 'Invalid user id' });
	}

	toolsLib.user.getUserBalanceHistory({
		user_id,
		limit: limit.value,
		page: page.value,
		orderBy: order_by.value,
		order: order.value,
		startDate: start_date.value,
		endDate: end_date.value,
		format: format.value
	})
		.then((data) => {
			if (format.value === 'csv') {
				res.setHeader('Content-disposition', `attachment; filename=${toolsLib.getKitConfig().api_name}-balance_history.csv`);
				res.set('Content-Type', 'text/csv');
				return res.status(202).send(data);
			} else {
				return res.json(data);
			}
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/getUserBalanceHistory',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const fetchUserProfitLossInfo = (req, res) => {
	loggerUser.verbose(
		req.uuid,
		'controllers/user/fetchUserProfitLossInfo/auth',
		req.auth
	);
	const { period } = req.swagger.params;
	const user_id = req.auth.sub.id;

	toolsLib.user.fetchUserProfitLossInfo(user_id, { period: period.value || 7 })
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/fetchUserProfitLossInfo', err.message);
			return res.status(err.statusCode || 400).json({ message: 'Something went wrong' });
		});
};

const getUnrealizedUserReferral = (req, res) => {
	loggerUser.info(
		req.uuid,
		'controllers/user/getUnrealizedUserReferral',
	);

	if (
		!toolsLib.getKitConfig().referral_history_config ||
		!toolsLib.getKitConfig().referral_history_config.active
	) {
		// TODO it should be added to the messages
		throw new Error('Feature is not active');
	}

	toolsLib.user.getUnrealizedReferral(req.auth.sub.id)
		.then((data) => {
			return res.json({ data });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/getUnrealizedUserReferral err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getRealizedUserReferral = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/getRealizedUserReferral/auth', req.auth);

	const { limit, page, order_by, order, start_date, end_date, format } = req.swagger.params;

	if (order_by.value && typeof order_by.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/getRealizedUserReferral invalid order_by',
			order_by.value
		);
		return res.status(400).json({ message: 'Invalid order by' });
	}

	toolsLib.user.getRealizedReferral({
		user_id: req.auth.sub.id,
		limit: limit.value,
		page: page.value,
		order_by: order_by.value,
		order: order.value,
		start_date: start_date.value,
		end_date: end_date.value,
		format: format.value
	}
	)
		.then((data) => {
			if (format.value === 'csv') {
				toolsLib.user.createAuditLog({ email: req?.auth?.sub?.email, session_id: req?.session_id }, req?.swagger?.apiPath, req?.swagger?.operationPath?.[2], req?.swagger?.params);
				res.setHeader('Content-disposition', `attachment; filename=${toolsLib.getKitConfig().api_name}-logins.csv`);
				res.set('Content-Type', 'text/csv');
				return res.status(202).send(data);
			} else {
				return res.json(data);
			}
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/getRealizedUserReferral', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getUserReferralCodes = (req, res) => {
	loggerUser.info(
		req.uuid,
		'controllers/user/getUserReferralCodes',
	);

	if (
		!toolsLib.getKitConfig().referral_history_config ||
		!toolsLib.getKitConfig().referral_history_config.active
	) {
		// TODO it should be added to the messages
		throw new Error('Feature is not active');
	}

	toolsLib.user.getUserReferralCodes({ user_id: req.auth.sub.id })
		.then((data) => {
			return res.json({ data });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/getUserReferralCodes err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const createUserReferralCode = (req, res) => {
	loggerUser.info(
		req.uuid,
		'controllers/user/createUserReferralCode',
	);
	const { discount, earning_rate, code } = req.swagger.params.data.value;

	if (
		!toolsLib.getKitConfig().referral_history_config ||
		!toolsLib.getKitConfig().referral_history_config.active
	) {
		// TODO it should be added to the messages
		throw new Error('Feature is not active');
	}

	toolsLib.user.createUserReferralCode({
		user_id: req.auth.sub.id,
		discount,
		earning_rate,
		code
	})
		.then(() => {
			return res.json({ message: 'success' });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/createUserReferralCode err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const settleUserFees = (req, res) => {
	loggerUser.info(
		req.uuid,
		'controllers/user/settleUserFees',
	);

	if (
		!toolsLib.getKitConfig().referral_history_config ||
		!toolsLib.getKitConfig().referral_history_config.active
	) {
		// TODO it should be added to the messages
		throw new Error('Feature is not active');
	}

	toolsLib.user.settleFees(req.auth.sub.id)
		.then(() => {
			return res.json({ message: 'success' });
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/settleUserFees err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const fetchUserReferrals = (req, res) => {
	const { limit, page, order_by, order, start_date, end_date, format } = req.swagger.params;

	loggerUser.info(
		req.uuid,
		'controllers/user/referrals',
		limit,
		page,
		order_by,
		order,
		start_date,
		end_date,
		format
	);

	if (
		!toolsLib.getKitConfig().referral_history_config ||
		!toolsLib.getKitConfig().referral_history_config.active
	) {
		// TODO it should be added to the messages
		throw new Error('Feature is not active');
	}

	toolsLib.user.fetchUserReferrals(
		{
			user_id: req.auth.sub.id,
			limit: limit.value,
			page: page.value,
			order_by: order_by.value,
			order: order.value,
			start_date: start_date.value,
			end_date: end_date.value,
			format: format.value
		}
	)
		.then((referrals) => {
			return res.json(referrals);
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/referrals err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const fetchUserTradingVolume = (req, res) => {
	const { to, from } = req.swagger.params;

	loggerUser.info(
		req.uuid,
		'controllers/user/fetchUserTradingVolume',
		to.value,
		from.value
	);

	toolsLib.user.fetchUserTradingVolume(
		req.auth.sub.id,
		{
			to: to.value,
			from: from.value
		}
	)
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(
				req.uuid,
				'controllers/user/fetchUserTradingVolume err',
				err.message
			);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const fetchUserAddressBook = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/fetchUserAddressBook/auth', req.auth);

	toolsLib.user.fetchUserAddressBook(req.auth.sub.id)
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/fetchUserAddressBook', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const updateUserAddresses = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/updateUserAddresses/auth', req.auth);

	const { addresses } = req.swagger.params.data.value;

	loggerUser.verbose(req.uuid, 'controllers/user/updateUserAddresses data', req.auth.sub.id, addresses);

	toolsLib.user.updateUserAddresses(req.auth.sub.id, { addresses })
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/updateUserAddresses err', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const getPaymentDetails = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/getPaymentDetails/auth', req.auth);

	const { is_p2p, is_fiat_control, status, limit, page, order_by, order, start_date, end_date } = req.swagger.params;

	const user_id = req.auth.sub.id;

	toolsLib.user.getPaymentDetails(user_id,
		{
			limit: limit.value,
			page: page.value,
			order_by: order_by.value,
			order: order.value,
			start_date: start_date.value,
			end_date: end_date.value,
			is_p2p: is_p2p.value,
			is_fiat_control: is_fiat_control.value,
			status: status.value,
		})
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/getPaymentDetails', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const createPaymentDetail = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/createPaymentDetail/auth', req.auth);

	const user_id = req.auth.sub.id;
	const { name, label, details, is_p2p, is_fiat_control, status } = req.swagger.params.data.value;

	toolsLib.user.createPaymentDetail({
		user_id,
		name,
		label,
		details,
		is_p2p,
		is_fiat_control,
		status
	})
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/createPaymentDetail', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const updatePaymentDetail = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/updatePaymentDetail/auth', req.auth);

	const user_id = req.auth.sub.id;
	const { id, name, label, details, is_p2p, is_fiat_control } = req.swagger.params.data.value;

	toolsLib.user.updatePaymentDetail(id, {
		user_id,
		name,
		label,
		details,
		is_p2p,
		is_fiat_control
	})
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/updatePaymentDetail', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const deletePaymentDetail = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/deletePaymentDetail/auth', req.auth);

	const user_id = req.auth.sub.id;
	const { id } = req.swagger.params.data.value;

	toolsLib.user.deletePaymentDetail(id, user_id)
		.then(() => {
			return res.json({
				message: 'Success'
			});
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/deletePaymentDetail', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};


const fetchUserAutoTrades = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/fetchUserAutoTrades/auth', req.auth);

	const { limit, page, order_by, order, start_date, end_date, active } = req.swagger.params;

	if (order_by.value && typeof order_by.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/fetchUserAutoTrades invalid order_by',
			order_by.value
		);
		return res.status(400).json({ message: 'Invalid order by' });
	}

	toolsLib.user.fetchUserAutoTrades(req.auth.sub.id, {
		limit: limit.value,
		page: page.value,
		order_by: order_by.value,
		order: order.value,
		start_date: start_date.value,
		end_date: end_date.value,
		active: active.value
	})
		.then((data) => res.json(data))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/fetchUserAutoTrades', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const createUserAutoTrade = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/createUserAutoTrade/auth', req.auth);

	const { spend_coin, buy_coin, spend_amount, frequency, week_days, day_of_month, trade_hour, active, description } = req.swagger.params.data.value;

	loggerUser.verbose(
		req.uuid,
		'controllers/user/createUserAutoTrade data',
		spend_coin, buy_coin, spend_amount, frequency, week_days, day_of_month, trade_hour, active, description
	);

	toolsLib.user.createUserAutoTrade(req.auth.sub.id, {
		spend_coin,
		buy_coin,
		spend_amount,
		frequency,
		week_days,
		day_of_month,
		trade_hour,
		active,
		description
	}, req.headers['x-real-ip'])
		.then((data) => res.json(data))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/createUserAutoTrade', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const updateUserAutoTrade = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/updateUserAutoTrade/auth', req.auth);

	const { id, spend_coin, buy_coin, spend_amount, frequency, week_days, day_of_month, trade_hour, active, description } = req.swagger.params.data.value;

	loggerUser.verbose(
		req.uuid,
		'controllers/user/updateUserAutoTrade data',
		id, spend_coin, buy_coin, spend_amount, frequency, week_days, day_of_month, trade_hour, active, description
	);

	toolsLib.user.updateUserAutoTrade(req.auth.sub.id, {
		id,
		spend_coin,
		buy_coin,
		spend_amount,
		frequency,
		week_days,
		day_of_month,
		trade_hour,
		active,
		description
	}, req.headers['x-real-ip'])
		.then((data) => res.json(data))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/updateUserAutoTrade', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const deleteUserAutoTrade = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/deleteUserAutoTrade/auth', req.auth);

	const { removed_ids } = req.swagger.params.data.value;

	loggerUser.verbose(req.uuid, 'controllers/user/deleteUserAutoTrade data', removed_ids);

	toolsLib.user.deleteUserAutoTrade(
		removed_ids,
		req.auth.sub.id
	)
		.then(() => res.json({ message: 'Success' }))
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/deleteUserAutoTrade', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

const fetchAnnouncements = (req, res) => {
	loggerUser.verbose(req.uuid, 'controllers/user/fetchAnnouncements/auth');

	const { limit, page, order_by, order, start_date, end_date } = req.swagger.params;

	if (order_by.value && typeof order_by.value !== 'string') {
		loggerUser.error(
			req.uuid,
			'controllers/user/fetchAnnouncements invalid order_by',
			order_by.value
		);
		return res.status(400).json({ message: 'Invalid order by' });
	}

	toolsLib.user.getAnnouncements({
		limit: limit.value,
		page: page.value,
		order_by: order_by.value,
		order: order.value,
		start_date: start_date.value,
		end_date: end_date.value,
	})
		.then((data) => {
			return res.json(data);
		})
		.catch((err) => {
			loggerUser.error(req.uuid, 'controllers/user/fetchAnnouncements', err.message);
			const messageObj = errorMessageConverter(err, req?.auth?.sub?.lang);
			return res.status(err.statusCode || 400).json({ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code });
		});
};

module.exports = {
	signUpUser,
	getVerifyUser,
	verifyUser,
	loginPost,
	verifyToken,
	requestResetPassword,
	resetPassword,
	getUser,
	updateSettings,
	changePassword,
	confirmChangePassword,
	setUsername,
	getUserLogins,
	affiliationCount,
	getUserBalance,
	deactivateUser,
	createCryptoAddress,
	getHmacToken,
	createHmacToken,
	updateHmacToken,
	deleteHmacToken,
	getUserStats,
	userCheckTransaction,
	requestEmailConfirmation,
	addUserBank,
	revokeUserSession,
	getUserSessions,
	userLogout,
	userDelete,
	getUnrealizedUserReferral,
	getRealizedUserReferral,
	settleUserFees,
	getUserBalanceHistory,
	fetchUserProfitLossInfo,
	fetchUserReferrals,
	createUserReferralCode,
	getUserReferralCodes,
	fetchUserTradingVolume,
	updateUserAddresses,
	fetchUserAddressBook,
	getPaymentDetails,
	createPaymentDetail,
	updatePaymentDetail,
	deletePaymentDetail,
	fetchUserAutoTrades,
	createUserAutoTrade,
	updateUserAutoTrade,
	deleteUserAutoTrade,
	fetchAnnouncements,
	confirmLogin,
	freezeUserByCode
};