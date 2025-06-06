import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { SubmissionError } from 'redux-form';
import { isMobile } from 'react-device-detect';
import { browserHistory } from 'react-router';

import {
	setLanguage,
	changeTheme,
	openContactForm,
	openRiskPortfolioOrderWarning,
	closeNotification,
	setSettingsTab,
} from 'actions/appActions';
import { logout } from 'actions/authAction';
import {
	updateUserSettings,
	setUserData,
	setUsername,
	setUsernameStore,
} from 'actions/userAction';
import {
	IconTitle,
	HeaderSection,
	// CustomTabs,
	CustomMobileTabs,
	// CustomTabBar,
	MobileTabBar,
	Loader,
	TabController,
	EditWrapper,
	NotLoggedIn,
} from 'components';
import SettingsForm, { generateFormValues } from './SettingsForm';
import AccountForm, { generateUsernameFormValues } from './AccountForm';
import LanguageForm, { generateLanguageFormValues } from './LanguageForm';
import NotificationForm, {
	generateNotificationFormValues,
} from './NotificationForm';
import AudioCueForm, { generateAudioCueFormValues } from './AudioForm';
import { isLoggedIn } from 'utils/token';
import STRINGS from 'config/localizedStrings';
import withConfig from 'components/ConfigProvider/withConfig';

class UserSettings extends Component {
	state = {
		sections: [],
		tabs: [],
		activeTab: 0,
	};

	componentDidMount() {
		if (this.props.location.query && this.props.location.query.tab) {
			this.setState(
				{ activeTab: parseInt(this.props.location.query.tab, 10) },
				() => {
					this.updateTabs(this.props, this.state.activeTab);
				}
			);
		} else {
			this.updateTabs(this.props, this.state.activeTab);
		}
		if (window.location.search && window.location.search.includes('signals')) {
			this.setState({ activeTab: 0 });
			this.props.setSettingsTab(0);
		} else if (
			window.location.search &&
			window.location.search.includes('interface')
		) {
			this.setState({ activeTab: 1 });
			this.props.setSettingsTab(1);
		} else if (
			window.location.search &&
			window.location.search.includes('language')
		) {
			this.setState({ activeTab: 2 });
			this.props.setSettingsTab(2);
		} else if (
			window.location.search &&
			window.location.search.includes('audioCue')
		) {
			this.setState({ activeTab: 3 });
			this.props.setSettingsTab(3);
		} else if (
			window.location.search &&
			window.location.search.includes('account')
		) {
			this.setState({ activeTab: 4 });
			this.props.setSettingsTab(4);
		}
		this.openCurrentTab();
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		if (nextProps.activeLanguage !== this.props.activeLanguage) {
			this.updateTabs(nextProps, this.state.activeTab);
		}
		if (
			JSON.stringify(this.props.settings) !== JSON.stringify(nextProps.settings)
		) {
			this.updateTabs(nextProps, this.state.activeTab);
		}
		if (
			JSON.stringify(this.props.location.query) !==
				JSON.stringify(nextProps.location.query) &&
			nextProps.location.query &&
			nextProps.location.query.tab
		) {
			this.setState(
				{ activeTab: parseInt(nextProps.location.query.tab, 10) },
				() => {
					this.updateTabs(nextProps, this.state.activeTab);
				}
			);
		}
	}

	UNSAFE_componentWillUpdate(nextProps, nextState) {
		if (
			this.state.activeTab !== nextState.activeTab &&
			this.state.activeTab !== -1
		) {
			this.updateTabs(nextProps, nextState.activeTab);
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.props.getSettingsTab !== this.state.activeTab) {
			this.setState({
				activeTab: this.props.getSettingsTab,
			});
		}
		if (
			JSON.stringify(prevState.activeTab) !==
			JSON.stringify(this.state.activeTab)
		) {
			this.openCurrentTab();
		}
	}

	componentWillUnmount() {
		if (this.props.getSettingsTab) {
			this.props.setSettingsTab(0);
		}
	}

	openCurrentTab = () => {
		let currentTab = '';
		if (this.state.activeTab === 0) {
			currentTab = 'signals';
		}
		if (this.state.activeTab === 1) {
			currentTab = 'interface';
		} else if (this.state.activeTab === 2) {
			currentTab = 'language';
		} else if (this.state.activeTab === 3) {
			currentTab = 'audioCue';
		} else if (this.state.activeTab === 4) {
			currentTab = 'account';
		}
		this.props.router.push(`/settings?${currentTab}`);
	};

