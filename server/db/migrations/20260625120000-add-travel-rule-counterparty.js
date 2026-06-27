'use strict';

// Adds counterparty classification to travel-rule records: the type of service
// provider on the other side (exchange/VASP vs self-custody wallet), the name of
// that provider, and the name of the counterparty person/entity.
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await Promise.all([
			queryInterface.addColumn('TravelRules', 'counterparty_type', {
				type: Sequelize.STRING,
				allowNull: true
			}),
			queryInterface.addColumn('TravelRules', 'counterparty_name', {
				type: Sequelize.STRING,
				allowNull: true
			}),
			queryInterface.addColumn('TravelRules', 'vasp_name', {
				type: Sequelize.STRING,
				allowNull: true
			})
		]);
	},

	down: async (queryInterface) => {
		await Promise.all([
			queryInterface.removeColumn('TravelRules', 'counterparty_type'),
			queryInterface.removeColumn('TravelRules', 'counterparty_name'),
			queryInterface.removeColumn('TravelRules', 'vasp_name')
		]);
	}
};
