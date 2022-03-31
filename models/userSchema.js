const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true
		},

		surname: {
			type: String,
			required: true
		},

		username: {
			type: String,
			required: true
		},

		email: {
			type: String,
			required: true
		},

		password: {
			type: String,
			required: true
		},

		tests: {
			type: Array,
			default: [String],
			require: false
		}
	},
	{timestamps: true}
);

//initialization of User model
const User = mongoose.model("User", userSchema);

module.exports = User;
