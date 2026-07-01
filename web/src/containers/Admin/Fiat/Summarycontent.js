import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { STATIC_ICONS } from 'config/icons';
import { Link } from 'react-router';
import { Button, Spin } from 'antd';
import {
	CheckCircleFilled,
	MinusCircleOutlined,
	RightOutlined,
} from '@ant-design/icons';

import { Image } from 'components';
import { getOfframpTypes } from 'utils/wallet';
import Coins from '../Coins';

import './index.css';

const Summarycontent = ({
	handleTabChange,
	coins,
	appCoins = {},
	isUpgrade,
	user_payments = {},
	exchange = {},
	onramp = {},
	offramp = {},
	isGetExchange = true,
}) => {
	const [fiatCoins, setFiatCoins] = useState([]);

	const hasPaymentAccounts =
		user_payments && Object.keys(user_payments).length > 0;

	useEffect(() => {
		const exchangeCoins =
			(coins &&
				coins.filter(
					(val) =>
						exchange && exchange.coins && exchange.coins.includes(val.symbol)
				)) ||
			[];
		const filteredFiatCoins = exchangeCoins
			.filter((item) => item.type === 'fiat')
			.map((item) => ({
				symbol: item?.symbol,
				color: item?.meta?.color,
				fullname: item?.fullname,
			}));
		setFiatCoins(filteredFiatCoins);
	}, [coins, exchange]);

	// Prefer the asset's uploaded logo, then the bundled coin icon.
	const getCoinLogo = (symbol) => {
		const coin = appCoins?.[symbol];
		if (coin && coin.logo) {
			return coin.logo;
		} else if (STATIC_ICONS.COIN_ICONS[(symbol || '').toLowerCase()]) {
			return STATIC_ICONS.COIN_ICONS[(symbol || '').toLowerCase()];
		}
		return '';
	};

	const getRampStats = (symbol) => {
		const onRampMethods = onramp?.[symbol] ? Object.keys(onramp[symbol]) : [];
		const offRampMethods = getOfframpTypes(offramp?.[symbol]).filter(
			(method) => user_payments?.[method]
		);
		return {
			onCount: onRampMethods.length,
			offCount: offRampMethods.length,
		};
	};

	const renderStatusBadge = (count, onClick) =>
		count > 0 ? (
			<span
				className="ramp-status-badge configured clickable"
				onClick={onClick}
			>
				<CheckCircleFilled className="mr-1" />
				{count} configured
			</span>
		) : (
			<span
				className="ramp-status-badge not-configured clickable"
				onClick={onClick}
			>
				<MinusCircleOutlined className="mr-1" />
				Not configured
			</span>
		);

	const renderCurrencyCard = (coin) => {
		const symbol = coin?.symbol;
		const { onCount, offCount } = getRampStats(symbol);
		return (
			<div className="fiat-currency-card" key={symbol}>
				<div className="fiat-currency-card-header">
					{getCoinLogo(symbol) ? (
						<img
							src={getCoinLogo(symbol)}
							alt={symbol}
							className="fiat-currency-logo"
						/>
					) : (
						<Coins
							type={symbol?.toLowerCase()}
							small={true}
							color={coin?.color || ''}
						/>
					)}
					<div className="ml-2">
						<div className="fiat-currency-symbol">{symbol?.toUpperCase()}</div>
						<div className="fiat-currency-name">{coin?.fullname}</div>
					</div>
				</div>
				<div className="fiat-currency-card-body">
					<div className="ramp-status-row">
						<span className="ramp-status-label">On-ramp (deposits)</span>
						{renderStatusBadge(onCount, () => handleTabChange('2'))}
					</div>
					<div className="ramp-status-row">
						<span className="ramp-status-label">Off-ramp (withdrawals)</span>
						{renderStatusBadge(offCount, () => handleTabChange('3'))}
					</div>
				</div>
			</div>
		);
	};

	const renderMiniStat = (type) => {
		const isDeposit = type === 'deposit';
		return (
			<div className="fiat-mini-stat-card">
				<Image
					icon={
						isDeposit
							? STATIC_ICONS['DEPOSIT_TIERS_SECTION']
							: STATIC_ICONS['WITHDRAW_TIERS_SECTION']
					}
					wrapperClassName="fiat-mini-stat-icon"
				/>
				<div className="fiat-mini-stat-text">
					<div className="fiat-mini-stat-title">
						Fiat {isDeposit ? 'deposits' : 'withdrawals'}
					</div>
					<div className="fiat-mini-stat-sub">
						Review pending & completed {isDeposit ? 'deposits' : 'withdrawals'}
					</div>
				</div>
				<Link
					to={
						isDeposit
							? '/admin/financials?deposits'
							: '/admin/financials?withdrawals'
					}
					className="fiat-mini-stat-link underline"
				>
					View <RightOutlined />
				</Link>
			</div>
		);
	};

	if (!isGetExchange) {
		return (
			<div className="d-flex align-items-center justify-content-center">
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div className="summary-content-wrapper">
			<div className="d-flex">
				<Image
					icon={STATIC_ICONS['CURRENCY_SYMBOL']}
					wrapperClassName="fiatcurrency"
				/>
				<div className="centercontent">
					Fiat currencies like USD, EUR, YEN, etc can be managed here. To allow
					your users to make fiat deposits and withdrawals you must add payment
					system account details.
				</div>
			</div>

			{!isUpgrade ? (
				<div className="d-flex mb-4">
					<div className="d-flex align-items-center justify-content-between upgrade-section my-4">
						<div>
							<div className="font-weight-bold">
								Add fiat deposits & withdrawals
							</div>
							<div>Allow your users to send USD & other fiat</div>
						</div>
						<div className="ml-5 button-wrapper">
							<a
								href="https://dash.hollaex.com/billing"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Button type="primary" className="w-100">
									Upgrade Now
								</Button>
							</a>
						</div>
					</div>
				</div>
			) : null}

			<div className={!isUpgrade ? 'disableall' : ''}>
				{!hasPaymentAccounts ? (
					<div className="payment mt-4">
						<div className="d-flex align-items-center justify-content-between">
							<div className="d-flex align-items-center">
								<Image
									icon={STATIC_ICONS['DOLLAR_GEAR']}
									wrapperClassName="fiatcurrency"
								/>
								<div>
									We've noticed that there hasn't been any Payment Accounts
									added yet. To start it is recommended to{' '}
									<span
										className="underline"
										onClick={() => handleTabChange('1')}
									>
										add a Payment Account
									</span>
									.
								</div>
							</div>
							<Button
								type="primary"
								className="green-btn"
								onClick={() => handleTabChange('1')}
							>
								Add payment account
							</Button>
						</div>
					</div>
				) : null}

				<div className="fiat-summary-section mt-4">
					<div className="fiat-summary-section-header">
						<span className="fiat-summary-section-title">
							Fiat currencies ({fiatCoins.length})
						</span>
						<Link to="/admin/financials?tab=0" className="underline">
							Manage assets
						</Link>
					</div>
					{fiatCoins.length ? (
						<div className="fiat-summary-grid">
							{fiatCoins.map((coin) => renderCurrencyCard(coin))}
						</div>
					) : (
						<div className="fiat-summary-empty">
							<Image
								icon={STATIC_ICONS['CURRENCY_SYMBOL']}
								wrapperClassName="fiat-summary-empty-icon"
							/>
							<div>
								There are no fiat currencies on your exchange yet. Add a fiat
								asset from the{' '}
								<Link to="/admin/financials?tab=0" className="underline">
									assets page
								</Link>{' '}
								to start configuring on-ramps and off-ramps.
							</div>
						</div>
					)}
				</div>

				<div className="fiat-summary-section mt-4">
					<div className="fiat-summary-section-header">
						<span className="fiat-summary-section-title">
							Deposits & withdrawals
						</span>
					</div>
					<div className="fiat-mini-stats">
						{renderMiniStat('deposit')}
						{renderMiniStat('withdrawal')}
					</div>
				</div>
			</div>
		</div>
	);
};

const mapStateToProps = (state) => ({
	appCoins: state.app.coins,
});

export default connect(mapStateToProps)(Summarycontent);
