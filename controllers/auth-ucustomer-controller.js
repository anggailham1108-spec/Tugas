const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const db = require("../models");

exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // 1. Validasi input
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/nomor HP dan password wajib diisi!"
      });
    }

    const cleanLogin = login.trim();

    // 2. Cari akun berdasarkan email ATAU nomor HP
    const userCustomer = await db.UserCustomer.findOne({
      where: {
        [Op.or]: [
          {
            email: {
              [Op.iLike]: cleanLogin
            }
          },
          {
            no_telp_login: cleanLogin
          }
        ]
      }
    });

    // 3. Kalau akun tidak ditemukan
    if (!userCustomer) {
      return res.status(401).json({
        success: false,
        message: "Email/nomor HP atau password salah!"
      });
    }

    // 4. Cek password
    const passwordMatch = await bcrypt.compare(
      password,
      userCustomer.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Email/nomor HP atau password salah!"
      });
    }

    // 5. Buat JWT
    const token = jwt.sign(
      {
        id_user_customer: userCustomer.id,
        type: "customer"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    // 6. Login berhasil
    return res.status(200).json({
      success: true,
      message: "Login customer berhasil!",
      token
    });

  } catch (error) {
    console.error("Error login customer:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan internal pada server."
    });
  }
};

// ? notes

// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const { Op } = require("sequelize");

// const db = require("../models");


// // ======================================================
// // LOGIN CUSTOMER
// // ======================================================

// exports.login = async (req, res) => {

//   try {

//     const { login, password } = req.body;


//     // --------------------------------------------------
//     // 1. Validasi input
//     // --------------------------------------------------

//     if (!login || !password) {

//       return res.status(400).json({
//         success: false,
//         message: "Email/nomor HP dan password wajib diisi!"
//       });

//     }


//     const cleanLogin = login.trim();


//     // --------------------------------------------------
//     // 2. Cari akun berdasarkan email ATAU nomor HP
//     // --------------------------------------------------

//     const userCustomer = await db.UserCustomer.findOne({

//       where: {
//         [Op.or]: [
//           {
//             email: {
//               [Op.iLike]: cleanLogin
//             }
//           },
//           {
//             no_telp_login: cleanLogin
//           }
//         ]
//       }

//     });


//     // --------------------------------------------------
//     // 3. Akun tidak ditemukan
//     // --------------------------------------------------

//     if (!userCustomer) {

//       return res.status(401).json({
//         success: false,
//         message: "Email/nomor HP atau password salah!"
//       });

//     }


//     // --------------------------------------------------
//     // 4. Cek password
//     // --------------------------------------------------

//     const passwordMatch = await bcrypt.compare(
//       password,
//       userCustomer.password
//     );


//     if (!passwordMatch) {

//       return res.status(401).json({
//         success: false,
//         message: "Email/nomor HP atau password salah!"
//       });

//     }


//     // --------------------------------------------------
//     // 5. Cari customer/cabang yang terhubung
//     // --------------------------------------------------

//     const customerRelations =
//       await db.UserCustomerCustomer.findAll({

//         where: {
//           id_user_customer: userCustomer.id
//         },

//         include: [
//           {
//             model: db.Customer,
//             as: "customer",

//             attributes: [
//               "id",
//               "nama",
//               "alamat",
//               "kota",
//               "no_telp",
//               "pic"
//             ]
//           }
//         ]

//       });


//     // --------------------------------------------------
//     // 6. Akun belum memiliki customer
//     // --------------------------------------------------

//     if (customerRelations.length === 0) {

//       return res.status(404).json({
//         success: false,
//         message: "Akun belum terhubung dengan data customer!"
//       });

//     }


//     // --------------------------------------------------
//     // 7. Kalau memiliki lebih dari satu cabang
//     // --------------------------------------------------

//     if (customerRelations.length > 1) {

//       return res.status(200).json({

//         success: true,

//         message: "Login berhasil. Silakan pilih cabang.",

//         data: customerRelations.map(
//           relation => relation.customer
//         )

//       });

//     }


//     // --------------------------------------------------
//     // 8. Kalau hanya memiliki satu cabang
//     // --------------------------------------------------

//     const customer =
//       customerRelations[0].customer;


//     // --------------------------------------------------
//     // 9. Buat JWT
//     // --------------------------------------------------

//     const token = jwt.sign(

//       {
//         id_user_customer: userCustomer.id,
//         id_customer: customer.id,
//         type: "customer"
//       },

//       process.env.JWT_SECRET,

//       {
//         expiresIn: "1h"
//       }

//     );


//     // --------------------------------------------------
//     // 10. Response login
//     // --------------------------------------------------

//     return res.status(200).json({

