const express = require("express");
const { createQuote } = require("../controller/quoteController");

const router = express.Router();

router.post('/create', createQuote)

module.exports = router