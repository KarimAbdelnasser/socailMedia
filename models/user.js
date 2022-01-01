const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
require("dotenv").config();

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      minlength: 4,
    },
    email: {
      type: String,
      required: true,
      minlength: 6,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
    },
    profilePic: {
      type: String,
    },
    specialization: Array,
    birthDate: Date,
    city: String,
    currentJob: String,
    friends: [{ type: mongoose.Schema.Types.ObjectId }],
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    process.env.jwtPrivateKey
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = {
    fullName: Joi.string().min(4).max(30).required(),
    email: Joi.string().min(6).max(30).required(),
    password: Joi.string().min(5).max(40).required(),
  };
  return Joi.validate(user, schema);
}

module.exports = {
  User,
  validate: validateUser,
};
