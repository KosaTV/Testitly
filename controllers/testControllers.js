const Test = require("../models/testSchema");
const User = require("../models/userSchema");

const clearDatabase = (req, res) => {
	Test.deleteMany();
};

const getTests = async (req, res) => {
	const user = await User.findById(req.user.id);
	let tests = user.tests;
	tests = tests.map(async id => {
		const test = await Test.findById(id);
		return test;
	});

	Promise.all(tests).then(tests => {
		res.json(tests);
	});
};

const createTest = async (req, res) => {
	const user = await User.findById(req.user.id);
	const test = new Test(req.body);
	const savedTest = await test.save();

	user.tests.push(savedTest._id.toString());
	await user.save();
	res.send(savedTest);
};

const removeTest = async (req, res) => {
	const id = req.params.id;
	const user = await User.findById(req.user.id);
	const removedTest = await Test.findByIdAndDelete(id);
	user.tests = user.tests.filter(id => id !== removedTest._id.toString());
	await user.save();
	res.json(removedTest);
};

const updateTestProperties = async (req, res) => {
	const data = req.body;
	const id = req.params.id;
	const test = await Test.findById(id);
	if (test) {
		if (data.public !== undefined) test.public = data.public;
		if (data.bonusLockTest === "true") test.bonusLock = data.code;
		else test.bonusLock = "";

		if (data.solvedBy) test.solvedBy = data.solvedBy;
		if (data.solutionsCount) test.limitedSolutionsCount = data.solutionsCount === 0 || data.solutionsCount >= 999 ? 999 : data.solutionsCount;
		if (data.testStartTime && data.testStartDate && data.testEndTime && data.testEndDate) {
			const startTime = data.testStartTime.split(":");
			const startDate = data.testStartDate.split("/");
			const forMonth = +startDate[0] - 1;
			const forDay = +startDate[1];
			const forYear = +startDate[2];
			const forHours = +startTime[0] + 2;
			const forMinutes = +startTime[1];

			const testStartDate = new Date(forYear, forMonth, forDay, forHours, forMinutes);
			test.testStartDate = testStartDate;

			const endTime = data.testEndTime.split(":");
			const endDate = data.testEndDate.split("/");
			const toMonth = +endDate[0] - 1;
			const toDay = +endDate[1];
			const toYear = +endDate[2];
			const toHours = +endTime[0] + 2;
			const toMinutes = +endTime[1];

			const testEndDate = new Date(toYear, toMonth, toDay, toHours, toMinutes);
			test.testEndDate = testEndDate;
		}
		test
			.save()
			.then(result => {
				res.json(result);
			})
			.catch(err => console.log(err));
	}
};

const updateTest = async (req, res) => {
	const newTest = req.body;
	const _id = req.params.id;
	await Test.updateOne({_id}, newTest);
	res.end();
};

module.exports = {
	getTests,
	createTest,
	removeTest,
	updateTestProperties,
	updateTest,
	clearDatabase
};
