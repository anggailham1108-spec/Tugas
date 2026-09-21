"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      this.hasMany(models.Complain, {
        foreignKey: 'id_crm_employee',
        as: 'handled_complains'
      });
      this.hasMany(models.Complain, {
        foreignKey: 'id_reported_employee',
        as: 'reported_complains'
      });
    }
  }

  Employee.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false
    },
    no_telp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    jabatan: {
      type: DataTypes.ENUM('crm', 'sales', 'driver'),
      allowNull: false
    },
    divisi: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    underscored: true
  });

  return Employee;
};