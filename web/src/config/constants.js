import config from './index';
import STRINGS from './localizedStrings';
export { default as ICONS } from './icons';

export const ENV = process.env.NODE_ENV || 'production';
export const NETWORK = process.env.REACT_APP_NETWORK || 'mainnet';
export const LAST_BUILD = process.env.REACT_APP_LAST_BUILD;

export const APP_TITLE =
	process.env.REACT_APP_EXCHANGE_NAME || STRINGS['APP_TITLE'];

export const PUBLIC_URL =
	process.env.REACT_APP_PUBLIC_URL || 'http://localhost:8080';

export const TOKEN_TIME = 24 * 60 * 60 * 1000; // 1 day
export const SESSION_TIME = 6 * 60 * 60 * 1000; // 6 hour

export const API_URL = config[ENV].API_URL;
export const WS_URL = config[ENV].WS_URL;

export const PLUGIN_URL = config[ENV].PLUGIN_URL;
export const NETWORK_API_URL = config[ENV].NETWORK_API_URL;

export const DEFAULT_LANDING_SECTIONS = {
	heading: {
		name: 'Title/heading',
		is_active: true,
		order: 0,
		className: '',
	},
	carousel_section: {
		name: 'Moving ticker cards',
		is_active: true,
		order: 1,
	},
	card_section: {
		name: 'Key icon features',
		is_active: true,
		order: 3,
	},
	quick_trade: {
		name: 'Quick trade calculator',
		is_active: true,
		order: 2,
		className: 'px-2',
	},
	question_section: {
		name: 'Q&A Accordian',
		is_active: true,
		order: 2,
		className: 'px-2 faq-container',
	},
	create_account_section: {
		name: 'Call-to-action',
		is_active: true,
		order: 2,
		className: 'px-2 create-account-section',
	},
	quick_trade_calculator: {
		name: 'Mini-convert Tool',
		is_active: true,
		order: 2,
		className: 'px-2 mini-quick-trade-section',
	},
};

export const AUDIOS = {
	ORDERBOOK_FIELD_UPDATE: '/assets/audio/orderbook_field_update_1.wav',
	ORDERBOOK_LIMIT_ORDER: '/assets/audio/orderbook-limit-order_1.wav',
	PUBLIC_TRADE_NOTIFICATION: '/assets/audio/public-trade-notification.wav',
	ORDER_COMPLETED: '/assets/audio/order-filled_1.wav',
	ORDER_PARTIALLY_COMPLETED: '/assets/audio/part-fill_1.wav',
	CANCEL_ORDER: '/assets/audio/cancel_order_1.wav',
	QUICK_TRADE_COMPLETE: '/assets/audio/quick-trade-complete_1.wav',
	REVIEW_QUICK_TRADE_ORDER: '/assets/audio/review-quick-trade-order_1.wav',
	TIME_OUT_QUICK_TRADE: '/assets/audio/time-out-quick-trade.wav',
};

export const CURRENCY_PRICE_FORMAT = '{0} {1}';
export const APPROXIMATELY_EQAUL_CURRENCY_PRICE_FORMAT = '\u2248{0} {1}';
// this DEFAULT_COIN_PAIR to prevent from error while irrelevant BASE_CURRENCY
export const DEFAULT_COIN_DATA = {
	fullname: '',
	symbol: '',
	display_name: '',
	icon_id: 'DEFAULT_ICON',
	min: 0.001,
};

export const DEFAULT_PAIR = 'btc-usdt';

export const FLEX_CENTER_CLASSES = [
	'd-flex',
	'justify-content-center',
	'align-items-center',
];

export const TIMESTAMP_FORMAT = STRINGS['TIMESTAMP_FORMAT'];
export const DEFAULT_TIMESTAMP_FORMAT = STRINGS['DEFAULT_TIMESTAMP_FORMAT'];
export const HOUR_FORMAT = STRINGS['HOUR_FORMAT'];
export const TIMESTAMP_FORMAT_FA = STRINGS['TIMESTAMP_FORMAT']
	.split('/')
	.map((s) => `j${s}`)
	.join('/');

