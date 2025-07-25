import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { isMobile } from 'react-device-detect';
import { withRouter } from 'react-router';
import { bindActionCreators } from 'redux';

import { ActionNotification, SearchBox } from 'components';
import withConfig from 'components/ConfigProvider/withConfig';
import STRINGS from 'config/localizedStrings';
import { DEFAULT_COIN_DATA } from 'config/constants';
import { getSparklines } from 'actions/chartAction';
import { EditWrapper } from 'components';
import { MarketsSelector } from 'containers/Trade/utils';
import MarketList from 'containers/TradeTabs/components/MarketList';
import { changeSparkLineChartData } from 'actions/appActions';
import { STATIC_ICONS } from 'config/icons';

class Markets extends Component {
	constructor(props) {
		super(props);
		this.state = {
			data: [],
			// chartData: {},
			pageSize: 10,
			page: 0,
			count: 0,
			searchValue: '',
			isLoading: true,
		};
	}

	componentDidMount() {
		this.getMarketsList();
	}

	componentDidUpdate(prevProps) {
		const { markets } = this.props;
		const { page, searchValue } = this.state;

		if (JSON.stringify(markets) !== JSON.stringify(prevProps.markets)) {
			this.constructData(page, searchValue);
		}
	}

	getMarketsList = async () => {
		const { pairs } = this.props;
		const { page, searchValue } = this.state;
		try {
			this.setState({ isLoading: true });
			this.constructData(page, searchValue);
			await getSparklines(Object.keys(pairs)).then((chartData) =>
				this.props.changeSparkLineChartData(chartData)
			);
			this.setState({ isLoading: false });
		} catch (error) {
			console.error(error);
		}
	};

	constructData = (page, searchValue) => {
		const { pageSize } = this.state;
		const { markets } = this.props;

		const pairs = this.getSearchPairs(searchValue);

		const searchResults = markets.filter(({ key }) => pairs.includes(key));

		const count = searchResults.length;

		const initItem = page * pageSize;
		if (initItem < count) {
			const data = searchResults.slice(0, initItem + pageSize);
			this.setState({ data, page, count });
		} else {
			this.setState({ data: searchResults, page, count });
		}
	};

	getSearchPairs = (value = '') => {
		const { pairs, coins } = this.props;
		const result = [];
		const searchValue = value ? value.toLowerCase().trim() : '';

		if (!value) {
			return Object.keys(pairs);
		} else {
			Object.entries(pairs).forEach(([key, pair]) => {
				const { pair_base, pair_2 } = pair;
				const { fullname = '' } = coins[pair_base] || DEFAULT_COIN_DATA;

				if (
					key.indexOf(searchValue) !== -1 ||
					pair_base.indexOf(searchValue) !== -1 ||
					pair_2.indexOf(searchValue) !== -1 ||
					fullname.toLowerCase().indexOf(searchValue) !== -1
				) {
					result.push(key);
				}
			});

			return result;
		}
	};

	handleTabSearch = (_, value) => {
		const { page } = this.state;
		if (value) {
			this.constructData(0, value);
		} else {
			this.constructData(page, value);
		}
		this.setState({ searchValue: value });
	};

	handleLoadMore = () => {
		const { page, searchValue } = this.state;
		this.constructData(page + 1, searchValue);
	};

	handleClick = (pair) => {
		const {
			router,
			constants: { features: { pro_trade, quick_trade } = {} },
		} = this.props;
		if (pair && router) {
			if (pro_trade) {
				router.push(`/trade/${pair}`);
			} else if (quick_trade) {
				router.push(`/quick-trade/${pair}`);
			}
		}
	};

	render() {
		const { data, page, pageSize, count } = this.state;
		const {
			showSearch = true,
			showMarkets = false,
			router,
			isHome = false,
			showContent = false,
			renderContent,
			sparkLineChartData,
		} = this.props;

		if (isHome) {
			renderContent(data);
		}

		return (
			<div>
				{showContent && (
					<div className="d-flex justify-content-between">
						<EditWrapper stringId="SUMMARY_MARKETS.VISIT_COIN_INFO_PAGE">
							{STRINGS.formatString(
								STRINGS['SUMMARY_MARKETS.VISIT_COIN_INFO_PAGE'],
								<Link to="/prices" className="link-text">
									{STRINGS['SUMMARY_MARKETS.HERE']}
								</Link>
							)}
						</EditWrapper>
						<ActionNotification
							stringId="REFRESH"
							text={STRINGS['REFRESH']}
							iconId="REFRESH"
							iconPath={STATIC_ICONS['REFRESH']}
							className="blue-icon refresh-link mr-3"
							onClick={() => this.getMarketsList()}
							disable={this.state.isLoading}
						/>
					</div>
				)}
				{showSearch && (
					<div className="d-flex justify-content-end">
						<div className={isMobile ? '' : 'w-25 pb-4'}>
							<SearchBox
								name={STRINGS['SEARCH_ASSETS']}
								className="trade_tabs-search-field"
								outlineClassName="trade_tabs-search-outline"
								placeHolder={`${STRINGS['SEARCH_ASSETS']}...`}
								handleSearch={this.handleTabSearch}
								showCross
							/>
						</div>
					</div>
				)}

				<MarketList
					loading={this.state.isLoading}
					markets={data}
					chartData={sparkLineChartData}
					handleClick={this.handleClick}
				/>

				{!showMarkets && page * pageSize + pageSize < count && (
					<div className="text-right">
						<EditWrapper
							stringId="STAKE_DETAILS.VIEW_MORE"
							renderWrapper={(children) => (
								<span
									className="trade-account-link pointer d-flex justify-content-center"
									onClick={this.handleLoadMore}
								>
									{children}
								</span>
							)}
						>
							{STRINGS['STAKE_DETAILS.VIEW_MORE']}
						</EditWrapper>
					</div>
				)}
				{showMarkets && (
					<div className="d-flex justify-content-center app_bar-link blue-link pointer py-2 underline-text market-list__footer">
						<EditWrapper
							stringId="MARKETS_TABLE.VIEW_MARKETS"
							renderWrapper={(children) => (
								<div
									onClick={() => {
										router.push('/markets');
									}}
									className="pt-1"
								>
									{children}
								</div>
							)}
						>
							{STRINGS['MARKETS_TABLE.VIEW_MARKETS']}
						</EditWrapper>
					</div>
				)}
			</div>
		);
	}
}

const mapStateToProps = (state) => ({
	pairs: state.app.pairs,
	tickers: state.app.tickers,
	constants: state.app.constants,
	markets: MarketsSelector(state),
	sparkLineChartData: state.app.sparkLineChartData,
});

const mapDispatchToProps = (dispatch) => ({
	changeSparkLineChartData: bindActionCreators(
		changeSparkLineChartData,
		dispatch
	),
});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withRouter(withConfig(Markets)));
