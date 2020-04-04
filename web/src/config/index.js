const PRODUCTION_ENDPOINT =
	process.env.REACT_APP_SERVER_ENDPOINT || 'https://api.hollaex.com';

const DEVELOPMENT_ENDPOINT = '/api.demo.bitholla.com';

const API_PATH = '/v1';

const PROXY_ENDPOINT = 'http://localhost'

const generateEndpoint = (endpoint, path) => ({
	API_URL: `${PROXY_ENDPOINT}${endpoint}${path}`,
	WS_URL: PROXY_ENDPOINT,
	PROXY_URL: `${PROXY_ENDPOINT}`,
	URL: DEVELOPMENT_ENDPOINT,

});

const VARIABLES = {
	production: generateEndpoint(PRODUCTION_ENDPOINT, API_PATH),
	development: generateEndpoint(DEVELOPMENT_ENDPOINT, API_PATH)
};

export default VARIABLES;
