const db = require("../models");
const Op = db.Sequelize.Op;

// ======= FUNGSI GLOBAL/REUSEABLE/HELP ========
const createRecord = async (model, dataObject) => {
  return await model.create(dataObject);
};

const findByColumn = async (model, column, value) => {
  return await model.findOne({ where: { [column]: value } });
};

const getComplainsData = async (model, keyword = '', orderConfig = [], includeConfig = []) => {
  const whereClause = keyword && keyword.trim() !== '' 
    ? {
        [Op.or]: [
          { jenis: { [Op.iLike]: `%${keyword.trim()}%` } },
          { status: { [Op.iLike]: `%${keyword.trim()}%` } }
        ]
      }
    : {};

  return await model.findAll({
    where: whereClause,
    include: includeConfig,
    order: orderConfig
  });
};

const fetchAllWithOrderAndInclude = async (model, orderConfig = [], includeConfig = []) => {
  return await model.findAll({
    include: includeConfig,
    order: orderConfig
  });
};

const updateRecord = async (model, primaryKeyConfig, dataObject) => {
  return await model.update(dataObject, {
    where: primaryKeyConfig
  });
};

const deleteRecord = async (model, primaryKeyConfig) => {
  return await model.destroy({
    where: primaryKeyConfig
  });
};

const validateEntityMatch = async (model, id, name, nameColumn, entityLabel, extraWhere = {}) => {
  let entity = null;

  // Case 1: Jika ID dan NAMA diisi dua-duanya -> Cross Validate
  if (id && name && name.trim()) {
    entity = await model.findOne({ where: { id, ...extraWhere } });
    if (!entity) {
      return { error: `Data ${entityLabel} dengan ID ${id} tidak ditemukan!` };
    }
    
    // Cek apakah nama di database cocok dengan nama yang dikirim dari request
    const cleanInputName = name.trim().toLowerCase();
    const dbName = entity[nameColumn].toLowerCase();

    if (!dbName.includes(cleanInputName)) {
      return { 
        error: `${entityLabel} dengan ID ${id} ditemukan (${entity[nameColumn]}), tetapi tidak cocok dengan nama "${name.trim()}" yang dimasukkan!` 
      };
    }
    return { data: entity };
  }

  // Case 2: Jika CUMA ID yang diisi
  if (id) {
    entity = await model.findOne({ where: { id, ...extraWhere } });
    if (!entity) {
      return { error: `Data ${entityLabel} dengan ID ${id} tidak ditemukan!` };
    }
    return { data: entity };
  }

  // Case 3: Jika CUMA NAMA yang diisi (Case-Insensitive)
  if (name && name.trim()) {
    const cleanInputName = name.trim().toLowerCase();
    entity = await model.findOne({
      where: {
        [nameColumn]: { [Op.iLike]: `%${cleanInputName}%` },
        ...extraWhere
      }
    });
    if (!entity) {
      return { error: `Data ${entityLabel} dengan nama "${name.trim()}" tidak ditemukan!` };
    }
    return { data: entity };
  }

  return { data: null };
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
    let { 
        id_customer, 
        nama_customer, 
        jenis, 
        deskripsi, 
        status,
        id_crm_employee,
        nama_crm_employee,
        id_product,
        nama_product,
        id_reported_employee,
        nama_reported_employee
        } = req.body;

    if (jenis) jenis = jenis.toLowerCase().trim();
    if (status) status = status.toLowerCase().trim();
    if (nama_customer) nama_customer = nama_customer.trim();
    // validasi 1 = Wajib isi nama/id customer
    if ((!id_customer && !nama_customer) || !jenis || !deskripsi) {
      return res.status(400).json({
        success: false,
        message: "Nama atau ID Customer, Jenis Komplain, dan Deskripsi wajib diisi!"
      });
    };

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
    // validasi 2 = wajib isi nama CRM yang handle complain
    if (!id_crm_employee && (!nama_crm_employee || !nama_crm_employee.trim())) {
      return res.status(400).json({
        success: false,
        message: "ID atau Nama Staf CRM yang menangani komplain wajib diisi!"
      });
    }

    let crmEmployee = null;
    if (id_crm_employee) {
      // Jika diisi ID: Cari berdasarkan Primary Key DAN pastikan divisinya 'crm'
      crmEmployee = await db.Employee.findOne({
        where: {
          id: id_crm_employee,
          divisi: { [Op.iLike]: 'crm' } // Case-insensitive untuk jaga-jaga ('CRM', 'crm', etc.)
        }
      });
    } else if (nama_crm_employee) {
      // Jika diisi Nama: Cari berdasarkan Nama DAN pastikan divisinya 'crm'
      const cleanNamaCrm = nama_crm_employee.trim().toLowerCase();
      crmEmployee = await db.Employee.findOne({
        where: { 
          nama: { [Op.iLike]: `%${cleanNamaCrm}%` },
          divisi: { [Op.iLike]: 'crm' }
        }
      });
    }

    if (!crmEmployee) {
      return res.status(404).json({
        success: false,
        message: `Staf CRM dengan ${id_crm_employee ? `ID ${id_crm_employee}` : `Nama "${nama_crm_employee.trim()}"`} tidak ditemukan!`
      });
    }
    // validasi 3 = kalau kualitas/kuantitas wajib isi nama/id produk
    let product = null
    const isProductComplain = jenis === 'kualitas produk' || jenis === 'kuantitas produk';

    if (isProductComplain) {
  
        if (!id_product && (!nama_product || !nama_product.trim())) {
        return res.status(400).json({
        success: false,
        message: "Untuk komplain kualitas/kuantitas produk, ID atau Nama Produk wajib diisi!"
        });
    }

        if (id_product) {
        product = await db.Product.findByPk(id_product);

    }    else if (nama_product) {
        const cleanNamaProduct = nama_product.trim().toLowerCase();
        product = await db.Product.findOne({
        where: {
        nama_product: { [Op.iLike]: `%${cleanNamaProduct}%` }
            }
        });
    }
        if (!product) {
        return res.status(404).json({
        success: false,
        message: `Produk dengan ${id_product ? `ID ${id_product}` : `Nama "${nama_product.trim()}"`} tidak ditemukan!`
            });
        }
    }
    // validasi 3 = kalau pelayanan/pengiriman wajib isi nama karyawan
    let reportedEmployee = null;
    const isEmployeeComplain = jenis === 'pengiriman' || jenis === 'pelayanan admin';

    if (isEmployeeComplain) {
      if (!id_reported_employee && (!nama_reported_employee || !nama_reported_employee.trim())) {
        return res.status(400).json({
          success: false,
          message: "Untuk komplain pengiriman/pelayanan admin, ID atau Nama Karyawan (Sales/Driver) yang dilaporkan wajib diisi!"
        });
      }

      if (id_reported_employee) {
        reportedEmployee = await db.Employee.findByPk(id_reported_employee);
      } else if (nama_reported_employee) {
        const cleanNamaEmployee = nama_reported_employee.trim().toLowerCase();
        reportedEmployee = await db.Employee.findOne({
          where: { nama: { [Op.iLike]: `%${cleanNamaEmployee}%` } }
        });
      }

      if (!reportedEmployee) {
        return res.status(404).json({
          success: false,
          message: `Karyawan dengan ${id_reported_employee ? `ID ${id_reported_employee}` : `Nama "${nama_reported_employee.trim()}"`} tidak ditemukan!`
        });
      }
    }
    // Buat data
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
    if (error.name === 'SequelizeValidationError'|| error.name === 'SequelizeDatabaseError') {
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

exports.searchComplains = async (req, res) => {
  try {
    const { keyword, sortBy, sortOrder } = req.query;
    const allowedSortColumns = ['id_komplain', 'tanggal', 'jenis', 'status'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'id_komplain';
    const validSortOrder = (sortOrder && sortOrder.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
    const orderConfig = [[validSortBy, validSortOrder]];
    const includeConfig = [
      {
        model: db.Customer,
        as: 'customer',
        attributes: ['id', 'nama', 'no_telp']
      }
    ];
    const results = await getComplainsData(db.Complain, keyword, orderConfig, includeConfig);

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error("Error get complains:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server."
    });
  }
};