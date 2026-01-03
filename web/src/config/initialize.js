import axios from 'axios';
import { API_URL } from './constants';
import store from 'store';
import { logout, logoutLocal } from 'actions/authAction';
import { ERROR_TOKEN_EXPIRED } from 'components/Notification/Logout';
import { isLoggedIn, getSharedToken } from 'utils/token';

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.baseURL = API_URL;

const extractBearerToken = (authorization = '') => {
	const raw = `${authorization || ''}`.trim();
	if (!raw) return null;
	const match = raw.match(/^Bearer\s+(.+)$/i);
	return match ? match[1] : null;
};

axios.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error?.response?.status === 401 && isLoggedIn()) {
			const authHeader =
				error?.config?.headers?.Authorization ||
				error?.config?.headers?.authorization ||
				'';
			const requestToken = extractBearerToken(authHeader);
			const sharedToken = getSharedToken();

			// If this tab used a stale token but shared storage has a different (newer) token,
			// only log out this tab snapshot to avoid logging out other tabs.
			if (requestToken && sharedToken && requestToken !== sharedToken) {
				store.dispatch(logoutLocal(ERROR_TOKEN_EXPIRED));
			} else {
				store.dispatch(logout(ERROR_TOKEN_EXPIRED));
			}
		}

		return Promise.reject(error);
	}
);
