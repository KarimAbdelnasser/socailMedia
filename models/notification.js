const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  add_friend: [
    {
      friendId: { type: mongoose.Schema.Types.ObjectId },
      friendName: String,
      msg: String,
      accept: { type: Number, default: 0 },
      reject: { type: Number, default: 0 },
    },
  ],
  like: [
    {
      postId: { type: mongoose.Schema.Types.ObjectId },
      likedBy: { type: mongoose.Schema.Types.ObjectId },
      friendName: String,
      msg: String,
      seen: { type: Number, default: 0 },
    },
  ],
  comment: [
    {
      postId: { type: mongoose.Schema.Types.ObjectId },
      commentedBy: { type: mongoose.Schema.Types.ObjectId },
      friendName: String,
      body: String,
      msg: String,
      seen: { type: Number, default: 0 },
    },
  ],
});
const Notification = mongoose.model("Notification", notificationSchema);

function validateUser(notification) {
  const schema = {
    userId: Joi.ObjectId().required(),
    add_friend: Joi.Array(),
    like: Joi.Array(),
    comment: Joi.Array(),
  };
  return Joi.validate(notification, schema);
}

module.exports = {
  Notification,
  validate: validateUser,
};
