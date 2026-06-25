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

const { Option } = Select;

/**
 * Collects travel-rule info for a transaction at or above the configured threshold.
 * Used for both withdrawals (receiver) and deposits (sender). `subjectLabel`
 * customises the self-checkbox wording.
 */
const TravelRuleModal = ({
	onSubmit,
	onCancel,
	loading = false,
	subjectLabel = 'The receiver is myself',
	showSourceAddress = false,
}) => {
	const [isOwnAddress, setIsOwnAddress] = useState(false);
	const [purpose, setPurpose] = useState(undefined);
	const [customPurpose, setCustomPurpose] = useState('');
	const [sourceAddress, setSourceAddress] = useState('');

	const isOther = purpose === 'Other';
	const resolvedPurpose = isOther ? customPurpose.trim() : purpose;
	const isValid =
		!!resolvedPurpose && (!showSourceAddress || !!sourceAddress.trim());

	return (
		<div className="travel-rule-modal d-flex flex-column">
			<div className="dialog-title bold">Travel rule information</div>
			<div className="mt-2">
				This transaction requires additional information for compliance. Please
				provide the details below.
			</div>

			<div className="mt-4">
				<Checkbox
					checked={isOwnAddress}
					onChange={(e) => setIsOwnAddress(e.target.checked)}
				>
					{subjectLabel}
				</Checkbox>
			</div>

			<div className="mt-4">
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

			{showSourceAddress && (
				<div className="mt-3">
					<div className="mb-1">Originating address</div>
					<Input
						value={sourceAddress}
						onChange={(e) => setSourceAddress(e.target.value)}
						placeholder="Enter the source address"
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
							is_own_address: isOwnAddress,
							purpose: resolvedPurpose,
							...(showSourceAddress
								? { source_address: sourceAddress.trim() }
								: {}),
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
