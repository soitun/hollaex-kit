'use strict';

module.exports = function (sequelize, DataTypes) {
	const TravelRule = sequelize.define(
		'TravelRule',
		{
			id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true
			},
			user_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				references: {
					model: 'Users',
					key: 'id'
				}
			},
			// 'withdrawal' | 'deposit'
			type: {
				type: DataTypes.STRING,
				allowNull: false
			},
			// the transaction's id (withdrawal: resulting/uuid tx id; deposit: txid)
			transaction_id: {
				type: DataTypes.STRING,
				allowNull: true
			},
			// withdrawal: destination address; deposit: source/originating address
			address: {
				type: DataTypes.STRING,
				allowNull: true
			},
			network: {
				type: DataTypes.STRING,
				allowNull: true
			},
			currency: {
				type: DataTypes.STRING,
				allowNull: true
			},
			amount: {
				type: DataTypes.DOUBLE,
				allowNull: true
			},
			// value converted to the exchange native currency (compared against threshold)
			amount_native: {
				type: DataTypes.DOUBLE,
				allowNull: true
			},
			// receiver/sender is the user themselves
			is_own_address: {
				type: DataTypes.BOOLEAN,
				allowNull: true
			},
			// selected purpose/source (or the free text when "other")
			purpose: {
				type: DataTypes.STRING,
				allowNull: true
			},
			// counterparty service-provider type: 'exchange_vasp' | 'self_custody'
			counterparty_type: {
				type: DataTypes.STRING,
				allowNull: true
			},
			// name of the counterparty person/entity (originator for deposits,
			// beneficiary for withdrawals)
			counterparty_name: {
				type: DataTypes.STRING,
				allowNull: true
			},
			// name of the exchange/VASP when counterparty_type === 'exchange_vasp'
			vasp_name: {
				type: DataTypes.STRING,
				allowNull: true
			},
			// withdrawals: 'recorded'. deposits: 'pending' -> 'released' | 'kept'
			status: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: 'recorded'
			},
			// when a deposit stays on hold after the user provides travel-rule info,
			// the reason it remains held (KYT review, auto-deposit disabled, blacklisted
			// source). null once released or when travel rule was the only hold reason.
			note: {
				type: DataTypes.STRING,
				allowNull: true
			}
		},
		{
			timestamps: true,
			underscored: true,
			tableName: 'TravelRules'
		}
	);

	TravelRule.associate = (models) => {
		TravelRule.belongsTo(models.User, {
			onDelete: 'SET NULL',
			foreignKey: 'user_id',
			targetKey: 'id'
		});
	};

	return TravelRule;
};
