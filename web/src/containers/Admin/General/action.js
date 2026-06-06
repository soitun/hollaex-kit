import axios from 'axios';
import querystring from 'query-string';
import { requestAuthenticated } from '../../../utils';

export const updateConstants = (values) => {
	const options = {
		method: 'PUT',
		body: JSON.stringify(values),
	};
	return requestAuthenticated(`/admin/kit`, options);
};

export const upload = (formData) => {
	const options = {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		data: formData,
		method: 'POST',
	};

	return axios('/admin/upload', options);
};

export const getEmailStrings = (param) => {
	let url = `/admin/email?${querystring.stringify(param)}`;
	return requestAuthenticated(url);
};

export const updateEmailStrings = (values) => {
	values.html = values?.html?.replace(/\\"/g, "'");
	const options = {
		method: 'PUT',
		body: JSON.stringify(values),
	};
	return requestAuthenticated('/admin/email', options);
};

export const getEmailType = () => {
	let url = '/admin/email/types';
	return requestAuthenticated(url);
};

export const getBlacklistedAddresses = (params = {}) => {
	const url = `/admin/blacklist/address?${querystring.stringify(params)}`;
	return requestAuthenticated(url);
};

export const addBlacklistedAddress = (values) => {
	const options = {
		method: 'POST',
		body: JSON.stringify(values),
	};
	return requestAuthenticated('/admin/blacklist/address', options);
};

export const removeBlacklistedAddress = (id) => {
	const options = {
		method: 'DELETE',
	};
	return requestAuthenticated(
		`/admin/blacklist/address?${querystring.stringify({ id })}`,
		options
	);
};
