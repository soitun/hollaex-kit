import React, { useState } from 'react';
import { Button, Checkbox, Input, Select } from 'antd';

// Fixed purpose/source list — mirrors TRAVEL_RULE_PURPOSES in the kit's
// server/utils/hollaex-tools-lib/tools/travelRule.js. "Other" reveals a free-text input.
export const TRAVEL_RULE_PURPOSES = [
	'Personal transfer',
	'Investment',
	'Purchase of goods/services',
	'Salary/income',
	'Gift',
	'Trading',
	'Other',
];

// Counterparty service-provider types — mirrors TRAVEL_RULE_COUNTERPARTY_TYPES on
// the server. The user picks the type first, then identifies the counterparty.
export const TRAVEL_RULE_COUNTERPARTY_TYPES = [
	{ value: 'exchange_vasp', label: 'Exchange / VASP' },
	{ value: 'self_custody', label: 'Self-custody wallet' },
];

const { Option } = Select;

/**
 * Collects travel-rule info for a transaction at or above the configured threshold.
 * Used for both withdrawals (receiver) and deposits (sender). The user first selects
 * the counterparty service-provider type, then identifies who the counterparty is.
 * `subjectLabel` customises the self-checkbox wording.
 */
const TravelRuleModal = ({
	onSubmit,
	onCancel,
	loading = false,
	subjectLabel = 'The receiver is myself',
}) => {
	const [counterpartyType, setCounterpartyType] = useState(undefined);
	const [isOwnAddress, setIsOwnAddress] = useState(false);
	const [counterpartyName, setCounterpartyName] = useState('');
	const [vaspName, setVaspName] = useState('');
	const [purpose, setPurpose] = useState(undefined);
	const [customPurpose, setCustomPurpose] = useState('');

	const isExchange = counterpartyType === 'exchange_vasp';
	const isSelfCustody = counterpartyType === 'self_custody';
	// "is myself" only applies to self-custody wallets; an exchange counterparty
	// is never the user themselves.
	const ownAddress = isSelfCustody ? isOwnAddress : false;
	// A name is needed unless the self-custody wallet belongs to the user.
	const needsName = isExchange || (isSelfCustody && !ownAddress);

	const isOther = purpose === 'Other';
	const resolvedPurpose = isOther ? customPurpose.trim() : purpose;
	const isValid =
		!!counterpartyType &&
		!!resolvedPurpose &&
		(!isExchange || !!vaspName.trim()) &&
		(!needsName || !!counterpartyName.trim());

	const onChangeType = (value) => {
		setCounterpartyType(value);
		// reset identity fields when switching type to avoid stale data
		setIsOwnAddress(false);
		setCounterpartyName('');
		setVaspName('');
	};

	return (
		<div className="travel-rule-modal d-flex flex-column">
			<div className="dialog-title bold">Travel rule information</div>
			<div className="mt-2">
				This transaction requires additional information for compliance. Please
				provide the details below.
			</div>

			<div className="mt-4">
				<div className="mb-1">Service provider type</div>
				<Select
					className="w-100"
					placeholder="Select the counterparty type"
					value={counterpartyType}
					onChange={onChangeType}
				>
					{TRAVEL_RULE_COUNTERPARTY_TYPES.map((item) => (
						<Option key={item.value} value={item.value}>
							{item.label}
						</Option>
					))}
				</Select>
			</div>

			{isExchange && (
				<div className="mt-3">
					<div className="mb-1">Exchange / VASP name</div>
					<Input
						value={vaspName}
						onChange={(e) => setVaspName(e.target.value)}
						placeholder="e.g. Coinbase, Binance"
						maxLength={256}
					/>
				</div>
			)}

			{isSelfCustody && (
				<div className="mt-3">
					<Checkbox
						checked={isOwnAddress}
						onChange={(e) => setIsOwnAddress(e.target.checked)}
					>
						{subjectLabel}
					</Checkbox>
				</div>
			)}

			{needsName && (
				<div className="mt-3">
					<div className="mb-1">
						{isExchange ? 'Account holder name' : 'Counterparty name'}
					</div>
					<Input
						value={counterpartyName}
						onChange={(e) => setCounterpartyName(e.target.value)}
						placeholder="Full name of the person or entity"
						maxLength={256}
					/>
				</div>
			)}

			<div className="mt-3">
				<div className="mb-1">Purpose of transaction</div>
				<Select
					className="w-100"
					placeholder="Select a purpose"
					value={purpose}
					onChange={(value) => setPurpose(value)}
				>
					{TRAVEL_RULE_PURPOSES.map((item) => (
						<Option key={item} value={item}>
							{item}
						</Option>
					))}
				</Select>
			</div>

			{isOther && (
				<div className="mt-3">
					<div className="mb-1">Please specify</div>
					<Input
						value={customPurpose}
						onChange={(e) => setCustomPurpose(e.target.value)}
						placeholder="Enter the purpose"
						maxLength={256}
					/>
				</div>
			)}

			<div className="d-flex mt-4">
				<Button className="mr-2 w-50" onClick={onCancel} disabled={loading}>
					Cancel
				</Button>
				<Button
					type="primary"
					className="w-50"
					disabled={!isValid || loading}
					loading={loading}
					onClick={() =>
						onSubmit({
							is_own_address: ownAddress,
							purpose: resolvedPurpose,
							counterparty_type: counterpartyType,
							counterparty_name: needsName ? counterpartyName.trim() : '',
							vasp_name: isExchange ? vaspName.trim() : '',
						})
					}
				>
					Submit
				</Button>
			</div>
		</div>
	);
};

export default TravelRuleModal;
