const path = require("path");
const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const passport = require("passport");
const localStrategy = require("passport-local");

//authentication
const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");
};

const checkNotAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) res.redirect("/");
	next();
};

//user info
const userInfo = name => {
	User.findOne({username: name})
		.then(result => result)
		.catch(err => err);
};

//Controllers for authentication
const register = (req, res) => {
	res.render("./login/register", {title: "Register"});
};

const login = (req, res) => {
	const info = {error: req.query.error, communicat: "Password or login is incorrect"};
	res.render("./login/login", {title: "Login", info});
};

const logout = (req, res) => {
	req.logout();
	res.redirect("/login");
};

const createUser = async (req, res) => {
	const usersExist = await User.find({username: req.body.username});
	if (Object.entries(req.body).length) {
		if (!req.body.hidden.length) {
			let response = {
				usersExist: usersExist,
				reservedName: req.body.username.toLowerCase() === "admin",
				badInputs: []
			};

			for (const info in req.body) {
				if (req.body.hasOwnProperty(info)) {
					if (!req.body[info].length && info !== "hidden") response.badInputs.push(info);
					else if (info.toString() === "password") {
						const reqExp = /[A-ZĄĆĘŁŃÓŚŹŻ]{1}.{7,}/;
						if (!req.body[info].match(reqExp)) response.badInputs.push(info);
					} else if (info.toString() === "email") {
						const reqExp = /.{1,}@.{1,}\..{1,}/;
						if (!req.body[info].match(reqExp)) response.badInputs.push(info);
					} else if (info.toString() === "username") {
						if (!req.body[info].length < 3 && !req.body[info].length > 35) {
							response.badInputs.push(info);
						}
					}
				}
			}
			if (!response.badInputs.length && !response.reservedName && !response.usersExist.length) {
				req.body.password = await bcrypt.hash(req.body.password, 10);
				const user = new User(req.body);
				user
					.save()
					.then(result => {
						res.json({redirect: "/login"});
					})
					.catch(err => {
						res.json({redirect: "/register"});
					});
			} else {
				res.json(response);
			}
		}
	}
};

module.exports = {
	register,
	login,
	logout,
	createUser,
	userInfo,
	checkAuthenticated,
	checkNotAuthenticated
};
