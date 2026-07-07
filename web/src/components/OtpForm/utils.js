import { SubmissionError } from 'redux-form';

export const errorHandler = (err) => {
	const data = err.response && err.response.data;
	const _error = data ? (data.message ? data.message : data) : err.message;
	const error = {};
	if (_error.toLowerCase().indexOf('otp') > -1) {
		// error.otp_code = _error;
		error._error = _error;
	} else {
		error._error = _error;
	}
	// Server error responses carry a stable numeric `code` (see
	// server/utils/lang-messages.js) alongside the localized `message`.
	// Keep it so callers can branch on the error without string-matching.
	if (data && data.code != null) {
		error._code = data.code;
	}

	throw new SubmissionError(error);
};
