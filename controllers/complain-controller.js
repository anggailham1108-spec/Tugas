const db = require("../models");
const Op = db.Sequelize.Op;

// * ======= FUNGSI GLOBAL/REUSEABLE/HELP ========
// * ======= ---------------------------- ========
const createRecord = async (model, dataObject) => {
  return await model.create(dataObject);
};

const findByColumn = async (model, column, value) => {
  return await model.findOne({ where: { [column]: value } });
};

const getComplainsData = async (
  model,
  keyword = '',
  orderConfig = [],
  includeConfig = []
) => {

  const whereClause = keyword && keyword.trim() !== ''
    ? {
      [Op.or]: [
        {
          jenis_komplain: {
            [Op.iLike]: `%${keyword.trim()}%`
          }
        },
        {
          status: {
            [Op.iLike]: `%${keyword.trim()}%`
          }
        }
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

// * ======= END OF FUNGSI GLOBAL ========
// * ======= -------------------- ========


// ** ====== FUNGSI UTAMA ========
// ** ----------------------------

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

// update complain sisi CUSTOMER
exports.updateComplainByCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complain = await db.Complain.findByPk(id);

    if (!complain) {
      return res.status(404).json({
        success: false,
        message: "Tiket komplain dengan ID tersebut tidak ditemukan!"
      });
    }

    // Customer hanya boleh memberikan keputusan
    // ketika tiket sudah berada di tahap on review
    if (complain.status !== "on review") {
      return res.status(400).json({
        success: false,
        message:
          "Customer hanya dapat memberikan konfirmasi ketika status tiket adalah on review."
      });
    }

    // Customer hanya boleh memilih:
    // on review -> closed
    // on review -> on progress
    if (
      status !== "closed" &&
      status !== "on progress"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer hanya dapat mengubah status menjadi closed atau on progress."
      });
    }

    await updateRecord(
      db.Complain,
      { id_komplain: id },
      {
        status: status
      }
    );

    const updatedComplain = await db.Complain.findByPk(id, {
      include: [
        {
          model: db.Customer,
          as: "customer",
          attributes: ["id", "nama", "no_telp"]
        },
        {
          model: db.Product,
          as: "product",
          attributes: ["id", "nama_product", "jenis_product"]
        },
        {
          model: db.Employee,
          as: "crm_handler",
          attributes: ["id", "nama", "jabatan"]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message:
        status === "closed"
          ? "Tiket komplain berhasil dikonfirmasi selesai!"
          : "Tiket komplain dikembalikan ke proses penanganan!",
      data: updatedComplain
    });

  } catch (error) {
    console.error("Error update complain by customer:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server."
    });
  }
};

