const db = require("../models");
const Op = db.Sequelize.Op;

// ======= FUNGSI GLOBAL/REUSEABLE/HELP ========
const createRecord = async (model, dataObject) => {
  return await model.create(dataObject);
};

const findByColumn = async (model, column, value) => {
  return await model.findOne({ where: { [column]: value } });
};

const searchComplainByTypeOrStatus = async (model, keyword, orderConfig = []) => {
  return await model.findAll({
    where: {
      [Op.or]: [ 
        { jenis: { [Op.iLike]: `%${keyword}%` } },
        { status: { [Op.iLike]: `%${keyword}%` } }
      ]
    },
    order: orderConfig
  });
};

// Fungsi global untuk mengubah data berdasarkan ID/Primary Key tertentu
const updateRecord = async (model, primaryKeyConfig, dataObject) => {
  // primaryKeyConfig berbentuk objek, contoh: { id_komplain: 1 } atau { id: 2 }
  return await model.update(dataObject, {
    where: primaryKeyConfig
  });
};

// Fungsi global untuk menghapus data berdasarkan ID/Primary Key tertentu
const deleteRecord = async (model, primaryKeyConfig) => {
  return await model.destroy({
    where: primaryKeyConfig
  });
};

// ======= END OF FUNGSI GLOBAL ========

// FUNGSI
exports.updateComplain = async (req, res) => {
  try {
    const { id } = req.params; // ID komplain dari URL
    let { jenis, deskripsi, status, tanggapan_crm } = req.body;
    if (jenis) jenis = jenis.toLowerCase().trim();
    if (status) status = status.toLowerCase().trim();
    
    // Gunakan fungsi umum findByColumn yang kemarin untuk cek data
    const complain = await findByColumn(db.Complain, "id_komplain", id);
    if (!complain) {
      return res.status(404).json({ 
        success: false, 
        message: "Tiket komplain dengan ID ${id} tidak ditemukan!" });
    }
    const updatePayload = {
      jenis: jenis || complain.jenis,
      deskripsi: deskripsi || complain.deskripsi,
      status: status || complain.status,
      tanggapan_crm: tanggapan_crm !== undefined ? tanggapan_crm : complain.tanggapan_crm
    };
    await updateRecord(db.Complain, { id_komplain: id }, updatePayload);

    return res.status(200).json({
      success: true,
      message: `Tiket komplain dengan ID ${id} berhasil diperbarui!`
    });

  } catch (error) {
    //console.error("Error update complain:", error); buat test error katanya

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({
        success: false,
        message: "Gagal memvalidasi data! Pastikan jenis atau status komplain sudah sesuai dengan pilihan yang ditentukan."
      });
    }

    return res.status(500).json({ 
        success: false, 
        message: "Terjadi kesalahan pada server." });
  }
};

exports.deleteComplain = async (req, res) => {
  try {
    const { id } = req.params;
    const complain = await findByColumn(db.Complain, "id_komplain", id);

    if (!complain) {
      return res.status(404).json({ success: false, message: "Tiket komplain tidak ditemukan!" });
    }

    // Panggil FUNGSI UMUM DELETE
    await deleteRecord(db.Complain, { id_komplain: id });

    return res.status(200).json({ success: true, message: "Tiket komplain berhasil dihapus!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
};

exports.createComplain = async (req, res) => {
  try {
    let { id_customer, nama_customer, jenis, deskripsi, status } = req.body;
    if (jenis) jenis = jenis.toLowerCase().trim();
    if (status) status = status.toLowerCase().trim();
    if (nama_customer) nama_customer = nama_customer.trim();

    if ((!id_customer && !nama_customer) || !jenis || !deskripsi) {
      return res.status(400).json({
        success: false,
        message: "Nama/ID Customer, Jenis Komplain, dan Deskripsi wajib diisi!"
      });
    };

    let customer = null;

    if (id_customer) {
      customer = await db.Customer.findByPk(id_customer);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: `Customer dengan ID ${id_customer} tidak ditemukan!`
        });
      }
      if (nama_customer && customer.nama.toLowerCase() !== nama_customer.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: `ID ${id_customer} ditemukan, tetapi nama customer tidak sesuai dengan "${nama_customer}"!`
        });
      }
    } else if (nama_customer) {
        customer = await db.Customer.findOne({
            where: {
                nama: { [Op.iLike]: `%${nama_customer}%` }
            }
        });
        if (!customer) {
          return res.status(404).json({
            success: false,
            message: `Customer dengan nama "${nama_customer}" tidak ditemukan!`
          });
        };
    }
    if (!customer) {
        return res.status(400).json({
            success: false,
            message: `Customer dengan ID "${id_customer || '-'}" atau Nama "${nama_customer || '-'}" tidak ditemukan!`
        })
    }

    const newComplain = await createRecord(db.Complain, {
      id_customer: customer.id,
      jenis,
      deskripsi,
      status: status || 'open'
    });

    return res.status(201).json({
      success: true,
      message: "Tiket komplain berhasil didaftarkan!",
      data: newComplain
    });

  } catch (error) {
    console.error("Error create complain:", error);
    
    // Validasi tambahan jika input ENUM tidak sesuai (SequelizeValidationError)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Gagal memvalidasi data! Pastikan jenis atau status komplain sudah sesuai dengan pilihan yang ditentukan."
      });
    };

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan internal pada server."
    });
  }
};