// Default trading pairs (it is set from the server so it is not important to set these properly)
export const DEFAULT_TRADING_PAIRS = ['xht-usdt'];

export const TOKEN_KEY = `${ENV}_${NETWORK}_TOKEN`;
export const DASH_TOKEN_KEY = `${ENV}_${NETWORK}_DASH_TOKEN`;
export const LANGUAGE_KEY = `${ENV}_${NETWORK}_LANGUAGE`;
export const DEFAULT_LANGUAGE = process.env.REACT_APP_DEFAULT_LANGUAGE || 'en';
export const MAIN_ACCOUNT_TOKEN = 'main_account_token';

export const TEMP_KEY_LANGUAGE_RTL = 'temp_key_language_rtl';
export const TEMP_KEY_LANGUAGE_LTR = 'temp_key_language_ltr';
export const LAST_UPDATED_NOTIFICATION_KEY = 'LAST_UPDATED_NOTIFICATION_TIME';

export const BANK_WITHDRAWAL_BASE_FEE =
	process.env.REACT_APP_BANK_WITHDRAWAL_BASE_FEE || 1;
export const BANK_WITHDRAWAL_DYNAMIC_FEE_RATE =
	process.env.REACT_APP_BANK_WITHDRAWAL_DYNAMIC_FEE_RATE || 0.5;
export const BANK_WITHDRAWAL_MAX_DYNAMIC_FEE =
	process.env.REACT_APP_BANK_WITHDRAWAL_MAX_DYNAMIC_FEE || 50;
export const BANK_WITHDRAWAL_MAX_AMOUNT_FOR_BASE_FEE =
	process.env.REACT_APP_BANK_WITHDRAWAL_MAX_AMOUNT_FOR_BASE_FEE || 0;
export const takerFee = 0;

export const EXPLORERS_ENDPOINT = (currency) => {
	let endpoint = '';
	switch (currency) {
		case 'eth':
			endpoint =
				NETWORK === 'testnet'
					? 'https://ropsten.etherscan.io/tx/'
					: 'https://etherscan.io/tx/';
			break;
		case 'btc':
			endpoint =
				NETWORK === 'testnet'
					? 'https://live.blockcypher.com/btc-test/tx/'
					: 'https://live.blockcypher.com/btc/tx/';
			break;
		case 'xrp':
			endpoint =
				NETWORK === 'testnet'
					? 'https://test.bithomp.com/explorer/'
					: 'https://bithomp.com/explorer/';
			break;
		case 'bch':
			endpoint =
				NETWORK === 'testnet'
					? 'https://explorer.bitcoin.com/tbch/tx/'
					: 'https://explorer.bitcoin.com/bch/tx/';
			break;
		case 'xmr':
			endpoint =
				NETWORK === 'testnet'
					? 'https://moneroblocks.info/tx/'
					: 'https://moneroblocks.info/tx/';
			break;
		case 'xlm':
			endpoint =
				NETWORK === 'testnet'
					? 'https://testnet.steexp.com/tx/'
					: 'https://steexp.com/tx/';
			break;
		case 'eos':
			endpoint = 'https://bloks.io/transaction/';
			break;
		case 'trx':
			endpoint =
				NETWORK === 'testnet'
					? 'https://shasta.tronscan.org/#/transaction/'
					: 'https://tronscan.org/#/transaction/';
			break;
		case 'doge':
			endpoint = 'https://blockchair.com/dogecoin/transaction/';
			break;
		case 'ltc':
			endpoint = 'https://blockchair.com/litecoin/transaction/';
			break;
		case 'ada':
			endpoint = 'https://blockchair.com/cardano/transaction/';
			break;
		case 'bnb':
			endpoint = 'https://bscscan.com/tx/';
			break;
		case 'sol':
			endpoint = 'https://solscan.io/tx/';
			break;
		case 'ton':
			endpoint = 'https://tonscan.org/tx/';
			break;
		case 'arb':
			endpoint = 'https://arbiscan.io/tx/';
			break;
		case 'matic':
			endpoint = 'https://polygonscan.com/tx/';
			break;
		case 'pol':
			endpoint = 'https://polygonscan.com/tx/';
			break;
		case 'etc':
			endpoint = 'https://etc.blockscout.com/tx/';
			break;
		case 'ftm':
			endpoint = 'https://ftmscan.com/tx/';
			break;
		case 's':
			endpoint = 'https://sonicscan.org/tx/';
			break;
		case 'sui':
			endpoint = 'https://suiscan.xyz/mainnet/tx/';
			break;
		default:
			endpoint = '';
			break;
	}
	return endpoint;
};

