import React, { Component } from 'react';
import { Spin, Alert, Table } from 'antd';
import { connect } from 'react-redux';
import { ReactSVG } from 'react-svg';

import { STATIC_ICONS } from 'config/icons';
import { requestTotalBalance, requestConstants } from './actions';
import { formatCurrencyByIncrementalUnit } from 'utils/currency';
import './index.scss';
class Wallets extends Component {
	state = {
		users: [],
		fetched: false,
		loading: false,
		error: '',
		showSweep: null,
		walletNum: null,
		constants: {},
	};

	UNSAFE_componentWillMount() {
		this.requestTotalBalance();
		this.requestConstants();
		this.setState({ showSweep: false });
	}

	requestConstants = () => {
		this.setState({
			loading: true,
			error: '',
		});
		requestConstants()
			.then((res) => {
				this.setState({ loading: false, constants: res.kit });
			})
			.catch((error) => {
				const message = error.data ? error.data.message : error.message;
				this.setState({
					loading: false,
					error: message,
				});
			});
	};

	requestTotalBalance = () => {
		this.setState({
			loading: true,
			error: '',
		});

		requestTotalBalance()
			.then((res) => {
				this.setState({
					balance: res,
					loading: false,
					fetched: true,
				});
			})
			.catch((error) => {
				const message = error.data ? error.data.message : error.message;
				this.setState({
					loading: false,
					error: message,
				});
			});
	};

	goToVault = () => {
		this.props.router.push('/admin/plugins/vault');
	};

	render() {
		const { balance, loading, error } = this.state;
		const { coins } = this.props;
		const sortedCoins = Object.keys(coins).sort();

		const data = [];
		const columns = [
			{
				key: 'name',
				title: 'Name',
				dataIndex: 'name',
			},
			{
				key: 'total',
				title: 'Total',
				dataIndex: 'total',
			},
			{
				key: 'available',
				title: 'Available',
				dataIndex: 'available',
			},
		];

		sortedCoins.forEach((coin) => {
			if (balance && balance[`${coin}_balance`]) {
				const inc_unit = coins[coin]?.increment_unit;
				let asset = {
					name: coin.toUpperCase(),
					total: formatCurrencyByIncrementalUnit(
						balance[`${coin}_balance`],
						inc_unit
					),
					available: formatCurrencyByIncrementalUnit(
						balance[`${coin}_available`],
						inc_unit
					),
				};
				data.push(asset);
			}
		});

		return (
			<div className="app_container-content">
				{error && (
					<Alert
						message="Error"
						className="m-top"
						description={error}
						type="error"
						showIcon
					/>
				)}
				{loading ? (
					<Spin size="large" />
				) : (
					<div style={{ width: '60%' }} className="admin-user-container">
						{error && <p>-{error}-</p>}
						<div className="d-flex align-items-center justify-content-between">
							<div className="d-flex align-items-center">
								<ReactSVG
									src={STATIC_ICONS['USER_SECTION_WALLET']}
									className="admin-wallet-icon"
								/>
								<h1>USER WALLETS</h1>
							</div>
						</div>
						<p>Total balance of users wallet</p>
						<Table
							columns={columns}
							rowKey={(data, index) => index}
							dataSource={data}
							loading={data.length === 0}
							pagination={false}
						/>
					</div>
				)}
			</div>
		);
	}
}

const mapStateToProps = (state) => ({
	constants: state.app.constants,
	coins: state.app.coins,
});

export default connect(mapStateToProps)(Wallets);
