'use strict';

const BUSINESS_ADDRESS_DEFAULT = {
	address: '',
	city: '',
	country: '',
	postal_code: ''
};

module.exports = function (sequelize, DataTypes) {
	const Company = sequelize.define(
		'Company',
		{
			id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true
			},
			user_id: {
				type: DataTypes.INTEGER,
				onDelete: 'CASCADE',
				allowNull: false,
				unique: true,
				references: {
					model: 'Users',
					key: 'id'
				}
			},
			name: {
				type: DataTypes.STRING,
				allowNull: true
			},
			registration_number: {
				type: DataTypes.STRING,
				allowNull: true
			},
			country_of_incorporation: {
				type: DataTypes.STRING,
				allowNull: true
			},
			business_address: {
				type: DataTypes.JSONB,
				allowNull: false,
				defaultValue: BUSINESS_ADDRESS_DEFAULT
			},
			status: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0
			}
		},
		{
			timestamps: true,
			underscored: true,
			tableName: 'Companies'
		}
	);

	Company.associate = (models) => {
		Company.belongsTo(models.User, {
			foreignKey: 'user_id',
			as: 'user'
		});
	};

	return Company;
};
