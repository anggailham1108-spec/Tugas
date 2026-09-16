const express = require('express');
const app = express()
const port = 3000
const { connectDB } = require('./config.js');
const mainRoutes = require('./routes/main_routes.js');

connectDB();


app.use(express.json());
require('./routes/main_routes.js')(app);


app.get('/', (req, res) => {
  res.send('Hello Tugas!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// const { connectDB, sequelize } = require('./config.js'); knp gk gini?
//app.use(mainRoutes); knp gk pake ini?