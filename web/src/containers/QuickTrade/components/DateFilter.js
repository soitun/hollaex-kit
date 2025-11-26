import React, { useState, useEffect } from 'react';
import { Radio, DatePicker, Form, Row } from 'antd';
import moment from 'moment';

import STRINGS from 'config/localizedStrings';
import { EditWrapper } from 'components';
import { dateFilters } from 'containers/TransactionsHistory/filterUtils';

const { RangePicker } = DatePicker;

const DateFilter = ({ onFilterChange, initialFilter = 'all' }) => {
	const [form] = Form.useForm();
	const [customDateRange, setCustomDateRange] = useState([]);
	const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

	useEffect(() => {
		setShowCustomDatePicker(initialFilter === 'custom');
		if (form) {
			form.setFieldsValue({
				size: initialFilter === 'custom' ? '' : initialFilter,
			});
		}
	}, [initialFilter, form]);

	const handleDateFilterChange = (e) => {
		const filterValue = e.target.value;
		setShowCustomDatePicker(false);
		setCustomDateRange([]);

		let filterParams = {};

		const filterRange = dateFilters()[filterValue]?.range;
		if (filterRange && filterRange.length === 2) {
			filterParams.start_date = moment?.utc(filterRange[0])?.format();
			filterParams.end_date = moment?.utc(filterRange[1])?.format();
		}

		if (onFilterChange) {
			onFilterChange(filterParams);
		}
	};

	const handleCustomDateRangeChange = (dates) => {
		if (dates && dates.length === 2 && dates[0] && dates[1]) {
			const firstDate = moment(dates[0])?.format('DD/MMM/YYYY');
			const secondDate = moment(dates[1])?.format('DD/MMM/YYYY');
			let dateRange = dates;

			if (firstDate === secondDate) {
				dateRange = [moment(dates[0]), moment(dates[1])?.add(1, 'days')];
			}

			setCustomDateRange(dateRange);
			form.setFieldsValue({
				size: '',
			});

			const filterParams = {
				start_date: moment?.utc(dateRange[0])?.format(),
				end_date: moment?.utc(dateRange[1])?.format(),
			};

			if (onFilterChange) {
				onFilterChange(filterParams);
			}
		} else {
			setCustomDateRange(dates || []);
			if (onFilterChange) {
				onFilterChange({
					start_date: undefined,
					end_date: undefined,
				});
			}
		}
	};

	const handleCustomClick = () => {
		if (!showCustomDatePicker) {
			setShowCustomDatePicker(true);
			setCustomDateRange([]);
			form.setFieldsValue({
				size: '',
				range: [],
			});
			const filterParams = {
				start_date: undefined,
				end_date: undefined,
			};
			if (onFilterChange) {
				onFilterChange(filterParams);
			}
		} else {
			setShowCustomDatePicker(false);
			setCustomDateRange([]);
			form.setFieldsValue({
				size: 'all',
				range: [],
			});
			const filterParams = {};
			if (onFilterChange) {
				onFilterChange(filterParams);
			}
		}
	};

	return (
		<Form
			form={form}
			className="ant-advanced-search-form"
			initialValues={{
				size: 'all',
			}}
		>
			<Row gutter={24}>
				<Form.Item name="size">
					<Radio.Group size="small" onChange={handleDateFilterChange}>
						{Object.entries(dateFilters())?.map(([key, { name }]) => (
							<Radio.Button key={key} value={key}>
								{name}
							</Radio.Button>
						))}
					</Radio.Group>
				</Form.Item>
				<Form.Item
					name="custom"
					size="small"
					onClick={handleCustomClick}
					className={showCustomDatePicker ? 'cusStyle1' : 'cusStyle2'}
				>
					<EditWrapper stringId="REFERRAL_LINK.CUSTOM">
						{STRINGS['REFERRAL_LINK.CUSTOM']}
					</EditWrapper>
				</Form.Item>
				{showCustomDatePicker && (
					<Form.Item name="range">
						<RangePicker
							allowEmpty={[false, false]}
							size="small"
							suffixIcon={false}
							placeholder={[STRINGS['START_DATE'], STRINGS['END_DATE']]}
							onChange={handleCustomDateRangeChange}
							value={
								customDateRange?.length === 2 &&
								customDateRange[0] &&
								customDateRange[1]
									? customDateRange
									: null
							}
						/>
					</Form.Item>
				)}
			</Row>
		</Form>
	);
};

export default DateFilter;
