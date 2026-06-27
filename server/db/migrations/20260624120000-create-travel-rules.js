'use strict';

const TABLE_NAME = 'TravelRules';

module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable(TABLE_NAME, {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
				onDelete: 'SET NULL',
				references: {
					model: 'Users',
					key: 'id'
				}
			},
			type: {
				type: Sequelize.STRING,
				allowNull: false
			},
			transaction_id: {
				type: Sequelize.STRING,
				allowNull: true
			},
			address: {
				type: Sequelize.STRING,
				allowNull: true
			},
			network: {
				type: Sequelize.STRING,
				allowNull: true
			},
			currency: {
				type: Sequelize.STRING,
				allowNull: true
			},
			amount: {
				type: Sequelize.DOUBLE,
				allowNull: true
			},
			amount_native: {
				type: Sequelize.DOUBLE,
				allowNull: true
			},
			is_own_address: {
				type: Sequelize.BOOLEAN,
				allowNull: true
			},
			purpose: {
				type: Sequelize.STRING,
				allowNull: true
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: 'recorded'
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
		},
		{
			timestamps: true,
			underscored: true
		}).then(() => {
			return queryInterface.addIndex(TABLE_NAME, ['transaction_id']);
		}).then(() => {
			return queryInterface.addIndex(TABLE_NAME, ['user_id', 'type']);
		});
	},
	down: (queryInterface) => queryInterface.dropTable(TABLE_NAME)
};
