import React, { useState, useEffect } from 'react';
import { Tooltip, Select } from 'antd';
import {
	CloseCircleOutlined,
	CloseOutlined,
	CheckCircleOutlined,
} from '@ant-design/icons';

import STRINGS from 'config/localizedStrings';
import { EditWrapper, Coin, Button, Dialog, Paginator } from 'components';
import { formatToCurrency, countDecimals } from 'utils/currency';
import { getDecimals } from 'utils/utils';
import { PAIR2_STATIC_SIZE } from 'components/QuickTrade';
import { getFormattedDate } from 'utils/string';

const ActiveOTCLimitOrder = ({
	orders,
	coins,
	onCancelOrder,
	icons: ICONS,
}) => {
	const [showCancelOrderDialog, setShowCancelOrderDialog] = useState(false);
	const [showViewMoreDialog, setShowViewMoreDialog] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedPair, setSelectedPair] = useState(null);
	const pageSize = 10;

	const ordersArray = Array.isArray(orders) ? orders : [];

	const allOtcOrders = ordersArray.filter(
		(order) => order && order.meta?.broker === 'otc'
	);

	const uniquePairs = Array.from(
		new Set(
			allOtcOrders?.map((order) => order?.symbol)?.filter((symbol) => symbol)
		)
	)?.sort();

	const otcOrders = selectedPair
		? allOtcOrders?.filter((order) => order?.symbol === selectedPair)
		: allOtcOrders;

	useEffect(() => {
		if (selectedPair && otcOrders?.length === 0 && allOtcOrders?.length > 0) {
			setSelectedPair(null);
			setCurrentPage(1);
		} else if (selectedPair && allOtcOrders?.length === 0) {
			setSelectedPair(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [otcOrders?.length, allOtcOrders?.length, selectedPair, uniquePairs]);

	const totalPages = Math.ceil(otcOrders?.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = startIndex + pageSize;
	const paginatedOrders = otcOrders?.slice(startIndex, endIndex);

	const goToPreviousPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	const goToNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1);
		}
	};

	useEffect(() => {
		if (totalPages > 0 && currentPage > totalPages) {
			setCurrentPage(1);
		}
	}, [totalPages, currentPage]);

	if (!otcOrders || otcOrders?.length === 0) {
		return null;
	}

	const handleCancelOrderClick = (order) => {
		setSelectedOrder(order);
		setShowCancelOrderDialog(true);
	};

	const handleConfirmCancelOrder = () => {
		if (selectedOrder?.id && onCancelOrder) {
			onCancelOrder(selectedOrder?.id);
			setShowCancelOrderDialog(false);
			setSelectedOrder(null);
		}
	};

	const handlePairChange = (value) => {
		setSelectedPair(value);
		setCurrentPage(1);
	};

	const handleViewMoreClick = (order) => {
		setSelectedOrder(order);
		setShowViewMoreDialog(true);
	};

	const handleCloseCancelOrderDialog = () => {
		setShowCancelOrderDialog(false);
		setSelectedOrder(null);
	};

	const handleCloseViewMoreDialog = () => {
		setShowViewMoreDialog(false);
		setSelectedOrder(null);
	};

	const handleViewMoreCancelOrder = () => {
		setShowViewMoreDialog(false);
		if (selectedOrder) {
			handleCancelOrderClick(selectedOrder);
		}
	};

	const renderOrderDetails = (order) => {
		const [source, target] = order?.symbol?.split('-') || [];
		if (!source || !target) return null;

		const sourceCoin = coins?.[source?.toUpperCase()];
		const targetCoin = coins?.[target?.toUpperCase()];
		const sourceAmount = order?.size || 0;
		const quotePrice = order?.price || 0;
		const targetAmount = sourceAmount * quotePrice;
		const inversePrice = quotePrice > 0 ? 1 / quotePrice : 0;

		const sourceDecimalPoint = getDecimals(
			sourceCoin?.increment_unit || PAIR2_STATIC_SIZE
		);
		const targetDecimalPoint = getDecimals(
			targetCoin?.increment_unit || PAIR2_STATIC_SIZE
		);

		return (
			<div className="order-details-section mb-4">
				<div className="d-flex flex-column justify-content-between align-items-start py-4 border-bottom">
					<span className="secondary-text">
						<EditWrapper stringId="SPEND_AMOUNT">
							{STRINGS['SPEND_AMOUNT']}
						</EditWrapper>
					</span>
					<div className="d-flex align-items-center mt-2">
						{coins[source]?.icon_id && (
							<span className="mr-2">
								<Coin iconId={coins[source]?.icon_id} type="CS6" />
							</span>
						)}
						<span className="bold">
							{formatToCurrency(
								sourceAmount,
								sourceDecimalPoint,
								sourceAmount < 1 && countDecimals(sourceAmount) > 8
							)}{' '}
							{source?.toUpperCase()}
						</span>
					</div>
				</div>
				<div className="d-flex flex-column justify-content-between align-items-start py-4 border-bottom">
					<span className="secondary-text">
						<EditWrapper stringId="ESTIMATE_RECEIVE_AMOUNT">
							{STRINGS['ESTIMATE_RECEIVE_AMOUNT']}
						</EditWrapper>
					</span>
					<div className="d-flex align-items-center mt-2">
						{coins[target]?.icon_id && (
							<span className="mr-2">
								<Coin iconId={coins[target]?.icon_id} type="CS6" />
							</span>
						)}
						<span className="bold">
							{formatToCurrency(
								targetAmount,
								targetDecimalPoint,
								targetAmount < 1 && countDecimals(targetAmount) > 8
							)}{' '}
							{target?.toUpperCase()}
						</span>
					</div>
				</div>
				<div className="d-flex flex-column justify-content-between align-items-start py-4 border-bottom">
					<span className="secondary-text">
						<EditWrapper stringId="QUICK_TRADE_COMPONENT.MARKET_RATE">
							{STRINGS['QUICK_TRADE_COMPONENT.MARKET_RATE']}
						</EditWrapper>
					</span>
					<div className="d-flex align-items-center mt-2">
						<span className="bold">
							1 {target?.toUpperCase()} ={' '}
							{formatToCurrency(
								inversePrice,
								sourceDecimalPoint,
								inversePrice > 0 &&
									inversePrice < 1 &&
									countDecimals(inversePrice) > 8
							)}{' '}
							{source?.toUpperCase()}
						</span>
					</div>
				</div>
				<div className="d-flex flex-column justify-content-between align-items-start py-4">
					<span className="secondary-text">
						<EditWrapper stringId="QUICK_TRADE_COMPONENT.DATE_ORDER_PLACED">
							{STRINGS['QUICK_TRADE_COMPONENT.DATE_ORDER_PLACED']}
						</EditWrapper>
					</span>
					<span className="bold">{getFormattedDate(order?.created_at)}</span>
				</div>
			</div>
		);
	};

	return (
		<div className="active-otc-limit-order-container mt-4">
			<div className="d-flex justify-content-between align-items-center mb-3">
				<div className="d-flex align-items-center gap-3">
					<div className="bold">
						<EditWrapper stringId="QUICK_TRADE_COMPONENT.WAITING_ORDERS">
							{STRINGS.formatString(
								STRINGS['QUICK_TRADE_COMPONENT.WAITING_ORDERS'],
								allOtcOrders?.length
							)}
						</EditWrapper>
					</div>
					{uniquePairs.length > 0 && (
						<Select
							className="active-otc-limit-order-select ml-3"
							value={selectedPair}
							onChange={handlePairChange}
							placeholder="Select Pair"
							dropdownClassName="active-otc-limit-order-select-dropdown"
						>
							<Select.Option key="all" value={null}>
								All
							</Select.Option>
							{uniquePairs?.map((pair) => (
								<Select.Option key={pair} value={pair}>
									{pair?.toUpperCase()}
								</Select.Option>
							))}
						</Select>
					)}
				</div>
			</div>
			{paginatedOrders?.map((order) => {
				const [source, target] = order?.symbol?.split('-') || [];
				if (!source || !target) return null;

				const sourceCoin = coins?.[source?.toUpperCase()];
				const targetCoin = coins?.[target?.toUpperCase()];
				const sourceAmount = order?.size || 0;
				const quotePrice = order?.price || 0;
				const targetAmount = sourceAmount * quotePrice;
				const filledTargetAmount = (order?.filled || 0) * quotePrice;
				const remainingTargetAmount = targetAmount - filledTargetAmount;
				const progressPercentage =
					targetAmount > 0
						? Math.min((filledTargetAmount / targetAmount) * 100, 100)
						: 0;

				const sourceDecimalPoint = getDecimals(
					sourceCoin?.increment_unit || PAIR2_STATIC_SIZE
				);
				const targetDecimalPoint = getDecimals(
					targetCoin?.increment_unit || PAIR2_STATIC_SIZE
				);

				return (
					<div key={order?.id} className="active-otc-limit-order-item">
						<div className="base-info-container">
							<div className="d-flex align-items-center">
								{coins[source]?.icon_id && (
									<span className="mr-2">
										<Coin iconId={coins[source]?.icon_id} type="CS8" />
									</span>
								)}
								<div>
									<div className="bold">
										<EditWrapper stringId="QUICK_TRADE_COMPONENT.CONVERT_ORDER">
											{STRINGS.formatString(
												STRINGS['QUICK_TRADE_COMPONENT.CONVERT_ORDER'],
												formatToCurrency(
													sourceAmount,
													sourceDecimalPoint,
													sourceAmount < 1 && countDecimals(sourceAmount) > 8
												),
												source?.toUpperCase()
											)}
										</EditWrapper>
									</div>
								</div>
							</div>
						</div>
						<div className="quote-info-container">
							{(order?.status === 'pfilled' || order?.status === 'filled') && (
								<div
									className={`progress-bar-background ${
										order?.status === 'filled' ? 'progress-completed' : ''
									}`}
									style={{
										width:
											order?.status === 'filled'
												? '100%'
												: `${progressPercentage}%`,
									}}
								/>
							)}
							<div className="quote-info-content">
								<div className="quote-info-receiving-amount d-flex justify-content-between align-items-center w-100">
									<div className="d-flex align-items-center">
										{coins[target]?.icon_id && (
											<Coin iconId={coins[target]?.icon_id} type="CS8" />
										)}
										<EditWrapper stringId="QUICK_TRADE_COMPONENT.RECEIVING_AMOUNT">
											<span className="ml-2">
												{STRINGS.formatString(
													STRINGS['QUICK_TRADE_COMPONENT.RECEIVING_AMOUNT'],
													formatToCurrency(
														targetAmount,
														targetDecimalPoint,
														targetAmount < 1 && countDecimals(targetAmount) > 8
													),
													target?.toUpperCase()
												)}
											</span>
										</EditWrapper>
										<EditWrapper stringId="STAKE_DETAILS.VIEW_MORE">
											<span
												className="blue-link pointer underline-text ml-2"
												onClick={() => handleViewMoreClick(order)}
											>
												{STRINGS['STAKE_DETAILS.VIEW_MORE']}
											</span>
										</EditWrapper>
									</div>
								</div>
								<div className="d-flex flex-wrap gap-1 items-center">
									<EditWrapper stringId="QUICK_TRADE_COMPONENT.ORDER_PRICE">
										{STRINGS.formatString(
											STRINGS['QUICK_TRADE_COMPONENT.ORDER_PRICE'],
											formatToCurrency(
												quotePrice,
												targetDecimalPoint,
												quotePrice < 1 && countDecimals(quotePrice) > 8
											),
											target?.toUpperCase(),
											source?.toUpperCase()
										)}
									</EditWrapper>
									{(order?.status === 'pfilled' || order?.status === 'new') && (
										<>
											<EditWrapper stringId="QUICK_TRADE_COMPONENT.PARTIAL_COMPLETE">
												<span className="order-complete-amount">
													{STRINGS.formatString(
														STRINGS['QUICK_TRADE_COMPONENT.PARTIAL_COMPLETE'],
														formatToCurrency(
															filledTargetAmount,
															targetDecimalPoint,
															filledTargetAmount < 1 &&
																countDecimals(filledTargetAmount) > 8
														),
														target?.toUpperCase()
													)}
												</span>
											</EditWrapper>{' '}
											<span className="secondary-text underline-text">
												<EditWrapper stringId="QUICK_TRADE_COMPONENT.PARTIAL_COMPLETE_REMAINING">
													{STRINGS.formatString(
														STRINGS[
															'QUICK_TRADE_COMPONENT.PARTIAL_COMPLETE_REMAINING'
														],
														formatToCurrency(
															remainingTargetAmount,
															targetDecimalPoint,
															remainingTargetAmount < 1 &&
																countDecimals(remainingTargetAmount) > 8
														)
													)}
												</EditWrapper>
											</span>
										</>
									)}
								</div>
							</div>
							{order?.status !== 'filled' && order?.status !== 'canceled' && (
								<span
									className="cancel-order-btn pointer"
									onClick={() => handleCancelOrderClick(order)}
								>
									<CloseOutlined />
								</span>
							)}
							{order?.status === 'filled' && (
								<Tooltip
									title={
										STRINGS['QUICK_TRADE_COMPONENT.ORDER_FULLY_FILLED_TOOLTIP']
									}
								>
									<div className="d-flex flex-column align-items-start completed-status-section">
										<div className="d-flex align-items-center">
											<EditWrapper stringId="USER_VERIFICATION.COMPLETED">
												<span className="order-complete-amount">
													{STRINGS['USER_VERIFICATION.COMPLETED']}
												</span>
											</EditWrapper>
											<CheckCircleOutlined className="completed-check-icon ml-2" />
										</div>
										<span className="secondary-text mt-1">
											<EditWrapper stringId="QUICK_TRADE_COMPONENT.FUNDS_CLEARING">
												({STRINGS['QUICK_TRADE_COMPONENT.FUNDS_CLEARING']})
											</EditWrapper>
										</span>
									</div>
								</Tooltip>
							)}
						</div>
					</div>
				);
			})}

			{totalPages > 1 && (
				<Paginator
					currentPage={currentPage}
					pageSize={pageSize}
					count={otcOrders?.length}
					goToPreviousPage={goToPreviousPage}
					goToNextPage={goToNextPage}
					icons={ICONS}
				/>
			)}

			{selectedOrder && (
				<Dialog
					isOpen={showCancelOrderDialog}
					label="cancel-order-modal"
					className="cancel-order-dialog-wrapper"
					onCloseDialog={handleCloseCancelOrderDialog}
					shouldCloseOnOverlayClick={false}
					showCloseText={true}
				>
					<div className="cancel-order-dialog-content">
						<div className="d-flex align-items-center mb-3">
							<CloseCircleOutlined className="order-details-title" />
							<div className="bold order-details-title ml-2">
								<EditWrapper stringId="P2P.CANCEL_ORDER">
									{STRINGS['P2P.CANCEL_ORDER']}
								</EditWrapper>
							</div>
						</div>
						<div className="mb-3">
							<EditWrapper stringId="P2P.CANCEL_WARNING">
								{STRINGS['P2P.CANCEL_WARNING']}
							</EditWrapper>
						</div>
						{renderOrderDetails(selectedOrder)}
						<div className="d-flex justify-content-end">
							<Button
								label={STRINGS['BACK']}
								onClick={handleCloseCancelOrderDialog}
								type="button"
								className="mr-2"
							/>
							<Button
								label={STRINGS['QUICK_TRADE_COMPONENT.YES_CANCEL_ORDER']}
								onClick={handleConfirmCancelOrder}
								type="button"
							/>
						</div>
					</div>
				</Dialog>
			)}

			{selectedOrder && (
				<Dialog
					isOpen={showViewMoreDialog}
					label="view-more-order-modal"
					className="view-more-order-dialog-wrapper"
					onCloseDialog={handleCloseViewMoreDialog}
					shouldCloseOnOverlayClick={false}
					showCloseText={true}
				>
					<div className="view-more-order-dialog-content">
						<div className="d-flex justify-content-between align-items-center mb-3">
							<div className="bold order-details-title">
								<EditWrapper stringId="QUICK_TRADE_COMPONENT.ORDER_DETAILS">
									{STRINGS['QUICK_TRADE_COMPONENT.ORDER_DETAILS']}
								</EditWrapper>
							</div>
						</div>
						{renderOrderDetails(selectedOrder)}
						<div className="d-flex justify-content-end gap-2">
							<Button
								label={STRINGS['BACK']}
								onClick={handleCloseViewMoreDialog}
								type="button"
								className="mr-2"
							/>
							<Button
								label={STRINGS['P2P.CANCEL_ORDER']}
								onClick={handleViewMoreCancelOrder}
								type="button"
							/>
						</div>
					</div>
				</Dialog>
			)}
		</div>
	);
};

export default ActiveOTCLimitOrder;
