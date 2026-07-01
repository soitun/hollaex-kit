import React, { Component } from 'react';
import { connect } from 'react-redux';
import { SyncOutlined } from '@ant-design/icons';
import { Table, Spin, Button, Input, Select, Alert, Modal } from 'antd';
import moment from 'moment';

import {
	requestDeposits,
	// completeDeposits,
	// dismissDeposit,
	requestDepositDownload,
	requestBurn,
	requestMint,
	requestReallocate,
	requestTravelRule,
} from './actions';
import { renderRowContent, COLUMNS, SELECT_KEYS } from './utils';
import { TRAVEL_RULE_TYPE_LABELS } from '../Transactions/utils';
import { Filters } from './Filters';
import ValidateDismiss from './ValidateDismiss';

import './index.css';

const { Group: InputGroup, Search } = Input;
const { Option } = Select;

// const HEADERS = [
// 	{ label: 'Type', dataIndex: 'type', key: 'type' },
// 	{ label: 'User ID', dataIndex: 'user_id', key: 'user_id' },
// 	{ label: 'Currency', dataIndex: 'currency', key: 'currency' },
// 	{ label: 'Amount', dataIndex: 'amount', key: 'amount' },
// 	{ label: 'Fee', dataIndex: 'fee', key: 'fee' },
// 	{ label: 'Address', dataIndex: 'address', key: 'address' },
// 	{
// 		label: 'Transaction ID',
// 		dataIndex: 'transaction_id',
// 		key: 'transaction_id'
// 	},
// 	{ label: 'Time', dataIndex: 'created_at', key: 'created_at' }
// ];

class Deposits extends Component {
	state = {
		deposits: [],
		fetched: false,
		loading: true,
		loadingItem: false,
		dismissingItem: false,
		error: '',
		indexItem: -1,
		searchKey: 'transaction_id',
		searchValue: '',
		queryParams: {},
		queryDone: JSON.stringify({}),
		type: '',
		total: 0,
		page: 1,
		pageSize: 10,
		limit: 50,
		currentTablePage: 1,
		isRemaining: true,
		isOpen: false,
		statusType: '',
		validateData: {},
		travelRuleOpen: false,
		travelRuleLoading: false,
		travelRuleData: [],
		travelRuleError: '',
		travelRuleTxId: null,
	};

	UNSAFE_componentWillMount() {
		const { initialData, queryParams = {} } = this.props;
		if (Object.keys(queryParams).length) {
			this.requestDeposits(
				initialData,
				queryParams,
				this.state.page,
				this.state.limit
			);
		} else {
			this.requestDeposits(initialData, {}, this.state.page, this.state.limit);
		}
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		if (nextProps.queryParams.currency !== this.props.queryParams.currency) {
			const { initialData, queryParams } = nextProps;
			this.requestDeposits(
				initialData,
				queryParams,
				this.state.page,
				this.state.limit
			);
			this.onRefresh(false);
		}
	}

