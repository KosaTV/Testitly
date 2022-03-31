const express = require("express");
const router = new express.Router();
const tests = require("../controllers/testControllers");

//get all tests
router.get("/", tests.getTests);

//create test
router.post("/", tests.createTest);

//remove test
router.delete("/:id", tests.removeTest);

//update test status
router.patch("/:id", tests.updateTestProperties);

//update test
router.put("/:id", tests.updateTest);

//clear database
router.get("/clear", tests.clearDatabase);
module.exports = router;