export const BALANCE_ERROR = 'Insufficient balance to perform the order';

export const DEFAULT_CAPTCHA_SITEKEY =
	'6LeuOKoUAAAAAGVoZcSWXJH60GHt4crvIaNXn1YA'; // default recaptcha v3; // default recaptcha v3

export const TIME_ZONE = process.env.REACT_APP_TIMEZONE || 'GMT';
export const TOKEN_EMAIL = 'token::email';
export const TOKEN_MAX_AGE = 23 * 60 * 60;

export const DEFAULT_URL = '/';

// minimum level for a user to be able to create api tokens
export const MIN_LEVEL_FOR_TOKENS = 1;

const THEME_COLOR = localStorage.getItem('theme');
export const THEMES = ['dark', 'white'];
export const THEME_DEFAULT = THEME_COLOR ? THEME_COLOR : THEMES[1];
export const CHAT_STATUS_KEY = 'chat:minimized';

export const DEFAULT_COUNTRY = process.env.REACT_APP_DEFAULT_COUNTRY
	? process.env.REACT_APP_DEFAULT_COUNTRY.toUpperCase()
	: 'KR';

const local_base_currnecy = localStorage.getItem('base_currnecy');

export const BASE_CURRENCY = local_base_currnecy
	? local_base_currnecy.toLowerCase()
	: 'usdt';

export const API_DOCS_URL = 'https://docs.hollaex.com/';
export const EXCHANGE_URL = 'https://dash.hollaex.com/';
export const EXCHANGE_EXPIRY_DAYS = 15;
export const EXCHANGE_EXPIRY_SECONDS = EXCHANGE_EXPIRY_DAYS * 86400;
export const REQUEST_VAULT_SUPPORTED_COINS =
	'https://www.hollaex.com/coin-and-market-listing';

export const MAX_NUMBER_BANKS = 3;

export const SHOW_SUMMARY_ACCOUNT_DETAILS = false;
export const SHOW_TOTAL_ASSETS = false;
export const FIT_SCREEN_HEIGHT = ['trade'];

export const DEFAULT_BANK_PAYMENT_ACCOUNTS = [
	{ key: 'bank_name', label: 'Bank name', required: true },
	{ key: 'account_number', label: 'Bank Account number', required: true },
	{ key: 'bank_account_owner', label: 'Bank Account Owner', required: true },
	{ key: 'swift_code', label: 'SWIFT code', required: false },
	{ key: 'iban', label: 'Iban', required: false },
	{ key: 'bank_location', label: 'Bank location (country)', required: false },
];
export const DEFAULT_PAYPAL_PAYMENT_PAYPAL = [
	{ key: 'email', label: 'Email', required: true },
];
export const DEFAULT_CUSTOM_PAYMENT_CUSTOM = [
	{ key: 'payment_info', label: 'Payment Info', required: true },
];

