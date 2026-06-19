const getWalletsByCurrnecy = (currency, wallets) => {
	return wallets.filter((wallet) => wallet.currency === currency);
};

const getWalletByNetwork = (network, networks, currnecyWallets) => {
	let wallet;
	if (!networks && currnecyWallets.length === 1) {
		wallet = currnecyWallets[0];
	} else if (network) {
		wallet = currnecyWallets.find((wallet) => wallet.network === network);
	}

	return wallet ? wallet['address'] : '';
};

export const getWallet = (currnecy, network, wallets, networks) => {
	return getWalletByNetwork(
		network,
		networks,
		getWalletsByCurrnecy(currnecy, wallets)
	);
};

export const getNetworkNameByKey = (network) => {
	if (network) {
		switch (network) {
			case 'eth':
				return 'ERC20';
			case 'trx':
				return 'TRC20';
			case 'bnb':
				return 'BEP20';
			case 'klay':
				return 'Klaytn';
			case 'matic':
				return 'Polygon';
			case 'pol':
				return 'Polygon';
			case 'sol':
				return 'Solana';
			case 'xlm':
				return 'Stellar';
			case 'ftm':
				return 'Fantom';
			case 's':
				return 'Sonic';
			case 'arb':
				return 'Arbitrum';
			case 'sui':
				return 'Sui';
			default:
				return network.toUpperCase();
		}
	} else {
		return network;
	}
};

export const getNetworkLabelByKey = (network) => {
	return `${network.toUpperCase()} (${getNetworkNameByKey(network)})`;
};

export const getNetworkName = (network) => {
	if (network) {
		switch (network) {
			case 'ERC20':
				return 'eth';
			case 'TRC20':
				return 'trx';
			case 'BEP20':
				return 'bnb';
			case 'klaytn':
				return 'klay';
			case 'Polygon':
				return 'matic';
			case 'Solana':
				return 'sol';
			case 'Stellar':
				return 'xlm';
			case 'Fantom':
				return 'ftm';
			default:
				return network.toUpperCase();
		}
	} else {
		return network;
	}
};

// `onramp[currency]` / `offramp[currency]` are backward compatible: each may be a
// plain array of enabled payment types (legacy, no limits) or an object keyed by
// type holding { min, max, fee } (and, for on-ramp, the payment schema { data, type }).
export const getRampTypes = (cfg) => {
	if (!cfg) return [];
	return Array.isArray(cfg) ? cfg : Object.keys(cfg);
};

export const getRampMethodConfig = (cfg, type) => {
	if (!cfg || Array.isArray(cfg)) return null;
	return cfg[type] || null;
};

// Normalize a currency's ramp config to object form, preserving any existing
// per-method config so legacy array configs upgrade in place without data loss.
export const toRampObject = (cfg) => {
	if (!cfg) return {};
	if (Array.isArray(cfg)) {
		return cfg.reduce((acc, type) => ({ ...acc, [type]: {} }), {});
	}
	return { ...cfg };
};

// Off-ramp-named aliases kept for existing call sites; the logic is direction-agnostic.
export const getOfframpTypes = getRampTypes;
export const getOfframpMethodConfig = getRampMethodConfig;
export const toOfframpObject = toRampObject;
