const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const { Notification } = require("../models/notification");
const { Post } = require("../models/post");
const auth = require("../middleware/auth");
require("dotenv").config();

//see the users's notifications
router.get("/notification", auth, async (req, res) => {
  const notification = await Notification.findOne({ userId: req.user._id });
  if (!notification) {
    return res
      .status(404)
      .send("The user with the given ID haven't any notifications!");
  } else {
    const friendRequest = notification.add_friend;
    const like = notification.like;
    const comment = notification.comment;
    let response = [[], [], []];

    //requests
    friendRequest.forEach((ele) => {
      response[0].push(ele.msg + `query-->id:${ele._id}`);
    });
    like.forEach((ele) => {
      response[1].push(ele.msg + `query-->id:${ele._id}`);
    });
    comment.forEach((ele) => {
      response[2].push(ele.msg + `query-->id:${ele._id}`);
    });
    res.send(response);
  }
});

//accept friend
router.post("/accept/:num", auth, async (req, res) => {
  const userId = req.user._id;
  const num = req.params.num;
  const notificationId = req.query.id;
  const user = await User.findById(userId);
  const notificationUser = await Notification.findOne({ userId: userId });
  const check = notificationUser.add_friend.find(
    (ele) => ele._id == notificationId
  );
  if (!check) {
    return res.send("not found!");
  }
  const friend = await User.findById(check.friendId);
  if (!notificationUser) {
    return res
      .status(404)
      .send("The user with the given ID haven't any notification!");
  } else if (num == 1) {
    check.accept = 1;
    await user.friends.push(friend._id);
    await user.save();
    await friend.friends.push(userId);
    await friend.save();

    const seen = await Notification.findOneAndUpdate(
      {
        userId: req.user._id,
      },
      { $pull: { add_friend: { friendId: friend._id } } },
      { safe: true, upsert: true }
    );
    await seen.save();
    return res.send(`You and ${friend.fullName} are now friends!`);
  }
});

//reject friend request
router.post("/reject/:num", auth, async (req, res) => {
  const userId = req.user._id;
  const num = req.params.num;
  const notificationId = req.query.id;
  const notificationUser = await Notification.findOne({ userId: userId });
  const check = notificationUser.add_friend.find(
    (ele) => ele._id == notificationId
  );
  if (!check) {
    return res.send("not found!");
  }
  const friend = await User.findById(check.friendId);
  if (!notificationUser) {
    return res
      .status(404)
      .send("The user with the given ID haven't any notification!");
  } else if (num == 1) {
    check.reject = 1;
    const seen = await Notification.findOneAndUpdate(
      {
        userId: req.user._id,
      },
      { $pull: { add_friend: { friendId: friend._id } } },
      { safe: true, upsert: true }
    );
    await seen.save();
    return res.send(`You have rejected add request from ${friend.fullName} !`);
  }
});

//seen post's notification and get the post
router.post("/notificationPost/:num", auth, async (req, res) => {
  const userId = req.user._id;
  const num = req.params.num;
  const notificationId = req.query.id;
  const type = req.query.type;

  const notificationUser = await Notification.findOne({ userId: userId });
  if (type == "comment") {
    const check = notificationUser.comment.find(
      (ele) => ele._id == notificationId
    );
    if (!check) {
      return res.send("not found!");
    }
    const friend = await User.findOne({ fullName: check.friendName });

    if (!notificationUser) {
      return res
        .status(404)
        .send("The user with the given ID haven't any notification!");
    } else if (num == 1) {
      check.seen = 1;
      const seen = await Notification.findOneAndUpdate(
        {
          userId: req.user._id,
        },
        { $pull: { comment: { friendName: friend.fullName } } },
        { safe: true, upsert: true }
      );
      await seen.save();
      const post = await Post.findById(check.postId);
      return res.send(post);
    }
  } else {
    const check2 = notificationUser.like.find(
      (ele) => ele._id == notificationId
    );
    if (!check2) {
      return res.send("not found!");
    }
    const friend = await User.findById(check2.likedBy);
    if (!notificationUser) {
      return res
        .status(404)
        .send("The user with the given ID haven't any notification!");
    } else if (num == 1) {
      check2.seen = 1;
      const seen = await Notification.findOneAndUpdate(
        {
          userId: req.user._id,
        },
        { $pull: { like: { friendName: friend.fullName } } },
        { safe: true, upsert: true }
      );
      await seen.save();
      const post = await Post.findById(check2.postId);
      return res.send(post);
    }
  }
});

module.exports = router;
