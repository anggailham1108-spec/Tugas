const express = require('express');
const router = express.Router();

// // Import controller customer yang baru saja Anda rapikan
// const CustomerController = require('../controllers/customer-controller.js');

// // 1. Jalur untuk menampilkan data standar (urutan sesuai database asli)
// router.get('/customers', CustomerController.getAllCustomers);

// // 2. Jalur untuk menampilkan data yang sudah di-sorting dari ID terbesar/terbaru
// router.get('/customers/sort', CustomerController.getAllCustomersSort);

// module.exports = router;




module.exports = (app) => {
  const CustomerController = require('../controllers/customer-controller.js');
  // Daftarkan router ke aplikasi express (app) secara langsung
  app.use(router);
  // fungsi fungsi di contorller customer
  //router.get('/customers', CustomerController.getAllCustomers);
  router.get('/customers', CustomerController.searchCustomer);
  router.get('/customers/sort', CustomerController.getAllCustomersSort);
  router.post('/customers', CustomerController.createCustomer);
};