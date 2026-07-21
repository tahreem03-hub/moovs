const express = require("express");
const {createUser, loginUser, getMe, logout} = require("../controller/userController");
const { isAuthenticated } = require("../middleware/auth");


const router = express.Router()

router.post('/register', createUser)
router.post('/login', loginUser)

// routes
router.get("/me", isAuthenticated, getMe);
router.get("/logout", isAuthenticated, logout);

module.exports = router;