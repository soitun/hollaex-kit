import React, { useEffect, useState } from 'react';
import ReviewBlock from 'components/QuickTrade/ReviewBlock';
import STRINGS from 'config/localizedStrings';
import moment from 'moment';
import classnames from 'classnames';
import { Button, EditWrapper } from 'components';
import { Progress } from 'antd';
import { ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { RiskyTrade } from 'components/QuickTrade/RiskyTrade';
import { formatToCurrency, countDecimals } from 'utils/currency';

const ReviewOrder = ({
	onCloseDialog,
	onExecuteTrade,
	selectedSource,
	sourceDecimalPoint,
	targetDecimalPoint,
	sourceAmount,
	targetAmount,
	selectedTarget,
	disabled,
	time,
	expiry,
	isActiveSlippage,
	coins,
	isQuickTradeLimitOrder,
	calculatedInvertedPrice,
	limitOrderPriceDisplay,
	isLimitOrderWithPrice,
}) => {
	const showTimer = time && expiry;

	const invertedPrice =
		limitOrderPriceDisplay && parseFloat(limitOrderPriceDisplay) > 0
			? parseFloat(limitOrderPriceDisplay)
			: calculatedInvertedPrice;
	const [totalTime] = useState(showTimer ? moment(time).seconds() : 0);
	const [timeToExpiry, setTimeToExpiry] = useState(
		showTimer ? moment(expiry).diff(moment(time), 'seconds') : 0
	);

	const [isExpired, setIsExpired] = useState(
		showTimer ? timeToExpiry <= 0 : false
	);

	const getShowCoinRisky = () => {
		const { is_risky, code } = coins[selectedTarget];

		if (is_risky) {
			const localRiskyItems = localStorage.getItem('riskyItems');
			const riskyItems = localRiskyItems ? JSON.parse(localRiskyItems) : {};
			const isNotWarn = !riskyItems[code];
			return isNotWarn;
		}

		return false;
	};

	const [showRisky, setShowRisky] = useState(getShowCoinRisky());

	const getLimitOrderWarning = () => {
		if (!limitOrderPriceDisplay || !calculatedInvertedPrice) {
			return null;
		}

		const limitOrderPrice = parseFloat(limitOrderPriceDisplay);
		if (isNaN(limitOrderPrice) || limitOrderPrice <= 0) {
			return null;
		}

		const isBelowMarket = limitOrderPrice < calculatedInvertedPrice;
		const isAboveMarket = limitOrderPrice >= calculatedInvertedPrice;

		if (isBelowMarket) {
			return (
				<div className="quote_content mt-2">
					{STRINGS['QUICK_TRADE_COMPONENT.LIMIT_ORDER_BELOW_MARKET_WARNING']}
				</div>
			);
		}

		if (isAboveMarket) {
			return (
				<div className="quote_content mt-2 secondary-text">
					<EditWrapper stringId="QUICK_TRADE_COMPONENT.LIMIT_ORDER_PROCESSING_NOTE">
						{STRINGS['QUICK_TRADE_COMPONENT.LIMIT_ORDER_PROCESSING_NOTE']}
					</EditWrapper>
				</div>
			);
		}

		return null;
	};

	useEffect(() => {
		if (!showTimer) return;

		// Update the timer every second
		const timerInterval = setInterval(() => {
			const newTimeToExpiry = moment(expiry).diff(moment(), 'seconds');
			setTimeToExpiry(newTimeToExpiry);
			setIsExpired(newTimeToExpiry <= 0);
		}, 1000);

		// Clear the interval on unmount
		return () => clearInterval(timerInterval);
	}, [expiry, showTimer]);

	return (
		<div className="quote-review-wrapper">
			{showRisky ? (
				<RiskyTrade
					setShowRisky={setShowRisky}
					coinData={coins[selectedTarget]}
					onCloseDialog={onCloseDialog}
				/>
			) : (
				<div>
					<div className="mb-4">
						<div className="quote_header">{STRINGS['CONFIRM_TEXT']}</div>
						<div className="quote_content">
							{STRINGS['QUOTE_CONFIRMATION_MSG_TEXT_1']}
						</div>
						<div className="quote_content">
							{STRINGS['QUOTE_CONFIRMATION_MSG_TEXT_2']}
						</div>
						{getLimitOrderWarning()}
						{showTimer && (
							<div
								className={classnames('quote_expiry_content d-flex', {
									'expired-content': isExpired,
								})}
							>
								<div className="clock-icon">
									<ClockCircleOutlined />
								</div>
								{isExpired ? (
									<div>
										<p>{STRINGS['QUOTE_CONFIRMATION_EXPIRED_MSG_TEXT_1']}</p>
										<p>{STRINGS['QUOTE_CONFIRMATION_EXPIRED_MSG_TEXT_2']}</p>
									</div>
								) : (
									STRINGS.formatString(
										STRINGS['QUOTE_CONFIRMATION_EXPIRY_MSG'],
										timeToExpiry,
										timeToExpiry > 1 ? STRINGS['SECONDS'] : STRINGS['SECOND']
									)
								)}
							</div>
						)}
					</div>
					{showTimer && (
						<div className="expiry-progress">
							<Progress
								percent={Math.max((timeToExpiry / totalTime) * 100)}
								showInfo={false}
								size="small"
								strokeColor="#fff"
							/>
						</div>
					)}
					<div
						className={classnames({
							'expired-block': isExpired,
						})}
					>
						<ReviewBlock
							symbol={selectedSource}
							text={STRINGS['SPEND_AMOUNT']}
							amount={sourceAmount}
							decimalPoint={sourceDecimalPoint}
						/>
						<ReviewBlock
							symbol={selectedTarget}
							text={STRINGS['ESTIMATE_RECEIVE_AMOUNT']}
							amount={targetAmount}
							decimalPoint={targetDecimalPoint}
						/>
						{isQuickTradeLimitOrder && invertedPrice && (
							<div className="d-flex flex-column align-items-end">
								<div className="quote_content mb-3 secondary-text">
									(
									{STRINGS.formatString(
										STRINGS['QUICK_TRADE_COMPONENT.CONVERSION_ASSET_PRICE'],
										selectedTarget?.toUpperCase(),
										formatToCurrency(
											invertedPrice,
											sourceDecimalPoint,
											invertedPrice < 1 && countDecimals(invertedPrice) > 8
										),
										selectedSource?.toUpperCase()
									)}
									)
								</div>
								{sourceAmount && invertedPrice && targetAmount && (
									<div className="quote_content review-block-wrapper w-100 text-right pt-3 important-text">
										{STRINGS['QUICK_TRADE_COMPONENT.CONVERSION_TEXT']}:{' '}
										{formatToCurrency(
											sourceAmount,
											sourceDecimalPoint,
											sourceAmount < 1 && countDecimals(sourceAmount) > 8
										)}
										{selectedSource?.toUpperCase()} /{' '}
										{formatToCurrency(
											invertedPrice,
											sourceDecimalPoint,
											invertedPrice < 1 && countDecimals(invertedPrice) > 8
										)}
										{selectedTarget?.toUpperCase()} ={' '}
										<span className="bold">
											{formatToCurrency(
												targetAmount,
												targetDecimalPoint,
												targetAmount < 1 && countDecimals(targetAmount) > 8
											)}{' '}
										</span>
										<span className="bold">
											{selectedTarget?.toUpperCase()}
										</span>
									</div>
								)}
							</div>
						)}
						{!isLimitOrderWithPrice && isActiveSlippage && (
							<div className="slippage-warning-content">
								<WarningOutlined className="slippage-warning-icon" />
								<EditWrapper stringId="QUICK_TRADE_COMPONENT.SLIPPAGE_WARNING_TEXT">
									{STRINGS['QUICK_TRADE_COMPONENT.SLIPPAGE_WARNING_TEXT']}
								</EditWrapper>
							</div>
						)}
					</div>
					<footer className="d-flex pt-4">
						<Button
							label={isExpired ? STRINGS['BACK'] : STRINGS['CLOSE_TEXT']}
							onClick={onCloseDialog}
							className="mr-2"
						/>
						<Button
							label={STRINGS['CONFIRM_TEXT']}
							onClick={onExecuteTrade}
							className="ml-2"
							disabled={disabled || isExpired}
						/>
					</footer>
				</div>
			)}
		</div>
	);
};

export default ReviewOrder;
