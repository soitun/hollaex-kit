import React, { useState, useEffect, useRef } from 'react';
import { withRouter } from 'react-router';
import { Tooltip, Spin } from 'antd';
import {
	CloseCircleOutlined,
	CloseOutlined,
	CheckCircleOutlined,
} from '@ant-design/icons';

import STRINGS from 'config/localizedStrings';
import {
	EditWrapper,
	Coin,
	Button,
	Dialog,
	Paginator,
	Image,
} from 'components';
import { formatToCurrency, countDecimals } from 'utils/currency';
import { getDecimals } from 'utils/utils';
import { PAIR2_STATIC_SIZE } from 'components/QuickTrade';
import { getFormattedDate } from 'utils/string';
import DateFilter from './DateFilter';
import withConfig from 'components/ConfigProvider/withConfig';

const ActiveOTCLimitOrder = ({
	orders,
	coins,
	onCancelOrder,
	icons: ICONS,
	selectedSource,
	selectedTarget,
	onFetchOrders,
	isLoadingOrders,
	ordersContainerRef,
	normalizePair,
	router,
}) => {
	const [showCancelOrderDialog, setShowCancelOrderDialog] = useState(false);
	const [showViewMoreDialog, setShowViewMoreDialog] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [isPairFiltered, setIsPairFiltered] = useState(true);
	const [dateFilterParams, setDateFilterParams] = useState({});
	const [dateFilterKey, setDateFilterKey] = useState(0);
	const previousPairRef = useRef(null);
	const pageSize = 10;

	const ordersArray = Array.isArray(orders) ? orders : [];
	const symbol = `${selectedSource?.toLowerCase()}-${selectedTarget?.toLowerCase()}`;

	const currentPair = normalizePair ? normalizePair(symbol) : symbol;

	const getFilteredOrders = () => {
		if (!isPairFiltered || !currentPair) {
			return ordersArray;
		}
		return ordersArray?.filter((order) => {
			const orderSymbol = order?.symbol?.toLowerCase();
			return orderSymbol === currentPair?.toLowerCase();
		});
	};

	const otcOrders = getFilteredOrders();

	const displayCount = otcOrders?.length;

	useEffect(() => {
		if (currentPair) {
			const normalizedCurrentPair = normalizePair
				? normalizePair(currentPair)
				: currentPair;

			setIsPairFiltered(true);
			setCurrentPage(1);

			previousPairRef.current = normalizedCurrentPair;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedSource, selectedTarget]);

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

	const handleCancelOrderClick = (order) => {
		setSelectedOrder(order);
		setShowCancelOrderDialog(true);
	};

	const handleConfirmCancelOrder = () => {
		if (selectedOrder?.id && onCancelOrder) {
			const symbolToPass = isPairFiltered && currentPair ? currentPair : null;
			onCancelOrder(selectedOrder?.id, {
				...dateFilterParams,
				symbol: symbolToPass,
			});
			setShowCancelOrderDialog(false);
			setSelectedOrder(null);
		}
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

	const handlePairFilterClick = () => {
		setIsPairFiltered(true);
		setCurrentPage(1);
		setDateFilterParams({});
		setDateFilterKey((prev) => prev + 1);
		if (onFetchOrders && currentPair) {
			onFetchOrders(currentPair, {});
		}
	};

	const handleShowAllClick = () => {
		setIsPairFiltered(false);
		setCurrentPage(1);
		setDateFilterParams({});
		setDateFilterKey((prev) => prev + 1);
		if (onFetchOrders) {
			onFetchOrders(null, {});
		}
	};

	const handleDateFilterChange = (filterParams) => {
		setDateFilterParams(filterParams);
		setCurrentPage(1);

		if (onFetchOrders) {
			const symbolToFetch = isPairFiltered && currentPair ? currentPair : null;
			onFetchOrders(symbolToFetch, filterParams);
		}
	};

	const parseOrderSymbol = (order) => {
		const [source, target] = order?.symbol?.split('-') || [];
		return { source, target };
	};

	const getOrderCoinData = (source, target) => {
		return {
			sourceCoin: coins?.[source?.toUpperCase()],
			targetCoin: coins?.[target?.toUpperCase()],
		};
	};

	const getOrderDecimalPoints = (sourceCoin, targetCoin) => {
		return {
			sourceDecimalPoint: getDecimals(
				sourceCoin?.increment_unit || PAIR2_STATIC_SIZE
			),
			targetDecimalPoint: getDecimals(
				targetCoin?.increment_unit || PAIR2_STATIC_SIZE
			),
		};
	};

	const renderOrderDetails = (order) => {
		const { source, target } = parseOrderSymbol(order);
		if (!source || !target) return null;

		const { sourceCoin, targetCoin } = getOrderCoinData(source, target);
		const sourceAmount = order?.size || 0;
		const quotePrice = order?.price || 0;
		const targetAmount = sourceAmount * quotePrice;
		const inversePrice = quotePrice > 0 ? 1 / quotePrice : 0;

		const { sourceDecimalPoint, targetDecimalPoint } = getOrderDecimalPoints(
			sourceCoin,
			targetCoin
		);

		return (
			<div className="order-details-section mb-4">
				<div className="d-flex flex-column justify-content-between align-items-start pb-4 border-bottom">
					<span className="important-text bold">
						<EditWrapper stringId="AUTO_TRADER.SPEND">
							{STRINGS['AUTO_TRADER.SPEND']}
						</EditWrapper>
					</span>
					<div className="d-flex align-items-center mt-2">
						{coins[source]?.icon_id && (
							<span className="mr-2">
								<Coin iconId={coins[source]?.icon_id} type="CS6" />
							</span>
						)}
						<span>
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
					<span className="important-text bold">
						<EditWrapper stringId="P2P.RECEIVING_AMOUNT">
							{STRINGS['P2P.RECEIVING_AMOUNT']}
						</EditWrapper>
					</span>
					<div className="d-flex align-items-center mt-2">
						{coins[target]?.icon_id && (
							<span className="mr-2">
								<Coin iconId={coins[target]?.icon_id} type="CS6" />
							</span>
						)}
						<span>
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
					<span className="important-text bold">
						<EditWrapper stringId="QUICK_TRADE_COMPONENT.MARKET_RATE">
							{STRINGS['QUICK_TRADE_COMPONENT.MARKET_RATE']}
						</EditWrapper>
					</span>
					<div className="d-flex align-items-center mt-2">
						<span>
							<EditWrapper stringId="QUICK_TRADE_COMPONENT.CONVERSION_ASSET_PRICE">
								{STRINGS.formatString(
									STRINGS['QUICK_TRADE_COMPONENT.CONVERSION_ASSET_PRICE'],
									target?.toUpperCase(),
									formatToCurrency(
										inversePrice,
										sourceDecimalPoint,
										inversePrice > 0 &&
											inversePrice < 1 &&
											countDecimals(inversePrice) > 8
									),
									source?.toUpperCase()
								)}
							</EditWrapper>
						</span>
					</div>
				</div>
				<div className="d-flex flex-column justify-content-between align-items-start py-4">
					<span className="important-text bold">
						<EditWrapper stringId="QUICK_TRADE_COMPONENT.DATE_ORDER_PLACED">
							{STRINGS['QUICK_TRADE_COMPONENT.DATE_ORDER_PLACED']}
						</EditWrapper>
					</span>
					<span>{getFormattedDate(order?.created_at)}</span>
				</div>
			</div>
		);
	};

	const hasDateFilter =
		dateFilterParams?.start_date || dateFilterParams?.end_date;
	const hasActiveOrders = ordersArray?.length > 0;
	const isFilterApplied = hasDateFilter;

	const shouldShowComponent = hasActiveOrders || isFilterApplied;

	if (!shouldShowComponent) {
		return null;
	}

	const handleViewOrderHistory = () => {
		if (router) {
			router.push('/transactions?tab=orders&active=true');
		}
	};

	return (
		<div
			ref={ordersContainerRef}
			className="active-otc-limit-order-container mt-4"
		>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<div className="d-flex align-items-center gap-3">
					<div className="bold">
						<EditWrapper stringId="QUICK_TRADE_COMPONENT.WAITING_ORDERS">
							{STRINGS.formatString(
								STRINGS['QUICK_TRADE_COMPONENT.WAITING_ORDERS'],
								displayCount || ordersArray?.length
							)}
						</EditWrapper>
					</div>
					{currentPair && (
						<div
							className={`active-otc-limit-order-pair-button pointer ml-3 ${
								isPairFiltered ? 'active' : 'secondary-text'
							}`}
							onClick={handlePairFilterClick}
						>
							{currentPair?.toUpperCase() || ''}
						</div>
					)}
					{currentPair && (
						<EditWrapper stringId="QUICK_TRADE_COMPONENT.SHOW_ALL">
							<span
								className="blue-link pointer underline-text ml-3"
								onClick={handleShowAllClick}
							>
								{STRINGS['QUICK_TRADE_COMPONENT.SHOW_ALL']}
							</span>
						</EditWrapper>
					)}
				</div>
				<div>
					<EditWrapper stringId="QUICK_TRADE_COMPONENT.VIEW_ORDER_HISTORY">
						<span
							className="blue-link pointer underline-text"
							onClick={handleViewOrderHistory}
						>
							{STRINGS['QUICK_TRADE_COMPONENT.VIEW_ORDER_HISTORY']}
						</span>
					</EditWrapper>
				</div>
			</div>
			<div className="mb-3 transaction-history-wrapper">
				<DateFilter
					key={dateFilterKey}
					onFilterChange={handleDateFilterChange}
					initialFilter="all"
				/>
			</div>
			{isLoadingOrders ? (
				<div className="d-flex justify-content-center align-items-center py-4">
					<Spin size="large" />
				</div>
			) : paginatedOrders && paginatedOrders.length > 0 ? (
				<>
					{paginatedOrders?.map((order) => {
						const { source, target } = parseOrderSymbol(order);
						if (!source || !target) return null;

						const { sourceCoin, targetCoin } = getOrderCoinData(source, target);
						const sourceAmount = order?.size || 0;
						const quotePrice = order?.price || 0;
						const targetAmount = sourceAmount * quotePrice;
						const filledTargetAmount = (order?.filled || 0) * quotePrice;
						const remainingTargetAmount = targetAmount - filledTargetAmount;
						const progressPercentage =
							targetAmount > 0
								? Math.min((filledTargetAmount / targetAmount) * 100, 100)
								: 0;

						const {
							sourceDecimalPoint,
							targetDecimalPoint,
						} = getOrderDecimalPoints(sourceCoin, targetCoin);

						return (
							<div key={order?.id} className="active-otc-limit-order-item">
								<div className="base-info-container">
									<div className="d-flex align-items-center">
										{coins[source]?.icon_id && (
											<span className="mr-2">
												<Coin iconId={coins[source]?.icon_id} type="CS10" />
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
															sourceAmount < 1 &&
																countDecimals(sourceAmount) > 8
														),
														source?.toUpperCase()
													)}
												</EditWrapper>
											</div>
										</div>
									</div>
								</div>
								<div className="quote-info-container">
									{(order?.status === 'pfilled' ||
										order?.status === 'filled') && (
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
												<EditWrapper stringId="P2P.RECEIVING_AMOUNT">
													<span className="ml-2">
														<span className="bold">
															<EditWrapper stringId="P2P.RECEIVING_AMOUNT">
																{STRINGS['P2P.RECEIVING_AMOUNT']}
															</EditWrapper>
														</span>
														{': '}
														{formatToCurrency(
															targetAmount,
															targetDecimalPoint,
															targetAmount < 1 &&
																countDecimals(targetAmount) > 8
														)}{' '}
														{target?.toUpperCase()}
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
										<div className="d-flex flex-wrap items-center">
											<EditWrapper stringId="P2P.PRICE">
												<span className="bold">
													<EditWrapper stringId="P2P.PRICE">
														{STRINGS['P2P.PRICE']}
													</EditWrapper>
												</span>
												{': '}
												{formatToCurrency(
													quotePrice,
													targetDecimalPoint,
													quotePrice < 1 && countDecimals(quotePrice) > 8
												)}{' '}
												{target?.toUpperCase()}{' '}
												<EditWrapper stringId="QUICK_TRADE_COMPONENT.PER_TEXT">
													{STRINGS['QUICK_TRADE_COMPONENT.PER_TEXT']}
												</EditWrapper>{' '}
												{source?.toUpperCase()}
											</EditWrapper>
											{order?.status === 'pfilled' && (
												<>
													<span className="secondary-text px-2">•</span>
													<EditWrapper stringId="QUICK_TRADE_COMPONENT.PARTIAL_COMPLETE">
														<span className="order-complete-amount">
															{STRINGS.formatString(
																STRINGS[
																	'QUICK_TRADE_COMPONENT.PARTIAL_COMPLETE'
																],
																formatToCurrency(
																	filledTargetAmount,
																	targetDecimalPoint,
																	filledTargetAmount < 1 &&
																		countDecimals(filledTargetAmount) > 8
																),
																target?.toUpperCase()
															)}
														</span>
													</EditWrapper>
													<span className="secondary-text underline-text ml-1">
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
												STRINGS[
													'QUICK_TRADE_COMPONENT.ORDER_FULLY_FILLED_TOOLTIP'
												]
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
				</>
			) : isFilterApplied ? (
				<div className="no-data d-flex flex-column align-items-center justify-content-center py-4">
					<Image
						iconId="NO_ICON"
						icon={ICONS['NO_ICON']}
						wrapperClassName="no-active-orders-icon"
					/>
					<span className="mt-2">
						<EditWrapper stringId="P2P.NO_ORDERS_DESC">
							{STRINGS['P2P.NO_ORDERS_DESC']}
						</EditWrapper>
					</span>
				</div>
			) : null}

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

export default withRouter(withConfig(ActiveOTCLimitOrder));
