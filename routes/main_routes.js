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
  //=== router dari customer controller ====
  const CustomerController = require('../controllers/customer-controller.js');
  // Daftarkan router ke aplikasi express (app) secara langsung
  app.use(router);
  // fungsi untuk tampilkan dan sort customer yang ada
  //router.get('/customers', CustomerController.getAllCustomers);
  router.get('/customers', CustomerController.searchCustomer);
  // fungsi untuk buat customer yang baru
  router.post('/customers', CustomerController.createCustomer);
  // fungsi untuk ubah/update customer yang ada
  router.put('/customers/:id', CustomerController.updateCustomer);
  // fungsi menghapus customer by idnya
  router.delete('/customers/:id', CustomerController.deleteCustomer);
  // === end of customer controller ===

  // === router dari complain controller ====
  const ComplainController = require('../controllers/complain-controller.js');
  //membuat complain
  router.post('/complains', ComplainController.createComplain);
  // update complain
  router.put('/complains/:id', ComplainController.updateComplain);
  // delete complain
  router.delete('/complains/:id', ComplainController.deleteComplain);
  // tampilkan complain
  router.get('/complains', ComplainController.searchComplains);
};