// Update complain sisi CRM
exports.updateComplain = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      id_crm_employee,
      status,
      tanggapan_crm
    } = req.body;

    const complain = await db.Complain.findByPk(id);

    if (!complain) {
      return res.status(404).json({
        success: false,
        message: "Tiket komplain dengan ID tersebut tidak ditemukan!"
      });
    }

    // Validasi CRM Handler
    if (id_crm_employee !== undefined) {
      const crmEmployee = await db.Employee.findOne({
        where: {
          id: id_crm_employee,
          divisi: "CRM"
        }
      });

      if (!crmEmployee) {
        return res.status(400).json({
          success: false,
          message:
            "Employee yang dipilih tidak ditemukan atau bukan bagian dari divisi CRM!"
        });
      }
    }

    // Validasi status
    if (status !== undefined) {
      const validStatus = [
        "open",
        "on progress",
        "on review",
        "closed"
      ];

      if (!validStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Status harus: open, on progress, on review, atau closed."
        });
      }

      // CRM tidak boleh langsung menutup tiket
      if (status === "closed") {
        return res.status(400).json({
          success: false,
          message:
            "Tiket tidak dapat ditutup oleh CRM. Customer yang menentukan tiket menjadi closed."
        });
      }

      // Validasi alur status CRM
      if (
        complain.status === "open" &&
        status !== "on progress"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Tiket dengan status open hanya dapat diubah menjadi on progress."
        });
      }

      if (
        complain.status === "on progress" &&
        status !== "on review"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Tiket dengan status on progress hanya dapat diubah menjadi on review."
        });
      }

      if (complain.status === "on review") {
        return res.status(400).json({
          success: false,
          message:
            "Tiket dengan status on review menunggu keputusan customer."
        });
      }
    }

    const updateData = {};

    if (id_crm_employee !== undefined) {
      updateData.id_crm_employee = id_crm_employee;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (tanggapan_crm !== undefined) {
      updateData.tanggapan_crm = tanggapan_crm;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diubah!"
      });
    }

    await updateRecord(
      db.Complain,
      { id_komplain: id },
      updateData
    );

    const updatedComplain = await db.Complain.findByPk(id, {
      include: [
        {
          model: db.Customer,
          as: "customer",
          attributes: ["id", "nama", "no_telp"]
        },
        {
          model: db.Product,
          as: "product",
          attributes: ["id", "nama_product", "jenis_product"]
        },
        {
          model: db.Employee,
          as: "crm_handler",
          attributes: ["id", "nama", "jabatan", "divisi"]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: "Tiket komplain berhasil diperbarui!",
      data: updatedComplain
    });

  } catch (error) {
    console.error("Error update complain:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server."
    });
  }
};

