import React, { Component } from 'react';
import { Link } from 'react-router';
import { Table, Button, Input, Select } from 'antd';
import {
	PlusCircleOutlined,
	MinusCircleOutlined,
	RightOutlined,
	SearchOutlined,
} from '@ant-design/icons';

import { formatDate } from 'utils';
import { COUNTRIES_OPTIONS } from '../../../utils/countries';
import { requestCompanies } from './actions';

import '../ListUsers/index.css';

const { Option } = Select;

const STATUS_OPTIONS = [
	{ value: 0, label: 'Not provided' },
	{ value: 1, label: 'Pending' },
	{ value: 2, label: 'Rejected' },
	{ value: 3, label: 'Verified' },
];

class Companies extends Component {
	constructor(props) {
		super(props);
		this.state = {
			companies: [],
			loading: false,
			error: '',
			total: 0,
			page: 1,
			limit: 50,
			currentTablePage: 1,
			isRemaining: true,
			filters: null,
			// pending (un-applied) filter inputs
			search: '',
			country_of_incorporation: undefined,
			status: undefined,
		};
	}

	UNSAFE_componentWillMount() {
		this.requestCompanies(this.state.page, this.state.limit);
	}

	requestCompanies = (page = 1, limit = 50) => {
		this.setState({ loading: true, error: '' });
		const { filters } = this.state;
		requestCompanies({ page, limit, ...(filters != null && filters) })
			.then((res) => {
				const companies =
					page === 1 ? res.data : [...this.state.companies, ...res.data];
				this.setState({
					companies,
					loading: false,
					total: res.count,
					page,
					currentTablePage: page === 1 ? 1 : this.state.currentTablePage,
					isRemaining: res.count > page * limit,
				});
			})
			.catch((error) => {
				const message = error.data ? error.data.message : error.message;
				this.setState({ loading: false, error: message });
			});
	};

	pageChange = (count, pageSize) => {
		const { page, limit, isRemaining } = this.state;
		const pageCount = count % 5 === 0 ? 5 : count % 5;
		const apiPageTemp = Math.floor(count / 5);
		if (limit === pageSize * pageCount && apiPageTemp >= page && isRemaining) {
			this.requestCompanies(page + 1, limit);
		}
		this.setState({ currentTablePage: count });
	};

	applyFilters = () => {
		const { search, country_of_incorporation, status } = this.state;
		const filters = {};
		if (search != null && search !== '') filters.search = search;
		if (country_of_incorporation != null)
			filters.country_of_incorporation = country_of_incorporation;
		if (status != null) filters.status = status;

		this.setState({ filters, page: 1, currentTablePage: 1 }, () => {
			this.requestCompanies(1, this.state.limit);
		});
	};

	resetFilters = () => {
		this.setState(
			{
				search: '',
				country_of_incorporation: undefined,
				status: undefined,
				filters: null,
				page: 1,
				currentTablePage: 1,
			},
			() => {
				this.requestCompanies(1, this.state.limit);
			}
		);
	};

