import { requestAuthenticated } from 'utils';

export const createSubAccount = (values) => {
	const options = {
		method: 'POST',
		body: JSON.stringify(values),
	};
	return requestAuthenticated(`/subaccount`, options);
};

export const getSubAccounts = () => {
	const options = {
		method: 'GET',
	};
	return requestAuthenticated('/subaccounts', options);
};

export const transferSubAccountFunds = (values) => {
	const options = {
		method: 'POST',
		body: JSON.stringify(values),
	};
	return requestAuthenticated('/subaccount/transfer', options);
};

export const switchSubAccount = (subaccountId) => {
	const options = {
		method: 'POST',
		body: JSON.stringify({ subaccount_id: subaccountId }),
	};
	return requestAuthenticated('/subaccount/auth', options);
};
