"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Complain extends Model {
    static associate(models) {

      // Komplain dimiliki oleh satu customer
      this.belongsTo(models.Customer, {
        foreignKey: "id_customer",
        as: "customer"
      });

      // Produk hanya ada untuk komplain kualitas/kuantitas
      this.belongsTo(models.Product, {
        foreignKey: "id_product",
        as: "product"
      });

      // CRM Handler yang menangani tiket
      this.belongsTo(models.Employee, {
        foreignKey: "id_crm_employee",
        as: "crm_handler"
      });
    }
  }

  Complain.init({

    id_komplain: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    id_customer: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    id_product: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    jenis_komplain: {
      type: DataTypes.ENUM(
        "kuantitas produk",
        "kualitas produk",
        "pengiriman",
        "pelayanan admin"
      ),
      allowNull: false
    },

    deskripsi_singkat: {
      type: DataTypes.STRING,
      allowNull: false
    },

    deskripsi_detail: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    data_created: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },

    status: {
      type: DataTypes.ENUM(
        "open",
        "on progress",
        "on review",
        "closed"
      ),
      allowNull: false,
      defaultValue: "open"
    },

    id_crm_employee: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    tanggapan_crm: {
      type: DataTypes.TEXT,
      allowNull: true
    }

  }, {
    sequelize,
    modelName: "Complain",
    tableName: "complains",
    underscored: true,
    timestamps: true
  });

  return Complain;
};

// ! OLD MODEL
// "use strict";
// const { Model } = require("sequelize");

// module.exports = (sequelize, DataTypes) => {
//   class Complain extends Model {
//     /**
//      Helper method untuk mendefinisikan relasi (association).
//      Jika tabel 'complain' di database PostgreSQL Anda saat ini belum 
//      memiliki hubungan/Foreign Key ke tabel lain, biarkan bagian ini kosong.
//      
//     static associate(models) {
//       this.belongsTo(models.Customer, {
//         foreignKey: 'id_customer',
//         as: 'customer'
//       });

//       this.belongsTo(models.Product, {
//         foreignKey: 'id_product',
//         as: 'product'
//       });

//       this.belongsTo(models.Employee, {
//         foreignKey: 'id_crm_employee',
//         as: 'crm_handler'
//       });

//       this.belongsTo(models.Employee, {
//         foreignKey: 'id_reported_employee',
//         as: 'reported_employee'
//       });
//     }
//   }

//   Complain.init({
//     // PERBAIKAN KRUSIAL: Beritahu Sequelize bahwa Primary Key Anda bernama id_komplain
//     id_komplain: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true
//     },
//     id_customer: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     },
//     id_product: {
//       type: DataTypes.INTEGER,
//       allowNull: true // Boleh NULL jika komplain pengiriman / pelayanan admin
//     },
//     id_crm_employee: {
//       type: DataTypes.INTEGER,
//       allowNull: true // Boleh NULL di awal saat tiket baru masuk (open)
//     },
//     id_reported_employee: {
//       type: DataTypes.INTEGER,
//       allowNull: true // ID Sales/Driver yang dilaporkan
//     },
//     jenis: {
//       // Menggunakan ENUM agar sesuai dengan tipe data di DBeaver
//       type: DataTypes.ENUM('kuantitas produk', 'kualitas produk', 'pengiriman', 'pelayanan admin'),
//       allowNull: false
//     },
//     tanggal: {
//       type: DataTypes.DATEONLY, // DATEONLY hanya mengambil tanggal tanpa jam (Y-MM-DD)
//       allowNull: false,
//       defaultValue: DataTypes.NOW
//     },
//     deskripsi: {
//       type: DataTypes.TEXT,
//       allowNull: false
//     },
//     status: {
//       type: DataTypes.ENUM('open', 'on progress', 'closed'),
//       defaultValue: 'open'
//     },
//     tanggapan_crm: {
//       type: DataTypes.TEXT,
//       allowNull: true
//     }
//   }, {
//     sequelize,
//     modelName: 'Complain',
//     tableName: 'complains', // Pastikan nama tabel persis seperti di DBeaver (jamak/huruf kecil)
//     underscored: true,      // Mengubah otomatis camelCase menjadi snake_case untuk created_at & updated_at
//   });

//   return Complain;
// };