const express = require("express");
const { createQuote } = require("../controller/quoteController");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.use(isAuthenticated);

router.post('/create', createQuote)

module.exports = router