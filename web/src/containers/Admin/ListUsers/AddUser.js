import React, { useState } from 'react';
import { Button, Input, Form, Switch, Select, message } from 'antd';
import {
	requestAddUser,
	requestUserData,
	updateUserCompany,
} from '../User/actions';
import { COUNTRIES_OPTIONS } from 'utils/countries';

const { Item } = Form;
const { Option } = Select;

const AddUser = ({ onCancel, requestFullUsers, setIsActiveAddNewUsers }) => {
	const [isCompany, setIsCompany] = useState(false);

	// The create-user endpoint only returns a success message, so look the user
	// up by email to get the id needed for the company update.
	const findUserIdByEmail = (email) =>
		requestUserData({ email }).then((res) => {
			const match = (res?.data || []).find((user) => user.email === email);
			if (!match) {
				throw new Error('Could not locate the newly created user');
			}
			return match.id;
		});

	const saveCompanyDetails = (email, values) => {
		const submitData = {
			is_company: true,
			name: values.companyName,
			registration_number: values.registrationNumber,
			country_of_incorporation: values.countryOfIncorporation,
			business_address: {
				country: values.businessCountry,
				address: values.businessAddress,
				city: values.businessCity,
				postal_code: values.businessPostalCode,
			},
		};

		return findUserIdByEmail(email).then((userId) =>
			updateUserCompany(submitData, userId)
		);
	};

	const onFinish = (values) => {
		const { password, confirmPassword, userEmail } = values;

		if (password !== confirmPassword) {
			message.error('Password do not match');
			return;
		}

		requestAddUser({ email: userEmail, password })
			.then(() => {
				if (isCompany) {
					return saveCompanyDetails(userEmail, values);
				}
			})
			.then(() => {
				onCancel();
				requestFullUsers();
				setIsActiveAddNewUsers(false);
			})
			.catch((error) => {
				message.error(
					error?.data?.message || error?.message || 'Something went wrong'
				);
			});
	};

	return (
		<div>
			<div className="header-txt mb-5">
				<span>Add new users</span>
				<p> Create a new user account and have it added to your platform</p>
			</div>

			<Form name="addUser" onFinish={onFinish} layout="vertical">
				<Item
					label="Email"
					name="userEmail"
					initialValue=""
					rules={[
						{
							required: true,
							message: 'Please input your mail!',
						},
					]}
				>
					<Input />
				</Item>

				<Item
					label="Password"
					name="password"
					initialValue=""
					rules={[
						{
							required: true,
							message:
								'Invalid password. It has to contain at least 8 characters, at least one digit and one character.',
							pattern: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
						},
					]}
				>
					<Input.Password />
				</Item>

				<Item
					label="Confirm Password"
					name="confirmPassword"
					initialValue=""
					rules={[
						{
							required: true,
							message: 'Please input your password!',
						},
					]}
				>
					<Input.Password />
				</Item>

				<Item label="Company account">
					<Switch checked={isCompany} onChange={setIsCompany} />
				</Item>

				{isCompany && (
					<>
						<Item
							label="Company name"
							name="companyName"
							initialValue=""
							rules={[
								{
									required: true,
									message: 'Please input the company name!',
								},
							]}
						>
							<Input />
						</Item>

						<Item
							label="Registration number"
							name="registrationNumber"
							initialValue=""
						>
							<Input />
						</Item>

						<Item
							label="Country of incorporation"
							name="countryOfIncorporation"
						>
							<Select
								showSearch
								allowClear
								placeholder="Select country"
								optionFilterProp="children"
							>
								{COUNTRIES_OPTIONS.map((option, index) => (
									<Option value={option.value} key={index}>
										{option.label}
									</Option>
								))}
							</Select>
						</Item>

						<Item
							label="Business address"
							name="businessAddress"
							initialValue=""
						>
							<Input />
						</Item>

						<Item label="City" name="businessCity" initialValue="">
							<Input />
						</Item>

						<Item label="Postal code" name="businessPostalCode" initialValue="">
							<Input />
						</Item>

						<Item label="Country" name="businessCountry">
							<Select
								showSearch
								allowClear
								placeholder="Select country"
								optionFilterProp="children"
							>
								{COUNTRIES_OPTIONS.map((option, index) => (
									<Option value={option.value} key={index}>
										{option.label}
									</Option>
								))}
							</Select>
						</Item>
					</>
				)}

				<div className="footer mt-5">
					<Button className="mr-5" onClick={onCancel} type="sucess">
						Back
					</Button>
					<Button type="sucess" htmlType="submit">
						Next
					</Button>
				</div>
			</Form>
		</div>
	);
};

export default AddUser;
