import React from 'react';
import { connect } from 'react-redux';
import { SubmissionError } from 'redux-form';
import { updateUserCompany } from './actions';
import { AdminHocForm } from '../../../components';
import { COUNTRIES_OPTIONS } from 'utils/countries';

const Form = AdminHocForm('COMPANY_DATA', 'company_data');

const BusinessAddressFields = {
	country: {
		type: 'select',
		label: 'Country',
		options: COUNTRIES_OPTIONS,
	},
	address: {
		type: 'text',
		label: 'Address',
	},
	postal_code: {
		type: 'text',
		label: 'Postal Code',
	},
	city: {
		type: 'text',
		label: 'City',
	},
};

const CompanyDataFields = {
	name: {
		type: 'text',
		label: 'Company name',
	},
	registration_number: {
		type: 'text',
		label: 'Registration number',
	},
	country_of_incorporation: {
		type: 'select',
		label: 'Country of incorporation',
		options: COUNTRIES_OPTIONS,
	},
};

const onSubmit = (userData, onChangeSuccess, handleClose) => (values) => {
	const submitData = {
		business_address: {},
	};

	Object.keys(CompanyDataFields).forEach((key) => {
		submitData[key] = values[key];
	});
	Object.keys(BusinessAddressFields).forEach((key) => {
		submitData.business_address[key] = values[key];
	});

	return updateUserCompany(submitData, userData.id)
		.then((data) => {
			if (onChangeSuccess) {
				// onChangeSuccess replaces the whole user object, so merge with the
				// existing userData rather than replacing it with company fields only.
				onChangeSuccess({
					...userData,
					is_company: true,
					company: { ...submitData, ...data },
				});
			}
			handleClose();
		})
		.catch((err) => {
			throw new SubmissionError({ _error: err.data.message });
		});
};

const generateInitialValues = (company = {}) => {
	const { business_address = {} } = company;
	return {
		...company,
		...business_address,
	};
};

const CompanyData = ({ initialValues, onChangeSuccess, handleClose }) => {
	const company = initialValues.company || {};

	const fieldsData = {
		...CompanyDataFields,
		...BusinessAddressFields,
	};

	return (
		<Form
			onSubmit={onSubmit(initialValues, onChangeSuccess, handleClose)}
			buttonText="SAVE"
			fields={fieldsData}
			initialValues={generateInitialValues(company)}
			buttonClass="green-btn"
		/>
	);
};

const mapStateToProps = (state) => ({
	features: state.app.features,
	plugins: state.app.plugins,
});

export default connect(mapStateToProps)(CompanyData);
