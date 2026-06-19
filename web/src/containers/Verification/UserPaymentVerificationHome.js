import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
	CheckCircleFilled,
	ClockCircleFilled,
	CloseCircleFilled,
} from '@ant-design/icons';
import { EditWrapper, Button } from 'components';
import STRINGS from 'config/localizedStrings';
import withConfig from 'components/ConfigProvider/withConfig';
import { generateDynamicStringKey } from 'utils/id';
import { getPaymentMethodIcon } from 'config/constants';

// Show this many accounts per method before requiring "view all".
const VISIBLE_COUNT = 2;
// Sort order within a method card: verified first, then pending, then rejected.
const STATUS_PRIORITY = { 3: 0, 1: 1, 2: 2 };

const PaymentMethodCard = ({ title, iconSrc, accounts, renderAccount }) => {
	const [expanded, setExpanded] = useState(false);
	const visible = expanded ? accounts : accounts.slice(0, VISIBLE_COUNT);
	return (
		<div className="payment-account-card">
			<div className="payment-account-card-header">
				<img src={iconSrc} alt="" className="payment-account-card-icon" />
				<span className="payment-account-card-title">{title}</span>
				{accounts.length > 1 && (
					<span className="payment-account-card-count">
						{STRINGS.formatString(
							STRINGS['PAYMENT_ACCOUNTS_COUNT'],
							accounts.length
						)}
					</span>
				)}
			</div>
			{visible.map((account, index) => renderAccount(account, index))}
			{accounts.length > VISIBLE_COUNT && (
				<div
					className="payment-account-expand"
					onClick={() => setExpanded((prev) => !prev)}
				>
					{expanded
						? STRINGS['SHOW_LESS']
						: `${STRINGS['VIEW_ALL']} (${accounts.length})`}
				</div>
			)}
		</div>
	);
};

// `offrampLimits` is injected onto withdrawal payment options by the fiat withdrawal
// selector; it's metadata (an object), never a renderable account field.
export const HIDDEN_KEYS = ['id', 'status', 'type', 'offrampLimits'];

// Bank-account status codes: 1 = pending, 2 = rejected, 3 = verified (0 = draft, hidden).
const STATUS_META = {
	1: { className: 'pending', labelKey: 'PENDING', Icon: ClockCircleFilled },
	2: { className: 'rejected', labelKey: 'REJECTED', Icon: CloseCircleFilled },
	3: { className: 'verified', labelKey: 'VERIFIED', Icon: CheckCircleFilled },
};