//       success: true,

//       message: "Login customer berhasil!",

//       token,

//       data: customer

//     });


//   } catch (error) {

//     console.error(
//       "Error login customer:",
//       error
//     );


//     return res.status(500).json({

//       success: false,

//       message:
//         "Terjadi kesalahan internal pada server."

//     });

//   }

// };



// // ======================================================
// // SELECT CUSTOMER / CABANG
// // ======================================================

// exports.selectCustomer = async (req, res) => {

//   try {

//     const {
//       id_user_customer,
//       id_customer
//     } = req.body;


//     // --------------------------------------------------
//     // 1. Validasi input
//     // --------------------------------------------------

//     if (!id_user_customer || !id_customer) {

//       return res.status(400).json({

//         success: false,

//         message:
//           "ID User Customer dan ID Customer wajib diisi!"

//       });

//     }


//     // --------------------------------------------------
//     // 2. Pastikan customer memang terhubung
//     //    dengan akun tersebut
//     // --------------------------------------------------

//     const relation =
//       await db.UserCustomerCustomer.findOne({

//         where: {
//           id_user_customer,
//           id_customer
//         },

//         include: [
//           {
//             model: db.Customer,
//             as: "customer",

//             attributes: [
//               "id",
//               "nama",
//               "alamat",
//               "kota",
//               "no_telp",
//               "pic"
//             ]
//           }
//         ]

//       });


//     // --------------------------------------------------
//     // 3. Customer tidak terhubung
//     // --------------------------------------------------

//     if (!relation) {

//       return res.status(403).json({

//         success: false,

//         message:
//           "Customer tersebut tidak terhubung dengan akun Anda!"

//       });

//     }


//     // --------------------------------------------------
//     // 4. Buat JWT setelah cabang dipilih
//     // --------------------------------------------------

//     const token = jwt.sign(

//       {
//         id_user_customer,
//         id_customer,
//         type: "customer"
//       },

//       process.env.JWT_SECRET,

//       {
//         expiresIn: "1h"
//       }

//     );


//     // --------------------------------------------------
//     // 5. Response
//     // --------------------------------------------------

//     return res.status(200).json({

//       success: true,

//       message: "Cabang berhasil dipilih!",

//       token,

//       data: relation.customer

//     });


//   } catch (error) {

//     console.error(
//       "Error select customer:",
//       error
//     );


//     return res.status(500).json({

//       success: false,

//       message:
//         "Terjadi kesalahan internal pada server."

//     });

//   }

// };
// ```

// ---

// # 5. Route

// Route-nya cukup:

// ```js
// const express = require("express");

// const router = express.Router();

// const AuthCustomerController =
//   require("../controllers/AuthCustomerController");


// // Login customer
// router.post(
//   "/customer/login",
//   AuthCustomerController.login
// );


// // Pilih cabang/customer
// router.post(
//   "/customer/select-customer",
//   AuthCustomerController.selectCustomer
// );


// module.exports = router;
// ```

// Kemudian di `app.js`:

// ```js
// const customerAuthRoutes =
//   require("./routes/customerAuthRoutes");

// app.use("/auth", customerAuthRoutes);
// ```

// ---

// ## Alur akhirnya

// Kalau customer hanya punya **1 cabang**:

// ```text
// POST /auth/customer/login
//         ↓
// email / no HP + password
//         ↓
// bcrypt.compare()
//         ↓
// Customer ditemukan
//         ↓
// 1 cabang
//         ↓
// JWT langsung dibuat
//         ↓
// id_customer masuk JWT
// ```

// Kalau punya **2 cabang**:

// ```text
// POST /auth/customer/login
//         ↓
// email / no HP + password
//         ↓
// bcrypt.compare()
//         ↓
// Customer ditemukan
//         ↓
// 2 cabang
//         ↓
// return daftar cabang
//         ↓
// POST /auth/customer/select-customer
//         ↓
// pilih id_customer
//         ↓
// JWT dibuat
// ```

// JWT akhirnya:

// ```json
// {
//   "id_user_customer": 1,
//   "id_customer": 25,
//   "type": "customer"
// }
// ```

// **Catatan keamanan:** versi di atas masih tahap **authentication**. Pada `selectCustomer`, kita masih menerima `id_user_customer` dari body. Nanti setelah `authCustomer` middleware dibuat, kita ubah menjadi `req.user.id_user_customer`, sehingga user tidak bisa memanipulasi ID akun dari Postman.

// Jadi setelah ini, **jangan dulu ubah endpoint `/complains`**. Kita selesaikan dulu testing login customer sampai JWT berhasil, kemudian baru masuk **Langkah 2: middleware `authCustomer` + `authorizeCustomer`**.
