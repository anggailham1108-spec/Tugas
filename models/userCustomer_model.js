"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {

  class UserCustomer extends Model {

    static associate(models) {

      // Hubungan ke akun user
      this.belongsTo(models.User, {
        foreignKey: "id_user",
        as: "user"
      });

      // Hubungan ke customer
      this.belongsTo(models.Customer, {
        foreignKey: "id_customer",
        as: "customer"
      });
    }
  }

  UserCustomer.init({

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    id_customer: {
      type: DataTypes.INTEGER,
      allowNull: false
    }

  }, {
    sequelize,
    modelName: "UserCustomer",
    tableName: "user_customers",
    underscored: true,
    timestamps: true
  });

  return UserCustomer;
};