	onAdjustPortfolio = () => {
		this.props.openRiskPortfolioOrderWarning({
			onSubmit: (formProps) => this.onSubmitSettings(formProps, 'risk'),
			initialValues: this.props.settings.risk,
		});
	};

	updateTabs = (
		{ activeLanguage = '', username = '', settings = {}, coins = {} },
		activeTab
	) => {
		const {
			constants = {},
			icons: ICONS,
			themeOptions,
			selectable_native_currencies,
		} = this.props;
		const formValues = generateFormValues({
			options: themeOptions?.map(({ value }) => ({ value, label: value })),
			currencyOptions: selectable_native_currencies?.map((value) => ({
				value,
				label: value,
			})),
		});
		const usernameFormValues = generateUsernameFormValues(
			settings.chat.set_username
		);
		const languageFormValue = generateLanguageFormValues(
			constants.valid_languages
		);
		const DEFAULT_TOGGLE_OPTIONS = [
			{ value: true, label: STRINGS['DEFAULT_TOGGLE_OPTIONS.ON'] },
			{ value: false, label: STRINGS['DEFAULT_TOGGLE_OPTIONS.OFF'] },
		];
		const notificationFormValues = generateNotificationFormValues(
			DEFAULT_TOGGLE_OPTIONS
		);
		const audioFormValues = generateAudioCueFormValues(DEFAULT_TOGGLE_OPTIONS);

		let audioFormInitialValues = {
			all: true,
			public_trade: false,
			order_partially_completed: true,
			order_placed: true,
			order_canceled: true,
			order_completed: true,
			click_amounts: true,
			get_quote_quick_trade: true,
			quick_trade_success: true,
			quick_trade_timeout: true,
			...settings.audio,
		};

		const tabs = [
			{
				title: isMobile ? (
					<CustomMobileTabs
						title={STRINGS['USER_SETTINGS.TITLE_NOTIFICATION']}
						icon={ICONS['SETTING_NOTIFICATION_ICON']}
					/>
				) : (
					// <CustomTabs
					// 	stringId="USER_SETTINGS.TITLE_NOTIFICATION"
					// 	title={STRINGS['USER_SETTINGS.TITLE_NOTIFICATION']}
					// 	iconId="SETTING_NOTIFICATION_ICON"
					// 	icon={ICONS['SETTING_NOTIFICATION_ICON']}
					// />
					<EditWrapper stringId="USER_SETTINGS.TITLE_NOTIFICATION">
						{STRINGS['USER_SETTINGS.TITLE_NOTIFICATION']}
					</EditWrapper>
				),
				content: (
					<NotificationForm
						onSubmit={(formProps) =>
							this.onSubmitSettings(formProps, 'notification')
						}
						formFields={notificationFormValues}
						initialValues={settings.notification}
						ICONS={ICONS}
					/>
				),
			},
			{
				title: isMobile ? (
					<CustomMobileTabs
						title={STRINGS['USER_SETTINGS.TITLE_INTERFACE']}
						icon={ICONS['SETTING_INTERFACE_ICON']}
					/>
				) : (
					// <CustomTabs
					// 	stringId="USER_SETTINGS.TITLE_INTERFACE"
					// 	title={STRINGS['USER_SETTINGS.TITLE_INTERFACE']}
					// 	iconId="SETTING_INTERFACE_ICON"
					// 	icon={ICONS['SETTING_INTERFACE_ICON']}
					// />
					<EditWrapper stringId="USER_SETTINGS.TITLE_INTERFACE">
						{STRINGS['USER_SETTINGS.TITLE_INTERFACE']}
					</EditWrapper>
				),
				content: (
					<SettingsForm
						onSubmit={(formProps) =>
							this.onSubmitSettings(formProps, 'interface')
						}
						formFields={formValues}
						initialValues={settings.interface}
						ICONS={ICONS}
					/>
				),
			},
			{
				title: isMobile ? (
					<CustomMobileTabs
						title={STRINGS['USER_SETTINGS.TITLE_LANGUAGE']}
						icon={ICONS['SETTING_LANGUAGE_ICON']}
					/>
				) : (
					// <CustomTabs
					// 	stringId="USER_SETTINGS.TITLE_LANGUAGE"
					// 	title={STRINGS['USER_SETTINGS.TITLE_LANGUAGE']}
					// 	iconId="SETTING_LANGUAGE_ICON"
					// 	icon={ICONS['SETTING_LANGUAGE_ICON']}
					// />
					<EditWrapper stringId="USER_SETTINGS.TITLE_LANGUAGE">
						{STRINGS['USER_SETTINGS.TITLE_LANGUAGE']}
					</EditWrapper>
				),
				content: (
					<LanguageForm
						onSubmit={(formProps) =>
							this.onSubmitSettings(formProps, 'language')
						}
						formFields={languageFormValue}
						initialValues={{ language: activeLanguage }}
						ICONS={ICONS}
					/>
				),
			},
			{
				title: isMobile ? (
					<CustomMobileTabs
						title={STRINGS['USER_SETTINGS.TITLE_AUDIO_CUE']}
						icon={ICONS['SETTING_AUDIO_ICON']}
					/>
				) : (
					// <CustomTabs
					// 	stringId="USER_SETTINGS.TITLE_AUDIO_CUE"
					// 	title={STRINGS['USER_SETTINGS.TITLE_AUDIO_CUE']}
					// 	iconId="SETTING_AUDIO_ICON"
					// 	icon={ICONS['SETTING_AUDIO_ICON']}
					// />
					<EditWrapper stringId="USER_SETTINGS.TITLE_AUDIO_CUE">
						{STRINGS['USER_SETTINGS.TITLE_AUDIO_CUE']}
					</EditWrapper>
				),
				content: (
					<AudioCueForm
						onSubmit={(formProps) => this.onSubmitSettings(formProps, 'audio')}
						formFields={audioFormValues}
						initialValues={audioFormInitialValues}
						ICONS={ICONS}
					/>
				),
			},
			{
				title: isMobile ? (
					<CustomMobileTabs
						title={STRINGS['USER_SETTINGS.TITLE_ACCOUNT']}
						icon={ICONS['ACCOUNT_LINE']}
					/>
				) : (
					// <CustomTabs
					// 	stringId="USER_SETTINGS.TITLE_ACCOUNT"
					// 	title={STRINGS['USER_SETTINGS.TITLE_ACCOUNT']}
					// 	iconId="SETTING_CHAT_ICON"
					// 	icon={ICONS['SETTING_CHAT_ICON']}
					// />
					<EditWrapper stringId="USER_SETTINGS.TITLE_ACCOUNT">
						{STRINGS['USER_SETTINGS.TITLE_ACCOUNT']}
					</EditWrapper>
				),
				content: (
					<AccountForm
						onSubmit={this.onSubmitUsername}
						formFields={usernameFormValues}
						initialValues={{ username }}
						ICONS={ICONS}
					/>
				),
			},
		];
		this.setState({ tabs });
	};

