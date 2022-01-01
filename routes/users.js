const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User, validate } = require("../models/user");
const { Post } = require("../models/post");
const { Notification } = require("../models/notification");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const upload = require("../middleware/upload");
const PORT = process.env.PORT;
const socket = require("socket.io-client")(`http://localhost:${PORT}`);

//Sign Up
router.post("/signUp", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");
  user = new User({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    specialization: req.body.specialization,
    birthDate: req.body.birthDate,
    city: req.body.city,
    currentJob: req.body.currentJob,
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save(function (err) {
    if (err) {
      return res.status(500).send({ msg: err.message });
    }
  });
  const token = user.generateAuthToken();
  res.status(201).json({
    message: `You have signed up successfully\n Your ID is = ${user._id}\n You can sign in from here --> http://localhost:${PORT}/users/user/${user._id}`,
    token: token,
  });
});

//Sign In with User's ID
router.get("/user/:id", validateObjectId, async (req, res) => {
  const user = await User.findById(req.params.id, {
    password: 0,
    createdAt: 0,
    __v: 0,
    isAdmin: 0,
  });
  if (!user) {
    return res.status(401).send("We can't find any user with this ID!");
  } else {
    const token = user.generateAuthToken();

    res.status(200).json({
      message: `Signed In successfully!\n${user}`,
      token: token,
    });
  }
});

//Update user
router.put("/update", auth, async (req, res) => {
  const id = req.user._id;
  const user = await User.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: {
        fullName: req.body.fullName,
        birthDate: req.body.birthDate,
        city: req.body.city,
        currentJob: req.body.currentJob,
        updatedAt: Date.now(),
      },
      $push: { specialization: req.body.specialization },
    },
    { safe: true, upsert: true }
  );
  await user.save();
  res.status(201).send("User's data updated successfully");
});

//Change user's password
router.put("/changePass", auth, async (req, res) => {
  const thisUser = await User.findById(req.user._id);
  if (!thisUser) {
    return res.status(404).send("No user with this ID was found!");
  }
  const oldPass = req.body.oldPassword;
  const newPass = req.body.newPassword;
  const salt = await bcrypt.genSalt(10);
  const compareOldPass = await bcrypt.compare(oldPass, thisUser.password);
  const compareNewPass = await bcrypt.compare(newPass, thisUser.password);
  if (!compareOldPass) {
    return res.send(
      `wrong password!\nIf you can't remember the old password you can go to this link to get into your account==>http://localhost:${PORT}/users/forgetPass\n , You have to Know the email that you registered with!`
    );
  }
  if (compareNewPass) {
    return res
      .status(404)
      .send("The new password could not match old passwords!");
  } else {
    const freshPass = await bcrypt.hash(newPass, salt);
    await User.findByIdAndUpdate(
      req.user._id,
      { password: freshPass },
      {
        new: true,
      }
    );
    res.status(201).send("your password has changed successfully!");
  }
});

//FORGET OLD PASSWORD
router.put("/forgetPass", auth, async (req, res) => {
  const thisUser = await User.findById(req.user._id);
  if (!thisUser) {
    return res.status(404).send("No user with this Id was found!");
  }
  const userEmail = req.body.email;
  const userName = req.body.fullName;
  if (userEmail != thisUser.email || userName != thisUser.fullName) {
    return res.send("You have enter wrong email or username!");
  }
  const newPass = req.body.password;
  const compareNewPass = await bcrypt.compare(newPass, thisUser.password);
  if (compareNewPass) {
    return res
      .status(404)
      .send("The new password could not match old passwords!");
  } else {
    const salt = await bcrypt.genSalt(10);
    const freshPass = await bcrypt.hash(newPass, salt);
    await User.findByIdAndUpdate(
      req.user._id,
      { password: freshPass },
      {
        new: true,
      }
    );
    res.status(201).send("your password has changed successfully!");
  }
});

//Add a profile pic to signed in user
router.post(
  "/uploadProfPic",
  auth,
  upload.single("upload"),
  async (req, res) => {
    const user = await User.findOne({ _id: req.user._id }).select("profilePic");

    if (user) {
      await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: { profilePic: null } },
        { new: true }
      );
    }
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: { profilePic: req.file.path } },
      { new: true }
    );
    res
      .status(201)
      .send(
        `You have upload a profile picture to your account\nHere it is-->'http://localhost:${PORT}/${user.profilePic}'`
      );
  }
);

