import React from 'react';
import { Select } from 'antd';
import classname from 'classnames';

const Option = Select.Option;

export const SelectValue = ({
	label,
	defaultValue,
	onSelect,
	options,
	description,
	className,
	emptyLabel = '-----',
	showSearch = false,
}) => (
	<div className={classname('filter-select-wrapper', className)}>
		<div className="filter-select-label">{label}</div>
		<div className="input-container">
			<Select
				defaultValue={defaultValue}
				className="select-container filter-date-field"
				onSelect={onSelect}
				placeholder={label}
				showSearch={showSearch}
				dropdownClassName="blue-admin-select-dropdown"
				filterOption={
					showSearch
						? (input, option) =>
								(option?.value ?? '')
									.toString()
									.toLowerCase()
									.includes(input.toLowerCase())
						: undefined
				}
			>
				<Option value="" key="">
					{emptyLabel}
				</Option>
				{options.map(({ value, text, icon }) => (
					<Option value={value} key={value}>
						<span className="filter-option-content">
							{icon ? (
								<img src={icon} alt="" className="filter-option-icon" />
							) : null}
							{text}
						</span>
					</Option>
				))}
			</Select>
			{description && <div className="input-description">{description}</div>}
		</div>
	</div>
);
