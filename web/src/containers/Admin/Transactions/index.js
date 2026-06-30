import React, { Component } from 'react';
import { Table, Alert, Modal, Spin } from 'antd';
import { connect } from 'react-redux';

import './index.css';

import {
	requestDeposits,
	completeDeposits,
	dismissDeposit,
	requestDepositsDownload,
	requestTravelRule,
	requestBurn,
	requestMint,
	requestReallocate,
} from './actions';
import { renderRowContent, COLUMNS, TRAVEL_RULE_TYPE_LABELS } from './utils';
import { Filters } from './Filters';
import ValidateDismiss from '../Deposits/ValidateDismiss';

// import { Table, Button, Input, Select, Alert } from 'antd';
// import { renderRowContent, COLUMNS, SELECT_KEYS } from './utils';

// const InputGroup = Input.Group;
// const Option = Select.Option;
// const Search = Input.Search;

// const HEADERS = [
// 	{ label: 'Transaction id', key: 'transaction_id' },
// 	{ label: 'Type', key: 'type' },
// 	{ label: 'Amount', key: 'amount' },
// 	{ label: 'Currency', key: 'currency' },
// 	{ label: 'Time', key: 'created_at' }
// ];

const conditionHandler = (queryParams) => {
	let data = {};
	if (Object.keys(queryParams).includes('status')) {
		if (queryParams.status === 'dismiss') {
			data = { dismissed: true };
		} else if (queryParams.status === 'reject') {
			data = { rejected: true };
		} else if (queryParams.status === 'status') {
			data = { status: true };
		} else {
			data = { status: false, dismissed: false, rejected: false };
		}
	}
	const { status, ...rest } = queryParams;
	return { ...rest, ...data };
};

