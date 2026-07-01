import React, { useState } from 'react';
import { Button, Checkbox, Input, Select } from 'antd';
import STRINGS from 'config/localizedStrings';
import { EditWrapper } from 'components';

// Fixed purpose/source list — mirrors TRAVEL_RULE_PURPOSES in the kit's
// server/utils/hollaex-tools-lib/tools/travelRule.js. The `value` is the
// canonical English string the server validates against and must never be
// localized; only the displayed `labelId` is translated. "Other" reveals a
// free-text input.
export const TRAVEL_RULE_PURPOSES = [
	{
		value: 'Personal transfer',
		labelId: 'TRAVEL_RULE.PURPOSE_PERSONAL_TRANSFER',
	},
	{ value: 'Investment', labelId: 'TRAVEL_RULE.PURPOSE_INVESTMENT' },
	{
		value: 'Purchase of goods/services',
		labelId: 'TRAVEL_RULE.PURPOSE_PURCHASE',
	},
	{ value: 'Salary/income', labelId: 'TRAVEL_RULE.PURPOSE_SALARY' },
	{ value: 'Gift', labelId: 'TRAVEL_RULE.PURPOSE_GIFT' },
	{ value: 'Trading', labelId: 'TRAVEL_RULE.PURPOSE_TRADING' },
	{ value: 'Other', labelId: 'TRAVEL_RULE.PURPOSE_OTHER' },
];

// Counterparty service-provider types — mirrors TRAVEL_RULE_COUNTERPARTY_TYPES on
// the server. The user picks the type first, then identifies the counterparty.
// As with purposes, `value` stays canonical English; only `labelId` is localized.
export const TRAVEL_RULE_COUNTERPARTY_TYPES = [
	{ value: 'exchange_vasp', labelId: 'TRAVEL_RULE.COUNTERPARTY_EXCHANGE' },
	{ value: 'self_custody', labelId: 'TRAVEL_RULE.COUNTERPARTY_SELF_CUSTODY' },
];

const { Option } = Select;

/**
 * Collects travel-rule info for a transaction at or above the configured threshold.
 * Used for both withdrawals (receiver) and deposits (sender). The user first selects
 * the counterparty service-provider type, then identifies who the counterparty is.
 * `subjectLabelId` customises the self-checkbox wording (receiver vs sender).
 */
const TravelRuleModal = ({
	onSubmit,
	onCancel,
	loading = false,
	subjectLabelId = 'TRAVEL_RULE.RECEIVER_IS_MYSELF',
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
			<div className="travel-rule-modal__header">
				<div className="dialog-title bold">
					<EditWrapper stringId="TRAVEL_RULE.TITLE">
						{STRINGS['TRAVEL_RULE.TITLE']}
					</EditWrapper>
				</div>
				<div className="travel-rule-modal__intro">
					<EditWrapper stringId="TRAVEL_RULE.INTRO">
						{STRINGS['TRAVEL_RULE.INTRO']}
					</EditWrapper>
				</div>
			</div>

			<div className="travel-rule-modal__field">
				<div className="travel-rule-modal__label">
					<EditWrapper stringId="TRAVEL_RULE.SERVICE_PROVIDER_TYPE">
						{STRINGS['TRAVEL_RULE.SERVICE_PROVIDER_TYPE']}
					</EditWrapper>
				</div>
				<Select
					className="w-100"
					dropdownClassName="custom-select-style"
					placeholder={STRINGS['TRAVEL_RULE.SELECT_COUNTERPARTY_TYPE']}
					value={counterpartyType}
					onChange={onChangeType}
				>
					{TRAVEL_RULE_COUNTERPARTY_TYPES.map((item) => (
						<Option key={item.value} value={item.value}>
							{STRINGS[item.labelId]}
						</Option>
					))}
				</Select>
			</div>

			{isExchange && (
				<div className="travel-rule-modal__field">
					<div className="travel-rule-modal__label">
						<EditWrapper stringId="TRAVEL_RULE.VASP_NAME">
							{STRINGS['TRAVEL_RULE.VASP_NAME']}
						</EditWrapper>
					</div>
					<Input
						value={vaspName}
						onChange={(e) => setVaspName(e.target.value)}
						placeholder={STRINGS['TRAVEL_RULE.VASP_NAME_PLACEHOLDER']}
						maxLength={256}
					/>
				</div>
			)}

			{isSelfCustody && (
				<div className="travel-rule-modal__field travel-rule-modal__field--checkbox">
					<Checkbox
						checked={isOwnAddress}
						onChange={(e) => setIsOwnAddress(e.target.checked)}
					>
						{STRINGS[subjectLabelId]}
					</Checkbox>
				</div>
			)}

			{needsName && (
				<div className="travel-rule-modal__field">
					<div className="travel-rule-modal__label">
						<EditWrapper
							stringId={
								isExchange
									? 'TRAVEL_RULE.ACCOUNT_HOLDER_NAME'
									: 'TRAVEL_RULE.COUNTERPARTY_NAME'
							}
						>
							{isExchange
								? STRINGS['TRAVEL_RULE.ACCOUNT_HOLDER_NAME']
								: STRINGS['TRAVEL_RULE.COUNTERPARTY_NAME']}
						</EditWrapper>
					</div>
					<Input
						value={counterpartyName}
						onChange={(e) => setCounterpartyName(e.target.value)}
						placeholder={STRINGS['TRAVEL_RULE.NAME_PLACEHOLDER']}
						maxLength={256}
					/>
				</div>
			)}

			<div className="travel-rule-modal__field">
				<div className="travel-rule-modal__label">
					<EditWrapper stringId="TRAVEL_RULE.PURPOSE_LABEL">
						{STRINGS['TRAVEL_RULE.PURPOSE_LABEL']}
					</EditWrapper>
				</div>
				<Select
					className="w-100"
					dropdownClassName="custom-select-style"
					placeholder={STRINGS['TRAVEL_RULE.SELECT_PURPOSE']}
					value={purpose}
					onChange={(value) => setPurpose(value)}
				>
					{TRAVEL_RULE_PURPOSES.map((item) => (
						<Option key={item.value} value={item.value}>
							{STRINGS[item.labelId]}
						</Option>
					))}
				</Select>
			</div>

			{isOther && (
				<div className="travel-rule-modal__field">
					<div className="travel-rule-modal__label">
						<EditWrapper stringId="TRAVEL_RULE.SPECIFY">
							{STRINGS['TRAVEL_RULE.SPECIFY']}
						</EditWrapper>
					</div>
					<Input
						value={customPurpose}
						onChange={(e) => setCustomPurpose(e.target.value)}
						placeholder={STRINGS['TRAVEL_RULE.SPECIFY_PLACEHOLDER']}
						maxLength={256}
					/>
				</div>
			)}

			<div className="travel-rule-modal__actions d-flex">
				<Button
					className="travel-rule-modal__cancel"
					onClick={onCancel}
					disabled={loading}
				>
					<EditWrapper stringId="TRAVEL_RULE.CANCEL">
						{STRINGS['TRAVEL_RULE.CANCEL']}
					</EditWrapper>
				</Button>
				<Button
					type="primary"
					className="travel-rule-modal__submit"
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
					<EditWrapper stringId="TRAVEL_RULE.SUBMIT">
						{STRINGS['TRAVEL_RULE.SUBMIT']}
					</EditWrapper>
				</Button>
			</div>
		</div>
	);
};

export default TravelRuleModal;