	renderContent = (tabs, activeTab) =>
		tabs[activeTab] && tabs[activeTab].content ? (
			tabs[activeTab].content
		) : (
			<div />
		);

	onSubmitSettings = (formProps, formKey) => {
		let settings = {};
		let formValues = { ...formProps };
		switch (formKey) {
			case 'notification':
				settings.notification = formProps;
				break;
			case 'interface':
				if (formProps.order_book_levels) {
					formValues.order_book_levels = parseInt(
						formProps.order_book_levels,
						10
					);
				}
				settings.interface = formValues;
				break;
			case 'language':
				settings = { ...formProps };
				break;
			case 'chat':
				settings.chat = { ...formProps };
				break;
			case 'audio':
				settings.audio = formProps;
				break;
			default:
		}
		return updateUserSettings(settings)
			.then(({ data }) => {
				this.props.setUserData(data);
				if (data.settings) {
					if (data.settings.language) {
						this.props.changeLanguage(data.settings.language);
					}
					if (data.settings.interface && data.settings.interface.theme) {
						this.props.changeTheme(data.settings.interface.theme);
						localStorage.setItem('theme', data.settings.interface.theme);
					}
					if (
						data.settings.interface &&
						data.settings.interface.display_currency
					) {
						localStorage.setItem(
							'base_currnecy',
							data.settings.interface.display_currency
						);
					}
				}
				this.props.closeNotification();
			})
			.catch((err) => {
				const _error =
					err.response && err.response.data
						? err.response.data.message
						: err.message;
				throw new SubmissionError({ _error });
			});
	};

	onSubmitUsername = (values) => {
		return setUsername(values)
			.then(() => {
				this.props.setUsernameStore(values.username);
				this.onSubmitSettings({ set_username: true }, 'chat');
			})
			.catch((err) => {
				const _error =
					err.response && err.response.data
						? err.response.data.message
						: err.message;
				throw new SubmissionError({ username: _error });
			});
	};

