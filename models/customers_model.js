// pake opsi 1 yang gk pake class //

// module.exports = (sequelize, DataTypes) => {
//   const Customer = sequelize.define('Customer', {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true
//     },
//     nama: DataTypes.STRING,
//     alamat: DataTypes.STRING,
//     kota: DataTypes.STRING,
//     no_telp: DataTypes.STRING,
//     pic: DataTypes.STRING
//   }, {
//     tableName: 'customers', // Paksa Sequelize membaca tabel 'customers' yang sudah ada di database
//     timestamps: false       // Set false jika tabel di database Anda tidak punya kolom createdAt/updatedAt
//   });

//   return Customer;
// };

// pake opsi 2 = class //
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method untuk mendefinisikan relasi (association).
     * Jika tabel 'customers' di database PostgreSQL Anda saat ini belum 
     * memiliki hubungan/Foreign Key ke tabel lain, biarkan bagian ini kosong.
     */
    static associate(models) {
      // define association here
    }
  }

  Customer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nama: DataTypes.STRING,
      alamat: DataTypes.STRING,
      kota: DataTypes.STRING,
      no_telp: DataTypes.STRING,
      pic: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Customer",
      tableName: "customers", // Memastikan Sequelize membaca nama tabel 'customers' di PostgreSQL Anda
      timestamps: false,      // Set false karena tabel Anda tidak memiliki kolom otomatis createdAt & updatedAt
    }
  );

  return Customer;
};