// TAMPIL COMPLAIN SISI CRM
exports.searchComplains = async (req, res) => {
  try {
    const { keyword, sortBy, sortOrder } = req.query;

    const allowedSortColumns = [
      "id_komplain",
      "data_created",
      "jenis_komplain",
      "status"
    ];

    const validSortBy = allowedSortColumns.includes(sortBy)
      ? sortBy
      : "id_komplain";

    const validSortOrder =
      sortOrder && sortOrder.toUpperCase() === "DESC"
        ? "DESC"
        : "ASC";

    const orderConfig = [[validSortBy, validSortOrder]];

    const includeConfig = [
      {
        model: db.Customer,
        as: "customer",
        attributes: ["id", "nama", "no_telp"]
      },
      {
        model: db.Product,
        as: "product",
        attributes: ["id", "nama_product", "jenis_product"]
      },
      {
        model: db.Employee,
        as: "crm_handler",
        attributes: ["id", "nama", "jabatan", "divisi"]
      }
    ];

    const results = await getComplainsData(
      db.Complain,
      keyword,
      orderConfig,
      includeConfig
    );

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

// TAMPIL COMPLAIN SISI CUSTOMER
exports.getCustomerComplains = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await db.Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer dengan ID tersebut tidak ditemukan!"
      });
    }

    const results = await db.Complain.findAll({
      where: {
        id_customer: id
      },
      include: [
        {
          model: db.Product,
          as: "product",
          attributes: ["id", "nama_product", "jenis_product"]
        },
        {
          model: db.Employee,
          as: "crm_handler",
          attributes: ["id", "nama", "jabatan"]
        }
      ],
      order: [["id_komplain", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error("Error get customer complains:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server."
    });
  }
};

exports.createComplain = async (req, res) => {
  try {
    let {
      id_customer,
      no_telp_customer,
      jenis_komplain,
      id_product,
      deskripsi_singkat,
      deskripsi_detail
    } = req.body;

    // =========================
    // 1. Normalisasi input
    // =========================

    if (jenis_komplain) {
      jenis_komplain = jenis_komplain.toLowerCase().trim();
    }

    if (no_telp_customer) {
      no_telp_customer = no_telp_customer.trim();
    }

    // =========================
    // 2. Validasi input wajib
    // =========================

    if (
      !id_customer &&
      (!no_telp_customer || no_telp_customer === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "ID Customer atau Nomor HP Customer wajib diisi!"
      });
    }

    if (
      !jenis_komplain ||
      !deskripsi_singkat ||
      !deskripsi_detail
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Jenis Komplain, Deskripsi Singkat, dan Deskripsi Detail wajib diisi!"
      });
    }

    // =========================
    // 3. Validasi jenis komplain
    // =========================

    const validJenis = [
      "kualitas produk",
      "kuantitas produk",
      "pengiriman",
      "pelayanan admin"
    ];

    if (!validJenis.includes(jenis_komplain)) {
      return res.status(400).json({
        success: false,
        message:
          "Jenis komplain harus: kualitas produk, kuantitas produk, pengiriman, atau pelayanan admin."
      });
    }

    // =========================
    // 4. Cari Customer
    // =========================

    let customer = null;

    // Kalau ID dan nomor HP sama-sama diberikan
    if (id_customer && no_telp_customer) {
      customer = await db.Customer.findOne({
        where: {
          id: id_customer,
          no_telp: no_telp_customer
        }
      });

      if (!customer) {
        return res.status(400).json({
          success: false,
          message:
            "ID Customer dan Nomor HP tidak cocok dengan data customer yang sama!"
        });
      }
    }

    // Kalau hanya ID Customer
    else if (id_customer) {
      customer = await db.Customer.findByPk(id_customer);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer dengan ID tersebut tidak ditemukan!"
        });
      }
    }

    // Kalau hanya nomor HP
    else if (no_telp_customer) {
      customer = await db.Customer.findOne({
        where: {
          no_telp: no_telp_customer
        }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message:
            "Customer dengan nomor HP tersebut tidak ditemukan!"
        });
      }
    }

    // =========================
    // 5. Tentukan apakah perlu produk
    // =========================

    const isProductComplain =
      jenis_komplain === "kualitas produk" ||
      jenis_komplain === "kuantitas produk";

    let product = null;

    // Komplain kualitas/kuantitas → produk wajib
    if (isProductComplain) {
      if (!id_product) {
        return res.status(400).json({
          success: false,
          message:
            "Untuk komplain kualitas atau kuantitas produk, ID Produk wajib diisi!"
        });
      }

      product = await db.Product.findByPk(id_product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produk dengan ID tersebut tidak ditemukan!"
        });
      }
    }

    // =========================
    // 6. Buat tiket komplain
    // =========================

    const newComplain = await createRecord(db.Complain, {
      id_customer: customer.id,
      id_product: product ? product.id : null,
      jenis_komplain,
      deskripsi_singkat,
      deskripsi_detail
    });

    // =========================
    // 7. Response
    // =========================

    return res.status(201).json({
      success: true,
      message: "Tiket komplain berhasil didaftarkan!",
      data: newComplain
    });

  } catch (error) {
    console.error("Error create complain:", error);

    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeDatabaseError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Gagal memvalidasi data!",
        error_detail: error.errors
          ? error.errors.map(e => e.message)
          : error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan internal pada server."
    });
  }
};

// ** ====== END FUNGSI ========
// ** ----------------------------


// ! FUNGSI OLD

// exports.updateComplain = async (req, res) => {
//   try {
//     const { id } = req.params; // ID komplain dari URL
//     let { jenis, deskripsi, status, tanggapan_crm } = req.body;
//     if (jenis) jenis = jenis.toLowerCase().trim();
//     if (status) status = status.toLowerCase().trim();
    
//     // Gunakan fungsi umum findByColumn yang kemarin untuk cek data
//     const complain = await findByColumn(db.Complain, "id_komplain", id);
//     if (!complain) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Tiket komplain dengan ID ${id} tidak ditemukan!" });
//     }
//     const updatePayload = {
//       jenis: jenis || complain.jenis,
//       deskripsi: deskripsi || complain.deskripsi,
//       status: status || complain.status,
//       tanggapan_crm: tanggapan_crm !== undefined ? tanggapan_crm : complain.tanggapan_crm
//     };
//     await updateRecord(db.Complain, { id_komplain: id }, updatePayload);

//     return res.status(200).json({
//       success: true,
//       message: `Tiket komplain dengan ID ${id} berhasil diperbarui!`
//     });

//   } catch (error) {
//     //console.error("Error update complain:", error); buat test error katanya

