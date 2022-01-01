const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const { Notification } = require("../models/notification");
const auth = require("../middleware/auth");
require("dotenv").config();
const PORT = process.env.PORT;
const socket = require("socket.io-client")(`http://localhost:8090`);

//search for a user and add to friends
router.get("/search/:email", auth, async (req, res) => {
  const email = req.params.email;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .send("The user with the given email haven't registered yet!");
  }
  return res
    .status(200)
    .send(
      `You can add '${user.email}' as a friend by clicking this URL-->http://localhost:${PORT}/users/addFriend/${user._id}`
    );
});

//search for a user by full name or city or current job or specialization in query type
router.get("/querySearch/:key", auth, async (req, res) => {
  const id = req.user._id;
  const value = req.params.key;
  const type = req.query.type;
  const keys = ["fullName", "city", "currentJob", "specialization"];
  if (
    type == keys[0] ||
    type == keys[1] ||
    type == keys[2] ||
    type == keys[3]
  ) {
    if (type == "fullName") {
      const user = await User.findOne({ fullName: value });
      if (!user) {
        return res
          .status(404)
          .send("The user with the given email haven't registered yet!");
      }
      return res
        .status(200)
        .send(
          `You can add '${user.email}' as a friend by clicking this URL-->http://localhost:${PORT}/users/addFriend/${user._id}`
        );
    } else if (type == "city") {
      const user = await User.findOne({ city: value });
      if (!user) {
        return res
          .status(404)
          .send("The user with the given email haven't registered yet!");
      }
      return res
        .status(200)
        .send(
          `You can add '${user.email}' as a friend by clicking this URL-->http://localhost:${PORT}/users/addFriend/${user._id}`
        );
    } else if (type == "currentJob") {
      const user = await User.findOne({ currentJob: value });
      if (!user) {
        return res
          .status(404)
          .send("The user with the given email haven't registered yet!");
      }
      return res
        .status(200)
        .send(
          `You can add '${user.email}' as a friend by clicking this URL-->http://localhost:${PORT}/users/addFriend/${user._id}`
        );
    } else {
      const user = await User.findOne({ specialization: value });
      if (!user) {
        return res
          .status(404)
          .send("The user with the given email haven't registered yet!");
      }
      return res
        .status(200)
        .send(
          `You can add '${user.email}' as a friend by clicking this URL-->http://localhost:${PORT}/users/addFriend/${user._id}`
        );
    }
  } else {
    return res.send(`You have 4 query to search only -->${keys}`);
  }
});

//add friend
router.post("/addFriend/:user", auth, async (req, res) => {
  const userId = req.user._id;
  const newFriend = req.params.user;
  const friend = await User.findById(newFriend);
  const user = await User.findById(userId);
  const notification = await Notification.findOne({ userId: newFriend });
  if (notification) {
    if (notification.add_friend.find((ele) => ele.friendId == userId)) {
      return res.send("You have sent a friend request to this user already!");
    }
    const user = await User.findById(userId);
    const form = {
      friendId: userId,
      friendName: user.fullName,
      msg: `You have a friend request from '${user.fullName}', You can accept this request by clicking here -->'http://localhost:${PORT}/users/accept/1', If you want to reject this you can click here -->'http://localhost:${PORT}/users/reject/1'.`,
    };
    notification.add_friend.push(form);
    await notification.save();
    socket.emit("Not", notification);
  } else {
    const newNot = new Notification({
      userId: friend._id,
      add_friend: [
        {
          friendId: userId,
          friendName: user.fullName,
          msg: `You have a friend request from '${user.fullName}', You can accept this request by clicking here -->'http://localhost:${PORT}/users/accept/1', If you want to reject this you can click here -->'http://localhost:${PORT}/users/reject/1'.`,
        },
      ],
    });
    await newNot.save();
    socket.emit("Not", newNot);
  }

  return res
    .status(201)
    .send(`Add request has been sent to ${friend.fullName}`);
});

module.exports = router;
