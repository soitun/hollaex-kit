import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Button, Form, Input } from 'antd';
import { Coin } from 'components';

const { Item } = Form;

const ValidateDismiss = ({
	validateData,
	statusType,
	onCancel,
	handleConfirm,
	coins,
}) => {
	const [isAutoFocus, setAutoFocus] = useState(false);
	const [type, setType] = useState('');
	const handleEdit = (type) => {
		setAutoFocus(!isAutoFocus);
		setType(type);
	};
	const transaction_id = useRef(null);
	const description = useRef(null);
	useEffect(() => {
		if (type === 'transaction_id') {
			transaction_id.current.focus();
		} else if (type === 'description') {
			description.current.focus();
		}
	}, [type, isAutoFocus]);

	const handleSubmit = (values) => {
		let formProps = {
			...validateData,
			description: values.description,
		};
		if (values?.transaction_id !== validateData?.transaction_id) {
			formProps = {
				...formProps,
				updated_transaction_id: values.transaction_id,
			};
		}
		if (statusType === 'block') {
			formProps = {
				...formProps,
				receiver_id: values.receiver_id,
			};
		}
		handleConfirm(formProps);
	};

	const titleMap = {
		validate: 'Validate',
		dismiss: 'Dismiss',
		retry: 'Retry',
		release: 'Release',
		block: 'Block',
		reject: 'Reject',
	};
	const descriptionMap = {
		dismiss: 'Dismissing this transaction will stop it from being processed.',
		validate: 'Validating this transaction will allow it to get processed.',
		release:
			'Releasing will take this transaction off hold so it gets processed automatically.',
		reject:
			'Rejecting will dismiss this withdrawal so it will not be processed.',
		block:
			'Blocking rejects this deposit for the original user (they receive nothing). The amount is instead credited to the user ID you enter below — tagged as "block", with no email sent — so you can redirect the funds (e.g. to return them to the sender).',
	};
	return (
		<Form
			name="validate-dismiss-form"
			initialValues={validateData}
			onFinish={handleSubmit}
			className="Validate-Dismiss-popup"
		>
			<div className="title">{titleMap[statusType] || 'Confirm'}</div>
			<div className="my-1">{descriptionMap[statusType] || null}</div>
			<div className="my-3">Please check and confirm the details below.</div>
			<span className="legend">Check & Confirm</span>
			<div className="confirm-container">
				<div className="mt-3">
					<span className="bold">Type:</span> {validateData.type}
				</div>
				<div className="mt-3">
					<span className="bold">Currency:</span> {validateData.currency}
				</div>
				<div className="mt-3">
					<span className="bold">Amount:</span> {validateData.amount}
				</div>
				{Number(validateData?.fee) > 0 && (
					<div className="mt-3 fees-wrapper">
						<span className="bold">Fee:</span>
						<span>{validateData?.fee}</span>
						{coins[validateData?.currency]?.icon_id && (
							<Coin
								iconId={coins[validateData?.currency]?.icon_id}
								type="CS4"
							/>
						)}
						<span>{validateData?.currency?.toUpperCase()} </span>
					</div>
				)}
			</div>
			{statusType === 'validate' || statusType === 'dismiss' ? (
				<div className="my-5">
					<div>Transaction ID</div>
					<Item name="transaction_id">
						<Input ref={transaction_id} />
					</Item>
					<div className="edit-link-wrapper">
						<div
							className="edit-link"
							onClick={() => handleEdit('transaction_id')}
						>
							Edit
						</div>
					</div>
					<div>Description</div>
					<Item name="description">
						<Input ref={description} />
					</Item>
					<div className="edit-link-wrapper">
						<div
							className="edit-link"
							onClick={() => handleEdit('description')}
						>
							Edit
						</div>
					</div>
				</div>
			) : (
				''
			)}
			{statusType === 'block' ? (
				<div className="my-5">
					<div>Recipient user ID</div>
					<Item
						name="receiver_id"
						rules={[
							{ required: true, message: 'Please enter a recipient user ID' },
						]}
					>
						<Input type="number" placeholder="User ID to credit" />
					</Item>
				</div>
			) : null}
			<div className="d-flex align-items-center mt-4">
				<Button type="ghost" className="f-1" onClick={onCancel}>
					Back
				</Button>
				<Button type="primary" htmlType="submit" className="green-btn f-1 ml-2">
					Confirm
				</Button>
			</div>
		</Form>
	);
};

const mapStateToProps = (state) => ({
	coins: state.app.coins,
});

export default connect(mapStateToProps)(ValidateDismiss);
