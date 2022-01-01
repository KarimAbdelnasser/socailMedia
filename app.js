const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.get("/", (req, res) => {
  res.send("Welcome to meta media");
});

require("dotenv").config();
require("./startup/routes")(app);

mongoose
  .connect(`${process.env.MONGO_URL}`, {
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to mongDb...`);
  });

module.exports = app;
