const express = require("express");
const mongoose = require("mongoose");
const app = express();

require("dotenv").config();
require("./startup/routes")(app);

mongoose
  .connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to ${process.env.MONGO_URL}...`);
  });

module.exports = app;