//     if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
//       return res.status(400).json({
//         success: false,
//         message: "Gagal memvalidasi data! Pastikan jenis atau status komplain sudah sesuai dengan pilihan yang ditentukan."
//       });
//     }

//     return res.status(500).json({ 
//         success: false, 
//         message: "Terjadi kesalahan pada server." });
//   }
// };

// ! OLD UPDATE
// exports.updateComplain = async (req, res) => {
//   try {
//     const { id } = req.params;
//     let { 
//       jenis, 
//       deskripsi, 
//       status, 
//       tanggapan_crm,
//       id_product,
//       nama_product,
//       id_crm_employee,
//       nama_crm_employee,
//       id_reported_employee,
//       nama_reported_employee
//     } = req.body;

//     if (jenis) jenis = jenis.toLowerCase().trim();
//     if (status) status = status.toLowerCase().trim();
    
//     // 1. Cek keberadaan tiket komplain
//     const complain = await findByColumn(db.Complain, "id_komplain", id);
//     if (!complain) {
//       return res.status(404).json({ 
//         success: false, 
//         message: `Tiket komplain dengan ID ${id} tidak ditemukan!` 
//       });
//     }

//     // Tentukan jenis komplain yang berlaku (jenis baru atau tetap jenis lama)
//     const finalJenis = jenis || complain.jenis;
//     const isProductComplain = finalJenis === 'kualitas produk' || finalJenis === 'kuantitas produk';
//     const isEmployeeComplain = finalJenis === 'pengiriman' || finalJenis === 'pelayanan admin';

//     // 2. PROTEKSI: Cek apakah input yang dikirim sesuai dengan jenis komplainnya
//     const isSendingProduct = id_product || (nama_product && nama_product.trim());
//     const isSendingReportedEmp = id_reported_employee || (nama_reported_employee && nama_reported_employee.trim());

//     if (isProductComplain && isSendingReportedEmp) {
//       return res.status(400).json({
//         success: false,
//         message: `Jenis komplain "${finalJenis}" hanya diperbolehkan meng-update Produk, tidak boleh mengisi Karyawan yang dilaporkan!`
//       });
//     }

//     if (isEmployeeComplain && isSendingProduct) {
//       return res.status(400).json({
//         success: false,
//         message: `Jenis komplain "${finalJenis}" hanya diperbolehkan meng-update Karyawan yang dilaporkan, tidak boleh mengisi Produk!`
//       });
//     }

//     // 3. Validasi & Set ID Produk
//     let newProductId = complain.id_product;
//     if (isProductComplain) {
//       if (isSendingProduct) {
//         const productValidation = await validateEntityMatch(
//           db.Product,
//           id_product,
//           nama_product,
//           'nama_product',
//           'Produk'
//         );
//         if (productValidation.error) {
//           return res.status(400).json({ success: false, message: productValidation.error });
//         }
//         newProductId = productValidation.data.id;
//       }
//     } else {
//       // Jika jenis komplain BUKAN produk, reset id_product ke null
//       newProductId = null;
//     }

//     // 4. Validasi & Set ID Karyawan yang Dilaporkan
//     let newReportedEmployeeId = complain.id_reported_employee;
//     if (isEmployeeComplain) {
//       if (isSendingReportedEmp) {
//         const reportedValidation = await validateEntityMatch(
//           db.Employee,
//           id_reported_employee,
//           nama_reported_employee,
//           'nama',
//           'Karyawan yang dilaporkan'
//         );
//         if (reportedValidation.error) {
//           return res.status(400).json({ success: false, message: reportedValidation.error });
//         }
//         newReportedEmployeeId = reportedValidation.data.id;
//       }
//     } else {
//       // Jika jenis komplain BUKAN karyawan, reset id_reported_employee ke null
//       newReportedEmployeeId = null;
//     }

