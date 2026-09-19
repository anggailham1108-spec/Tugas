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
    const phoneRegex = /^[0-9]{1,13}$/;
    if (!phoneRegex.test(no_telp.trim())) {
      return res.status(400).json({
        success: false,
        message: "Nomor telepon harus berupa angka dan maksimal 13 digit!"
      });
    }
    const existingCustomer = await findByColumn(db.Customer, "no_telp", no_telp);
    const existingName = await findByColumn(db.Customer, "nama", nama);

    if (existingCustomer || existingName) {
      return res.status(400).json({
        success: false,
        message: "Data nama atau nomor telepon sudah digunakan oleh customer lain!"
      });
    }
    const newCustomer = await createRecord(db.Customer, {
      nama: nama.trim(),
      alamat: alamat.trim(),
      kota: kota.trim(),
      no_telp: no_telp.trim(),
      pic: pic.trim()
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

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, alamat, kota, no_telp, pic } = req.body;

    // 1. Validasi ID harus angka (defensive coding)
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID Customer harus berupa angka!"
      });
    }

    // 2. Cari data customer menggunakan helper yang sudah Anda miliki
    const customer = await findByColumn(db.Customer, "id", id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer tidak ditemukan!"
      });
    }

    // 3. Pengecekan unik nomor telepon jika diubah
    if (no_telp && no_telp !== customer.no_telp) {
      const existingPhone = await findByColumn(db.Customer, "no_telp", no_telp);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Nomor telepon sudah digunakan oleh customer lain!"
        });
      }
    }

    // 4. Update data (gunakan data baru jika ada, atau tetap pakai data lama)
    await customer.update({
      nama: nama !== undefined ? nama.trim() : customer.nama,
      alamat: alamat !== undefined ? alamat.trim() : customer.alamat,
      kota: kota !== undefined ? kota.trim() : customer.kota,
      no_telp: no_telp !== undefined ? no_telp.trim() : customer.no_telp,
      pic: pic !== undefined ? pic.trim() : customer.pic
    });

    return res.status(200).json({
      success: true,
      message: "Data customer berhasil diperbarui!",
      data: customer
    });

  } catch (error) {
    console.error("Error update customer:", error);

    // Tangkap SequelizeValidationError jika ada constraint no.telp dan nama harus beda dari cust lain
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({
        success: false,
        message: "Data yang dikirimkan tidak valid!"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server."
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await findByColumn(db.Customer, "id", id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer ID ${id} tidak ditemukan!`
      });
    }
    const hasComplain = await db.Complain.findOne({
      where: { id_customer: id }
    });

    if (hasComplain) {
      return res.status(400).json({
        success: false,
        message: "Customer tidak bisa dihapus karena masih memiliki riwayat komplain!"
      });
    }

    await customer.destroy();

    return res.status(200).json({
      success: true,
      message: `Customer ID ${id} berhasil dihapus!`
    })

  } catch (error) {
    console.error("Error menghapus customer", error);

    return res.status(500).json({
      success: false,
      message: "Error menghapus customer!"
    })
  }
}
