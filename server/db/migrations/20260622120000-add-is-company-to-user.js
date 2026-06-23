'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.addColumn('Users', 'is_company', {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false
		});
	},

	down: async (queryInterface) => {
		await queryInterface.removeColumn('Users', 'is_company');
	}
};
