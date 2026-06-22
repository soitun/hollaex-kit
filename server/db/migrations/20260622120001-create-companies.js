'use strict';

const TABLE_NAME = 'Companies';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable(
			TABLE_NAME,
			{
				id: {
					allowNull: false,
					autoIncrement: true,
					primaryKey: true,
					type: Sequelize.INTEGER
				},
				user_id: {
					type: Sequelize.INTEGER,
					onDelete: 'CASCADE',
					allowNull: false,
					unique: true,
					references: {
						model: 'Users',
						key: 'id'
					}
				},
				name: {
					type: Sequelize.STRING,
					allowNull: true
				},
				registration_number: {
					type: Sequelize.STRING,
					allowNull: true
				},
				country_of_incorporation: {
					type: Sequelize.STRING,
					allowNull: true
				},
				business_address: {
					type: Sequelize.JSONB,
					allowNull: false,
					defaultValue: {
						address: '',
						city: '',
						country: '',
						postal_code: ''
					}
				},
				status: {
					type: Sequelize.INTEGER,
					allowNull: false,
					defaultValue: 0
				},
				created_at: {
					allowNull: false,
					type: Sequelize.DATE,
					defaultValue: Sequelize.literal('NOW()')
				},
				updated_at: {
					allowNull: false,
					type: Sequelize.DATE,
					defaultValue: Sequelize.literal('NOW()')
				}
			}
		);
	},
	down: (queryInterface) => {
		return queryInterface.dropTable(TABLE_NAME);
	}
};
