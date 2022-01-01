const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const auth = require("../middleware/auth");
const { Post } = require("../models/post");
require("dotenv").config();

//get User's timeline
router.get("/myTimeline", auth, async (req, res) => {
  const id = req.user._id;
  const user = await User.findById(id);
  const friends = user.friends;
  const posts = await Post.find(
    { userId: { $in: friends } },
    function (err, docs) {
      res.status(200).send(docs);
    }
  ).clone();
});

//Show User's posts only
router.get("/myPosts", auth, async (req, res) => {
  const id = req.user._id;
  const user = await User.findById(id);
  const post = await Post.find({ userId: id }, { __v: 0, updatedAt: 0 });
  res.status(200).send(post);
});

module.exports = router;