//     // 5. Validasi & Set Staf CRM (jika dikirim)
//     let newCrmEmployeeId = complain.id_crm_employee;
//     if (id_crm_employee || (nama_crm_employee && nama_crm_employee.trim())) {
//       const crmValidation = await validateEntityMatch(
//         db.Employee,
//         id_crm_employee,
//         nama_crm_employee,
//         'nama',
//         'Staf CRM',
//         { divisi: 'CRM' }
//       );
//       if (crmValidation.error) {
//         return res.status(400).json({ success: false, message: crmValidation.error });
//       }
//       newCrmEmployeeId = crmValidation.data.id;
//     }

//     // 6. Eksekusi Update ke Database
//     const updatePayload = {
//       jenis: finalJenis,
//       deskripsi: deskripsi || complain.deskripsi,
//       status: status || complain.status,
//       tanggapan_crm: tanggapan_crm !== undefined ? tanggapan_crm : complain.tanggapan_crm,
//       id_product: newProductId,
//       id_reported_employee: newReportedEmployeeId,
//       id_crm_employee: newCrmEmployeeId
//     };

//     await updateRecord(db.Complain, { id_komplain: id }, updatePayload);

//     return res.status(200).json({
//       success: true,
//       message: `Tiket komplain dengan ID ${id} berhasil diperbarui!`
//     });

//   } catch (error) {
//     console.error("Error update complain:", error);

//     if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
//       return res.status(400).json({
//         success: false,
//         message: "Gagal memvalidasi data! Pastikan jenis atau status komplain sudah sesuai dengan pilihan yang ditentukan."
//       });
//     }

//     return res.status(500).json({ 
//       success: false, 
//       message: "Terjadi kesalahan pada server." 
//     });
//   }
// };

// ! OLD VIEW COMPLAIN
// exports.searchComplains = async (req, res) => {
//   try {
//     const { keyword, sortBy, sortOrder } = req.query;
//     const allowedSortColumns = ['id_komplain', 'tanggal', 'jenis', 'status'];
//     const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'id_komplain';
//     const validSortOrder = (sortOrder && sortOrder.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
//     const orderConfig = [[validSortBy, validSortOrder]];

//     // Alias 'as' disesuaikan persis dengan complains_model.js
//     const includeConfig = [
//       {
//         model: db.Customer,
//         as: 'customer',
//         attributes: ['id', 'nama', 'no_telp']
//       },
//       {
//         model: db.Product,
//         as: 'product',
//         attributes: ['id', 'nama_product', 'jenis_product']
//       },
//       {
//         model: db.Employee,
//         as: 'crm_handler', // Menggunakan 'crm_handler' sesuai model Complain
//         attributes: ['id', 'nama', 'jabatan', 'divisi']
//       },
//       // {
//       //   model: db.Employee,
//       //   as: 'reported_employee', // Menggunakan 'reported_employee' sesuai model Complain
//       //   attributes: ['id', 'nama', 'jabatan', 'divisi']
//       // }
//     ];

//     const results = await getComplainsData(db.Complain, keyword, orderConfig, includeConfig);

//     return res.status(200).json({
//       success: true,
//       count: results.length,
//       data: results
//     });

//   } catch (error) {
//     console.error("Error get complains:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Terjadi kesalahan pada server."
//     });
//   }
// };

// ! OLD CREATE COMPLAIN !
// exports.createComplain = async (req, res) => {
//   try {
//     let { 
//       id_customer, 
//       nama_customer, 
//       jenis, 
//       deskripsi, 
//       status,
//       id_crm_employee,
//       nama_crm_employee,
//       id_product,
//       nama_product,
//       id_reported_employee,
//       nama_reported_employee
//     } = req.body;

//     // Paksa kedua nilai ENUM (jenis & status) menjadi huruf kecil & trim spasi
//     if (jenis) jenis = jenis.toLowerCase().trim();
//     if (status) status = status.toLowerCase().trim();

//     // Default ke 'open' jika status tidak dikirim
//     status = status || 'open';