	requestDeposits = (
		values = {},
		queryParams = { type: 'deposit' },
		page = 1,
		limit = 50
	) => {
		const requestParams =
			Object.keys(queryParams).length > 0
				? queryParams
				: { type: this.props.type || 'deposit' };

		this.setState({
			loading: true,
			error: '',
			queryDone: JSON.stringify(queryParams),
			queryType: requestParams.type,
		});
		requestDeposits({
			...values,
			...requestParams,
			page,
			limit,
		})
			.then((data) => {
				this.setState({
					deposits:
						page === 1 ? data.data : [...this.state.deposits, ...data.data],
					loading: false,
					fetched: true,
					page: page,
					currentTablePage: page === 1 ? 1 : this.state.currentTablePage,
					isRemaining: data.count > page * limit,
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

	// completeDeposit = (transaction_id, indexItem) => () => {
	// 	const { loadingItem, loading, dismissingItem } = this.state;
	// 	if (!(dismissingItem || loadingItem || loading)) {
	// 		this.setState({ loadingItem: true, error: '', indexItem });
	// 		completeDeposits(transaction_id, true)
	// 			.then((data) => {
	// 				const { deposits } = this.state;
	// 				this.setState({
	// 					deposits: [].concat(
	// 						deposits.slice(0, indexItem),
	// 						data,
	// 						deposits.slice(indexItem + 1, deposits.length)
	// 					),
	// 					loadingItem: false,
	// 					indexItem: -1,
	// 				});
	// 			})
	// 			.catch((error) => {
	// 				const message = error.data ? error.data.message : error.message;
	// 				this.setState({
	// 					loadingItem: false,
	// 					error: message,
	// 					indexItem: -1,
	// 				});
	// 			});
	// 	}
	// };

	// dismissDeposit = (transaction_id, dismissed, indexItem) => () => {
	// 	const { loadingItem, loading, dismissingItem } = this.state;
	// 	if (!(dismissingItem || loadingItem || loading)) {
	// 		this.setState({ dismissingItem: true, error: '', indexItem });
	// 		dismissDeposit(transaction_id, dismissed)
	// 			.then((data) => {
	// 				const { deposits } = this.state;
	// 				this.setState({
	// 					deposits: [].concat(
	// 						deposits.slice(0, indexItem),
	// 						data,
	// 						deposits.slice(indexItem + 1, deposits.length)
	// 					),
	// 					dismissingItem: false,
	// 					indexItem: -1,
	// 				});
	// 			})
	// 			.catch((error) => {
	// 				const message = error.data ? error.data.message : error.message;
	// 				this.setState({
	// 					dismissingItem: false,
	// 					error: message,
	// 					indexItem: -1,
	// 				});
	// 			});
	// 	}
	// };
	onSelect = (value, option) => {
		this.setState({ searchKey: value });
	};

	onSearch = (value) => {
		if (value) {
			const values = {};
			values[this.state.searchKey] = value.trim();
			const queryParams = { ...this.props.queryParams };
			delete queryParams.dismissed;
			delete queryParams.status;
			delete queryParams.rejected;
			delete queryParams.onhold;
			this.setState({ searchValue: value.trim(), queryParams: values });
			this.requestDeposits(values, queryParams);
		}
	};

	onRefresh = (requestData = true) => {
		const { initialData, queryParams } = this.props;
		this.setState({ searchValue: '', searchKey: 'transaction_id' });
		if (requestData) {
			this.requestDeposits(initialData, queryParams);
		}
	};

	onCloseErrorAlert = () => {
		this.setState({ error: '' });
	};

	onChangeQuery = (key) => (value, option) => {
		const queryParams = {
			...this.state.queryParams,
		};
		if (value) {
			if (key === 'start_date' || key === 'end_date') {
				queryParams[key] = moment(value).format();
			} else if (key === 'status') {
				switch (value) {
					case 'dismissed':
						delete queryParams[key];
						delete queryParams.rejected;
						delete queryParams.onhold;
						queryParams.dismissed = true;
						break;
					case 'rejected':
						delete queryParams[key];
						delete queryParams.dismissed;
						delete queryParams.onhold;
						queryParams.rejected = true;
						break;
					case 'onhold':
						delete queryParams[key];
						delete queryParams.dismissed;
						delete queryParams.rejected;
						queryParams.onhold = true;
						break;
					case 'false':
						queryParams.dismissed = false;
						queryParams.rejected = false;
						delete queryParams.onhold;
						queryParams[key] = value;
						break;
					case 'true':
						delete queryParams.dismissed;
						delete queryParams.rejected;
						delete queryParams.onhold;
						queryParams[key] = value;
						break;
					default:
						delete queryParams.rejected;
						delete queryParams.dismissed;
						delete queryParams.onhold;
						delete queryParams[key];
						break;
				}
			} else {
				queryParams[key] = value;
			}
		} else {
			if (key === 'status') {
				delete queryParams.dismissed;
				delete queryParams.rejected;
				delete queryParams.onhold;
			}
			delete queryParams[key];
		}
		this.setState({ queryParams });
	};

	onClickFilters = () => {
		console.log(
			'this.state.queryParams',
			this.state.queryParams,
			this.props.queryParams
		);
		this.requestDeposits(this.state.queryParams, this.props.queryParams);
	};

	pageChange = (count, pageSize) => {
		const { page, limit, isRemaining } = this.state;
		const pageCount = count % 5 === 0 ? 5 : count % 5;
		const apiPageTemp = Math.floor(count / 5);
		if (limit === pageSize * pageCount && apiPageTemp >= page && isRemaining) {
			this.requestDeposits(
				this.state.queryParams,
				this.props.queryParams,
				page + 1,
				limit
			);
		}
		this.setState({ currentTablePage: count });
	};

	requestDepositDownload = () => {
		const { initialData = {}, queryParams = {} } = this.props;
		return requestDepositDownload({
			...initialData,
			...this.state.queryParams,
			...queryParams,
			format: 'csv',
		});
	};

	onOpenModal = (validateData, statusType) => {
		this.setState({ isOpen: true, validateData, statusType });
	};

	onCancelModal = () => {
		this.setState({ isOpen: false, statusType: '' });
	};

	// Open the travel-rule detail modal for a deposit and fetch its record(s).
	openTravelRule = (transaction_id) => {
		this.setState({
			travelRuleOpen: true,
			travelRuleLoading: true,
			travelRuleData: [],
			travelRuleError: '',
			travelRuleTxId: transaction_id,
		});
		requestTravelRule(transaction_id)
			.then((data) => {
				this.setState({
					travelRuleLoading: false,
					travelRuleData: Array.isArray(data) ? data : [],
				});
			})
			.catch((error) => {
				const message = error.data ? error.data.message : error.message;
				this.setState({ travelRuleLoading: false, travelRuleError: message });
			});
	};

	closeTravelRule = () => {
		this.setState({
			travelRuleOpen: false,
			travelRuleLoading: false,
			travelRuleData: [],
			travelRuleError: '',
			travelRuleTxId: null,
		});
	};

	renderTravelRuleRecord = (record) => {
		const rows = [
			['Type', record.type],
			['Status', record.status],
			[
				'Service provider type',
				TRAVEL_RULE_TYPE_LABELS[record.counterparty_type] ||
					record.counterparty_type,
			],
			['VASP / provider name', record.vasp_name],
			['Counterparty name', record.counterparty_name],
			[
				'Is own address',
				record.is_own_address == null
					? null
					: record.is_own_address
					? 'Yes'
					: 'No',
			],
			['Purpose', record.purpose],
			['Address', record.address],
			['Network', record.network],
			['Currency', record.currency],
			['Amount', record.amount],
			['Amount (native)', record.amount_native],
			['Note', record.note],
		];
		return (
			<div key={record.id} className="travel-rule-detail mb-3">
				{rows.map(([label, value]) =>
					value === null || value === undefined || value === '' ? null : (
						<div key={label}>
							<span className="bold">{label}:</span> {String(value)}
						</div>
					)
				)}
			</div>
		);
	};

	handleConfirm = (formValues) => {
		const { statusType, queryType } = this.state;

		// Block an on-hold deposit: reject it for the original user and reallocate
		// the funds to an admin-chosen recipient (category 'block', no email).
		if (statusType === 'block') {
			requestReallocate({
				transaction_id: formValues.transaction_id,
				// address disambiguates which deposit row to reallocate, since one
				// transaction_id can map to multiple rows (one per credited address)
				address: formValues.address,
				receiver_id: Number(formValues.receiver_id),
				...(formValues.description
					? { description: formValues.description }
					: {}),
			})
				.then(() => {
					this.requestDeposits(this.state.queryParams, this.props.queryParams);
					this.onCancelModal();
				})
				.catch((error) => {
					const message = error.data ? error.data.message : error.message;
					this.setState({ error: message });
					this.onCancelModal();
				});
			return;
		}

		let body = {
			transaction_id: formValues.transaction_id,
			updated_transaction_id: formValues.updated_transaction_id,
			rejected: false,
			processing: false,
			waiting: false,
		};
		if (formValues.description) {
			body = {
				...body,
				description: formValues.description,
			};
		}
		if (statusType === 'validate') {
			body = {
				...body,
				status: true,
				dismissed: false,
			};
		} else if (statusType === 'retry') {
			body = {
				...body,
				dismissed: false,
				processing: false,
				rejected: false,
				status: false,
				waiting: false,
			};
		} else if (statusType === 'release') {
			// Take the transaction off hold. The network finalizes it by type: a
			// released deposit is credited/completed, a released withdrawal goes back
			// to pending for the withdrawal cron to send on-chain.
			body = {
				...body,
				status: false,
				dismissed: false,
				rejected: false,
				processing: false,
				waiting: false,
			};
		} else if (statusType === 'reject') {
			// On-hold withdrawal rejection -> dismissed.
			body = {
				...body,
				dismissed: true,
				status: false,
			};
		} else {
			body = {
				...body,
				dismissed: true,
				status: false,
			};
		}
		if (queryType === 'deposit') {
			requestMint(body)
				.then((data) => {
					this.requestDeposits(this.state.queryParams, this.props.queryParams);
					this.onCancelModal();
				})
				.catch((error) => {
					const message = error.data ? error.data.message : error.message;
					this.setState({
						error: message,
					});
					this.onCancelModal();
				});
		} else {
			requestBurn(body)
				.then((data) => {
					this.requestDeposits(this.state.queryParams, this.props.queryParams);
					this.onCancelModal();
				})
				.catch((error) => {
					const message = error.data ? error.data.message : error.message;
					this.setState({
						error: message,
					});
					this.onCancelModal();
				});
		}
	};
	render() {
		const {
			deposits,
			loading,
			fetched,
			error,
			// indexItem,
			searchValue,
			// dismissingItem,
			// loadingItem,
			queryParams,
			queryDone,
			queryType,
			currentTablePage,
			isOpen,
			validateData,
			statusType,
		} = this.state;
		const { showFilters, coins } = this.props;
		const columns = COLUMNS(undefined, this.onOpenModal);
		return (
			<div className="admin-deposit-wrapper">
				{loading ? (
					<Spin size="large" />
				) : (
					<div className="app-wrapper">
						<h1 className="upperCase">{queryType}</h1>
						<div>
							{showFilters && (
								<Filters
									coins={coins}
									onChange={this.onChangeQuery}
									onClick={this.onClickFilters}
									hasChanges={queryDone !== JSON.stringify(queryParams)}
									params={queryParams}
									loading={loading}
									fetched={fetched}
								/>
							)}
						</div>
						{!showFilters && (
							<div className="controls-wrapper">
								<div className="controls-search">
									<div>
										Press enter or click on the search icon to perform a search
									</div>
									<InputGroup compact>
										<Select
											defaultValue={this.state.searchKey}
											style={{ width: '25%' }}
											onSelect={this.onSelect}
										>
											{SELECT_KEYS(undefined).map(({ value, label }, index) => (
												<Option value={value} key={index}>
													{label}
												</Option>
											))}
										</Select>
										<Search
											style={{ width: '75%' }}
											defaultValue={searchValue}
											onSearch={this.onSearch}
										/>
									</InputGroup>
								</div>
								<div className="controls-refresh">
									<Button
										onClick={this.onRefresh}
										type="primary"
										icon={<SyncOutlined />}
										disabled={!searchValue}
									>
										Refresh Data
									</Button>
								</div>
							</div>
						)}

						{error && (
							<Alert
								message={error}
								type="error"
								showIcon
								onClose={this.onCloseErrorAlert}
								closable={true}
								closeText="Close"
							/>
						)}
						<div>
							<span
								className="pointer"
								onClick={() => this.requestDepositDownload()}
							>
								Download table
							</span>
						</div>
						<Table
							columns={columns}
							className="blue-admin-table"
							dataSource={deposits.map((deposit, index) => {
								return {
									...deposit,
									// Show the travel-rule detail link on every transaction while the
									// feature is on; the record is fetched lazily on click (the modal
									// reports "no record" when none exists). No per-row server lookup.
									viewTravelRule: this.props.travelRuleActive
										? () => this.openTravelRule(deposit.transaction_id)
										: undefined,
									// completeDeposit:
									// 	index !== indexItem
									// 		? this.completeDeposit(deposit.transaction_id, index)
									// 		: () => {},
									// dismissDeposit:
									// 	index !== indexItem
									// 		? this.dismissDeposit(
									// 				deposit.transaction_id,
									// 				!deposit.dismissed,
									// 				index
									// 		  )
									// 		: () => {},
									// updatingItem: loadingItem && index === indexItem,
									// dismissingItem: dismissingItem && index === indexItem,
								};
							})}
							rowKey={(data) => {
								return data.id;
							}}
							expandedRowRender={(vals) => renderRowContent({ ...vals, coins })}
							expandRowByClick={true}
							pagination={{
								current: currentTablePage,
								onChange: this.pageChange,
							}}
						/>
					</div>
				)}
				<Modal
					visible={isOpen}
					footer={null}
					onCancel={this.onCancelModal}
					width="37rem"
				>
					{isOpen ? (
						<ValidateDismiss
							validateData={validateData}
							statusType={statusType}
							onCancel={this.onCancelModal}
							handleConfirm={this.handleConfirm}
						/>
					) : null}
				</Modal>
				<Modal
					title="Travel rule details"
					visible={this.state.travelRuleOpen}
					onCancel={this.closeTravelRule}
					footer={null}
				>
					{this.state.travelRuleLoading ? (
						<div className="text-center">
							<Spin />
						</div>
					) : this.state.travelRuleError ? (
						<Alert message={this.state.travelRuleError} type="error" showIcon />
					) : this.state.travelRuleData.length === 0 ? (
						<div>No travel rule record was collected for this transaction.</div>
					) : (
						this.state.travelRuleData.map((record) =>
							this.renderTravelRuleRecord(record)
						)
					)}
				</Modal>
			</div>
		);
	}
}
const mapStateToProps = (state) => ({
	coins: state.app.coins,
	travelRuleActive: state.app.constants?.travel_rule?.active === true,
});

export default connect(mapStateToProps)(Deposits);
