"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      this.hasMany(models.Complain, {
        foreignKey: 'id_product',
        as: 'complains'
      });
    }
  }

  Product.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nama_product: {
      type: DataTypes.STRING,
      allowNull: false
    },
    jenis_product: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    underscored: true
  });

  return Product;
};