// Ready-made payment-method presets the operator can add with one click.
// Each preset becomes a custom payment account pre-filled with the fields below.
// `icon` points to a placeholder monogram SVG — replace with an official brand
// asset (same path) once you have the rights to use it.
const PRESET_ICON_PATH = '/assets/images/payment-presets';
export const DEFAULT_PAYMENT_PRESETS = [
	{
		name: 'Bank (United States)',
		region: 'United States',
		icon: `${PRESET_ICON_PATH}/bank-us.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'bank_name', label: 'Bank name', required: true },
			{ key: 'routing_number', label: 'Routing number (ABA)', required: true },
			{ key: 'account_number', label: 'Account number', required: true },
			{
				key: 'account_type',
				label: 'Account type (Checking/Savings)',
				required: false,
			},
		],
	},
	{
		name: 'Bank (Europe)',
		region: 'Eurozone',
		icon: `${PRESET_ICON_PATH}/bank-europe.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'bank_name', label: 'Bank name', required: false },
			{ key: 'iban', label: 'IBAN', required: true },
			{ key: 'bic_swift', label: 'BIC / SWIFT', required: false },
		],
	},
	{
		name: 'Bank (United Kingdom)',
		region: 'United Kingdom',
		icon: `${PRESET_ICON_PATH}/bank-united-kingdom.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'bank_name', label: 'Bank name', required: false },
			{ key: 'sort_code', label: 'Sort code', required: true },
			{ key: 'account_number', label: 'Account number', required: true },
		],
	},
	{
		name: 'Bank (Canada)',
		region: 'Canada',
		icon: `${PRESET_ICON_PATH}/bank-canada.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'bank_name', label: 'Bank name', required: true },
			{
				key: 'institution_number',
				label: 'Institution number',
				required: true,
			},
			{ key: 'transit_number', label: 'Transit number', required: true },
			{ key: 'account_number', label: 'Account number', required: true },
		],
	},
	{
		name: 'Bank (Australia)',
		region: 'Australia',
		icon: `${PRESET_ICON_PATH}/bank-australia.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'bank_name', label: 'Bank name', required: false },
			{ key: 'bsb', label: 'BSB number', required: true },
			{ key: 'account_number', label: 'Account number', required: true },
		],
	},
	{
		name: 'Bank (International / SWIFT)',
		region: 'Global',
		icon: `${PRESET_ICON_PATH}/bank-international.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'bank_name', label: 'Bank name', required: true },
			{ key: 'swift_bic', label: 'SWIFT / BIC', required: true },
			{
				key: 'iban_or_account_number',
				label: 'IBAN / Account number',
				required: true,
			},
			{ key: 'bank_address', label: 'Bank address', required: false },
			{
				key: 'bank_location',
				label: 'Bank location (country)',
				required: false,
			},
		],
	},
	{
		name: 'Wise',
		region: 'Global',
		icon: `${PRESET_ICON_PATH}/wise.svg`,
		data: [
			{ key: 'email', label: 'Email', required: true },
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{
				key: 'iban_or_account_number',
				label: 'IBAN / Account number',
				required: false,
			},
		],
	},
	{
		name: 'Skrill',
		region: 'Global',
		icon: `${PRESET_ICON_PATH}/skrill.svg`,
		data: [{ key: 'email', label: 'Email', required: true }],
	},
	{
		name: 'Neteller',
		region: 'Global',
		icon: `${PRESET_ICON_PATH}/neteller.svg`,
		data: [{ key: 'account_id', label: 'Account ID / Email', required: true }],
	},
	{
		name: 'Payoneer',
		region: 'Global',
		icon: `${PRESET_ICON_PATH}/payoneer.svg`,
		data: [
			{ key: 'email', label: 'Email', required: true },
			{ key: 'payee_id', label: 'Payee ID', required: false },
		],
	},
	{
		name: 'Revolut',
		region: 'UK, EEA, US, AU, SG',
		icon: `${PRESET_ICON_PATH}/revolut.svg`,
		data: [
			{ key: 'revtag', label: 'Revtag (@username)', required: true },
			{ key: 'phone', label: 'Phone number', required: false },
		],
	},
	{
		name: 'SEPA',
		region: 'Eurozone',
		icon: `${PRESET_ICON_PATH}/sepa.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'iban', label: 'IBAN', required: true },
			{ key: 'bic', label: 'BIC / SWIFT', required: false },
		],
	},
	{
		name: 'Faster Payments',
		region: 'United Kingdom',
		icon: `${PRESET_ICON_PATH}/faster-payments.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'sort_code', label: 'Sort code', required: true },
			{ key: 'account_number', label: 'Account number', required: true },
		],
	},
	{
		name: 'Zelle',
		region: 'United States',
		icon: `${PRESET_ICON_PATH}/zelle.svg`,
		data: [
			{ key: 'email_or_phone', label: 'Email or US phone', required: true },
			{ key: 'recipient_name', label: 'Recipient name', required: true },
		],
	},
	{
		name: 'Venmo',
		region: 'United States',
		icon: `${PRESET_ICON_PATH}/venmo.svg`,
		data: [
			{ key: 'username', label: 'Username (@handle)', required: true },
			{ key: 'phone_last4', label: 'Phone (last 4 digits)', required: false },
		],
	},
	{
		name: 'Cash App',
		region: 'US, UK',
		icon: `${PRESET_ICON_PATH}/cash-app.svg`,
		data: [{ key: 'cashtag', label: 'Cashtag ($)', required: true }],
	},
	{
		name: 'Interac',
		region: 'Canada',
		icon: `${PRESET_ICON_PATH}/interac.svg`,
		data: [
			{ key: 'email', label: 'Email', required: true },
			{ key: 'security_question', label: 'Security question', required: false },
			{ key: 'security_answer', label: 'Security answer', required: false },
		],
	},
	{
		name: 'PayID',
		region: 'Australia',
		icon: `${PRESET_ICON_PATH}/payid.svg`,
		data: [
			{ key: 'payid', label: 'PayID (email or phone)', required: true },
			{ key: 'account_name', label: 'Account name', required: true },
		],
	},
	{
		name: 'UPI',
		region: 'India',
		icon: `${PRESET_ICON_PATH}/upi.svg`,
		data: [
			{ key: 'upi_id', label: 'UPI ID (VPA)', required: true },
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: false,
			},
		],
	},
	{
		name: 'Paytm',
		region: 'India',
		icon: `${PRESET_ICON_PATH}/paytm.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'registered_name', label: 'Registered name', required: false },
		],
	},
	{
		name: 'Pix',
		region: 'Brazil',
		icon: `${PRESET_ICON_PATH}/pix.svg`,
		data: [
			{ key: 'pix_key', label: 'Pix key', required: true },
			{
				key: 'key_type',
				label: 'Key type (CPF/email/phone/random)',
				required: false,
			},
			{ key: 'full_name', label: 'Full name', required: false },
		],
	},
	{
		name: 'Mercado Pago',
		region: 'Latin America',
		icon: `${PRESET_ICON_PATH}/mercado-pago.svg`,
		data: [
			{ key: 'email', label: 'Email', required: true },
			{ key: 'cvu_or_alias', label: 'CVU / alias', required: false },
		],
	},
	{
		name: 'M-Pesa',
		region: 'East Africa',
		icon: `${PRESET_ICON_PATH}/mpesa.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'registered_name', label: 'Registered name', required: false },
		],
	},
	{
		name: 'Alipay',
		region: 'China',
		icon: `${PRESET_ICON_PATH}/alipay.svg`,
		data: [
			{ key: 'account', label: 'Account (phone/email)', required: true },
			{ key: 'real_name', label: 'Real name', required: true },
			{ key: 'qr_code', label: 'QR code', required: false },
		],
	},
	{
		name: 'WeChat Pay',
		region: 'China',
		icon: `${PRESET_ICON_PATH}/wechat-pay.svg`,
		data: [
			{ key: 'wechat_id', label: 'WeChat ID', required: true },
			{ key: 'phone', label: 'Phone number', required: false },
			{ key: 'qr_code', label: 'QR code', required: false },
		],
	},
	{
		name: 'GCash',
		region: 'Philippines',
		icon: `${PRESET_ICON_PATH}/gcash.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'iDEAL',
		region: 'Netherlands',
		icon: `${PRESET_ICON_PATH}/ideal.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'iban', label: 'IBAN', required: true },
		],
	},
	{
		name: 'Bancontact',
		region: 'Belgium',
		icon: `${PRESET_ICON_PATH}/bancontact.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'iban', label: 'IBAN', required: true },
		],
	},
	{
		name: 'BLIK',
		region: 'Poland',
		icon: `${PRESET_ICON_PATH}/blik.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'Swish',
		region: 'Sweden',
		icon: `${PRESET_ICON_PATH}/swish.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'MobilePay',
		region: 'Denmark, Finland',
		icon: `${PRESET_ICON_PATH}/mobilepay.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'Vipps',
		region: 'Norway',
		icon: `${PRESET_ICON_PATH}/vipps.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'TWINT',
		region: 'Switzerland',
		icon: `${PRESET_ICON_PATH}/twint.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'Bizum',
		region: 'Spain',
		icon: `${PRESET_ICON_PATH}/bizum.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'PayNow',
		region: 'Singapore',
		icon: `${PRESET_ICON_PATH}/paynow.svg`,
		data: [
			{ key: 'phone_or_uen', label: 'Phone or UEN', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'DuitNow',
		region: 'Malaysia',
		icon: `${PRESET_ICON_PATH}/duitnow.svg`,
		data: [
			{ key: 'phone_or_id', label: 'Phone or NRIC', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'PromptPay',
		region: 'Thailand',
		icon: `${PRESET_ICON_PATH}/promptpay.svg`,
		data: [
			{ key: 'phone_or_id', label: 'Phone or national ID', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'Touch n Go',
		region: 'Malaysia',
		icon: `${PRESET_ICON_PATH}/touch-n-go.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'MoMo',
		region: 'Vietnam',
		icon: `${PRESET_ICON_PATH}/momo.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'DANA',
		region: 'Indonesia',
		icon: `${PRESET_ICON_PATH}/dana.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'OVO',
		region: 'Indonesia',
		icon: `${PRESET_ICON_PATH}/ovo.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'Maya',
		region: 'Philippines',
		icon: `${PRESET_ICON_PATH}/maya.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'KakaoPay',
		region: 'South Korea',
		icon: `${PRESET_ICON_PATH}/kakaopay.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'bKash',
		region: 'Bangladesh',
		icon: `${PRESET_ICON_PATH}/bkash.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'Easypaisa',
		region: 'Pakistan',
		icon: `${PRESET_ICON_PATH}/easypaisa.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'JazzCash',
		region: 'Pakistan',
		icon: `${PRESET_ICON_PATH}/jazzcash.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
	{
		name: 'MTN MoMo',
		region: 'Africa',
		icon: `${PRESET_ICON_PATH}/mtn-momo.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'registered_name', label: 'Registered name', required: false },
		],
	},
	{
		name: 'Airtel Money',
		region: 'Africa',
		icon: `${PRESET_ICON_PATH}/airtel-money.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'registered_name', label: 'Registered name', required: false },
		],
	},
	{
		name: 'Orange Money',
		region: 'Africa, Middle East',
		icon: `${PRESET_ICON_PATH}/orange-money.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'registered_name', label: 'Registered name', required: false },
		],
	},
	{
		name: 'STC Pay',
		region: 'Saudi Arabia',
		icon: `${PRESET_ICON_PATH}/stc-pay.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'Fawry',
		region: 'Egypt',
		icon: `${PRESET_ICON_PATH}/fawry.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'Nequi',
		region: 'Colombia',
		icon: `${PRESET_ICON_PATH}/nequi.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'Yape',
		region: 'Peru',
		icon: `${PRESET_ICON_PATH}/yape.svg`,
		data: [{ key: 'phone', label: 'Phone number', required: true }],
	},
	{
		name: 'SPEI',
		region: 'Mexico',
		icon: `${PRESET_ICON_PATH}/spei.svg`,
		data: [
			{
				key: 'account_holder_name',
				label: 'Account holder name',
				required: true,
			},
			{ key: 'clabe', label: 'CLABE', required: true },
		],
	},
	{
		name: 'OPay',
		region: 'Nigeria',
		icon: `${PRESET_ICON_PATH}/opay.svg`,
		data: [
			{ key: 'phone', label: 'Phone number', required: true },
			{ key: 'account_name', label: 'Account name', required: false },
		],
	},
];

export const getPaymentPreset = (name) =>
	DEFAULT_PAYMENT_PRESETS.find((preset) => preset.name === name);

export const DEFAULT_PINNED_COINS = [
	'xht',
	'btc',
	'eth',
	'usdt',
	'bnb',
	'xrp',
	'ada',
	'trx',
	'matic',
];
export const METAMASK_LINK = 'https://metamask.io/download';
