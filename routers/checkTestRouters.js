const express = require("express");
const formData = require("express-form-data");
const router = new express.Router();

router.use(formData.parse());

const checks = require("../controllers/checkTestControllers");

//get all tests
router.get("/", checks.openTest);
router.post("/", checks.checkTest);

router.get("/result", checks.showResult);

module.exports = router;
