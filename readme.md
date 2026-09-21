# 📋 Customer Complaints Management System API & Dashboard

A production-grade RESTful API and Interactive Dashboard for managing customer records and product complaints built with **Node.js**, **Express**, **Sequelize ORM**, and **PostgreSQL**.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database & ORM**: PostgreSQL, Sequelize ORM
- **Frontend / Visualization**: HTML5, Vanilla JavaScript, CSS3, Chart.js
- **API Testing**: Postman

---

## ✨ Features & Business Logic Rules

1. **Application-Level Deletion Protection**:
   - Customer deletion is protected explicitly at the controller layer (`deleteCustomer`). If a customer has active complaint records in the `complains` table, the API aborts the operation and returns a `400 Bad Request` response to prevent accidental data loss.
2. **Strict Data Validation**:
   - Phone numbers must contain **only digits** and have a maximum length of **13 characters** (`/^[0-9]{1,13}$/`).
   - `ENUM` validation for complaint types (`kuantitas produk`, `kualitas produk`, `pengiriman`, `pelayanan admin`) and status (`open`, `on progress`, `closed`).
3. **Flexible Input Payload Handling**:
   - Endpoints accept flexible input key aliases (e.g., `id_customer` / `customer_id` and `nama_customer` / `nama`) to ensure seamless frontend and API client compatibility.
4. **Interactive Dashboard**:
   - Features responsive KPI summary cards, Chart.js metrics (Bar & Doughnut charts), real-time search filtering, and column sorting without canvas resize loops.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) database server

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
   cd your-repo-name