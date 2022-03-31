const Test = require("../models/testSchema");
const {addZero} = require("../server/helpers/fns");

const checkTestResult = (test, data) => {
	let points = 0;
	let maxPoints = 0;
	let solvedTest = {};
	solvedTest.name = test.name;
	solvedTest.quests = [];
	test.quests.forEach(quest => {
		quest.badOption = [];
		quest.solvedCorrectOption = [];
		const {correctOption: options} = quest;
		const {badOption: badOptions} = quest;
		if (quest.type === "written") {
			quest.someBadOption = [];
			const {someBadOption: someBadOptions} = quest;
			if (data.hasOwnProperty(quest.index)) {
				if (quest.letterSize) {
					if (data[quest.index].includes(options[0])) {
						points += quest.points;
						quest.solvedCorrectOption.push(data[quest.index]);
					} else if (data[quest.index].toLowerCase().includes(options[0].toLowerCase())) {
						if (quest.negativePoints) points += quest.points - quest.negativePoints;
						someBadOptions.push(data[quest.index]);
					} else {
						badOptions.push(data[quest.index]);
					}
				} else {
					if (data[quest.index].toLowerCase().includes(options[0].toLowerCase())) {
						points += quest.points;
						quest.solvedCorrectOption.push(data[quest.index]);
					} else {
						badOptions.push(data[quest.index]);
					}
				}
			}
			maxPoints += quest.points;
		} else {
			if (data.hasOwnProperty(quest.index)) {
				if (quest.type === "single") {
					options.forEach(option => {
						if (data[quest.index].includes(option)) {
							points += quest.points;
							quest.solvedCorrectOption.push(data[quest.index]);
						} else {
							badOptions.push(data[quest.index]);
						}
					});
				} else {
					let allCorrect = true;
					options.forEach(option => {
						if (data[quest.index].includes(option)) {
							points += quest.points;
						} else {
							allCorrect = false;
						}
					});

					//marge thoose both functions | ^
					//                           V |

					if (!Array.isArray(data[quest.index])) data[quest.index] = [data[quest.index]];
					data[quest.index].forEach(answear => {
						if (!options.includes(answear)) {
							badOptions.push(answear);
						} else {
							quest.solvedCorrectOption.push(answear);
						}
					});

					if (allCorrect && quest.bonusPoints) points += quest.bonusPoints;
					if (data[quest.index].length > options.length && Array.isArray(data[quest.index])) {
						const bads = data[quest.index].length - options.length;
						if (quest.negativePoints) points -= quest.negativePoints * bads;
					}
				}
			}

			options.forEach(option => {
				maxPoints += quest.points;
			});
		}
		solvedTest.quests.push(quest);
	});

	return {
		points,
		maxPoints,
		solvedTest
	};
};

const openTest = async (req, res) => {
	try {
		const newIP = req.header("x-forwarded-for") || req.connection.remoteAddress;
		const id = req.query.tid;
		const test = await Test.findById(id);
		if (!test || !test.public) {
			res.render("404-test", {title: "404"});
		} else {
			const blocked = test.solversIP.some(solver => {
				if (solver[0] === newIP) {
					if (solver[1] >= test.limitedSolutionsCount) {
						return true;
					}
				}
				return false;
			});

			if (!blocked) {
				let available = true;
				const now = new Date();
				now.setDate(now.getDate());
				now.setHours(now.getHours() + 2);
				if (test.testStartDate) {
					const start = now - test.testStartDate;
					const end = now - test.testEndDate;
					if (start >= 0 && end < 0) available = true;
					else available = false;
				}

				if (available) {
					if (test.bonusLock) {
						if (req.body.bonusLock) {
							if (req.body.bonusLock === test.bonusLock) {
								res.render("testMainPage", {test});
							} else {
								res.render("testNotAvailable", {errorInfo: "Code is incorrect"});
							}
						} else {
							res.render("blockedTestPage", {title: "Test", id});
						}
					} else {
						res.render("testMainPage", {test});
					}
				} else {
					res.render("testNotAvailable", {errorInfo: "Test isn't available"});
				}
			} else {
				res.render("testNotAvailable", {errorInfo: "You used all tries to solve this test"});
			}
		}
	} catch {
		res.render("404-test", {title: "404"});
	}
};

const checkTest = async (req, res) => {
	const data = req.body;
	const newIP = req.header("x-forwarded-for") || req.connection.remoteAddress;
	if (Array.isArray(data.id)) data.id = data.id[0]; //bug handle for firefox
	if (data.id.length === 12 || data.id.length === 24) {
		const test = await Test.findById(data.id);
		const errors = [];
		if (!test) {
			errors.push("no-exist");
		} else if (test.public) {
			if (data.bonusLock) {
				openTest(req, res);
			} else {
				if (!req.body.authorName.length || !req.body.authorSurname.length) errors.push("novalid");
				let existsIPIndex = -1;
				let existsIP;
				let solvesCount = 0;
				if (test.limitedSolutionsCount !== Infinity) {
					test.solversIP.every(([ip, counter], index) => {
						if (ip === newIP) {
							existsIP = ip;
							solvesCount = counter;
							existsIPIndex = index;
							return false;
						}
						return true;
					});
				}

				const {points, maxPoints, solvedTest} = checkTestResult(test, data);

				const person = {
					name: req.body.authorName,
					surname: req.body.authorSurname,
					points,
					maxPoints,
					solvedTest,
					time: `${addZero(new Date().getHours())}:${addZero(new Date().getMinutes())}`
				};

				solvesCount++;
				if (existsIP && test.limitedSolutionsCount !== 0) {
					test.solversIP.splice(existsIPIndex, 1, [existsIP, solvesCount]);
				} else if (test.limitedSolutionsCount === 0) {
					test.solversIP.splice(existsIPIndex, 1, [existsIP, Infinity]);
				} else {
					test.solversIP.push([newIP, 1]);
				}

				test.solvedBy.push(person);

				if (!errors.length) {
					test
						.save()
						.then(result => res.json({points, maxPoints}))
						.catch(err => console.log(err));
				} else {
					res.json({errors});
				}
			}
		} else {
			errors.push("no-public");
		}
	} else {
		res.json({errors: ["no-exist"]});
	}
};

const showResult = (req, res) => {
	res.render("testResult");
};

module.exports = {
	openTest,
	showResult,
	checkTest
};