//     // 1. Validasi Field Wajib Dasar
//     if ((!id_customer && (!nama_customer || !nama_customer.trim())) || !jenis || !deskripsi) {
//       return res.status(400).json({
//         success: false,
//         message: "Nama atau ID Customer, Jenis Komplain, dan Deskripsi wajib diisi!"
//       });
//     }

//     // 2. Validasi Customer (Gunakan validateEntityMatch)
//     const customerValidation = await validateEntityMatch(
//       db.Customer, 
//       id_customer, 
//       nama_customer, 
//       'nama', 
//       'Customer'
//     );
//     if(nama_customer) nama_customer = nama_customer.toLowerCase().trim();
//     if (customerValidation.error) {
//       return res.status(400).json({ success: false, message: customerValidation.error });
//     }
//     const customer = customerValidation.data;

//     // 3. Validasi Staf CRM
//     if (!id_crm_employee && (!nama_crm_employee || !nama_crm_employee.trim())) {
//       return res.status(400).json({
//         success: false,
//         message: "ID atau Nama Staf CRM yang menangani komplain wajib diisi!"
//       });
//     }

//     const crmValidation = await validateEntityMatch(
//       db.Employee,
//       id_crm_employee,
//       nama_crm_employee,
//       'nama',
//       'Staf CRM',
//       { divisi: 'CRM' }
//     );
//     if (crmValidation.error) {
//       return res.status(400).json({ success: false, message: crmValidation.error });
//     }
//     const crmEmployee = crmValidation.data;

//     // 4. Validasi Produk (Khusus komplain kualitas/kuantitas produk)
//     let product = null;
//     const isProductComplain = jenis === 'kualitas produk' || jenis === 'kuantitas produk';

//     if (isProductComplain) {
//       if (!id_product && (!nama_product || !nama_product.trim())) {
//         return res.status(400).json({
//           success: false,
//           message: "Untuk komplain kualitas/kuantitas produk, ID atau Nama Produk wajib diisi!"
//         });
//       }

//       const productValidation = await validateEntityMatch(
//         db.Product,
//         id_product,
//         nama_product,
//         'nama_product',
//         'Produk'
//       );
//       if (productValidation.error) {
//         return res.status(400).json({ success: false, message: productValidation.error });
//       }
//       product = productValidation.data;
//     }

//     // 5. Validasi Karyawan Dilaporkan (Khusus komplain pengiriman/pelayanan admin)
//     let reportedEmployee = null;
//     const isEmployeeComplain = jenis === 'pengiriman' || jenis === 'pelayanan admin';

//     if (isEmployeeComplain) {
//       if (!id_reported_employee && (!nama_reported_employee || !nama_reported_employee.trim())) {
//         return res.status(400).json({
//           success: false,
//           message: "Untuk komplain pengiriman/pelayanan admin, ID atau Nama Karyawan yang dilaporkan wajib diisi!"
//         });
//       }

//       const reportedValidation = await validateEntityMatch(
//         db.Employee,
//         id_reported_employee,
//         nama_reported_employee,
//         'nama',
//         'Karyawan yang dilaporkan'
//       );
//       if (reportedValidation.error) {
//         return res.status(400).json({ success: false, message: reportedValidation.error });
//       }
//       reportedEmployee = reportedValidation.data;
//     }

//     // 6. Simpan Data ke Database
//     const newComplain = await createRecord(db.Complain, {
//       id_customer: customer.id,
//       id_crm_employee: crmEmployee.id,
//       id_product: product ? product.id : null,
//       id_reported_employee: reportedEmployee ? reportedEmployee.id : null,
//       jenis,
//       deskripsi,
//       status
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Tiket komplain berhasil didaftarkan!",
//       data: newComplain
//     });

//   } catch (error) {
//     console.error("Error create complain:", error);
    
//     if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
//       return res.status(400).json({
//         success: false,
//         message: "Gagal memvalidasi data! Pastikan jenis atau status komplain sudah sesuai dengan pilihan yang ditentukan.",
//         error_detail: error.errors ? error.errors.map(e => e.message) : error.message
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Terjadi kesalahan internal pada server."
//     });
//   }
// };