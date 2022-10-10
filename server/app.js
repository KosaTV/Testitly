if (process.env.Node_ENV !== "production") require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const universalControllers = require("../controllers/universalControllers");
const testRouters = require("../routers/testRouters");
const session = require("express-session");
const checkTestRouters = require("../routers/checkTestRouters");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const loginRouters = require("../routers/loginRouters");
const bcrypt = require("bcrypt");
const {checkAuthenticated} = require("../controllers/authenticationControllers");
const User = require("../models/userSchema");
const MongoStore = require("connect-mongo")(session);

//initial app
const app = express();
const PORT = process.env.PORT || 3000;

//configuration of express
app.use(express.static("../public"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.set("trust proxy", 1);

//connect to database
const dbURL = process.env.DB_SECRET;

mongoose
	.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(res => {
		app.listen(PORT);
		console.log(`Server listening on ${PORT} port`);
	})
	.catch(err => console.log(err));

app.use(
	session({
		cookie: {maxAge: +process.env.EXPIRATION_TIME},
		secret: process.env.SESSION_SECRET,
		resave: true,
		rolling: true,
		store: new MongoStore({url: dbURL}),
		saveUninitialized: true
	})
);

app.use(function (req, res, next) {
	if (!req.session) {
		return next(new Error("Oh no"));
	}
	next();
});

//initialize a authentication and session
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (err, user) => {
		done(err, user);
	});
});

//creating a passport condition
passport.use(
	new localStrategy((username, password, done) => {
		User.findOne({username: username}, (err, user) => {
			if (err) return done(err);
			if (!user) return done(null, false, {message: "Incorrect username"});

			bcrypt.compare(password, user.password, (err, result) => {
				if (err) return done(err);
				if (!result) return done(null, false, {message: "Incorrect password"});
				return done(null, user);
			});
		});
	})
);

//main routers
app.get("/", checkAuthenticated, universalControllers.root);

//tests routers
app.use("/tests", checkAuthenticated, testRouters);

//check test routers
app.use("/check", checkTestRouters);

// login routers
app.use(loginRouters);

//404 page
app.use((req, res) => {
	res.status(404).render("404", {title: 404});
});
