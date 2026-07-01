import React, { useState, useEffect } from 'react';
import { message, Table, Button, Spin, Modal, Input } from 'antd';
import { Link } from 'react-router';

import {
	CloseOutlined,
	PlusSquareOutlined,
	MinusSquareOutlined,
} from '@ant-design/icons';
import withConfig from 'components/ConfigProvider/withConfig';
import { connect } from 'react-redux';
import { updateConstants } from '../General/action';
import { requestAdminData, setConfig } from 'actions/appActions';
import { Coin } from 'components';
import { renderAsset } from '../Deposits/utils';
import { getRampTypes, getRampMethodConfig, toRampObject } from 'utils/wallet';

const FiatFees = ({ coins, dispatch, constants }) => {
	const onramp = constants?.onramp || {};
	const offramp = constants?.offramp || {};
	const [coinData, setCoinData] = useState([]);
	const [coinCustomizations, setCoinCustomizations] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [queryValues] = useState();
	// eslint-disable-next-line
	const [editMode, setEditMode] = useState(false);
	const [selectedCoin, setSelectedCoin] = useState(true);
	const [queryFilters, setQueryFilters] = useState({
		total: 0,
		page: 1,
		pageSize: 10,
		limit: 50,
		currentTablePage: 1,
		isRemaining: true,
	});

	const [displayCostumizationModal, setDisplayCostumizationModal] = useState(
		false
	);
	// per-payment-method limits/fee editing (on-ramp / off-ramp breakdown rows)
	const [editingMethod, setEditingMethod] = useState(null);

	// Build the per-payment-method breakdown rows for a fiat currency, combining
	// its enabled on-ramp and off-ramp methods (each row carries its current limits).
	const buildRampRows = (symbol) => {
		const rows = [];
		getRampTypes(onramp?.[symbol]).forEach((method) => {
			const cfg = getRampMethodConfig(onramp?.[symbol], method) || {};
			rows.push({
				symbol,
				dirKey: 'onramp',
				direction: 'On-ramp',
				method,
				min: cfg.min,
				max: cfg.max,
				fee: cfg.fee,
			});
		});
		getRampTypes(offramp?.[symbol]).forEach((method) => {
			const cfg = getRampMethodConfig(offramp?.[symbol], method) || {};
			rows.push({
				symbol,
				dirKey: 'offramp',
				direction: 'Off-ramp',
				method,
				min: cfg.min,
				max: cfg.max,
				fee: cfg.fee,
			});
		});
		return rows;
	};

	const renderLimitCell = (value) =>
		value != null && value !== '' ? value : '-';

	// Rendered as a themed block (not a nested antd Table) so it inherits the dark
	// admin theme instead of antd's default white table styling.
	const renderRampBreakdown = (record) => {
		const rows = buildRampRows(record.symbol);
		if (!rows.length) {
			return (
				<div className="ramp-breakdown-empty">
					No on-ramp or off-ramp payment methods enabled for this currency.
				</div>
			);
		}
		return (
			<div className="ramp-breakdown">
				<div className="ramp-breakdown-row ramp-breakdown-head">
					<span>Direction</span>
					<span>Payment method</span>
					<span>Minimum</span>
					<span>Maximum</span>
					<span>Fee</span>
					<span>Edit</span>
				</div>
				{rows.map((row) => (
					<div
						className="ramp-breakdown-row"
						key={`${row.dirKey}-${row.method}`}
					>
						<span>{row.direction}</span>
						<span className="text-capitalise">{row.method}</span>
						<span>{renderLimitCell(row.min)}</span>
						<span>{renderLimitCell(row.max)}</span>
						<span>{renderLimitCell(row.fee)}</span>
						<span>
							<Button
								size="small"
								onClick={() =>
									setEditingMethod({
										...row,
										min: row.min ?? '',
										max: row.max ?? '',
										fee: row.fee ?? '',
									})
								}
								style={{ backgroundColor: '#CB7300', color: 'white' }}
							>
								Edit
							</Button>
						</span>
					</div>
				))}
			</div>
		);
	};

	const saveMethodLimits = async () => {
		if (!editingMethod) return;
		const { symbol, dirKey, method } = editingMethod;
		const source = dirKey === 'onramp' ? onramp : offramp;
		// preserve the rest of the method config (e.g. on-ramp's data/type schema)
		const symbolCfg = toRampObject(source?.[symbol]);
		const methodCfg = { ...(symbolCfg[method] || {}) };
		['min', 'max', 'fee'].forEach((key) => {
			const value = editingMethod[key];
			if (value === '' || value == null) {
				delete methodCfg[key];
			} else {
				methodCfg[key] = Number(value);
			}
		});
		const updatedRamp = {
			...source,
			[symbol]: { ...symbolCfg, [method]: methodCfg },
		};
		try {
			setIsLoading(true);
			await updateConstants({ kit: { [dirKey]: updatedRamp } });
			dispatch(setConfig({ ...constants, [dirKey]: updatedRamp }));
			message.success('Changes saved.');
			setEditingMethod(null);
			setIsLoading(false);
		} catch (error) {
			setIsLoading(false);
			message.error(error?.data?.message || error.message);
		}
	};

	const columns = [
		{
			title: 'Symbol',
			dataIndex: 'symbol',
			key: 'symbol',
			render: (user_id, data) => {
				return renderAsset(data?.symbol);
			},
		},
		{
			title: 'Name',
			dataIndex: 'fullname',
			key: 'fullname',
			render: (user_id, data) => {
				return <div className="d-flex">{data?.fullname || '-'}</div>;
			},
		},
		{
			title: 'Withdrawal Fee',
			dataIndex: 'withdrawal_fee',
			key: 'withdrawal_fee',
			render: (user_id, data) => {
				return (
					<div className="d-flex">
						{data?.withdrawal_fee !== null && data?.withdrawal_fee !== undefined
							? data?.withdrawal_fee
							: '-'}
					</div>
				);
			},
		},
		{
			title: 'Deposit Fee',
			dataIndex: 'deposit_fee',
			key: 'deposit_fee',
			render: (user_id, data) => {
				return (
					<div className="d-flex">
						{data?.deposit_fee !== null && data?.deposit_fee !== undefined
							? data?.deposit_fee
							: '-'}
					</div>
				);
			},
		},
		{
			title: 'Minimum amount',
			dataIndex: 'min',
			key: 'min',
			render: (user_id, data) => {
				return <div className="d-flex">{data?.min || '-'}</div>;
			},
		},
		{
			title: 'Maximum amount',
			dataIndex: 'max',
			key: 'max',
			render: (user_id, data) => {
				return <div className="d-flex">{data?.max || '-'}</div>;
			},
		},
		{
			title: 'Increment Unit',
			dataIndex: 'increment_unit',
			key: 'increment_unit',
			render: (user_id, data) => {
				return <div className="d-flex">{data?.increment_unit || '-'}</div>;
			},
		},
		{
			title: 'Edit',
			dataIndex: 'edit',
			key: 'edit',
			render: (user_id, data) => {
				return (
					<div className="d-flex">
						<Button
							onClick={(e) => {
								e.stopPropagation();
								setEditMode(true);
								setSelectedCoin(data);
								setDisplayCostumizationModal(true);
							}}
							style={{ backgroundColor: '#CB7300', color: 'white' }}
						>
							Edit
						</Button>
					</div>
				);
			},
		},
	];

	useEffect(() => {
		// Wait for coins to be loaded before building the fiat fees table,
		// otherwise the closure captures an empty `coins` and filters out all
		// fiat rows (showing "No Data" on a fresh load of this tab).
		if (coins && Object.keys(coins).length) {
			requesCoinConfiguration(queryFilters.page, queryFilters.limit);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [coins]);

	useEffect(() => {
		// requesCoinConfiguration(queryFilters.page, queryFilters.limit);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryValues]);

	const requestDownload = () => {
		// return getExchangeSessionsCsv({ ...queryValues, format: 'csv' });
	};

	const requesCoinConfiguration = (page = 1, limit = 50) => {
		setIsLoading(true);
		requestAdminData()
			.then((response) => {
				const fiatFeesData = response?.data?.kit?.fiat_fees || {};
				const filteredData = {};

				// Include every fiat coin (not only those already in fiat_fees) so a
				// currency with on-ramp/off-ramp methods but no custom fee still shows a
				// row — and its per-payment-method breakdown stays editable.
				for (const coinSymbol in coins) {
					const coin = coins[coinSymbol];
					if (coin && coin.type === 'fiat') {
						const feeEntry = fiatFeesData[coinSymbol] || {
							symbol: coinSymbol,
							fee_markup: null,
						};
						filteredData[coinSymbol] = {
							...feeEntry,
							fullname: coin?.fullname,
							min: feeEntry?.min || coin?.min,
							max: feeEntry?.max || coin?.max,
							increment_unit: feeEntry?.increment_unit || coin?.increment_unit,
							icon_id: coin?.icon_id,
						};
					}
				}
				setCoinCustomizations(Object.values(filteredData));
				setCoinData(filteredData);

				setQueryFilters({
					total: response.count,
					fetched: true,
					page,
					currentTablePage: page === 1 ? 1 : queryFilters.currentTablePage,
					isRemaining: response.count > page * limit,
				});

				setIsLoading(false);
			})
			.catch((err) => {
				setIsLoading(false);
				const error = err && err.data ? err.data.message : err.message;
				console.error('error', error);
			});
	};

	const handleCostumizationModal = () => {
		setDisplayCostumizationModal(false);
		setSelectedCoin();
		setEditMode(false);
	};

	return (
		<div className="fiat-fees-wrapper">
			<div style={{ color: '#ccc' }}>
				Below, You can add/edit fees and other attributes for fiats available in
				your exchange, this will override the default fees set to fiats by
				default
			</div>
			<div style={{ color: '#ccc', marginTop: 8 }}>
				These are the per-currency defaults. To set fine-grained fees, minimums
				and maximums for a specific on-ramp or off-ramp payment option, expand a
				currency row below — those per-payment-option values supersede the
				defaults set here. Enable the payment options themselves in the{' '}
				<Link to="/admin/fiat?tab=2" className="underline-text">
					On-ramp
				</Link>{' '}
				and{' '}
				<Link to="/admin/fiat?tab=3" className="underline-text">
					Off-ramp
				</Link>{' '}
				tabs.
			</div>
			<div>
				<div style={{ marginTop: 20 }}></div>
				<div className="mt-5">
					<div style={{ display: 'flex', justifyContent: 'space-between' }}>
						<span
							onClick={(e) => {
								requestDownload();
							}}
							className="mb-2 underline-text cursor-pointer"
							style={{ cursor: 'pointer' }}
						>
							{/* Download below CSV table */}
						</span>
						<div>
							<span>
								{/* <Button
									onClick={() => {
										setDisplayCostumizationModal(true)
									}}
									style={{
										backgroundColor: '#288500',
										color: 'white',
										flex: 1,
										height: 35,
										marginRight: 10,
									}}
									type="default"
								>
									Create New Customization
								</Button> */}
							</span>
							{/* <span>Total: {queryFilters.total || '-'}</span> */}
						</div>
					</div>

					<div className="mt-4" style={{ marginBottom: 80 }}>
						<Spin spinning={isLoading}>
							<Table
								className="blue-admin-table"
								columns={columns}
								dataSource={
									coinCustomizations || [].sort((a, b) => a.symbol - b.symbol)
								}
								rowKey={(data) => data.symbol}
								expandable={{
									expandedRowRender: renderRampBreakdown,
									rowExpandable: (record) =>
										buildRampRows(record.symbol).length > 0,
									expandIcon: ({ expanded, onExpand, record }) =>
										buildRampRows(record.symbol).length > 0 ? (
											<span
												onClick={(e) => onExpand(record, e)}
												style={{
													cursor: 'pointer',
													color: '#ffffff',
													fontSize: 18,
													display: 'inline-flex',
												}}
												title={
													expanded
														? 'Hide payment methods'
														: 'Show payment methods'
												}
											>
												{expanded ? (
													<MinusSquareOutlined />
												) : (
													<PlusSquareOutlined />
												)}
											</span>
										) : (
											<span style={{ display: 'inline-block', width: 18 }} />
										),
								}}
								// pagination={{
								// 	current: queryFilters.currentTablePage,
								// 	onChange: pageChange,
								// }}

								pagination={false}
							/>
						</Spin>
					</div>
				</div>

				{displayCostumizationModal && (
					<Modal
						maskClosable={false}
						closeIcon={<CloseOutlined style={{ color: 'white' }} />}
						bodyStyle={{
							backgroundColor: '#27339D',
						}}
						visible={displayCostumizationModal}
						footer={null}
						onCancel={() => {
							handleCostumizationModal();
						}}
						wrapClassName="edit-fiat-fees-popup-wrapper"
					>
						<div
							style={{
								fontWeight: '600',
								color: 'white',
								fontSize: 18,
								marginBottom: 10,
							}}
							className="edit-fiat-fees-title d-flex align-items-center"
						>
							<span>Edit Fiat Fees </span>
							<div className="edit-fees-asset-symbol d-flex align-items-center">
								(
								{selectedCoin?.icon_id && (
									<Coin type="CS6" iconId={selectedCoin?.icon_id} />
								)}
								<span className="text-capitalise">
									{selectedCoin?.fullname}
								</span>
								)
							</div>
						</div>
						<div style={{ marginBottom: 20 }}>
							<div style={{ color: '#ccc', marginBottom: 12, fontSize: 12 }}>
								These apply to all payment options for this fiat. For fees,
								minimums and maximums specific to a single payment option, close
								this and expand the currency's row to edit each on-ramp /
								off-ramp method — those values supersede these.
							</div>
							<div style={{ marginBottom: 10 }}>
								<div className="mb-1">Withdrawal Fee</div>
								<Input
									type="number"
									placeholder="Enter Withdrawal Fee"
									value={selectedCoin.withdrawal_fee}
									onChange={(e) => {
										setSelectedCoin({
											...selectedCoin,
											withdrawal_fee: e.target.value,
										});
									}}
									suffix={renderAsset(selectedCoin?.symbol)}
								/>
							</div>

							<div style={{ marginBottom: 10 }}>
								<div className="mb-1">Deposit Fee</div>
								<Input
									type="number"
									placeholder="Enter Deposit Fee"
									value={selectedCoin.deposit_fee}
									onChange={(e) => {
										setSelectedCoin({
											...selectedCoin,
											deposit_fee: e.target.value,
										});
									}}
									suffix={renderAsset(selectedCoin?.symbol)}
								/>
							</div>
							<div style={{ marginBottom: 10 }}>
								<div className="mb-1">Minimum Allowable Amount</div>
								<Input
									type="number"
									placeholder="Enter Minimum allowable amount"
									value={selectedCoin.min}
									onChange={(e) => {
										setSelectedCoin({
											...selectedCoin,
											min: e.target.value,
										});
									}}
									suffix={renderAsset(selectedCoin?.symbol)}
								/>
							</div>
							<div style={{ marginBottom: 10 }}>
								<div className="mb-1">Maximum Allowable Amount</div>
								<Input
									type="number"
									placeholder="Enter Maximum allowable amount"
									value={selectedCoin.max}
									onChange={(e) => {
										setSelectedCoin({
											...selectedCoin,
											max: e.target.value,
										});
									}}
									suffix={renderAsset(selectedCoin?.symbol)}
								/>
							</div>
							<div style={{ marginBottom: 10 }}>
								<div className="mb-1">Increment Unit</div>
								<Input
									type="number"
									placeholder="Enter Increment Unit"
									value={selectedCoin.increment_unit}
									onChange={(e) => {
										setSelectedCoin({
											...selectedCoin,
											increment_unit: e.target.value,
										});
									}}
									suffix={renderAsset(selectedCoin?.symbol)}
								/>
							</div>
						</div>
						<div
							style={{
								display: 'flex',
								flexDirection: 'row',
								gap: 15,
								justifyContent: 'space-between',
								marginBottom: 20,
							}}
						>
							<Button
								onClick={() => {
									handleCostumizationModal();
								}}
								style={{
									backgroundColor: '#288500',
									color: 'white',
									flex: 1,
									height: 35,
								}}
								type="default"
							>
								Back
							</Button>
							<Button
								onClick={async () => {
									try {
										if (selectedCoin.withdrawal_fee) {
											selectedCoin.withdrawal_fee = Number(
												selectedCoin.withdrawal_fee
											);
										}

										if (selectedCoin.deposit_fee) {
											selectedCoin.deposit_fee = Number(
												selectedCoin.deposit_fee
											);
										}

										if (selectedCoin.min) {
											selectedCoin.min = Number(selectedCoin.min);
										}

										if (selectedCoin.max) {
											selectedCoin.max = Number(selectedCoin.max);
										}

										if (selectedCoin.increment_unit) {
											selectedCoin.increment_unit = Number(
												selectedCoin.increment_unit
											);
										}

										const updatedFiatFees = {
											...coinData,
											[selectedCoin.symbol]: {
												symbol: selectedCoin.symbol,
												withdrawal_fee: selectedCoin.withdrawal_fee,
												deposit_fee: selectedCoin.deposit_fee,
												min: selectedCoin.min,
												max: selectedCoin.max,
												increment_unit: selectedCoin.increment_unit,
											},
										};

										await updateConstants({
											kit: {
												fiat_fees: updatedFiatFees,
											},
										});
										dispatch(
											setConfig({
												...constants,
												fiat_fees: updatedFiatFees,
											})
										);

										requesCoinConfiguration();
										message.success('Changes saved.');
										handleCostumizationModal();
									} catch (error) {
										message.error(error.data.message);
									}
								}}
								style={{
									backgroundColor: '#288500',
									color: 'white',
									flex: 1,
									height: 35,
								}}
								type="default"
							>
								PROCEED
							</Button>
						</div>
					</Modal>
				)}

				{editingMethod && (
					<Modal
						maskClosable={false}
						closeIcon={<CloseOutlined style={{ color: 'white' }} />}
						bodyStyle={{ backgroundColor: '#27339D' }}
						visible={!!editingMethod}
						footer={null}
						onCancel={() => setEditingMethod(null)}
						wrapClassName="edit-fiat-fees-popup-wrapper"
					>
						<div
							style={{
								fontWeight: '600',
								color: 'white',
								fontSize: 18,
								marginBottom: 4,
							}}
							className="edit-fiat-fees-title text-capitalise"
						>
							{editingMethod.direction} fee &amp; limits —{' '}
							{editingMethod.method} (
							{(editingMethod.symbol || '').toUpperCase()})
						</div>
						<div style={{ color: '#ccc', marginBottom: 16, fontSize: 12 }}>
							Specific to this payment option. Leave a field blank to fall back
							to the {editingMethod.symbol?.toUpperCase()} defaults set above.
						</div>
						<div style={{ marginBottom: 20 }}>
							<div style={{ marginBottom: 10 }}>
								<div className="mb-1">
									{editingMethod.direction === 'On-ramp'
										? 'Minimum deposit'
										: 'Minimum withdrawal'}
								</div>
								<Input
									type="number"
									placeholder="Minimum"
									value={editingMethod.min}
									suffix={(editingMethod.symbol || '').toUpperCase()}
									onChange={(e) =>
										setEditingMethod({ ...editingMethod, min: e.target.value })
									}
								/>
							</div>
							<div style={{ marginBottom: 10 }}>
								<div className="mb-1">
									{editingMethod.direction === 'On-ramp'
										? 'Maximum deposit'
										: 'Maximum withdrawal'}
								</div>
								<Input
									type="number"
									placeholder="Maximum"
									value={editingMethod.max}
									suffix={(editingMethod.symbol || '').toUpperCase()}
									onChange={(e) =>
										setEditingMethod({ ...editingMethod, max: e.target.value })
									}
								/>
							</div>
							<div style={{ marginBottom: 10 }}>
								<div className="mb-1">
									{editingMethod.direction === 'On-ramp'
										? 'Deposit fee'
										: 'Withdrawal fee'}
								</div>
								<Input
									type="number"
									placeholder="Fee"
									value={editingMethod.fee}
									suffix={(editingMethod.symbol || '').toUpperCase()}
									onChange={(e) =>
										setEditingMethod({ ...editingMethod, fee: e.target.value })
									}
								/>
							</div>
						</div>
						<div
							style={{
								display: 'flex',
								flexDirection: 'row',
								gap: 15,
								justifyContent: 'space-between',
								marginBottom: 20,
							}}
						>
							<Button
								onClick={() => setEditingMethod(null)}
								style={{
									backgroundColor: '#288500',
									color: 'white',
									flex: 1,
									height: 35,
								}}
								type="default"
							>
								Back
							</Button>
							<Button
								onClick={saveMethodLimits}
								style={{
									backgroundColor: '#288500',
									color: 'white',
									flex: 1,
									height: 35,
								}}
								type="default"
							>
								PROCEED
							</Button>
						</div>
					</Modal>
				)}
			</div>
		</div>
	);
};

const mapStateToProps = (state) => ({
	coins: state.app.coins,
	constants: state.app.constants,
});

export default connect(mapStateToProps)(withConfig(FiatFees));
