const db = require("../models");
const Op = db.Sequelize.Op;

// FUNGSI GLOBAL/REUSEABLE/HELP
// const fetchAll = async (model) => {
//   return await model.findAll();
// };

const fetchAllWithOrder = async (model, orderConfig = []) => {
  return await model.findAll({
    order: orderConfig,
  });
};

const findByColumn = async (model, columnName, value) => {
  return await model.findOne({
    where: { [columnName]: value },
  });
};

const searchCustomerByNameOrPhone = async (model, keyword, orderConfig = []) => {
  return await model.findAll({
    where: {
      [Op.or]: [ 
        { nama: { [Op.iLike]: `%${keyword}%` } },
        { no_telp: { [Op.iLike]: `%${keyword}%` } }
      ]
    },
    order: orderConfig
  });
};

const createRecord = async (model, dataObject) => {
  return await model.create(dataObject);
};


// END OF FUNGSI GLOBAL

// FUNGSI BARU 1
// exports.getAllCustomers = async (req, res) => {
//   try {
//     // Memanggil fungsi umum dengan melemparkan model db.Customer
//     let customers = await fetchAll(db.Customer);

//     res.status(200).json({
//       status: 200,
//       message: "All Customers",
//       data: customers
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// FUNGSI BARU 2

// exports.getAllCustomersSort = async (req, res) => {
//   try {
//     // Memanggil fungsi umum sorting dengan model db.Customer dan konfigurasi DESC
//     let allCustomers = await fetchAllWithOrder(db.Customer, [["id", "DESC"]]);

//     return res.status(200).send({
//       success: true,
//       message: "All customers Sort by ID",
//       all_customer: allCustomers,
//     });
//   } catch (error) {
//     return res.status(500).send({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.createCustomer = async (req, res) => {
  try {
    const { nama, alamat, kota, no_telp, pic } = req.body;

    if (!nama || !no_telp || !alamat || !pic || !kota) {
      return res.status(400).json({
        success: false,
        message: "Semua data wajib diisi!"
      });
    }
    const existingCustomer = await findByColumn(db.Customer, "no_telp", no_telp);
    const existingName = await findByColumn(db.Customer, "nama", nama);

    if (existingCustomer || existingName) {
      return res.status(400).json({
        success: false,
        message: "Data sudah digunakan oleh customer lain!"
      });
    }
    const newCustomer = await createRecord(db.Customer, {
      nama,
      alamat,
      kota,
      no_telp,
      pic
    });
      return res.status(201).json({
      success: true,
      message: "Customer berhasil ditambahkan!",
      data: newCustomer
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.searchCustomer = async (req, res) => {
  try {
    const { keyword, sortBy, sortOrder } = req.query;
    const orderConfig = sortBy ? [[sortBy, sortOrder || 'ASC']] : [['id', 'ASC']];
    let results;

    if (keyword && keyword.trim() !== "") {
      results = await searchCustomerByNameOrPhone(db.Customer, keyword, orderConfig);
    }
    else {
      results = await fetchAllWithOrder(db.Customer, orderConfig);
    }
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });

    } catch (error) {
    console.error("Error search customer:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
};




// FUNGSI YANG LAMA
// exports.getAllCustomers = async (req, res) => {
//   try {
//     // Mengambil semua data dari tabel customers
//     let customers = await db.Customer.findAll();
    
//     // Mengembalikan data sesuai format respon dashboard Anda
//     res.status(200).json({
//       status: 200,
//       message: "All Customers",
//       data: customers
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getAllCustomersSort = async (req, res) => {
//   try {
//     // Mengambil data dari tabel customers dan diurutkan dari ID terbesar (terbaru)
//     let allCustomers = await db.Customer.findAll({
//       order: [["id", "DESC"]],
//     });

//     // Mengembalikan respon dengan format persis seperti contoh gambar Anda
//     return res.status(200).send({
//       success: true,
//       message: "All customers Sort by ID",
//       all_customer: allCustomers,
//     });
//   } catch (error) {
//     // Mengembalikan respon error jika terjadi kegagalan query database
//     return res.status(500).send({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.createCustomer = async (req, res) => {
//   try {
//     // 1. Ambil data dari body request Postman
//     const { nama, alamat, kota, no_telp, pic } = req.body;

//     // Validation sederhana: pastikan nama tidak kosong
//     if (!nama || !no_telp || !alamat || !pic || !kota) {
//       return res.status(400).json({
//         success: false,
//         message: "Semua data wajib diisi!"
//       });
//     }

//     const existingCustomer = await db.Customer.findOne({
//       where: { no_telp: no_telp }
//     });

//     if (existingCustomer) {
//       return res.status(400).json({
//         success: false,
//         message: "Nomor telepon sudah digunakan oleh customer lain!"
//       });
//     }

//     // 2. Simpan data baru ke database PostgreSQL menggunakan Sequelize .create()
//     const newCustomer = await db.Customer.create({
//       nama,
//       alamat,
//       kota,
//       no_telp,
//       pic
//     });

//     // 3. Kembalikan respon sukses jika data berhasil disimpan
//     return res.status(201).json({
//       success: true,
//       message: "Customer berhasil ditambahkan!",
//       data: newCustomer
//     });

//   } catch (error) {
//     // Kembalikan respon error jika query gagal
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
