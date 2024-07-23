// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route to create a new user
router.get('/register', async (req, res) => {
  const { name, password, email, dob } = req.body;

  try {
    const checkEmail = await User.findOne({ email });

    if (!checkEmail) {
      const newUser = new User({
        name,
        password,
        email
      });

      const savedUser = await newUser.save();
      res.status(201).send("User created successfully");
    } else {
      res.status(400).send("User already exists");
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send("Server error");
  }
});

// Route to sign in a user
router.get('/users/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ name: username });

    if (user) {
      if (password === user.password) {
        res.status(200).send("Login successful");
      } else {
        res.status(400).send("Password doesn't match");
      }
    } else {
      res.status(400).send("User doesn't exist");
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send("Server error");
  }
});

module.exports = router;