//Create a post
router.post("/addPost", auth, upload.single("upload"), async (req, res) => {
  const img = req.file;
  if (img === undefined) {
    const newPost = new Post({
      userId: req.user._id,
      desc: req.body.desc,
    });
    await newPost.save((err) => {
      if (err) {
        return res.status(500).send({ msg: err.message });
      }
    });
    return res.status(201).send(`You have created a post successfully`);
  } else {
    const newPost = new Post({
      userId: req.user._id,
      desc: req.body.desc,
      img: req.file.path,
    });
    await newPost.save((err) => {
      if (err) {
        return res.status(500).send({ msg: err.message });
      }
    });
    return res.status(201).send(`You have created a post successfully`);
  }
});

//like post
router.put("/like/:postId", auth, async (req, res) => {
  const postId = req.params.postId;
  const sure = await Post.findById(postId);
  if (sure.likedBy.find((ele) => ele._id == req.user._id)) {
    return res.send(
      "You have already liked this post you can't like it again!"
    );
  }
  const oldPost = await Post.findById(postId);
  const isFriend = oldPost.userId;
  const user = await User.findById(isFriend).select("friends");
  const found = user.friends.find((element) => element == req.user._id);
  if (!found) {
    return res.status(401).send("Access Denied");
  }
  const post = await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });
  await post.save((err) => {
    if (err) {
      return res.status(500).send({ msg: err.message });
    }
  });
  const notification = await Notification.findById(post.userId);
  if (notification) {
    const user = await User.findById(req.user._id);
    const form = {
      postId: postId,
      likedBy: req.user._id,
      friendName: user.fullName,
      msg: `Your friend '${user.fullName}' have liked your post ({ ${post.desc} }) , You can see this post by clicking here -->'http://localhost:${PORT}/users/myposts/1' with query --> type:like.`,
    };
    notification.like.push(form);
    await notification.save();
    let mine = await Post.findById(postId);
    let likedBy = req.user._id;
    mine.likedBy.push(likedBy);
    await mine.save();
  } else {
    const user = await User.findById(req.user._id);
    const newNot = new Notification({
      userId: post.userId,
      like: [
        {
          postId: postId,
          likedBy: req.user._id,
          friendName: user.fullName,
          msg: `Your friend '${user.fullName}' have liked your post ({ ${post.desc} }),(${post.img}) , You can see your posts from here -->'http://localhost:${PORT}/users/notificationPost/1' with query --> type:like.`,
        },
      ],
    });
    await newNot.save();
    let mine = await Post.findById(postId);
    let likedBy = req.user._id;
    mine.likedBy.push(likedBy);
    await mine.save();
  }

  return res.status(201).send("You have liked this post successfully");
});

//comment on a friend's post
router.put("/comment/:postId", auth, async (req, res) => {
  const postId = req.params.postId;
  const body = req.body.comment;
  const post = await Post.findById(postId);
  const isFriend = post.userId;
  const user = await User.findById(isFriend).select("friends");
  const found = user.friends.find((element) => element == req.user._id);
  if (!found) {
    return res.status(401).send("Access Denied");
  }
  const comment = {
    commentedBy: req.user._id,
    comBody: body,
  };
  post.comments.push(comment);
  await post.save((err) => {
    if (err) {
      return res.status(500).send({ msg: err.message });
    }
  });
  const notification = await Notification.findOne({ userId: post.userId });
  if (notification) {
    const user = await User.findById(req.user._id);
    const form = {
      postId: postId,
      commentedBy: req.user._id,
      friendName: user.fullName,
      comBody: body,
      msg: `Your friend '${user.fullName}' have commented on your post ({ ${post.desc} }),({${post.img}}), with this comment ({ ${body} }) , You can see your posts from here -->'http://localhost:${PORT}/users/myposts/1' with query --> type:comment.`,
    };
    notification.comment.push(form);
    await notification.save((err) => {
      if (err) {
        return res.status(500).send({ msg: err.message });
      }
    });
  } else {
    const user = await User.findById(req.user._id);
    const newNot = new Notification({
      userId: post.userId,
      comment: [
        {
          postId: postId,
          commentedBy: req.user._id,
          friendName: user.fullName,
          body: body,
          msg: `Your friend '${user.fullName}' have commented on your post ({ ${post.desc} }),({${post.img}}), with this comment ({ ${body} }) , You can see your posts from here -->'http://localhost:${PORT}/users/notificationPost/1' with query --> type:comment.`,
        },
      ],
    });
    await newNot.save();
  }
  return res.status(201).send("You have commented on this post successfully");
});

//Get profilePic
router.get("/getProfPic", auth, async (req, res) => {
  const user = await User.findOne({ _id: req.user._id }).select("-password");
  const picture = await User.findOne({ _id: user._id }).select("profilePic");

  if (!user || !picture) {
    throw new Error();
  }

  res.json(
    `Your profile picture is here --> 'http://localhost${PORT}/${picture.profilePic}'`
  );
});

module.exports = router;
