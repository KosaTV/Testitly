const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const testSchema = new Schema(
	{
		name: {
			type: String,
			required: true
		},

		public: {
			type: Boolean,
			default: false,
			required: true
		},

		bonusLock: {
			type: String,
			default: ""
		},

		testStartDate: {
			type: Date
		},

		testEndDate: {
			type: Date
		},

		quests: {
			type: Array,
			required: true
		},

		solvedBy: {
			type: Array,
			required: true
		},

		solversIP: {
			type: Array,
			default: [],
			required: true
		},

		limitedSolutionsCount: {
			type: Number,
			default: 1,
			required: true
		}
	},
	{timestamps: true}
);

const Test = mongoose.model("test", testSchema);

module.exports = Test;
