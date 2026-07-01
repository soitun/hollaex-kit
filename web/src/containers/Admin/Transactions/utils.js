import React from 'react';
import moment from 'moment';
import { Icon as LegacyIcon } from '@ant-design/compatible';
import {
	BankOutlined,
	CloseSquareOutlined,
	ClockCircleOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { Link } from 'react-router';

// import { isSupport } from '../../../utils';
import { formatDate } from 'utils';
import { formatCurrencyByIncrementalUnit } from 'utils/currency';

export const renderBoolean = (value) => (
	<LegacyIcon type={value ? 'check-circle' : 'close-circle-o'} />
);

// Derive a single human-readable status label from the transaction flags.
export const getStatusLabel = ({
	status,
	dismissed,
	rejected,
	onhold,
	processing,
	waiting,
} = {}) => {
	if (status) {
		return 'Completed';
	}
	if (dismissed) {
		return 'Dismissed';
	}
	if (rejected) {
		return 'Rejected';
	}
	if (onhold) {
		return 'On Hold';
	}
	if (processing) {
		return 'Processing';
	}
	if (waiting) {
		return 'Waiting';
	}
	return 'Pending';
};

export const renderStatus = (_, record) => getStatusLabel(record);

// Friendly text for the known structured hold-reason types the network tags on
// the transaction `note`. Falls back to the note's own label, then its raw type.
const HOLD_REASON_LABELS = {
	travel_rule: 'travel rule information is required',
	blacklist: 'the address is blacklisted',
	kyt: 'it was flagged by transaction monitoring (KYT)',
	scorechain: 'it was flagged by on-chain screening',
	auto_deposit_disabled: 'automatic crediting is disabled',
	screening_unavailable: 'screening is temporarily unavailable',
};

// The transaction `note` is a JSONB array of structured hold reasons shaped like
// { type, label, active }. Return human-readable text for the reasons still
// holding the transaction (mirrors the network's `e.active` / `e.label || e.type`).
export const getHoldReasons = (note) => {
	if (!Array.isArray(note)) {
		return [];
	}
	return note
		.filter((entry) => entry && entry.active)
		.map((entry) => entry.label || HOLD_REASON_LABELS[entry.type] || entry.type)
		.filter(Boolean);
};

// Plain-language explanation of what the current status means for this
// transaction, shown in the expanded row so admins don't have to interpret the
// raw status flags.
export const getStatusNote = ({
	status,
	dismissed,
	rejected,
	onhold,
	processing,
	waiting,
	type,
	note,
} = {}) => {
	const kind = type === 'withdrawal' ? 'withdrawal' : 'deposit';
	if (status) {
		return kind === 'withdrawal'
			? 'This withdrawal has been completed and the funds have been sent out.'
			: 'This deposit has been completed and the funds have been credited to the user.';
	}
	if (rejected) {
		return `This ${kind} was rejected. It was not processed and no funds were moved.`;
	}
	if (dismissed) {
		return `This ${kind} was dismissed and will not be processed.`;
	}
	if (onhold) {
		const reasons = getHoldReasons(note);
		const base =
			kind === 'withdrawal'
				? 'This withdrawal is on hold pending review. Release it to send it on-chain, or reject it to cancel it.'
				: 'This deposit is on hold pending review. Release it to credit the funds, or block it to redirect them to another user.';
		if (reasons.length === 1) {
			return `${base} It is held because ${reasons[0]}.`;
		}
		if (reasons.length > 1) {
			return `${base} It is held because: ${reasons.join('; ')}.`;
		}
		return base;
	}
	if (processing) {
		return `This ${kind} is currently being processed.`;
	}
	if (waiting) {
		return `This ${kind} is waiting in the queue to be processed.`;
	}
	return `This ${kind} is pending and has not been processed yet.`;
};

// Status cell with inline release / block (deposit) or release / reject
// (withdrawal) actions for on-hold transactions; other states show the label.
export const renderContent = (record, onOpenModal) => {
	if (record.onhold && onOpenModal) {
		const isDeposit = record.type === 'deposit';
		return (
			<div className="d-flex validate-wrapper align-items-center">
				<ClockCircleOutlined style={{ margin: '5px' }} />
				<span className="mr-3">On Hold</span>
				<Tooltip placement="bottom" title="RELEASE">
					<div
						className="anchor"
						onClick={(e) => {
							onOpenModal(record, 'release');
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						release
					</div>
				</Tooltip>
				<div className="mx-3">/</div>
				<Tooltip placement="bottom" title={isDeposit ? 'BLOCK' : 'REJECT'}>
					<div
						className="anchor"
						onClick={(e) => {
							onOpenModal(record, isDeposit ? 'block' : 'reject');
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						{isDeposit ? 'block' : 'reject'}
					</div>
				</Tooltip>
			</div>
		);
	}
	return getStatusLabel(record);
};

const ButtonNotAvailable = () => <CloseSquareOutlined />;
export const renderValidation = ({ status, completeDeposit, updatingItem }) =>
	!status ? (
		<Tooltip placement="bottom" title="VALIDATE">
			<Button
				type="primary"
				onClick={completeDeposit}
				loading={updatingItem}
				shape="circle"
			>
				{!updatingItem && <BankOutlined />}
			</Button>
		</Tooltip>
	) : (
		<ButtonNotAvailable />
	);

export const renderDismiss = ({
	status,
	dismissed,
	rejected,
	dismissDeposit,
	dismissingItem,
}) =>
	!status && !rejected ? (
		<Tooltip placement="bottom" title={dismissed ? 'UNDO DISMISS' : 'DISMISS'}>
			<Button
				type={dismissed ? 'dashed' : 'primary'}
				onClick={dismissDeposit}
				loading={dismissingItem}
				shape="circle"
			>
				{!dismissingItem && <LegacyIcon type={dismissed ? 'eye' : 'eye-o'} />}
			</Button>
		</Tooltip>
	) : (
		<ButtonNotAvailable />
	);

export const renderUser = (id) => (
	<Tooltip placement="bottom" title={`SEE USER ${id} DETAILS`}>
		<Button type="primary">
			<Link to={`user?id=${id}`}>{id}</Link>
		</Button>
	</Tooltip>
);

export const COLUMNS = (currency, type, onOpenModal) => {
	const transactionTitle =
		currency === 'fiat' ? 'Payment Id' : 'Transaction Id';
	const columns = [
		{
			title: 'User Id',
			dataIndex: 'user_id',
			key: 'user_id',
			render: renderUser,
		},
		{
			title: transactionTitle,
			dataIndex: 'transaction_id',
			key: 'transaction_id',
		},
		// { title: 'Address', dataIndex: 'address', key: 'address' },
		{ title: 'Type', dataIndex: 'type', key: 'type' },
		{ title: 'Currency', dataIndex: 'currency', key: 'currency' },

		{ title: 'Amount', dataIndex: 'amount', key: 'amount' },
		{
			title: 'Status',
			key: 'status',
			render: (_, record) => renderContent(record, onOpenModal),
		},
		{
			title: 'Time',
			dataIndex: 'created_at',
			key: 'created_at',
			render: (created_at) =>
				created_at ? (
					<Tooltip title={formatDate(created_at)}>
						{moment(created_at).fromNow()}
					</Tooltip>
				) : (
					'-'
				),
		},
		// { title: 'Fee', dataIndex: 'fee', key: 'fee' },
	];
	return columns;
};

export const SELECT_KEYS = (currency) => {
	if (currency === 'fiat') {
		return [{ value: 'transaction_id', label: 'Payment Id' }];
	} else {
		return [
			{ value: 'transaction_id', label: 'Transaction ID' },
			{ value: 'address', label: 'Address' },
		];
	}
};

export const renderRowContent = ({
	address,
	description,
	amount,
	fee,
	created_at,
	updated_at,
	currency,
	fee_coin,
	type,
	coins,
	network,
	source,
	status,
	dismissed,
	rejected,
	onhold,
	processing,
	waiting,
	category,
	note,
	viewTravelRule,
}) => {
	const renderSource = (value) => {
		const items = Array.isArray(value) ? value : value ? [value] : [];
		return items
			.map((item) => (typeof item === 'object' ? JSON.stringify(item) : item))
			.join(', ');
	};
	const renderFlag = (value) =>
		value === undefined ? '-' : value ? 'Yes' : 'No';
	return (
		<div>
			{address && <div>Address: {address}</div>}
			<div>Type: {type}</div>
			<div>Currency: {currency}</div>
			<div>
				Amount:{' '}
				{formatCurrencyByIncrementalUnit(
					amount,
					coins?.[currency?.toLocaleLowerCase()]?.increment_unit,
					true
				)}
			</div>
			<div>
				Fee: {fee} {fee_coin}
			</div>
			<div>Network: {network}</div>
			{(Array.isArray(source) ? source.length > 0 : !!source) && (
				<div>Source: {renderSource(source)}</div>
			)}
			<div>
				Status:{' '}
				{getStatusLabel({
					status,
					dismissed,
					rejected,
					onhold,
					processing,
					waiting,
				})}
			</div>
			<div>
				Completed: {renderFlag(status)} | Rejected: {renderFlag(rejected)} |
				Dismissed: {renderFlag(dismissed)} | On Hold: {renderFlag(onhold)} |
				Processing: {renderFlag(processing)} | Waiting: {renderFlag(waiting)}
			</div>
			<div
				className="mt-2 p-2"
				style={
					onhold
						? {
								backgroundColor: '#ffffff',
								color: '#d0021b',
								fontWeight: 'bold',
								borderRadius: '2px',
								display: 'inline-block',
						  }
						: undefined
				}
			>
				Note:{' '}
				{getStatusNote({
					status,
					dismissed,
					rejected,
					onhold,
					processing,
					waiting,
					type,
					note,
				})}
			</div>
			<div>Timestamp: {formatDate(created_at)}</div>
			{updated_at && <div>Last update: {formatDate(updated_at)}</div>}
			{category && <div>Category: {category}</div>}
			{description && <div>Description: {description}</div>}
			{viewTravelRule && (
				<div className="mt-2">
					<span
						className="pointer underline-text blue-link"
						onClick={(e) => {
							e.stopPropagation();
							viewTravelRule();
						}}
					>
						View travel rule details
					</span>
				</div>
			)}
		</div>
	);
};

// Counterparty type slugs -> human labels (mirrors TRAVEL_RULE_COUNTERPARTY_TYPES).
export const TRAVEL_RULE_TYPE_LABELS = {
	exchange_vasp: 'Exchange / VASP',
	self_custody: 'Self-custody wallet',
};
