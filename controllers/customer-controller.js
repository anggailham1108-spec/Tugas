const db = require("../models");


exports.getAllCustomers = async (req, res) => {
  try {
    // Mengambil semua data dari tabel customers
    let customers = await db.Customer.findAll();
    
    // Mengembalikan data sesuai format respon dashboard Anda
    res.status(200).json({
      status: 200,
      message: "All Customers",
      data: customers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllCustomersSort = async (req, res) => {
  try {
    // Mengambil data dari tabel customers dan diurutkan dari ID terbesar (terbaru)
    let allCustomers = await db.Customer.findAll({
      order: [["id", "DESC"]],
    });

    // Mengembalikan respon dengan format persis seperti contoh gambar Anda
    return res.status(200).send({
      success: true,
      message: "All customers Sort by ID",
      all_customer: allCustomers,
    });
  } catch (error) {
    // Mengembalikan respon error jika terjadi kegagalan query database
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
