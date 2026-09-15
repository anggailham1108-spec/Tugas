const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres', // Mengunci dialek ke PostgreSQL
    logging: false,      // Ubah ke true jika ingin melihat query SQL di terminal
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('⚡ Sukses terhubung ke database PostgreSQL.');
  } catch (error) {
    console.error('❌ Gagal terhubung ke PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
