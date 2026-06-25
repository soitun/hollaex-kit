'use strict';

// Adds a free-text `note` to travel-rule records. Used when a deposit stays on
// hold after the user provides travel-rule info — it records why the deposit was
// kept on hold (KYT review, auto-deposit disabled, blacklisted source) so the
// admin transaction detail view can explain the remaining hold.
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.addColumn('TravelRules', 'note', {
			type: Sequelize.STRING,
			allowNull: true
		});
	},

	down: (queryInterface) => {
		return queryInterface.removeColumn('TravelRules', 'note');
	}
};
