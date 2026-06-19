'use strict';

const TABLE_NAME = 'Users';

module.exports = {
	// dob was stored as TIMESTAMP WITH TIME ZONE, which made a calendar date
	// behave like an instant and shift +/- a day across timezones. Convert it
	// to a plain DATE, truncating existing values at UTC so the day stored as
	// midnight-Z is preserved.
	up: (queryInterface) =>
		queryInterface.sequelize.query(`
			ALTER TABLE "${TABLE_NAME}"
			ALTER COLUMN "dob" TYPE DATE
			USING ("dob" AT TIME ZONE 'UTC')::date;
		`),
	down: (queryInterface) =>
		queryInterface.sequelize.query(`
			ALTER TABLE "${TABLE_NAME}"
			ALTER COLUMN "dob" TYPE TIMESTAMP WITH TIME ZONE
			USING ("dob"::timestamp AT TIME ZONE 'UTC');
		`)
};
