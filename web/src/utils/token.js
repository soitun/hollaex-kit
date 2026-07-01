import jwtDecode from 'jwt-decode';
import {
	TOKEN_KEY,
	DASH_TOKEN_KEY,
	MAIN_ACCOUNT_TOKEN,
} from '../config/constants';

const TOKEN_TIME_KEY = 'time';
const DASH_TOKEN_TIME_KEY = 'dashTime';

// Session cookie shared across subdomains of the current site. A landing page
// (or any sibling subdomain) can write it after its quick login/signup flow so
// users arrive here already authenticated. On app load it takes priority over
// the localStorage session, and we keep it in sync on login/logout so both
// sides agree on the session state.
const SHARED_TOKEN_COOKIE = 'kit_token';

// Derive the registrable parent domain from the current hostname so the cookie
// is shared across subdomains (e.g. trade.example.com -> .example.com). Returns
// null for localhost / bare IPs, where a host-only cookie is the right scope.
const getSharedCookieDomain = () => {
	const { hostname } = window.location;
	if (hostname === 'localhost' || /^[\d.]+$/.test(hostname)) {
		return null;
	}
	const parts = hostname.split('.');
	if (parts.length < 2) {
		return null;
	}
	return `.${parts.slice(-2).join('.')}`;
};

const sharedCookieAttributes = () => {
	let attrs = ';path=/;SameSite=Lax';
	const domain = getSharedCookieDomain();
	if (domain) {
		attrs += `;domain=${domain}`;
	}
	if (window.location.protocol === 'https:') {
		attrs += ';secure';
	}
	return attrs;
};

export const getSharedCookieToken = () => {
	const match = document.cookie.match(
		new RegExp(`(?:^|;\\s*)${SHARED_TOKEN_COOKIE}=([^;]+)`)
	);
	const token = match && match[1];
	if (!token) return null;
	try {
		const { exp } = jwtDecode(token);
		if (typeof exp === 'number' && exp * 1000 <= Date.now()) return null;
	} catch (err) {
		return null;
	}
	return token;
};

const setSharedCookieToken = (token) => {
	let maxAge = 24 * 60 * 60;
	try {
		const { exp } = jwtDecode(token);
		if (typeof exp === 'number') {
			maxAge = Math.max(0, Math.floor(exp - Date.now() / 1000));
		}
	} catch (err) {}
	document.cookie = `${SHARED_TOKEN_COOKIE}=${token};max-age=${maxAge}${sharedCookieAttributes()}`;
};

export const removeSharedCookieToken = () => {
	document.cookie = `${SHARED_TOKEN_COOKIE}=;max-age=0${sharedCookieAttributes()}`;
};

export const getToken = () => {
	return localStorage.getItem(TOKEN_KEY);
};

export const getMainAccountToken = () => {
	return localStorage.getItem(MAIN_ACCOUNT_TOKEN);
};

export const setToken = (token) => {
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem(TOKEN_TIME_KEY, new Date().getTime());
	setSharedCookieToken(token);
	if (!getMainAccountToken()) {
		mainAccountToken(token);
	}
};

export const mainAccountToken = (token) => {
	localStorage.setItem(MAIN_ACCOUNT_TOKEN, token);
};

export const removeToken = () => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(TOKEN_TIME_KEY);
	localStorage.removeItem(DASH_TOKEN_KEY);
	localStorage.removeItem(DASH_TOKEN_TIME_KEY);
	localStorage.removeItem(MAIN_ACCOUNT_TOKEN);
	removeSharedCookieToken();
};

export const isLoggedIn = () => {
	let token = getToken();
	return !!token;
};

export const decodeToken = (token) => jwtDecode(token);

export const checkRole = () => {
	const token = getToken();
	if (!token || token === undefined) return '';
	const tokenRole = jwtDecode(token)?.sub?.role?.toLowerCase();
	const roles = [tokenRole];
	let role = tokenRole;
	if (roles.includes('admin')) {
		role = 'admin';
	} else if (roles.includes('supervisor')) {
		role = 'supervisor';
	} else if (roles.includes('support')) {
		role = 'support';
	} else if (roles.includes('kyc')) {
		role = 'kyc';
	} else if (roles.includes('communicator')) {
		role = 'communicator';
	}
	return role;
};

export const getPermissions = () => {
	const token = getToken();
	if (!token || token === undefined) return '';
	return jwtDecode(token)?.sub?.permissions;
};
export const getConfigs = () => {
	const token = getToken();
	if (!token || token === undefined) return '';
	return jwtDecode(token)?.sub?.configs;
};

export const isUser = () => {
	return (
		checkRole() === '' ||
		checkRole() === 'user' ||
		checkRole() === null ||
		checkRole() === undefined
	);
};
export const isKYC = () => {
	return checkRole() === 'kyc';
};
export const isSupport = () => {
	return checkRole() === 'support';
};
export const isSupervisor = () => {
	return checkRole() === 'supervisor';
};
export const isTech = () => {
	return checkRole() === 'tech';
};
export const isAdmin = () => {
	const role = checkRole();
	return role?.length > 0 && role !== 'user';
};

export const hasPermissions = () => {
	return getPermissions()?.length > 0;
};

export const getRole = () => {
	const token = getToken();
	if (!token || token === undefined) return '';
	return jwtDecode(token)?.sub?.role?.toLowerCase();
};

export const getDashToken = () => {
	return localStorage.getItem(DASH_TOKEN_KEY);
};

export const setDashToken = (token) => {
	localStorage.setItem(DASH_TOKEN_KEY, token);
	localStorage.setItem(DASH_TOKEN_TIME_KEY, new Date().getTime());
};

export const removeDashToken = () => {
	localStorage.removeItem(DASH_TOKEN_KEY);
	localStorage.removeItem(DASH_TOKEN_TIME_KEY);
};

export const getDashTokenTimestamp = () => {
	return localStorage.getItem(DASH_TOKEN_TIME_KEY);
};

export const checkAccountStatus = (key = '') => {
	const token = getToken();
	if (!token || token === undefined || !key?.trim()?.length) return false;
	return jwtDecode(token)[key] || false;
};
