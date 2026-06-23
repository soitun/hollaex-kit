import React from 'react';
import { Link } from 'react-router';
import { Icon as LegacyIcon } from '@ant-design/compatible';
import {
	CloseSquareOutlined,
	ClockCircleOutlined,
	CheckCircleOutlined,
	BankOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import store from 'store';
import { isSupport } from 'utils/token';
import { formatDate } from 'utils';
import { Coin } from 'components';

/*export const renderBoolean = (value) => (
	<LegacyIcon type={value ? 'check-circle' : 'close-circle-o'} />
);*/

export const renderStatus = (_, { status, dismissed, rejected, onhold }) => {
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

	return 'Pending';
};

const ButtonNotAvailable = () => <CloseSquareOutlined />;
export const renderValidation = ({
	status,
	dismissed,
	rejected,
	processing,
	completeDeposit,
	updatingItem,
}) =>
	!status && !dismissed && !rejected && !processing ? (
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
	rejected,
	dismissed,
	processing,
	dismissDeposit,
	dismissingItem,
}) =>
	!status && !dismissed && !rejected && !processing ? (
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
		<Button type="primary" className="green-btn">
			<Link to={`/admin/user?id=${id}`}>{id}</Link>
		</Button>
	</Tooltip>
);

export const renderAsset = (asset) => {
	const coins = store.getState().app.coins;
	return (
		<div className="d-flex align-items-center">
			{coins[asset]?.icon_id && (
				<Coin type="CS4" iconId={coins[asset]?.icon_id} />
			)}
			<span className={coins[asset]?.icon_id ? 'ml-1 caps' : 'caps'}>
				{asset}
			</span>
		</div>
	);
};

export const renderContent = (renderData, onOpenModal) => {
	if (renderData.status) {
		return (
			<div className="d-flex align-items-center">
				<CheckCircleOutlined style={{ margin: '5px' }} />
				Completed
			</div>
		);
	} else if (renderData.dismissed) {
		return <div>Dismissed</div>;
	} else if (renderData.rejected) {
		return <div>Rejected</div>;
	} else if (renderData.onhold) {
		const isDeposit = renderData.type === 'deposit';
		return (
			<div className="d-flex validate-wrapper align-items-center">
				<ClockCircleOutlined style={{ margin: '5px' }} />
				<span className="mr-3">On Hold</span>
				<Tooltip placement="bottom" title="RELEASE">
					<div
						className="anchor"
						onClick={(e) => {
							onOpenModal(renderData, 'release');
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
							onOpenModal(renderData, isDeposit ? 'block' : 'reject');
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

	const canValidateDismiss =
		!renderData.status &&
		!renderData.dismissed &&
		!renderData.rejected &&
		!renderData.processing;
	const canRetry =
		!renderData.status &&
		!renderData.dismissed &&
		!renderData.rejected &&
		renderData.waiting;

	return (
		<div className="d-flex validate-wrapper align-items-center">
			<ClockCircleOutlined style={{ margin: '5px' }} />
			<span className="mr-3">Pending</span>
			{canValidateDismiss && (
				<>
					<Tooltip placement="bottom" title="VALIDATE">
						<div
							className="anchor"
							onClick={(e) => {
								onOpenModal(renderData, 'validate');
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							validate
						</div>
					</Tooltip>
					<div className="mx-3">/</div>
					<Tooltip placement="bottom" title="DISMISS">
						<div
							className="anchor"
							onClick={(e) => {
								onOpenModal(renderData, 'dismiss');
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							dismiss
						</div>
					</Tooltip>
				</>
			)}
			{canValidateDismiss && canRetry && <div className="mx-3">/</div>}
			{canRetry && (
				<Tooltip placement="bottom" title="RETRY">
					<div
						className="anchor"
						onClick={(e) => {
							onOpenModal(renderData, 'retry');
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						Retry
					</div>
				</Tooltip>
			)}
		</div>
	);
};

export const COLUMNS = (currency, onOpenModal) => {
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
		{
			title: 'Currency',
			dataIndex: 'currency',
			key: 'currency',
			render: (asset) => renderAsset(asset),
		},
		{ title: 'Amount', dataIndex: 'amount', key: 'amount' },
		// { title: 'Fee', dataIndex: 'fee', key: 'fee' },
		// { title: 'Timestamp', dataIndex: 'created_at', key: 'created_at' },
	];
	// Admins get a combined Status column with inline validate/dismiss/retry
	// actions; support sees the status label only.
	if (!isSupport()) {
		columns.push({
			title: 'Status',
			render: (renderData) => renderContent(renderData, onOpenModal),
		});
	} else {
		columns.push({
			title: 'Status',
			key: 'status',
			render: renderStatus,
		});
	}
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
	id,
	network,
	processing,
	waiting,
	onhold,
	dismissed,
	rejected,
	status,
	transaction_id,
	source,
	coins,
}) => {
	const renderFlag = (value) =>
		value === undefined ? '-' : value ? 'Yes' : 'No';
	const renderValue = (value) =>
		value === undefined || value === null || value === '' ? '-' : value;
	const renderSource = (value) => {
		const items = Array.isArray(value) ? value : value ? [value] : [];
		return items
			.map((item) => (typeof item === 'object' ? JSON.stringify(item) : item))
			.join(', ');
	};
	return (
		<div>
			{id !== undefined && <div>Record Id: {id}</div>}
			<div>
				Amount: {amount} {currency}
			</div>
			<div>
				Fee: {fee} {fee_coin}
			</div>
			{address && <div>Address: {address}</div>}
			{transaction_id && <div>Transaction Id: {transaction_id}</div>}
			<div>Network: {renderValue(network)}</div>
			{(Array.isArray(source) ? source.length > 0 : !!source) && (
				<div>Source: {renderSource(source)}</div>
			)}
			<div>
				Status: {renderFlag(status)} | Rejected: {renderFlag(rejected)} |
				Dismissed: {renderFlag(dismissed)} | Processing:{' '}
				{renderFlag(processing)} | Waiting: {renderFlag(waiting)} | On Hold:{' '}
				{renderFlag(onhold)}
			</div>
			<div>Timestamp: {formatDate(created_at)}</div>
			{updated_at && <div>Last update: {formatDate(updated_at)}</div>}
			{description && <div>Description: {description}</div>}
		</div>
	);
};