const UserPaymentVerificationHome = ({
	user,
	setActivePageContent,
	handleBack,
	user_payments = {},
}) => {
	const { bank_account = [] } = user;

	const resolvePaymentTypeKey = (type) => {
		// Prefer explicit type when it is a string (e.g. "Interac").
		if (!type || typeof type !== 'string') {
			return '';
		}
		// Prefer exact match (config keys are case-sensitive), then case-insensitive.
		if (Object.prototype.hasOwnProperty.call(user_payments, type)) {
			return type;
		}
		const normalized = type.trim().toLowerCase();
		const found = Object.keys(user_payments).find(
			(k) => typeof k === 'string' && k.trim().toLowerCase() === normalized
		);
		return found || type;
	};

	const inferPaymentTypeKeyFromAccount = (account = {}) => {
		// When `type` isn't stored on the record, infer the payment method by
		// matching the account's keys against each user_payments schema.
		const accountKeys = Object.keys(account).filter(
			(k) => !HIDDEN_KEYS.includes(k)
		);
		if (!accountKeys.length) {
			return '';
		}

		let bestKey = '';
		let bestScore = 0;
		Object.entries(user_payments || {}).forEach(([paymentKey, paymentDef]) => {
			const schemaFields = Array.isArray(paymentDef?.data)
				? paymentDef.data
				: [];
			const schemaKeys = schemaFields.map(({ key }) => key).filter(Boolean);
			if (!schemaKeys.length) {
				return;
			}
			const overlap = schemaKeys.filter((k) => accountKeys.includes(k)).length;
			if (overlap > bestScore) {
				bestScore = overlap;
				bestKey = paymentKey;
			}
		});
		return bestScore > 0 ? bestKey : '';
	};

	// Match the payment-account icon used across the fiat admin flows so each
	// method card shows its own logo. An operator-uploaded custom icon (stored
	// on user_payments[name].icon) takes precedence over the built-in defaults.
	const getMethodIcon = (name) =>
		getPaymentMethodIcon(name, user_payments?.[name]?.icon);

	// Group every submitted account under its resolved payment method so multiple
	// accounts of the same method render together inside one card.
	const buildGroups = () => {
		const groups = [];
		const indexByKey = {};
		bank_account
			.filter(({ status }) => status !== 0)
			.forEach((account) => {
				const key =
					resolvePaymentTypeKey(account.type) ||
					inferPaymentTypeKeyFromAccount(account) ||
					account.type ||
					'bank';
				if (indexByKey[key] === undefined) {
					indexByKey[key] = groups.length;
					groups.push({ key, accounts: [] });
				}
				groups[indexByKey[key]].accounts.push(account);
			});
		return groups;
	};

	const getOrderedFieldKeys = (account, paymentTypeKey) => {
		const schema = paymentTypeKey ? user_payments?.[paymentTypeKey] : null;
		const schemaFields = Array.isArray(schema?.data) ? schema.data : [];
		const schemaFieldKeys = schemaFields.map(({ key }) => key).filter(Boolean);
		const accountFieldKeys = Object.keys(account).filter(
			(k) => !HIDDEN_KEYS.includes(k)
		);
		return paymentTypeKey
			? [
					...schemaFieldKeys.filter((k) => accountFieldKeys.includes(k)),
					...accountFieldKeys.filter((k) => !schemaFieldKeys.includes(k)),
			  ]
			: accountFieldKeys;
	};

	const renderField = (account, paymentTypeKey, fieldKey, index) => {
		const schema = paymentTypeKey ? user_payments?.[paymentTypeKey] : null;
		const schemaFields = Array.isArray(schema?.data) ? schema.data : [];
		const generateId = generateDynamicStringKey(
			'ULTIMATE_FIAT',
			paymentTypeKey || account.type || 'bank'
		);
		const stringId = generateId(fieldKey);
		const defaultText = fieldKey.replace(/_/g, ' ');
		const schemaLabel = schemaFields.find((f) => f.key === fieldKey)?.label;
		const label = schemaLabel || STRINGS[stringId] || defaultText;
		return (
			<div className="payment-account-field" key={index}>
				<span className="payment-account-field-label">{label}:</span>
				<span className="payment-account-field-value">{account[fieldKey]}</span>
			</div>
		);
	};

	const renderStatusBadge = (status) => {
		const meta = STATUS_META[status];
		if (!meta) {
			return null;
		}
		const { className, labelKey, Icon } = meta;
		return (
			<div className={`payment-account-status ${className}`}>
				<Icon />
				<span>{STRINGS[labelKey]}</span>
			</div>
		);
	};

	const renderCards = () => {
		const groups = buildGroups().map((group) => ({
			...group,
			// verified accounts first, then pending, then rejected
			accounts: [...group.accounts].sort(
				(a, b) =>
					(STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99)
			),
		}));
		return (
			<div className="payment-accounts-grid">
				{groups.map((group) => (
					<PaymentMethodCard
						key={group.key}
						title={group.key}
						iconSrc={getMethodIcon(group.key)}
						accounts={group.accounts}
						renderAccount={(account, index) => (
							<div className="payment-account-item" key={account.id ?? index}>
								{renderStatusBadge(account.status)}
								{getOrderedFieldKeys(account, group.key).map((fieldKey, i) =>
									renderField(account, group.key, fieldKey, i)
								)}
							</div>
						)}
					/>
				))}
			</div>
		);
	};

	if (
		!bank_account.length ||
		bank_account.length ===
			bank_account.filter((data) => data.status === 0).length
	) {
		return (
			<div className="btn-wrapper">
				<div className="holla-verification-button">
					<EditWrapper stringId="USER_VERIFICATION.START_PAYMENT_VERIFICATION" />
					<Button
						label={STRINGS['USER_VERIFICATION.START_PAYMENT_VERIFICATION']}
						onClick={() => setActivePageContent('user_payments')}
					/>
				</div>
			</div>
		);
	}

	return (
		<div>
			<EditWrapper
				stringId="USER_VERIFICATION.PAYMENT_VERIFICATION_HELP_TEXT,USER_VERIFICATION.DOCUMENT_SUBMISSION"
				renderWrapper={(children) => (
					<div className="font-weight-bold text-lowercase">{children}</div>
				)}
			>
				{STRINGS.formatString(
					STRINGS['USER_VERIFICATION.PAYMENT_VERIFICATION_HELP_TEXT'],
					<span
						className="verification_link pointer"
						onClick={(e) => handleBack('kyc', e)}
					>
						{STRINGS['USER_VERIFICATION.DOCUMENT_SUBMISSION']}
					</span>
				)}
			</EditWrapper>
			{renderCards()}
			<div>
				<EditWrapper stringId="USER_VERIFICATION.ADD_ANOTHER_PAYMENT_METHOD" />
				<Button
					label={STRINGS['USER_VERIFICATION.ADD_ANOTHER_PAYMENT_METHOD']}
					onClick={() => setActivePageContent('user_payments')}
				/>
			</div>
		</div>
	);
};

const mapStateToProps = ({ app: { user_payments = {} } }) => ({
	user_payments,
});

export default connect(mapStateToProps)(
	withConfig(UserPaymentVerificationHome)
);
