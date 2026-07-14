const express = require("express");
const {createUser, loginUser} = require("../controller/userController");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router()

router.post('/register', createUser)
router.post('/login', loginUser)

module.exports = router;