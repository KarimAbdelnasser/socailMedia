const express = require("express");
const helmet = require("helmet");
const users = require("../routes/users");
const addFriend = require("../routes/addFriend");
const notifications = require("../routes/notifications");
const timeline = require("../routes/timelines");

module.exports = (app) => {
  app.use(express.json());
  app.use(helmet());
  app.use(express.static("image"));
  app.use("/users", users);
  app.use("/users", addFriend);
  app.use("/users", notifications);
  app.use("/users", timeline);
};
