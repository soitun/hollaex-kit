import React, { useState } from 'react';
import { Select, Input, Checkbox, Button, Alert } from 'antd';

import { createTravelRule } from './actions';
import { TRAVEL_RULE_TYPE_LABELS } from './utils';

const { Option } = Select;
const { TextArea } = Input;

// Mirrors the server's TRAVEL_RULE_PURPOSES list (tools/travelRule.js).
const PURPOSES = [
	'Personal transfer',
	'Investment',
	'Purchase of goods/services',
	'Salary/income',
	'Gift',
	'Trading',
	'Other',
];

// Manual admin entry of travel-rule info for a transaction that has no record
// (the user never submitted one). Mirrors the user-facing questions: service
// provider type first, then counterparty identity, then purpose. Creates the
// record via POST /admin/travel-rule and hands it back through onCreated.
const TravelRuleForm = ({ transaction, onCreated }) => {
	const [counterpartyType, setCounterpartyType] = useState();
	const [vaspName, setVaspName] = useState('');
	const [counterpartyName, setCounterpartyName] = useState('');
	const [isOwnAddress, setIsOwnAddress] = useState(false);
	const [purpose, setPurpose] = useState();
	const [purposeOther, setPurposeOther] = useState('');
	const [note, setNote] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	const resolvedPurpose = purpose === 'Other' ? purposeOther.trim() : purpose;
	const canSubmit = counterpartyType && resolvedPurpose;

	const onSubmit = () => {
		setSubmitting(true);
		setError('');
		const body = {
			user_id: transaction.user_id,
			type: transaction.type,
			transaction_id: transaction.transaction_id,
			address: transaction.address,
			network: transaction.network,
			currency: transaction.currency,
			amount: transaction.amount,
			counterparty_type: counterpartyType,
			purpose: resolvedPurpose,
		};
		if (counterpartyType === 'exchange_vasp' && vaspName.trim()) {
			body.vasp_name = vaspName.trim();
		}
		if (counterpartyType === 'self_custody') {
			body.is_own_address = isOwnAddress;
		}
		if (counterpartyName.trim()) {
			body.counterparty_name = counterpartyName.trim();
		}
		if (note.trim()) {
			body.note = note.trim();
		}
		createTravelRule(body)
			.then((record) => {
				onCreated(record);
			})
			.catch((err) => {
				const message = err.data ? err.data.message : err.message;
				setSubmitting(false);
				setError(message);
			});
	};

	// counterparty name is meaningless when the address is the user's own
	const showCounterpartyName = !(
		counterpartyType === 'self_custody' && isOwnAddress
	);

	return (
		<div className="travel-rule-form mt-3">
			{error && (
				<Alert message={error} type="error" showIcon className="mb-2" />
			)}
			<div className="mb-2">
				<div className="bold">Service provider type</div>
				<Select
					style={{ width: '100%' }}
					placeholder="Where is the counterparty's address held?"
					value={counterpartyType}
					onChange={setCounterpartyType}
				>
					{Object.entries(TRAVEL_RULE_TYPE_LABELS).map(([value, label]) => (
						<Option value={value} key={value}>
							{label}
						</Option>
					))}
				</Select>
			</div>
			{counterpartyType === 'exchange_vasp' && (
				<div className="mb-2">
					<div className="bold">VASP / provider name</div>
					<Input
						value={vaspName}
						onChange={(e) => setVaspName(e.target.value)}
						placeholder="Name of the exchange / VASP"
					/>
				</div>
			)}
			{counterpartyType === 'self_custody' && (
				<div className="mb-2">
					<Checkbox
						checked={isOwnAddress}
						onChange={(e) => setIsOwnAddress(e.target.checked)}
					>
						The address belongs to the user themselves
					</Checkbox>
				</div>
			)}
			{showCounterpartyName && (
				<div className="mb-2">
					<div className="bold">Counterparty name</div>
					<Input
						value={counterpartyName}
						onChange={(e) => setCounterpartyName(e.target.value)}
						placeholder="Name of the counterparty person/entity"
					/>
				</div>
			)}
			<div className="mb-2">
				<div className="bold">Purpose</div>
				<Select
					style={{ width: '100%' }}
					placeholder="Purpose/source of the transaction"
					value={purpose}
					onChange={setPurpose}
				>
					{PURPOSES.map((value) => (
						<Option value={value} key={value}>
							{value}
						</Option>
					))}
				</Select>
				{purpose === 'Other' && (
					<Input
						className="mt-1"
						value={purposeOther}
						onChange={(e) => setPurposeOther(e.target.value)}
						placeholder="Describe the purpose"
					/>
				)}
			</div>
			<div className="mb-2">
				<div className="bold">Note (optional)</div>
				<TextArea
					rows={2}
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder="e.g. how this information was obtained"
				/>
			</div>
			<Button
				type="primary"
				block
				loading={submitting}
				disabled={!canSubmit || submitting}
				onClick={onSubmit}
			>
				Save travel rule info
			</Button>
		</div>
	);
};

export default TravelRuleForm;
