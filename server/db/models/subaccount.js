'use strict';
module.exports = function (sequelize, DataTypes) {
	const Subaccount = sequelize.define(
		'Subaccount',
		{
			active: {
				type: DataTypes.BOOLEAN,
				defaultValue: true
			}
		},
		{
			underscored: true,
			tableName: 'Subaccounts'
		}
	);

	Subaccount.associate = (models) => {
		Subaccount.belongsTo(models.User, {
			onDelete: 'CASCADE',
			foreignKey: 'sub_id',
			targetKey: 'id'
		});
        Subaccount.belongsTo(models.User, {
			onDelete: 'CASCADE',
			foreignKey: 'master_id',
			targetKey: 'id'
		});
	};

	return Subaccount;
};
