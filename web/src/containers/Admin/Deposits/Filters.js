import React, { useState } from 'react';
import {
	SearchOutlined,
	PlusOutlined,
	MinusCircleOutlined,
} from '@ant-design/icons';
import { Button, Alert, Dropdown, Menu } from 'antd';
import { STATIC_ICONS } from 'config/icons';
import { SelectValue } from './SelectValues';
import { FilterInput, FilterDate } from './FilterInput';

const getFilters = (coinOptions) => [
	{
		label: 'Currency',
		placeholder: 'Currency',
		key: 'currency',
		className: 'adjacent-fields',
		showSearch: true,
		options: coinOptions,
	},
	{
		label: 'Status',
		placeholder: 'Status',
		key: 'status',
		className: 'adjacent-fields pl-2 filter-status-field',
		emptyLabel: 'All',
		options: [
			{ value: 'true', text: 'Confirmed' },
			{ value: 'false', text: 'Pending' },
			{ value: 'dismissed', text: 'Dismissed' },
			{ value: 'rejected', text: 'Rejected' },
			{ value: 'onhold', text: 'On Hold' },
		],
	},
];

// Optional filters that can be added/removed dynamically via the "+" menu.
const OPTIONAL_FILTERS = [
	{ key: 'user_id', label: 'User Id', placeholder: 'User id', type: 'input' },
	{
		key: 'transaction_id',
		label: 'Transaction Id',
		placeholder: 'Transaction Id or Payment Id',
		type: 'input',
	},
	{ key: 'address', label: 'Address', placeholder: 'Address', type: 'input' },
	{ key: 'source', label: 'Source', placeholder: 'Source', type: 'input' },
	{
		key: 'description',
		label: 'Description',
		placeholder: 'Description',
		type: 'input',
	},
	{
		key: 'start_date',
		label: 'Start date',
		placeholder: 'Start date',
		type: 'date',
	},
	{
		key: 'end_date',
		label: 'End date',
		placeholder: 'End date',
		type: 'date',
	},
];

const getStatusValue = (key, params) => {
	if (
		key === 'status' &&
		params.dismissed === undefined &&
		params.rejected === undefined &&
		params.onhold === undefined &&
		params[key] === undefined
	) {
		return '';
	} else if (
		key === 'status' &&
		params.dismissed !== undefined &&
		params[key] === undefined
	) {
		return 'dismissed';
	} else if (
		key === 'status' &&
		params.rejected !== undefined &&
		params[key] === undefined
	) {
		return 'rejected';
	} else if (
		key === 'status' &&
		params.onhold !== undefined &&
		params[key] === undefined
	) {
		return 'onhold';
	} else {
		return params[key];
	}
};

export const Filters = ({
	coins,
	onChange,
	params,
	onClick,
	loading,
	fetched,
	hasChanges,
}) => {
	const [activeFilters, setActiveFilters] = useState(
		OPTIONAL_FILTERS.filter((f) => params[f.key] !== undefined).map(
			(f) => f.key
		)
	);

	const getCoinLogo = (symbol) => {
		const coin = coins?.[symbol];
		if (coin && coin.logo) {
			return coin.logo;
		} else if (STATIC_ICONS.COIN_ICONS[(symbol || '').toLowerCase()]) {
			return STATIC_ICONS.COIN_ICONS[(symbol || '').toLowerCase()];
		}
		return STATIC_ICONS.MISSING_ICON;
	};

	const coinOptions = [];
	Object.keys(coins).forEach((data) => {
		coinOptions.push({
			value: data,
			text: data.toUpperCase(),
			icon: getCoinLogo(data),
		});
	});
	const fieldProps = getFilters(coinOptions);
	const allowQuery =
		!loading && (hasChanges || Object.keys(params).length === 0);

	const addFilter = (key) => {
		if (!activeFilters.includes(key)) {
			setActiveFilters([...activeFilters, key]);
		}
	};

	const removeFilter = (key) => {
		// clear the value from the query params, then drop the field
		onChange(key)('');
		setActiveFilters(activeFilters.filter((item) => item !== key));
	};

	const availableFilters = OPTIONAL_FILTERS.filter(
		(f) => !activeFilters.includes(f.key)
	);

	const addMenu = (
		<Menu onClick={({ key }) => addFilter(key)}>
			{availableFilters.map((f) => (
				<Menu.Item key={f.key}>{f.label}</Menu.Item>
			))}
		</Menu>
	);

	return (
		<div>
			<Alert
				message="Select some filters to perform a query on the deposits"
				type="info"
				showIcon
				className="filter-alert"
			/>
			{Object.keys(params).length === 0 && !allowQuery && (
				<Alert
					message="You have to select at least one filter to perform a query"
					type="warning"
					showIcon
					className="filter-alert"
				/>
			)}
			<div className="filters-wrapper">
				<div className="filters-wrapper-filters d-flex flex-direction-row">
					{fieldProps.map(({ key, description, ...rest }, index) => (
						<SelectValue
							key={key}
							defaultValue={getStatusValue(key, params)}
							onSelect={onChange(key)}
							description={description}
							className={'adjacent-fields pl-2'}
							{...rest}
						/>
					))}
					{OPTIONAL_FILTERS.filter((f) => activeFilters.includes(f.key)).map(
						(f) => (
							<div
								className="adjacent-fields pl-2 filter-removable"
								key={f.key}
							>
								<MinusCircleOutlined
									className="filter-remove-icon"
									onClick={() => removeFilter(f.key)}
									title={`Remove ${f.label}`}
								/>
								{f.type === 'date' ? (
									<FilterDate
										onChange={onChange(f.key)}
										label={f.label}
										defaultValue={params[f.key]}
										placeholder={f.placeholder}
									/>
								) : (
									<FilterInput
										onChange={onChange(f.key)}
										label={f.label}
										defaultValue={params[f.key]}
										placeholder={f.placeholder}
									/>
								)}
							</div>
						)
					)}
					{availableFilters.length > 0 && (
						<div className="adjacent-fields pl-2 filter-more-toggle">
							<Dropdown
								overlay={addMenu}
								trigger={['click']}
								placement="bottomLeft"
								overlayClassName="filter-add-menu"
							>
								<Button
									type="primary"
									icon={<PlusOutlined />}
									className="filter-more-button"
								>
									Add filter
								</Button>
							</Dropdown>
						</div>
					)}
				</div>
				<div className="filters-wrapper-buttons pl-2">
					<Button
						onClick={onClick}
						type="primary"
						icon={<SearchOutlined />}
						className="filter-button green-btn"
						disabled={!allowQuery}
					>
						Search
					</Button>
				</div>
			</div>
		</div>
	);
};