	render() {
		const {
			companies,
			loading,
			error,
			currentTablePage,
			total,
			search,
			country_of_incorporation,
			status,
		} = this.state;

		const renderLink = (user_id) =>
			user_id ? (
				<Button type="primary" className="green-btn">
					<Link to={`/admin/user?id=${user_id}`}>
						GO
						<RightOutlined />
					</Link>
				</Button>
			) : (
				<div>-</div>
			);

		const COLUMNS = [
			{ title: 'ID', dataIndex: 'id', key: 'id' },
			{ title: 'Company name', dataIndex: 'name', key: 'name' },
			{
				title: 'Registration #',
				dataIndex: 'registration_number',
				key: 'registration_number',
			},
			{
				title: 'Country',
				dataIndex: 'country_of_incorporation',
				key: 'country_of_incorporation',
			},
			{ title: 'Status', dataIndex: 'status', key: 'status' },
			{
				title: 'Owner email',
				key: 'owner_email',
				render: (record) => <div>{record.user?.email || '-'}</div>,
			},
			{
				title: 'User',
				dataIndex: 'user_id',
				key: 'user',
				render: (user_id) => renderLink(user_id),
			},
		];

		const renderRowContent = ({
			user = {},
			business_address = {},
			created_at,
		}) => {
			const { address, city, country, postal_code } = business_address || {};
			return (
				<div>
					<div>Owner name: {user?.full_name || '-'}</div>
					<div>Owner verification level: {user?.verification_level ?? '-'}</div>
					<div>
						Business address:{' '}
						{[address, city, postal_code, country]
							.filter((part) => part)
							.join(', ') || '-'}
					</div>
					<div>Created at: {formatDate(created_at)}</div>
				</div>
			);
		};

		return (
			<div className="app_container-content admin-user-container">
				<div
					style={{
						marginTop: 20,
						marginBottom: 10,
						fontSize: 15,
						color: '#ccc',
					}}
				>
					Find company accounts by company name, registration number or the
					owner's email. Use the GO button to open the owner's user page for
					full account details.
				</div>
				<hr style={{ border: '1px solid #ccc', marginBottom: 20 }} />

				{error && <p>-{error}-</p>}

				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						gap: 10,
						flexWrap: 'wrap',
						alignItems: 'flex-end',
						marginBottom: 15,
						color: 'white',
					}}
				>
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<label>Search:</label>
						<Input
							value={search}
							placeholder="Name, reg. number or owner email"
							style={{ width: 260 }}
							onChange={(e) => this.setState({ search: e.target.value })}
							onPressEnter={this.applyFilters}
						/>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<label>Country of incorporation:</label>
						<Select
							showSearch
							allowClear
							className="select-box"
							style={{ width: 220 }}
							placeholder="Select country"
							value={country_of_incorporation}
							optionFilterProp="children"
							onChange={(value) =>
								this.setState({ country_of_incorporation: value })
							}
						>
							{COUNTRIES_OPTIONS.map((option, index) => (
								<Option value={option.value} key={index}>
									{option.label}
								</Option>
							))}
						</Select>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<label>Status:</label>
						<Select
							allowClear
							className="select-box"
							style={{ width: 150 }}
							placeholder="Select status"
							value={status}
							onChange={(value) =>
								this.setState({ status: value ?? undefined })
							}
						>
							{STATUS_OPTIONS.map((option) => (
								<Option value={option.value} key={option.value}>
									{option.label}
								</Option>
							))}
						</Select>
					</div>
					<div
						style={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							gap: 12,
						}}
					>
						<Button
							onClick={this.applyFilters}
							icon={<SearchOutlined />}
							style={{
								backgroundColor: '#288500',
								color: 'white',
								height: 35,
							}}
							type="default"
						>
							Search
						</Button>
						<div
							onClick={this.resetFilters}
							style={{
								cursor: 'pointer',
								textDecoration: 'underline',
								color: 'white',
							}}
						>
							Reset
						</div>
					</div>
				</div>

				<div className="user-list-header-wrapper">
					<span>Total: {total || '-'}</span>
				</div>

				<Table
					loading={loading}
					className="blue-admin-table"
					columns={COLUMNS}
					dataSource={companies}
					expandable={{
						expandedRowRender: renderRowContent,
						expandRowByClick: true,
						expandIcon: ({ expanded, onExpand, record }) =>
							expanded ? (
								<MinusCircleOutlined
									onClick={(e) => onExpand(record, e)}
									style={{ marginRight: 8 }}
								/>
							) : (
								<PlusCircleOutlined
									onClick={(e) => onExpand(record, e)}
									style={{ marginRight: 8 }}
								/>
							),
					}}
					rowKey={(data) => data.id}
					pagination={{
						current: currentTablePage,
						onChange: this.pageChange,
					}}
				/>
			</div>
		);
	}
}

export default Companies;
