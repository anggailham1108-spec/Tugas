"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {

  class User extends Model {

    static associate(models) {

      // Satu akun satu employee
      this.belongsTo(models.Employee, {
        foreignKey: "id_employee",
        as: "employee"
      });
    }
  }

  User.init({

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    id_employee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    }

  }, {
    sequelize,
    modelName: "User",
    tableName: "users",
    underscored: true,
    timestamps: true
  });

  return User;
};