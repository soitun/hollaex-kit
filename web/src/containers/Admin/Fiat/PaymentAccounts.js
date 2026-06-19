import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal, Tooltip, message, Spin } from 'antd';
import {
	PlusOutlined,
	QuestionCircleOutlined,
	EditOutlined,
	UndoOutlined,
} from '@ant-design/icons';
import _get from 'lodash/get';

import { STATIC_ICONS } from 'config/icons';
import PaymentAccountPopup from './PaymentPopup';
import PaymentDetails from './PaymentDetails';
import { updateConstants } from '../General/action';
import { getConstants } from '../Settings/action';
import { upload } from 'actions/operatorActions';
import {
	DEFAULT_BANK_PAYMENT_ACCOUNTS,
	DEFAULT_CUSTOM_PAYMENT_CUSTOM,
	DEFAULT_PAYPAL_PAYMENT_PAYPAL,
	getPaymentPreset,
	getPaymentMethodIcon,
} from 'config/constants';
import { PaymentWay } from './PaymentWay';
import { constractPaymentOption } from 'utils/utils';
import { getOfframpTypes } from 'utils/wallet';

import './index.css';

const PaymentAccounts = ({
	router,
	isUpgrade,
	user_payments = {},
	paymentsMethodsData = [],
	setConfig = () => {},
	offramp = {},
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const [currentTab, setCurrentTab] = useState('payment');
	const [paymenttype, setPaymentType] = useState('initial');
	const [paymentSelect, setPaymentSelect] = useState('');
	const [payOption, setPayOption] = useState(true);
	const [isDisplayForm, setIsDisplayForm] = useState(true);
	const [formData, setFormData] = useState({});
	const [saveType, setSaveType] = useState('');
	const [bodyData, setBodyData] = useState({});
	const [bankInitialValues, setBankInitValue] = useState({});
	const [paypalInitialValues, setPaypalInitValue] = useState({});
	const [customInitialValues, setCustomInitValue] = useState({});
	const [formValues, setFormValues] = useState([]);
	const [currentPaymentType, setCurrentPaymentType] = useState('');
	const [isCustomPay, setIsCustomPay] = useState(false);
	const [isDisplayDetails, setIsDisplayDetails] = useState(false);
	const [selectedPlugin, setPlugin] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [defaultBankInitialValues, setDefaultBankInitValue] = useState({});
	const [defaultPaypalInitialValues, setDefaultPaypalInitValue] = useState({});
	const [defaultCustomInitialValues, setDefaultCustomInitValue] = useState({});
	const [currentType, setCurrentType] = useState('');
	const [paymentSavedCoins, setPaymentSavedCoins] = useState([]);
	const [paymentmethodLen, setPaymentmethodLen] = useState(0);
	const [paymentOrderBy, setPaymentOrderBy] = useState(0);

	const getCustomDefaultValues = (paymentType = '') => {
		let temp = {};
		DEFAULT_CUSTOM_PAYMENT_CUSTOM.forEach((item, index) => {
			const itemData = {
				...item,
				label: `${paymentType} ${item?.label}`,
				key: paymentType
					? `${paymentType?.toLowerCase()}_${item?.key}`
					: item?.key,
			};
			temp = {
				...temp,
				[`section_${index + 1}`]: itemData,
			};
		});
		return temp;
	};

	const generateDefaultInitValue = useCallback(() => {
		if (DEFAULT_BANK_PAYMENT_ACCOUNTS.length) {
			let temp = {};
			DEFAULT_BANK_PAYMENT_ACCOUNTS.forEach((item, index) => {
				temp = {
					...temp,
					[`section_${index + 1}`]: item,
				};
			});
			setDefaultBankInitValue(temp);
		}
		if (DEFAULT_PAYPAL_PAYMENT_PAYPAL.length) {
			let temp = {};
			DEFAULT_PAYPAL_PAYMENT_PAYPAL.forEach((item, index) => {
				temp = {
					...temp,
					[`section_${index + 1}`]: item,
				};
			});
			setDefaultPaypalInitValue(temp);
		}
		if (DEFAULT_CUSTOM_PAYMENT_CUSTOM.length) {
			const temp = getCustomDefaultValues();
			setDefaultCustomInitValue(temp);
		}
	}, []);

	const constructedData = (paymentType) => {
		const tempData =
			paymentsMethodsData.filter((item) => item.name === paymentType)[0]
				?.data || [];
		let temp = {};
		tempData.forEach((item, index) => {
			temp = {
				...temp,
				[`section_${index + 1}`]: item,
			};
		});
		return temp;
	};

	const generateFormFieldsValues = (type, paymentType, currentType) => {
		if (type === 'bankForm') {
			setBankInitValue(
				currentType === 'add'
					? defaultBankInitialValues
					: constructedData(paymentType)
			);
		} else if (type === 'paypalForm') {
			setPaypalInitValue(
				currentType === 'add'
					? defaultPaypalInitialValues
					: constructedData(paymentType)
			);
		} else if (type === 'customForm') {
			let test;
			if (currentType === 'add') {
				const preset = getPaymentPreset(paymentType);
				if (preset) {
					let temp = {};
					preset.data.forEach((item, index) => {
						temp = { ...temp, [`section_${index + 1}`]: item };
					});
					test = temp;
				} else {
					test = getCustomDefaultValues(paymentType);
				}
			} else {
				test = constructedData(paymentType);
			}
			setCustomInitValue(test);
		}
	};

	useEffect(() => {
		generateDefaultInitValue();
	}, [currentPaymentType, generateDefaultInitValue]);

	useEffect(() => {
		let tempBank = { ...bankInitialValues };
		let tempPaypal = { ...paypalInitialValues };
		let tempCustom = { ...customInitialValues };

		if (paymentsMethodsData.length) {
			setPaymentmethodLen(paymentsMethodsData.length);
			setPayOption(true);
			setIsDisplayForm(false);
			paymentsMethodsData.forEach((item) => {
				const tempArr = item?.data || [];
				tempArr.forEach((elem, index) => {
					if (item.name === 'bank') {
						tempBank = {
							...tempBank,
							[`section_${index + 1}`]: elem,
						};
					} else if (item.name === 'paypal') {
						tempPaypal = {
							...tempPaypal,
							[`section_${index + 1}`]: elem,
						};
					} else {
						tempCustom = {
							...tempCustom,
							[`section_${index + 1}`]: elem,
						};
					}
				});
			});
			setBankInitValue(tempBank);
			setPaypalInitValue(tempPaypal);
			setCustomInitValue(tempCustom);
			setFormValues(paymentsMethodsData);
			setPaymentSelect(paymentsMethodsData[0].name);
		}
		// TODO: Fix react-hooks/exhaustive-deps
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paymentsMethodsData]);

	const getConstantData = (type) => {
		getConstants()
			.then((res) => {
				if (_get(res, 'kit.user_payments')) {
					const tempData =
						constractPaymentOption(_get(res, 'kit.user_payments')) || [];
					setPaymentmethodLen(tempData.length);
					if (type === 'delete') {
						if (tempData.length === 0) {
							setIsDisplayForm(true);
							setPaymentType('initial');
							setFormValues([]);
							setBankInitValue({});
							setPaypalInitValue({});
							setCustomInitValue({});
							setIsDisplayDetails(false);
						} else {
							setPaymentMethod(tempData[0]?.name);
						}
					} else if (type === 'add') {
						setPaymentMethod(tempData[tempData.length - 1].name);
						setFormValues(tempData);
					}
				}
				setConfig(res && res.kit);
				setIsLoading(false);
			})
			.catch((error) => {
				const message = error.data ? error.data.message : error.message;
				setIsLoading(false);
				console.log('message', message);
			});
	};

	const handleClosePlugin = (val) => {
		setIsVisible(val);
		setCurrentTab('payment');
	};

	const updateConstantsData = (bodyData, type = '') => {
		setIsLoading(true);
		updateConstants(bodyData)
			.then((res) => {
				if (res) {
					getConstantData(type);
					message.success('Updated successfully');
				}
			})
			.catch((err) => {
				let error = err && err.data ? err.data.message : err.message;
				message.error(error);
			});
	};

	const handleSaveAndPublish = (val, payType, saveMethod) => {
		setIsLoading(true);
		setIsVisible(val);
		setPaymentType('paymentform');
		setSaveType(saveMethod);
		setIsDisplayDetails(false);
		updateConstantsData(bodyData, 'add');
	};

	const handleClose = (val, type = '', formData = {}) => {
		setIsVisible(val);
		setCurrentTab(type);
		setFormData(formData);
		let userPayment = {};
		let paymentAccData = [];
		Object.keys(formData).forEach((elem) => {
			const item = formData[elem];
			paymentAccData = [
				...paymentAccData,
				{
					key: item?.key,
					label: item?.label,
					required: item?.required,
				},
			];
		});
		userPayment = {
			kit: {
				user_payments: {
					...user_payments,
					[currentPaymentType]: {
						...user_payments[currentPaymentType],
						data: paymentAccData,
						orderBy: paymentOrderBy,
					},
				},
			},
		};
		setBodyData(userPayment);
	};

	const tabUpdate = (type, currentType) => {
		setCurrentTab(type);
		setCurrentType(currentType);
	};

	const formUpdate = (
		type,
		currentPaymentType,
		isCustomPay,
		curIndex,
		currentType = ''
	) => {
		setPaymentType(type);
		setIsDisplayForm(true);
		setCurrentPaymentType(currentPaymentType);
		setIsCustomPay(isCustomPay);
		setIsDisplayDetails(true);
		generateFormFieldsValues(type, currentPaymentType, currentType);
		if (currentType === 'add') {
			setPaymentOrderBy(paymentmethodLen + 1);
		} else {
			const inx = paymentsMethodsData.filter(
				(item) => item.name === currentPaymentType
			)[0]?.orderBy;
			setPaymentOrderBy(inx);
		}
		if (currentType) {
			setCurrentType(currentType);
		}
	};
	const onCancel = () => {
		setIsVisible(false);
		setCurrentTab('payment');
		setPaymentSavedCoins([]);
	};

	const handleSave = (val, selectedPlugin) => {
		setIsVisible(val);
		setCurrentTab('save');
		setPlugin(selectedPlugin);
	};
	const handleDel = (val, selectedPlugin) => {
		setIsVisible(val);
		setCurrentTab('delete');
		setPlugin(selectedPlugin);
	};
	const handleDelBank = (val, formData) => {
		setIsVisible(val);
		setCurrentTab('deletebank');
		setFormData(formData);
	};

	const handlePopupDel = (method) => {
		const bodyData = {};
		let orderBy = 1;
		paymentsMethodsData.forEach((item) => {
			if (item.name !== method) {
				bodyData[item.name] = {
					data: item.data,
					orderBy: orderBy,
					...(item.icon ? { icon: item.icon } : {}),
				};
				orderBy++;
			}
		});

		let deletedBodyData = {
			kit: { user_payments: bodyData },
		};

		let paymentSavedCoins = Object.keys(offramp).filter((item) => {
			if (getOfframpTypes(offramp[item]).includes(method)) {
				return item.name;
			}
			return null;
		});
		if (paymentSavedCoins && paymentSavedCoins.length > 0) {
			setPaymentSavedCoins(paymentSavedCoins);
		} else {
			updateConstantsData(deletedBodyData, 'delete');
			setIsVisible(false);
		}
	};

	const setPaymentMethod = (e) => {
		setPaymentSelect(e);
		setIsDisplayDetails(false);
		setIsDisplayForm(false);
	};

	const renderPaymentIcon = (item) =>
		getPaymentMethodIcon(
			item?.name,
			item?.icon,
			typeof item?.data === 'string'
		);

	// Uploads a custom icon for a payment account and persists it on the
	// account's config (user_payments[name].icon) so it shows everywhere the
	// payment method is rendered (admin & user side).
	const handleIconUpload = (item, file) => {
		if (!file) {
			return;
		}
		if (!file.type.startsWith('image/')) {
			message.error('Please select an image file');
			return;
		}
		setIsLoading(true);
		const formData = new FormData();
		const extension = file.name.split('.').pop();
		const name = `PAYMENT_ICON_${item.name}___${Date.now()}.${extension}`;
		formData.append('name', name);
		formData.append('file', file);
		upload(formData)
			.then(({ data: { path } }) => {
				updateConstantsData({
					kit: {
						user_payments: {
							...user_payments,
							[item.name]: {
								...user_payments[item.name],
								icon: path,
							},
						},
					},
				});
			})
			.catch((err) => {
				const error = err && err.data ? err.data.message : err.message;
				message.error(error);
				setIsLoading(false);
			});
	};

	// Clears a previously uploaded custom icon so the method falls back to its
	// default (bank / paypal / preset / generic) icon.
	const handleIconReset = (item) => {
		const updatedMethod = { ...user_payments[item.name] };
		delete updatedMethod.icon;
		updateConstantsData({
			kit: {
				user_payments: {
					...user_payments,
					[item.name]: updatedMethod,
				},
			},
		});
	};

	const handleBack = () => {
		setIsDisplayDetails(false);
		setIsDisplayForm(false);
		if (!user_payments || !Object.keys(user_payments).length) {
			setPaymentType('initial');
			setIsDisplayForm(true);
		}
	};

	return (
		<div className="payment-acc-wrapper">
			<div>
				<div className="d-flex justify-content-between">
					<div className="d-flex">
						<img
							src={STATIC_ICONS.DOUBLEFIAT_ICON}
							alt="pay-icon"
							className="pay-icon"
						/>
						<div>
							<div>
								A <b>payment account</b> is a reusable fiat payment method —
								such as a bank transfer or PayPal — that defines which details
								to collect (e.g. account holder, IBAN, email).
							</div>
							<div className="d-flex align-items-center">
								<div className="mr-3">
									Your users fill in these details from their account
									verification section.
								</div>
								<Tooltip
									overlayClassName="admin-general-description-tip general-description-tip-right"
									title={
										<img
											src={STATIC_ICONS.FIAT_PAYMENT_TOOLTIP}
											className="fiatpayhelp fiatpayhelpnote"
											alt="footer"
										/>
									}
									placement="right"
								>
									<QuestionCircleOutlined className="quesIcon" />
								</Tooltip>
							</div>
							<div className="mt-4">
								Once added, a payment account can be reused to set up fiat
								deposits (On-ramp) and withdrawals (Off-ramp).
							</div>
						</div>
					</div>
					<Button
						type="primary"
						className={!isUpgrade ? 'green-btn disableall' : 'green-btn'}
						onClick={() => handleClosePlugin(true)}
						disabled={isDisplayDetails || isLoading}
					>
						Add payment account
					</Button>
				</div>
				<div className="border-divider"></div>

				{!isUpgrade ? (
					<div className="d-flex mt-3 ml-4">
						<div className="d-flex align-items-center justify-content-between upgrade-section my-4">
							<div>
								<div className="font-weight-bold">
									Add fiat deposits & withdrawals
								</div>
								<div>Allow your users to send USD & other fiat</div>
							</div>
							<div className="ml-5 button-wrapper">
								<a
									href="https://dash.hollaex.com/billing"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Button type="primary" className="w-100">
										Upgrade Now
									</Button>
								</a>
							</div>
						</div>
					</div>
				) : null}

				<div className="onramp-payment-acc-wrapper">
					<div className={!isUpgrade ? 'disableall ' : ''}>
						{payOption && formValues.length ? (
							<div className="mt-4">
								<div>Payment accounts ({formValues.length} method saved)</div>
								<div className="payment-cards-wrapper mb-3 mt-2">
									{formValues.map((item, index) => {
										const isSelected = paymentSelect === item.name;
										return (
											<div
												className={
													isSelected
														? 'payment-card payment-card-selected'
														: 'payment-card'
												}
												key={index}
												onClick={() => setPaymentMethod(item.name)}
											>
												<div className="payment-card-icon-wrapper">
													<img
														src={renderPaymentIcon(item)}
														alt="pay-icon"
														className="payment-card-icon"
													/>
													<label
														className="payment-card-icon-edit"
														title="Upload custom icon"
														onClick={(e) => e.stopPropagation()}
													>
														<EditOutlined />
														<input
															type="file"
															accept="image/*"
															style={{ display: 'none' }}
															onChange={(e) => {
																handleIconUpload(item, e.target.files[0]);
																e.target.value = '';
															}}
														/>
													</label>
													{item?.icon ? (
														<span
															className="payment-card-icon-reset"
															title="Reset to default icon"
															onClick={(e) => {
																e.stopPropagation();
																handleIconReset(item);
															}}
														>
															<UndoOutlined />
														</span>
													) : null}
												</div>
												<div className="payment-card-title">
													User payment account {item.orderBy}
												</div>
												<div className="payment-card-name">{item.name}</div>
											</div>
										);
									})}
									<div
										className={
											!isUpgrade || isDisplayDetails || isLoading
												? 'payment-card payment-card-add disableall'
												: 'payment-card payment-card-add'
										}
										onClick={() => {
											if (isUpgrade && !isDisplayDetails && !isLoading) {
												handleClosePlugin(true);
											}
										}}
									>
										<PlusOutlined className="payment-card-plus" />
										<div className="payment-card-title">
											Add payment account
										</div>
									</div>
								</div>
							</div>
						) : null}
					</div>
					{isLoading ? (
						<div className="d-flex justify-content-center align-items-center">
							<Spin size="large" />
						</div>
					) : (
						<div className={!isUpgrade ? 'disableall' : ''}>
							{isDisplayForm ? (
								<PaymentWay
									paymenttype={paymenttype}
									handleClosePlugin={handleClosePlugin}
									handleSave={handleSave}
									handleDel={handleDel}
									isUpgrade={isUpgrade}
									handleDelBank={handleDelBank}
									paymentSelect={paymentSelect}
									handleClose={handleClose}
									saveType={saveType}
									formData={formData}
									router={router}
									formUpdate={formUpdate}
									currentActiveTab={'paymentAccounts'}
									bankInitialValues={bankInitialValues}
									paypalInitialValues={paypalInitialValues}
									customInitialValues={customInitialValues}
									currentPaymentType={currentPaymentType}
									isCustomPay={isCustomPay}
									currentIndex={paymentOrderBy}
									handleBack={handleBack}
									currentType={currentType}
									defaultBankInitialValues={defaultBankInitialValues}
									defaultPaypalInitialValues={defaultPaypalInitialValues}
									defaultCustomInitialValues={defaultCustomInitialValues}
									user_payments={user_payments}
								/>
							) : null}
							{payOption && !isDisplayDetails ? (
								<PaymentDetails
									type={paymentSelect}
									formUpdate={formUpdate}
									saveType={saveType}
									handleClose={handleClose}
									formData={formData}
									router={router}
									user_payments={user_payments}
									activeTab={'paymentAccounts'}
									paymentIndex={paymentOrderBy}
								/>
							) : null}
						</div>
					)}
				</div>
			</div>
			<Modal
				visible={isVisible}
				footer={null}
				width={500}
				onCancel={onCancel}
				className="fiat-popup-modal"
			>
				<PaymentAccountPopup
					handleClosePlugin={handleClosePlugin}
					type={currentTab}
					tabUpdate={tabUpdate}
					handlePopupDel={handlePopupDel}
					formData={formData}
					formUpdate={formUpdate}
					handleSaveAndPublish={handleSaveAndPublish}
					currentActiveTab={'paymentAccounts'}
					user_payments={user_payments}
					bodyData={bodyData}
					paymentSelectData={currentPaymentType}
					selectedPlugin={selectedPlugin}
					currentIndex={paymentOrderBy}
					paymentSavedCoins={paymentSavedCoins}
					setIsDisplayDetails={setIsDisplayDetails}
					offramp={offramp}
					isVisible={isVisible}
					setPaymentSavedCoins={setPaymentSavedCoins}
					handleBack={handleBack}
				/>
			</Modal>
		</div>
	);
};

export default PaymentAccounts;
