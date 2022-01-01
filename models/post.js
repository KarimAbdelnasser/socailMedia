const mongoose = require("mongoose");
const Joi = require("joi");

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    desc: {
      type: String,
      max: 500,
    },
    img: { type: String },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId }],
    comments: [
      {
        commentedBy: { type: mongoose.Schema.Types.ObjectId },
        comBody: String,
      },
    ],
  },
  { timestamps: true }
);
const Post = mongoose.model("Post", postSchema);

function validateUser(post) {
  const schema = {
    userId: Joi.ObjectId().required(),
    img: Joi.String(),
    likes: Joi.Number(),
    likedBy: Joi.Array(),
    comments: Joi.Array(),
  };
  return Joi.validate(post, schema);
}

module.exports = {
  Post,
  validate: validateUser,
};
