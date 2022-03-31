const express = require("express");
const passport = require("passport");
const loginControllers = require("../controllers/authenticationControllers");
const checkNotAuthenticated = loginControllers.checkNotAuthenticated;
const checkAuthenticated = loginControllers.checkAuthenticated;
const formData = require("express-form-data");

const router = express.Router();

//parsing formData
router.use(formData.parse());

// get requests from forms
router.get("/login", checkNotAuthenticated, loginControllers.login);
router.get("/logout", checkAuthenticated, loginControllers.logout);
router.get("/register", checkNotAuthenticated, loginControllers.register);

//data handlers from forms
router.post("/register", loginControllers.createUser);

router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/login?error=true"
	})
);

module.exports = router;
