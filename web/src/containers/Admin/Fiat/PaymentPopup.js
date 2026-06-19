import React, { useState, useEffect } from 'react';
import {
	CaretDownOutlined,
	CaretUpOutlined,
	InfoCircleOutlined,
	QuestionCircleOutlined,
	SearchOutlined,
} from '@ant-design/icons';
import { Button, Tooltip, Select, Input, Radio } from 'antd';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import { STATIC_ICONS } from 'config/icons';
import { constractPaymentOption } from 'utils/utils';
import { getOfframpTypes } from 'utils/wallet';
import { DEFAULT_PAYMENT_PRESETS, getPaymentPreset } from 'config/constants';

import './index.css';
import '../Trades/index.css';

const { Option } = Select;

const PaymentAccountPopup = ({
	handleClosePlugin,
	appCoins = {},
	type,
	tabUpdate,
	updatePlugin,
	handlePopupSave,
	handlePopupDel,
	formData = {},
	formUpdate,
	handleSaveAndPublish,
	selectOffField,
	coins,
	coinSymbol,
	activeTab,
	user_payments = {},
	bodyData = {},
	fiatCoins,
	selectedAsset,
	showCoins,
	handleSelectCoin,
	paymentSelectData,
	currentActiveTab = '',
	handleOffRampProceed,
	selectedPlugin = '',
	currentIndex = 0,
	singleCoin = {},
	offramp = {},
	showSelect,
	selectedPaymentType = '',
	isPayChanged = false,
	setIsPayChanged,
	paymentSavedCoins = [],
	setCurrentOfframpIndex = () => {},
	isVisible = false,
	setPaymentSavedCoins = () => {},
	handleBack = () => {},
	paymentMethodItems = {},
}) => {
	const [plugin, setPlugin] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [paymentSelect, setPaymentSelect] = useState(
		!selectedPaymentType &&
			currentActiveTab &&
			currentActiveTab === 'paymentAccounts'
			? 'bank'
			: selectedPaymentType
	);
	const [isMulti, setIsMutli] = useState(false);
	const [selectedCoin, setSelectedCoin] = useState(singleCoin);
	const [errorMsg, setErrorMsg] = useState('');
	const [existErrorMsg, setExistErrorMsg] = useState('');
	const [paymentOptions, setPaymentOptions] = useState([]);
	const [paymentCount, setPaymentCount] = useState([]);
	const [search, setSearch] = useState('');
	const [PaymentMethodData, setPaymentMethodData] = useState([
		constractPaymentOption(paymentMethodItems),
	]);

	useEffect(() => {
		if (currentActiveTab && currentActiveTab === 'onRamp') {
			let tempData = constractPaymentOption(paymentMethodItems) || [];
			if (
				currentActiveTab &&
				currentActiveTab === 'onRamp' &&
				selectedPaymentType !== null &&
				!paymentSelect !== null
			) {
				setPaymentSelect(tempData[0].name);
			} else {
				setPaymentSelect(
					selectedPaymentType || Object.keys(user_payments)?.[0]
				);
			}
		}
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		if (currentActiveTab === 'offRamp') {
			setPaymentSelect(selectedPaymentType);
		}
		let tempArr = Object.keys(user_payments).filter((item, i) => {
			if (!getOfframpTypes(offramp[singleCoin.symbol]).includes(item)) {
				return item;
			} else {
				return null;
			}
		});
		setPaymentCount(tempArr);
		// eslint-disable-next-line
	}, [selectedPaymentType]);

	useEffect(() => {
		if (!isVisible) {
			setExistErrorMsg('');
			setErrorMsg('');
			if (currentActiveTab && currentActiveTab !== 'onRamp') {
				setPaymentSelect(
					!selectedPaymentType &&
						currentActiveTab &&
						currentActiveTab === 'paymentAccounts'
						? 'bank'
						: selectedPaymentType
				);
			}
		}
	}, [isVisible, currentActiveTab, selectedPaymentType]);

	useEffect(() => {
		const paymentsData = constractPaymentOption(paymentMethodItems);
		setPaymentMethodData(paymentsData);
		if (currentActiveTab && currentActiveTab === 'onRamp') {
			const tempArr = Object.keys(user_payments);
			let temp = [];
			if (tempArr.length > 0) {
				paymentsData.forEach((item) => {
					if (!tempArr.includes(item.name)) {
						temp.push(item);
					}
				});
			} else {
				temp = paymentsData;
			}
			setPaymentOptions(temp);
			if (temp.length > 0) {
				setPaymentSelect(temp[0].name);
			}
		}
		// eslint-disable-next-line
	}, [user_payments, paymentMethodItems]);

	let userPayment = Object.keys(formData).length
		? bodyData?.kit?.user_payments?.[paymentSelectData]
		: user_payments[paymentSelectData];
	if (currentActiveTab && currentActiveTab === 'onRamp') {
		let constructedData =
			bodyData?.kit?.onramp[coinSymbol][paymentSelectData]?.data[0];
		let temp = [];
		if (constructedData) {
			constructedData.forEach((item) => {
				temp = [...temp, item];
			});
		}
		userPayment = {
			data: temp,
		};
	}
	if (currentActiveTab && currentActiveTab === 'offRamp') {
		userPayment = user_payments[paymentSelect];
	}

	useEffect(() => {
		if (selectOffField && selectOffField.length) {
			setIsMutli(true);
		}
	}, [selectOffField]);

	const handleCoinChange = (val, type) => {
		if (val) {
			const filterData = coins.filter((item) => item.symbol === val)[0];
			setSelectedCoin(filterData);
		}
		setPaymentSelect(selectedPaymentType);
		handleSelectCoin(val, type);
		setIsPayChanged(true);
	};

	const getCoinLogo = (symbol) => {
		const coin = appCoins?.[symbol];
		if (coin && coin.logo) {
			return coin.logo;
		} else if (STATIC_ICONS.COIN_ICONS[(symbol || '').toLowerCase()]) {
			return STATIC_ICONS.COIN_ICONS[(symbol || '').toLowerCase()];
		}
		return STATIC_ICONS.MISSING_ICON;
	};

	const renderSelect = (type) => {
		return (
			<div className="mt-4 d-flex align-items-center">
				<div className="mr-3">Fiat coins:</div>
				<div className="coinSelect">
					<Select
						onChange={(e) => handleCoinChange(e, type)}
						size="small"
						value={
							selectedAsset ? selectedAsset : fiatCoins && fiatCoins[0]?.symbol
						}
						className="mb-2"
					>
						{fiatCoins.map((option, index) => (
							<Select.Option value={option.symbol} key={index}>
								<div className="d-flex align-items-center mt-1 summary-coin">
									<img
										src={getCoinLogo(option?.symbol)}
										alt=""
										className="fiat-coin-option-icon"
									/>
									<div className="ml-2">{option?.symbol}</div>
								</div>
							</Select.Option>
						))}
					</Select>
				</div>
			</div>
		);
	};

	const handleNext = () => {
		updatePlugin(plugin);
		handleClosePlugin(false);
		formUpdate('plugin', plugin, false, null, 'add');
	};

	const handleOpenPayment = () => {
		setIsOpen(!isOpen);
	};

	const handleChange = (e) => {
		setPaymentSelect(e);
		setExistErrorMsg('');
		if (currentActiveTab && currentActiveTab === 'offRamp') {
			setIsPayChanged(true);
		}
	};
	const handleCustomSelect = () => {
		if (Object.keys(user_payments).includes(plugin)) {
			setErrorMsg('This payment is already exist');
		} else {
			handleClosePlugin(false);
			formUpdate(
				'customForm',
				plugin,
				true,
				currentIndex === 0 ? currentIndex + 1 : currentIndex,
				'add'
			);
		}
	};

	const handleAddCustom = () => {
		setPaymentSelect('customPay');
		tabUpdate('sysname', 'add');
	};

	const handleProceed = () => {
		if (
			user_payments &&
			Object.keys(user_payments).length &&
			Object.keys(user_payments).includes(paymentSelect)
		) {
			setExistErrorMsg(
				`You have already created the payment by using ${paymentSelect} method`
			);
		} else {
			if (paymentSelect === 'bank') {
				handleClosePlugin(false);
				formUpdate(
					'bankForm',
					paymentSelect,
					false,
					currentIndex === 0 ? currentIndex + 1 : currentIndex,
					'add'
				);
			} else if (paymentSelect === 'paypal') {
				handleClosePlugin(false);
				formUpdate(
					'paypalForm',
					paymentSelect,
					false,
					currentIndex === 0 ? currentIndex + 1 : currentIndex,
					'add'
				);
			} else if (paymentSelect === 'customPay') {
				tabUpdate('sysname', 'add');
			} else if (getPaymentPreset(paymentSelect)) {
				handleClosePlugin(false);
				formUpdate(
					'customForm',
					paymentSelect,
					true,
					currentIndex === 0 ? currentIndex + 1 : currentIndex,
					'add'
				);
			} else if (
				currentActiveTab &&
				currentActiveTab === 'onRamp' &&
				!['bank', 'paypal', 'customPay'].includes(paymentSelect)
			) {
				handleClosePlugin(false);
				formUpdate(
					'customForm',
					paymentSelect,
					false,
					currentIndex === 0 ? currentIndex + 1 : currentIndex,
					'add'
				);
			}
		}
	};

	const handleCloseOnramp = () => {
		setIsMutli(false);
		handleClosePlugin(false);
		setIsPayChanged(false);
	};

	const handleUpdatePlugin = (val) => {
		let value = val.trim();
		if (value && value !== plugin) {
			setPlugin(value);
		} else {
			setPlugin('');
		}
		setErrorMsg('');
	};

	const handleOffRampDataProceed = (type, paymentSelect, symbol) => {
		if (!isPayChanged) {
			setPaymentSelect(selectedPaymentType);
		}
		handleOffRampProceed(type, paymentSelect, symbol);
		if (
			singleCoin &&
			singleCoin.symbol &&
			offramp &&
			offramp[singleCoin.symbol]
		) {
			const offrampCount = getOfframpTypes(offramp[singleCoin.symbol]).length;
			setCurrentOfframpIndex(offrampCount ? offrampCount + 1 : 1);
		}
	};

	const checkOptionExist = (optValue) => {
		if (activeTab === 'onRamp') {
			return (
				!Object.keys(paymentMethodItems).includes(optValue) &&
				!Object.keys(user_payments).includes(optValue)
			);
		}
		return true;
	};

	const handleAccountBack = () => {
		if (currentActiveTab && currentActiveTab === 'onRamp') {
			tabUpdate('onramp', showCoins ? true : false);
		} else {
			tabUpdate('payment');
		}
		setExistErrorMsg('');
		if (currentActiveTab && currentActiveTab !== 'onRamp') {
			setPaymentSelect(
				!selectedPaymentType &&
					currentActiveTab &&
					currentActiveTab === 'paymentAccounts'
					? 'bank'
					: selectedPaymentType
			);
		}
	};

	const handleLink = () => {
		handleClosePlugin(false);
		setPaymentSavedCoins([]);
		handleBack();
	};

	const onClickBack = () => {
		setErrorMsg('');
		tabUpdate('account');
	};

	const currentSelectedPay =
		currentActiveTab && currentActiveTab === 'offRamp'
			? paymentSelect
			: paymentSelectData;

	const paypalOption = {
		value: 'paypal',
		label: 'PayPal',
		icon: STATIC_ICONS.PAYPAL_FIAT_ICON,
		region: 'Global',
	};
	const getPaymentMethodIcon = (name) => {
		if (name === 'bank') {
			return STATIC_ICONS.BANK_FIAT_PILLARS;
		} else if (name === 'paypal') {
			return STATIC_ICONS.PAYPAL_FIAT_ICON;
		}
		const preset = getPaymentPreset(name);
		if (preset) {
			return preset.icon;
		}
		return STATIC_ICONS.MPESA_ICON;
	};

	const presetAccountOptions = DEFAULT_PAYMENT_PRESETS.map((preset) => ({
		value: preset.name,
		label: preset.name,
		icon: preset.icon,
		region: preset.region,
	}));
	// Show bank options first, then PayPal, then the rest. The custom option is
	// presented separately below the list (not part of this list).
	const bankPresetOptions = presetAccountOptions.filter((opt) =>
		opt.value.startsWith('Bank')
	);
	const otherPresetOptions = presetAccountOptions.filter(
		(opt) => !opt.value.startsWith('Bank')
	);
	const accountOptionsList = [
		...bankPresetOptions,
		paypalOption,
		...otherPresetOptions,
	].filter((opt) => checkOptionExist(opt.value));
	const filteredAccountOptions = accountOptionsList.filter((opt) => {
		const query = search.trim().toLowerCase();
		if (!query) return true;
		return (
			opt.label.toLowerCase().includes(query) ||
			(opt.region || '').toLowerCase().includes(query)
		);
	});

	switch (type) {
		case 'payment':
			return (
				<div className="payment-modal-wrapper">
					<h3>Add a payment account</h3>
					<div className="d-flex align-items-start mt-4">
						<img
							src={STATIC_ICONS.DOLLAR_GEAR}
							alt="add-pay-icon"
							className="add-pay-icon"
						/>
						<div>
							Add a manual payment account by simply adding the payment details
							of the system. These details will be displayed to your users in
							their verification page and can be used for fiat withdrawals.
						</div>
					</div>
					<div className="button-wrapper mt-4">
						<Button
							type="primary"
							className="green-btn"
							onClick={() => handleClosePlugin(false)}
						>
							Back
						</Button>
						<Button
							type="primary"
							className="green-btn"
							onClick={() => tabUpdate('account')}
						>
							Proceed
						</Button>
					</div>
				</div>
			);
		case 'account':
			let imgSrc = STATIC_ICONS.FIAT_PAYMENT_TOOLTIP;
			if (activeTab === 'onRamp') {
				imgSrc = STATIC_ICONS.FIAT_ONRAMP_TOOLTIP;
			} else if (activeTab === 'offRamp') {
				imgSrc = STATIC_ICONS.FIAT_OFFRAMP_TOOLTIP;
			}
			return (
				<div className="payment-modal-wrapper">
					<div className="d-flex align-items-center ">
						<img
							src={STATIC_ICONS.DOLLAR_GEAR}
							alt="add-pay-icon"
							className="add-pay-icon2 mr-3"
						/>
						<h3 className="payhead">
							{currentActiveTab && currentActiveTab === 'onRamp'
								? 'On-ramp'
								: 'Payment account'}{' '}
							information
						</h3>
					</div>
					{currentActiveTab && currentActiveTab === 'onRamp' ? (
						<div>
							Select what on-ramp payment system you'd like to add information
							for. This will then be viewed by your users for the fiat deposit
							purposes.
						</div>
					) : (
						<div>
							Select what type of payment account information you'd like to add.
							This will be used for the purpose of verification. This
							information can also be used in the off ramp section.
						</div>
					)}
					{currentActiveTab === 'onRamp' ? (
						<div className="payment-preset-search mt-3">
							<div className="mb-2">
								Select from saved payment accounts ({paymentOptions.length}):
							</div>
							{paymentOptions.length ? (
								<Radio.Group
									name="onramp-saved"
									className="payment-preset-list"
									value={paymentSelect}
									onChange={(e) => handleChange(e.target.value, 'standard')}
								>
									{paymentOptions.map((item, index) => (
										<Radio
											className="payment-preset-item"
											value={item.name}
											key={item.name}
										>
											<span className="payment-preset-item-content">
												<img
													src={getPaymentMethodIcon(item.name)}
													alt={item.name}
													className="payment-preset-item-icon"
												/>
												<span className="payment-preset-item-text">
													<span className="payment-preset-item-label">
														{item.name}
													</span>
												</span>
											</span>
										</Radio>
									))}
								</Radio.Group>
							) : (
								<div className="payment-preset-empty">
									No saved payment accounts available to add.
								</div>
							)}
							<div className="mt-3">
								<Link
									to="/admin/fiat?tab=1"
									className="anchor underline"
									onClick={() => handleClosePlugin(false)}
								>
									+ Add a new payment account
								</Link>
							</div>
						</div>
					) : (
						<div className="payment-preset-search mt-3">
							<Input
								className="payment-preset-search-input"
								placeholder="Search payment methods..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								prefix={<SearchOutlined />}
								allowClear
							/>
							<Radio.Group
								name="standard"
								className="payment-preset-list"
								value={paymentSelect}
								onChange={(e) => {
									handleChange(e.target.value, 'standard');
								}}
							>
								{filteredAccountOptions.length ? (
									filteredAccountOptions.map((opt) => (
										<Radio
											className="payment-preset-item"
											value={opt.value}
											key={opt.value}
										>
											<span className="payment-preset-item-content">
												<img
													src={opt.icon}
													alt={opt.label}
													className="payment-preset-item-icon"
												/>
												<span className="payment-preset-item-text">
													<span className="payment-preset-item-label">
														{opt.label}
													</span>
													{opt.region ? (
														<span className="payment-preset-item-region">
															{opt.region}
														</span>
													) : null}
												</span>
											</span>
										</Radio>
									))
								) : (
									<div className="payment-preset-empty">
										No matching payment methods
									</div>
								)}
							</Radio.Group>
							<div className="payment-preset-custom">
								Don't see your payment method?{' '}
								<span className="txtanchor" onClick={handleAddCustom}>
									Add a custom method
								</span>
							</div>
						</div>
					)}
					<div className="d-flex mt-3 align-items-center">
						<div>
							Note: this will be displayed to your users within the verification
							section.
						</div>
						<Tooltip
							overlayClassName="admin-general-description-tip general-description-tip-right "
							title={
								<img
									src={imgSrc}
									className={
										activeTab !== 'onRamp'
											? 'fiatpayhelp fiatpayhelpnote'
											: 'fiatpayhelp fiatonramppop'
									}
									alt="footer"
								/>
							}
							placement="right"
						>
							<QuestionCircleOutlined className="quesIcon" />
						</Tooltip>
					</div>
					{existErrorMsg ? (
						<div className="error-text">{existErrorMsg}</div>
					) : null}
					<div className="button-wrapper mt-4">
						<Button
							type="primary"
							className="green-btn"
							onClick={handleAccountBack}
						>
							Back
						</Button>
						<Button
							type="primary"
							className="green-btn"
							onClick={() => handleProceed()}
							disabled={
								currentActiveTab === 'onRamp' &&
								(!paymentOptions.length || !paymentSelect)
							}
						>
							Proceed
						</Button>
					</div>
				</div>
			);
		case 'sysname':
			return (
				<div className="payment-modal-wrapper">
					{paymentSelect === 'customPay' ? (
						<>
							<h3 className="syshead">Payment system name</h3>
							<div className="mt-3 mb-5">
								Please name the payment system. This will be displayed to the
								user and should be a recognizable system.
							</div>
							<div className="mb-3">
								<b>
									{currentActiveTab && currentActiveTab === 'paymentAccounts'
										? 'Payment system name'
										: 'Custom on-ramp system name'}
								</b>
							</div>
						</>
					) : (
						<>
							<div className="d-flex align-items-center">
								<img
									src={STATIC_ICONS.FIAT_PLUGIN}
									alt="add-pay-icon"
									className="add-pay-icon2 mb-4 mr-2"
								/>
								<div>
									<h3 className="syshead">On-ramp system name</h3>
									<p className="plugintxt">
										Please name the plugin on-ramp payment system.
									</p>
								</div>
							</div>
							<div className="mb-3">
								<b>Plugin on-ramp system name</b>
							</div>
						</>
					)}
					<Input
						placeholder="Enter your system name"
						id="sysname"
						onChange={(e) => handleUpdatePlugin(e.target.value)}
						className="mb-4"
					/>
					{paymentSelect !== 'customPay' && (
						<>
							<div className="plugintxt">
								Plugins will require that you get in touch with
							</div>
							<div className="plugintxt txtanchor">support@hollaex.com</div>
						</>
					)}
					{errorMsg ? <div className="error-text">{errorMsg}</div> : null}
					<div className="button-wrapper mt-5">
						<Button type="primary" className="green-btn" onClick={onClickBack}>
							Back
						</Button>
						<Button
							type="primary"
							className="green-btn"
							disabled={!plugin || errorMsg}
							onClick={
								paymentSelect !== 'customPay' ? handleNext : handleCustomSelect
							}
						>
							NEXT
						</Button>
					</div>
				</div>
			);
		case 'save':
			return (
				<div className="payment-modal-wrapper">
					<h3>Save</h3>
					<div>
						Please check that the plugin on-ramp details below are correct.
					</div>
					<div className="d-flex mt-5 mb-5 ml-1">
						<img
							src={STATIC_ICONS.FIAT_PLUGIN}
							alt="pay-icon"
							className="pay-icon"
						/>
						<div className="d-flex flex-column ml-3">
							<span>On-ramp 1</span>
							<span>
								<b>{plugin || selectedPlugin}</b>
							</span>
							<span>
								<b className="mr-1">Plugin:</b> True
							</span>
						</div>
					</div>
					<div>
						This on-ramp is marked as a <b>'plugin'</b> based system.
					</div>
					<div className="mb-5">
						Plugins require that you get in touch with{' '}
						<span className="txtanchor">support@hollaex.com</span>
					</div>
					<div className="button-wrapper">
						<Button
							type="primary"
							className="green-btn nxtbtn "
							onClick={() => handlePopupSave()}
						>
							Save
						</Button>
					</div>
				</div>
			);
		case 'delete':
			return (
				<div className="payment-modal-wrapper">
					<h3>Delete payment account</h3>
					<div className="d-flex mt-4 mb-4 ml-1">
						<img
							src={STATIC_ICONS.FIAT_PLUGIN}
							alt="pay-icon"
							className="pay-icon"
						/>
						<div className="d-flex flex-column ml-3">
							<span>
								<b>{plugin || selectedPlugin}</b>
							</span>
							<span>
								<b className="mr-1">Plugin:</b> True
							</span>
						</div>
					</div>
					<div className="mb-5">
						Are you sure you want to delete the payment account?
					</div>
					<div className="button-wrapper">
						<Button
							type="primary"
							className="green-btn nxtbtn "
							onClick={() => handlePopupDel(plugin || selectedPlugin)}
						>
							Proceed
						</Button>
					</div>
				</div>
			);
		case 'offramp':
			const userPaymentOptions = PaymentMethodData.filter(
				(item) =>
					!getOfframpTypes(offramp[singleCoin.symbol]).includes(item.name)
			);

			return (
				<div className="payment-modal-wrapper">
					<div className="d-flex align-items-center">
						<img
							src={STATIC_ICONS.OFFRAMP_DOLLAR_ICON}
							alt="add-pay-icon"
							className="add-pay-icon2 mr-2"
						/>
						<div>
							<h3 className="syshead">Add off-ramp</h3>
						</div>
					</div>
					<div className="mb-5 mt-2">
						Add an off-ramp to{' '}
						{selectedCoin?.fullname || fiatCoins[0]?.fullname} (
						{selectedCoin?.symbol?.toUpperCase() ||
							fiatCoins[0]?.symbol?.toUpperCase()}
						) so that you users can withdraw. Off-ramps require a Payment
						Account.
					</div>

					{showSelect && <span>{renderSelect('deposit')}</span>}
					{isMulti || PaymentMethodData.length ? (
						<div>
							{!offramp?.[singleCoin.symbol] ||
							(PaymentMethodData.length !==
								getOfframpTypes(offramp?.[singleCoin.symbol]).length &&
								selectedPaymentType) ? (
								<div>
									<div>
										Select from premade Payment Accounts (
										{paymentCount.length ? paymentCount.length : null}
										):
									</div>
									<div>
										<Select
											className="paymentSelect"
											defaultValue={paymentSelect}
											value={paymentSelect}
											suffixIcon={
												isOpen ? (
													<CaretDownOutlined className="downarrow" />
												) : (
													<CaretUpOutlined className="downarrow" />
												)
											}
											onClick={handleOpenPayment}
											onChange={handleChange}
										>
											{userPaymentOptions.map((item, i) => {
												return (
													<Option value={item.name} key={i}>
														<span className="d-flex align-items-center">
															<img
																src={getPaymentMethodIcon(item.name)}
																alt=""
																className="payment-option-icon mr-2"
															/>
															{item.name}
														</span>
													</Option>
												);
											})}
										</Select>
									</div>
								</div>
							) : (
								<div className="warning-text">
									You have already saved all of the Payment Accounts
								</div>
							)}
						</div>
					) : showCoins ? (
						<span>{renderSelect('deposit')}</span>
					) : (
						<div>
							<div>Select from premade Payment Accounts</div>
							<div className="noticepad">
								<InfoCircleOutlined className="infoStyle mr-4" />
								<div>
									We've noticed that there hasn't been any Payment Accounts
									added yet. To start it is recommended to{' '}
									<Link to="/admin/fiat?tab=1" className="underline">
										add a Payment Account
									</Link>
									.
								</div>
							</div>
						</div>
					)}
					<div className="notepad">
						<div>
							Note: this will be displayed as a withdrawal option to your users
							in their wallet fiat asset pages.
						</div>
						<Tooltip
							overlayClassName="admin-general-description-tip general-description-tip-right "
							title={
								<img
									src={
										activeTab === 'onRamp'
											? STATIC_ICONS.FIAT_ONRAMP_TOOLTIP
											: STATIC_ICONS.FIAT_OFFRAMP_TOOLTIP
									}
									className="fiatpayhelp fiatonramppop"
									alt="footer"
								/>
							}
							placement="right"
						>
							<QuestionCircleOutlined className="quesIcon" />
						</Tooltip>
					</div>
					<div className="button-wrapper mt-3">
						<Button
							type="primary"
							className="green-btn"
							onClick={handleCloseOnramp}
						>
							Back
						</Button>
						<Button
							type="primary"
							className="green-btn"
							onClick={
								currentActiveTab === 'offRamp'
									? () =>
											handleOffRampDataProceed(
												'savePayment',
												paymentSelect,
												singleCoin.symbol
											)
									: () => handleProceed()
							}
							disabled={
								!user_payments ||
								!Object.keys(user_payments).length ||
								(Object.keys(user_payments)?.length ===
									getOfframpTypes(offramp?.[singleCoin.symbol]).length &&
									selectedPaymentType)
							}
						>
							Proceed
						</Button>
					</div>
				</div>
			);
		case 'onramp':
			return (
				<div className="payment-modal-wrapper">
					<h3>Add an on-ramp</h3>
					<div className="d-flex align-items-start mt-4">
						<img
							src={STATIC_ICONS.ONRAMP_DOLLAR_ICON}
							alt="add-pay-icon"
							className="add-pay-icon"
						/>
						<div>
							Add an on-ramp by simply adding the details of the payment system.
							These details will be displayed to your users in their fiat
							deposit page which then can be used making deposits.
						</div>
					</div>
					{showCoins ? <span>{renderSelect('deposit')}</span> : null}
					<div className="button-wrapper mt-4">
						<Button
							type="primary"
							className="green-btn"
							onClick={() => handleClosePlugin(false)}
						>
							Back
						</Button>
						<Button
							type="primary"
							className="green-btn"
							onClick={() => tabUpdate('account', showCoins ? true : false)}
						>
							Proceed
						</Button>
					</div>
					<div className="mt-4 text-align-center small-txt">
						<div>
							Do you have programmatic access (APIs) to payment system or plan
							on getting one?
						</div>
						<div onClick={() => tabUpdate('sysname')}>
							Try <span className="anchor">adding a plugin</span>.
						</div>
					</div>
				</div>
			);
		case 'deletebank':
			return (
				<div className="payment-modal-wrapper">
					{currentActiveTab && currentActiveTab === 'onRamp' ? (
						<h3>Delete on-ramp</h3>
					) : currentActiveTab && currentActiveTab === 'offRamp' ? (
						<h3>Delete off-ramp</h3>
					) : (
						<h3>Delete payment account</h3>
					)}
					<div className="d-flex align-items-start mt-4">
						<img
							src={
								paymentSelectData === 'bank'
									? STATIC_ICONS.BANK_FIAT_PILLARS
									: paymentSelectData === 'paypal'
									? STATIC_ICONS.PAYPAL_FIAT_ICON
									: STATIC_ICONS.MPESA_ICON
							}
							alt="add-pay-icon"
							className="add-pay-icon"
						/>
						<div>
							{currentActiveTab && currentActiveTab === 'onRamp' ? (
								<div>On-ramp {currentIndex}</div>
							) : currentActiveTab && currentActiveTab === 'offRamp' ? (
								<div>off-ramp {currentIndex}</div>
							) : (
								<div>User payment account {currentIndex}</div>
							)}
							<b>
								{paymentSelectData === 'bank'
									? 'Bank'
									: paymentSelectData === 'paypal'
									? 'Paypal'
									: paymentSelectData}
							</b>
						</div>
					</div>
					<div className="mt-5 mb-5">
						Are you sure you want to delete the{' '}
						{currentActiveTab && currentActiveTab === 'onRamp'
							? 'on-ramp'
							: currentActiveTab && currentActiveTab === 'offRamp'
							? 'off-ramp'
							: 'payment'}{' '}
						account?
					</div>
					{paymentSavedCoins && paymentSavedCoins.length > 0 && (
						<>
							<div className="delete-warning">
								This payment method has offramp for the
								{paymentSavedCoins.map((item) => (
									<span> {item?.toUpperCase()}, </span>
								))}{' '}
								coins. So, please delete that from off-ramp first.
							</div>
							<div onClick={handleLink} className="go-to-offramp-text">
								<Link to="/admin/fiat?tab=3" className="underline">
									Go to off-ramp
								</Link>
							</div>
						</>
					)}
					<div className="button-wrapper">
						<Button
							type="primary"
							className="green-btn w-100"
							onClick={() => handlePopupDel(paymentSelectData)}
							disabled={
								paymentSavedCoins && paymentSavedCoins.length > 0 ? true : false
							}
						>
							Proceed
						</Button>
					</div>
				</div>
			);
		case 'savePayment':
			return (
				<div className="payment-modal-wrapper">
					<h3>Save and publish</h3>
					<div>
						Please check that the{' '}
						{currentActiveTab === 'offRamp'
							? 'off-ramp'
							: currentActiveTab === 'onRamp'
							? 'on-ramp'
							: 'payment'}{' '}
						details below are correct. This
					</div>
					<div>
						information will be displayed live in the{' '}
						{currentActiveTab === 'offRamp'
							? 'fiat withdrawal'
							: currentActiveTab === 'onRamp'
							? 'fiat deposit'
							: 'verification'}{' '}
						page for your
					</div>
					<div>
						users {currentActiveTab !== 'paymentAccounts' ? '' : 'to fill in'}{' '}
						after clicking 'Save and publish'. To save without
					</div>
					<div>publishing simply click 'Save.</div>
					<div className="d-flex align-items-start mt-4">
						<img
							src={
								currentSelectedPay === 'bank'
									? STATIC_ICONS.BANK_FIAT_PILLARS
									: currentSelectedPay === 'paypal'
									? STATIC_ICONS.PAYPAL_FIAT_ICON
									: STATIC_ICONS.MPESA_ICON
							}
							alt="add-pay-icon"
							className="add-pay-icon"
						/>
						<div>
							{currentActiveTab && currentActiveTab === 'onRamp' ? (
								<div>On-ramp {currentIndex}</div>
							) : currentActiveTab && currentActiveTab === 'offRamp' ? (
								<div>off-ramp {currentIndex}</div>
							) : (
								<div>User payment account {currentIndex}</div>
							)}
							<b>
								{currentSelectedPay === 'bank'
									? 'Bank'
									: currentSelectedPay === 'paypal'
									? 'Paypal'
									: currentSelectedPay}
							</b>
						</div>
					</div>
					<div className="mt-4">
						{userPayment?.data?.filter((item) => item.required).length ? (
							<div>REQUIRED</div>
						) : null}
						{userPayment?.data?.map((item, index) => {
							if (item?.required) {
								return (
									<div className="details-wrapper" key={index}>
										<div className="d-flex justify-content-between">
											<b>{item?.label}:</b>
											{item?.value ? (
												<div>{item?.value}</div>
											) : (
												<div className="disable-txt">(user input)</div>
											)}
										</div>
									</div>
								);
							} else {
								return null;
							}
						})}
					</div>
					<div className="mt-4">
						{userPayment?.data?.filter((item) => !item.required).length ? (
							<div>OPTIONAL</div>
						) : null}
						{userPayment?.data?.map((item, index) => {
							if (!item?.required) {
								return (
									<div className="details-wrapper" key={index}>
										<div className="d-flex justify-content-between">
											<div>
												<b>{item?.label}:</b> <div>(optional)</div>
											</div>
											{item?.value ? (
												<div>{item?.value}</div>
											) : (
												<div className="disable-txt">(user input)</div>
											)}
										</div>
									</div>
								);
							} else {
								return null;
							}
						})}
					</div>
					<div className="button-wrapper mt-4">
						<Button
							type="primary"
							className="green-btn"
							onClick={() => handleSaveAndPublish(false, paymentSelect, 'save')}
							disabled={true}
						>
							Save
						</Button>
						<Button
							type="primary"
							className="green-btn"
							onClick={() =>
								handleSaveAndPublish(false, paymentSelect, 'saveAndPub')
							}
						>
							Save & publish
						</Button>
					</div>
				</div>
			);
		default:
			return;
	}
};

const mapStateToProps = (state) => ({
	paymentMethodItems: state.app?.constants?.user_payments,
	appCoins: state.app.coins,
});

export default connect(mapStateToProps)(PaymentAccountPopup);