	logout = (message = '') => {
		this.props.logout(typeof message === 'string' ? message : '');
	};

	setActiveTab = (activeTab) => {
		this.setState({ activeTab });
		this.props.setSettingsTab(activeTab);
		if (this.props.location.query && this.props.location.query.tab) {
			this.removeQueryString();
		}
	};
	removeQueryString = () => {
		browserHistory.push('/settings');
	};

	render() {
		const {
			icons: ICONS,
			openContactForm,
			user: { verification_level },
		} = this.props;

		if (isLoggedIn() && verification_level === 0) {
			return <Loader />;
		}

		const { activeTab, tabs } = this.state;

		return (
			<div className="presentation_container apply_rtl settings_container">
				{!isMobile && (
					<IconTitle
						stringId="ACCOUNTS.TAB_SETTINGS"
						text={STRINGS['ACCOUNTS.TAB_SETTINGS']}
						textType="title"
						iconPath={ICONS['TAB_SETTING']}
						iconId="TAB_SETTING"
					/>
				)}
				{!isMobile ? (
					<HeaderSection
						stringId="ACCOUNTS.TAB_SETTINGS"
						title={isMobile && STRINGS['ACCOUNTS.TAB_SETTINGS']}
						openContactForm={openContactForm}
					>
						<div className="header-content mt-3">
							<div>
								<EditWrapper stringId="USER_SETTINGS.TITLE_TEXT">
									{STRINGS['USER_SETTINGS.TITLE_TEXT']}
								</EditWrapper>
							</div>
							<div className="mb-3">
								<EditWrapper stringId="USER_SETTINGS.TITLE_TEXT_1">
									{STRINGS['USER_SETTINGS.TITLE_TEXT_1']}
								</EditWrapper>
							</div>
						</div>
					</HeaderSection>
				) : (
					<div className="header-content">
						<div>
							<EditWrapper stringId="USER_SETTINGS.TITLE_TEXT">
								{STRINGS['USER_SETTINGS.TITLE_TEXT']}
							</EditWrapper>
						</div>
						<div className="mb-3">
							<EditWrapper stringId="USER_SETTINGS.TITLE_TEXT_1">
								{STRINGS['USER_SETTINGS.TITLE_TEXT_1']}
							</EditWrapper>
						</div>
					</div>
				)}

				<NotLoggedIn>
					{!isMobile ? (
						<TabController
							activeTab={activeTab}
							setActiveTab={this.setActiveTab}
							tabs={tabs}
						/>
					) : (
						<MobileTabBar
							activeTab={activeTab}
							renderContent={this.renderContent}
							setActiveTab={this.setActiveTab}
							tabs={tabs}
						/>
					)}
					{!isMobile && this.renderContent(tabs, activeTab)}
					{isMobile && (
						<div className="my-4 text-center">
							{/* <Button label={STRINGS["ACCOUNTS.TAB_SIGNOUT"]} onClick={this.logout} /> */}
						</div>
					)}
				</NotLoggedIn>
			</div>
		);
	}
}

const mapStateToProps = (state) => ({
	coins: state.app.coins,
	verification_level: state.user.verification_level,
	settings: state.user.settings,
	username: state.user.username,
	activeLanguage: state.app.language,
	balance: state.user.balance,
	prices: state.orderbook.prices,
	user: state.user,
	price: state.orderbook.price,
	//orders: state.order.activeOrders,
	constants: state.app.constants,
	features: state.app.features,
	selectable_native_currencies:
		state.app.constants.selectable_native_currencies,
	getSettingsTab: state.app.selectedSettingsTab,
});

const mapDispatchToProps = (dispatch) => ({
	setUsernameStore: bindActionCreators(setUsernameStore, dispatch),
	setUserData: bindActionCreators(setUserData, dispatch),
	changeLanguage: bindActionCreators(setLanguage, dispatch),
	changeTheme: bindActionCreators(changeTheme, dispatch),
	openContactForm: bindActionCreators(openContactForm, dispatch),
	openRiskPortfolioOrderWarning: bindActionCreators(
		openRiskPortfolioOrderWarning,
		dispatch
	),
	closeNotification: bindActionCreators(closeNotification, dispatch),
	logout: bindActionCreators(logout, dispatch),
	setSettingsTab: bindActionCreators(setSettingsTab, dispatch),
});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withConfig(UserSettings));