class Transactions extends Component {
	state = {
		deposits: [],
		fetched: false,
		loading: true,
		loadingItem: false,
		dismissingItem: false,
		// searchValue: '',
		error: '',
		indexItem: -1,
		searchKey: 'transaction_id',
		queryParams: {},
		queryDone: JSON.stringify({}),
		page: 1,
		pageSize: 10,
		limit: 50,
		currentTablePage: 1,
		isRemaining: true,
		travelRuleOpen: false,
		travelRuleLoading: false,
		travelRuleData: [],
		travelRuleError: '',
		travelRuleTxId: null,
		isOpen: false,
		statusType: '',
		validateData: {},
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
		if (
			nextProps.queryParams.currency !== this.props.queryParams.currency ||
			nextProps.queryParams.type !== this.props.queryParams.type
		) {
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
		queryParams = this.props.queryParams,
		page = 1,
		limit = 50
	) => {
		if (Object.keys(queryParams).length === 0) {
			return this.setState({
				loading: false,
				fetched: false,
				queryParams: {},
			});
		}

		this.setState({
			loading: true,
			error: '',
			queryDone: JSON.stringify(queryParams),
		});

		requestDeposits({
			...values,
			...queryParams,
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

	handleDownload = (
		values = this.props.initialData,
		queryParams = this.props.queryParams
	) => {
		return requestDepositsDownload({
			...values,
			...queryParams,
			...conditionHandler(this.state.queryParams),
			format: 'csv',
		});
	};

	completeDeposit = (transaction_id, indexItem) => () => {
		const { loadingItem, loading, dismissingItem } = this.state;
		if (!(dismissingItem || loadingItem || loading)) {
			this.setState({ loadingItem: true, error: '', indexItem });
			completeDeposits({ transaction_id, status: true })
				.then((data) => {
					const { deposits } = this.state;
					this.setState({
						deposits: [].concat(
							deposits.slice(0, indexItem),
							data,
							deposits.slice(indexItem + 1, deposits.length)
						),
						loadingItem: false,
						indexItem: -1,
					});
				})
				.catch((error) => {
					const message = error.data ? error.data.message : error.message;
					this.setState({
						loadingItem: false,
						error: message,
						indexItem: -1,
					});
				});
		}
	};

	dismissDeposit = (transaction_id, dismissed, indexItem) => () => {
		const { loadingItem, loading, dismissingItem } = this.state;
		if (!(dismissingItem || loadingItem || loading)) {
			this.setState({ dismissingItem: true, error: '', indexItem });
			dismissDeposit(transaction_id, dismissed)
				.then((data) => {
					const { deposits } = this.state;
					this.setState({
						deposits: [].concat(
							deposits.slice(0, indexItem),
							data,
							deposits.slice(indexItem + 1, deposits.length)
						),
						dismissingItem: false,
						indexItem: -1,
					});
				})
				.catch((error) => {
					const message = error.data ? error.data.message : error.message;
					this.setState({
						dismissingItem: false,
						error: message,
						indexItem: -1,
					});
				});
		}
	};
	onSelect = (value, option) => {
		this.setState({ searchKey: value });
	};

	onSearch = (value) => {
		if (value) {
			this.setState({ searchValue: value.trim() });
			const values = {};
			values[this.state.searchKey] = value.trim();
			const queryParams = { ...this.props.queryParams };
			delete queryParams.dismissed;
			delete queryParams.status;
			this.requestDeposits(values, queryParams);
		}
	};

	onRefresh = (requestData = true) => {
		const { initialData } = this.props;
		this.setState({ searchValue: '', searchKey: 'transaction_id' });
		if (requestData) {
			this.requestDeposits(initialData);
		}
	};

	onCloseErrorAlert = () => {
		this.setState({ error: '' });
	};

	// Open the travel-rule detail modal for a transaction and fetch its record(s).
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

	onChangeQuery = (key) => (value, option) => {
		const queryParams = {
			...this.state.queryParams,
		};
		if (value) {
			queryParams[key] = value;
		} else {
			delete queryParams[key];
		}
		this.setState({ queryParams }, () => {});
	};

	onClickFilters = () => {
		const { queryParams } = this.state;
		this.requestDeposits(
			{ ...this.props.initialData, ...conditionHandler(queryParams) },
			this.props.queryParams
		);
	};

	pageChange = (count, pageSize) => {
		const { page, limit, isRemaining } = this.state;
		const pageCount = count % 5 === 0 ? 5 : count % 5;
		const apiPageTemp = Math.floor(count / 5);
		if (limit === pageSize * pageCount && apiPageTemp >= page && isRemaining) {
			this.requestDeposits(
				this.props.initialData,
				this.props.queryParams,
				page + 1,
				limit
			);
		}
		this.setState({ currentTablePage: count });
	};

	onOpenModal = (validateData, statusType) => {
		this.setState({ isOpen: true, validateData, statusType });
	};

	onCancelModal = () => {
		this.setState({ isOpen: false, statusType: '' });
	};

	// Re-run the active query so the table reflects the transaction's new state.
	refreshDeposits = () => {
		this.requestDeposits(
			{
				...this.props.initialData,
				...conditionHandler(this.state.queryParams),
			},
			this.props.queryParams
		);
	};

	handleConfirm = (formValues) => {
		const { statusType, validateData } = this.state;
		// Determine the funding direction from the row, since this table mixes
		// deposits and withdrawals.
		const isDeposit = validateData.type === 'deposit';

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
					this.refreshDeposits();
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
		if (statusType === 'release') {
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

		const request = isDeposit ? requestMint : requestBurn;
		request(body)
			.then(() => {
				this.refreshDeposits();
				this.onCancelModal();
			})
			.catch((error) => {
				const message = error.data ? error.data.message : error.message;
				this.setState({ error: message });
				this.onCancelModal();
			});
	};

	render() {
		const {
			deposits,
			loading,
			fetched,
			error,
			indexItem,
			// searchValue,
			dismissingItem,
			loadingItem,
			queryParams,
			queryDone,
			currentTablePage,
			pageSize,
		} = this.state;
		const { showFilters, coins, icons } = this.props;

		const {
			hideUserColumn,
			queryParams: { currency, type },
		} = this.props;
		const columns = COLUMNS(currency, type, this.onOpenModal);
		return (
			<div className="app_container-content admin-user-container">
				<div>
					{showFilters && (
						<Filters
							icons={icons}
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
				{loading ? (
					<div />
				) : (
					<div className="app-wrapper admin-user-container">
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
							<span className="pointer" onClick={() => this.handleDownload()}>
								Download transactions
							</span>
						</div>
						<Table
							className="blue-admin-table"
							columns={hideUserColumn ? columns.slice(1) : columns}
							dataSource={deposits.map((deposit, index) => {
								return {
									...deposit,
									completeDeposit:
										index !== indexItem
											? this.completeDeposit(deposit.transaction_id, index)
											: () => {},
									dismissDeposit:
										index !== indexItem
											? this.dismissDeposit(
													deposit.transaction_id,
													!deposit.dismissed,
													index
											  )
											: () => {},
									updatingItem: loadingItem && index === indexItem,
									dismissingItem: dismissingItem && index === indexItem,
									// Show the travel-rule detail link on every transaction while the
									// feature is on; the record is fetched lazily on click (the modal
									// reports "no record" when none exists). No per-row server lookup.
									viewTravelRule: this.props.travelRuleActive
										? () => this.openTravelRule(deposit.transaction_id)
										: undefined,
								};
							})}
							expandedRowRender={(vals) => renderRowContent({ ...vals, coins })}
							expandRowByClick={true}
							rowKey={(data) => {
								return data.id;
							}}
							pagination={{
								pageSize: pageSize,
								current: currentTablePage,
								onChange: this.pageChange,
							}}
						/>
					</div>
				)}
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
				<Modal
					visible={this.state.isOpen}
					footer={null}
					onCancel={this.onCancelModal}
					width="37rem"
				>
					{this.state.isOpen ? (
						<ValidateDismiss
							validateData={this.state.validateData}
							statusType={this.state.statusType}
							onCancel={this.onCancelModal}
							handleConfirm={this.handleConfirm}
						/>
					) : null}
				</Modal>
			</div>
		);
	}
}

const mapStateToProps = (state) => ({
	coins: state.app.coins,
	travelRuleActive: state.app.constants?.travel_rule?.active === true,
});

export default connect(mapStateToProps)(Transactions);
