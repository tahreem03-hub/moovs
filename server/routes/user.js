const express = require("express");
const { 
    createUser, 
    loginUser, 
    getMe, 
    logout 
} = require("../controllers/userController");

const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

// Existing routes
router.post('/register', createUser);
router.post('/login', loginUser);
router.get("/me", isAuthenticated, getMe);
router.get("/logout", isAuthenticated, logout);

module.exports = router;