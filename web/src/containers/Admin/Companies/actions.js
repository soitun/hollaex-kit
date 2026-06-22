import querystring from 'query-string';

import { requestAuthenticated } from '../../../utils';

const toQueryString = (values) => {
	return querystring.stringify(values);
};

export const requestCompanies = (values) => {
	let url = '/admin/companies';
	if (values) {
		url = `/admin/companies?${toQueryString(values)}`;
	}
	return requestAuthenticated(url);
};
