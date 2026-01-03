import jwtDecode from 'jwt-decode';
import {
	TOKEN_KEY,
	DASH_TOKEN_KEY,
	MAIN_ACCOUNT_TOKEN,
} from '../config/constants';

const TOKEN_TIME_KEY = 'time';
const DASH_TOKEN_TIME_KEY = 'dashTime';

// Token model:
// - In-memory token is the source of truth for the current tab.
// - sessionStorage is only used to persist the token across refresh in the SAME tab.
// - localStorage is used ONLY as a bootstrap for NEW tabs:
//   if the tab has no token yet, we read localStorage and immediately snapshot it into
//   this tab's sessionStorage+memory so later changes from other tabs don't auto-switch this tab.
let MEMORY_TOKEN = null;
let MEMORY_MAIN_ACCOUNT_TOKEN = null;
let MEMORY_DASH_TOKEN = null;

const safeGet = (storage, key) => {
	try {
		if (storage && typeof storage.getItem === 'function') {
			return storage.getItem(key);
		}
		return null;
	} catch (e) {
		return null;
	}
};

const safeSet = (storage, key, value) => {
	try {
		if (storage && typeof storage.setItem === 'function') {
			storage.setItem(key, value);
		}
	} catch (e) {
		// ignore
	}
};

const safeRemove = (storage, key) => {
	try {
		if (storage && typeof storage.removeItem === 'function') {
			storage.removeItem(key);
		}
	} catch (e) {
		// ignore
	}
};

export const getSharedToken = () => safeGet(localStorage, TOKEN_KEY);
export const getSharedMainAccountToken = () =>
	safeGet(localStorage, MAIN_ACCOUNT_TOKEN);
export const getSharedDashToken = () => safeGet(localStorage, DASH_TOKEN_KEY);

export const getToken = () => {
	if (MEMORY_TOKEN) return MEMORY_TOKEN;
	try {
		const token = sessionStorage.getItem(TOKEN_KEY);
		if (token) MEMORY_TOKEN = token;
		if (token) return token;
	} catch (e) {
		// ignore
	}
	// Bootstrap for brand new tabs: snapshot shared token into this tab.
	const shared = getSharedToken();
	if (shared) {
		MEMORY_TOKEN = shared;
		safeSet(sessionStorage, TOKEN_KEY, shared);
		safeSet(sessionStorage, TOKEN_TIME_KEY, `${new Date().getTime()}`);
	}
	return shared;
};

export const getMainAccountToken = () => {
	if (MEMORY_MAIN_ACCOUNT_TOKEN) return MEMORY_MAIN_ACCOUNT_TOKEN;
	try {
		const token = sessionStorage.getItem(MAIN_ACCOUNT_TOKEN);
		if (token) MEMORY_MAIN_ACCOUNT_TOKEN = token;
		if (token) return token;
	} catch (e) {
		// ignore
	}
	const shared = getSharedMainAccountToken();
	if (shared) {
		MEMORY_MAIN_ACCOUNT_TOKEN = shared;
		safeSet(sessionStorage, MAIN_ACCOUNT_TOKEN, shared);
	}
	return shared;
};

export const setToken = (token) => {
	MEMORY_TOKEN = token;
	try {
		sessionStorage.setItem(TOKEN_KEY, token);
		sessionStorage.setItem(TOKEN_TIME_KEY, new Date().getTime());
	} catch (e) {
		// ignore
	}
	// Update shared token so NEW tabs can bootstrap into the latest login.
	safeSet(localStorage, TOKEN_KEY, token);
	safeSet(localStorage, TOKEN_TIME_KEY, `${new Date().getTime()}`);
	if (!getMainAccountToken()) {
		mainAccountToken(token);
	}
};

export const mainAccountToken = (token) => {
	MEMORY_MAIN_ACCOUNT_TOKEN = token;
	try {
		sessionStorage.setItem(MAIN_ACCOUNT_TOKEN, token);
	} catch (e) {
		// ignore
	}
	safeSet(localStorage, MAIN_ACCOUNT_TOKEN, token);
};

export const removeTokenLocal = () => {
	MEMORY_TOKEN = null;
	MEMORY_MAIN_ACCOUNT_TOKEN = null;
	MEMORY_DASH_TOKEN = null;
	safeRemove(sessionStorage, TOKEN_KEY);
	safeRemove(sessionStorage, TOKEN_TIME_KEY);
	safeRemove(sessionStorage, DASH_TOKEN_KEY);
	safeRemove(sessionStorage, DASH_TOKEN_TIME_KEY);
	safeRemove(sessionStorage, MAIN_ACCOUNT_TOKEN);
};

export const removeToken = () => {
	// Global logout: clear tab snapshot + shared storage (affects new tabs)
	removeTokenLocal();
	safeRemove(localStorage, TOKEN_KEY);
	safeRemove(localStorage, TOKEN_TIME_KEY);
	safeRemove(localStorage, DASH_TOKEN_KEY);
	safeRemove(localStorage, DASH_TOKEN_TIME_KEY);
	safeRemove(localStorage, MAIN_ACCOUNT_TOKEN);
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
	if (MEMORY_DASH_TOKEN) return MEMORY_DASH_TOKEN;
	try {
		const token = sessionStorage.getItem(DASH_TOKEN_KEY);
		if (token) MEMORY_DASH_TOKEN = token;
		if (token) return token;
	} catch (e) {
		// ignore
	}
	const shared = getSharedDashToken();
	if (shared) {
		MEMORY_DASH_TOKEN = shared;
		safeSet(sessionStorage, DASH_TOKEN_KEY, shared);
		safeSet(sessionStorage, DASH_TOKEN_TIME_KEY, `${new Date().getTime()}`);
	}
	return shared;
};

export const setDashToken = (token) => {
	MEMORY_DASH_TOKEN = token;
	try {
		sessionStorage.setItem(DASH_TOKEN_KEY, token);
		sessionStorage.setItem(DASH_TOKEN_TIME_KEY, new Date().getTime());
	} catch (e) {
		// ignore
	}
	safeSet(localStorage, DASH_TOKEN_KEY, token);
	safeSet(localStorage, DASH_TOKEN_TIME_KEY, `${new Date().getTime()}`);
};

export const removeDashToken = () => {
	MEMORY_DASH_TOKEN = null;
	safeRemove(sessionStorage, DASH_TOKEN_KEY);
	safeRemove(sessionStorage, DASH_TOKEN_TIME_KEY);
	safeRemove(localStorage, DASH_TOKEN_KEY);
	safeRemove(localStorage, DASH_TOKEN_TIME_KEY);
};

export const getDashTokenTimestamp = () => {
	try {
		return sessionStorage.getItem(DASH_TOKEN_TIME_KEY);
	} catch (e) {
		return safeGet(localStorage, DASH_TOKEN_TIME_KEY);
	}
};

export const checkAccountStatus = (key = '') => {
	const token = getToken();
	if (!token || token === undefined || !key?.trim()?.length) return false;
	return jwtDecode(token)[key] || false;
};
