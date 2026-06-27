import React from 'react';
import { Icon as LegacyIcon } from '@ant-design/compatible';
import { BankOutlined, CloseSquareOutlined } from '@ant-design/icons';
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

export const COLUMNS = (currency, type) => {
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
		{ title: 'Status', key: 'status', render: renderStatus },
		// { title: 'Fee', dataIndex: 'fee', key: 'fee' },
		// { title: 'Timestamp', dataIndex: 'created_at', key: 'created_at' },
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
			<div>Timestamp: {formatDate(created_at)}</div>
			{updated_at && <div>Last update: {formatDate(updated_at)}</div>}
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
