const testManager = new Window("My tests");

testManager.window.classList.add("test-manager");

const testManagerCreateButton = document.createElement("button");
const testManagerRefreshButton = document.createElement("button");
const testManagerUploadButton = document.createElement("button");
const testManagerSearchField = document.createElement("input");
testManagerSearchField.type = "text";
testManagerSearchField.placeholder = "Search a test";
testManagerCreateButton.classList.add("window__button", "window__button--create");
testManagerRefreshButton.classList.add("window__button", "window__button--ico", "window__button--refresh");
testManagerUploadButton.classList.add("window__button", "window__button--ico", "window__button--upload");
testManagerSearchField.classList.add("window__input");
testManagerCreateButton.innerHTML = "Create test";
testManagerRefreshButton.innerHTML = `<i class="fas fa-sync-alt"></i>`;
testManagerUploadButton.innerHTML = `<i class="fas fa-upload"></i>`;
const testManagerTopBar = document.createElement("div");
testManagerTopBar.classList.add("window__top-bar");
const testManagerTestsList = document.createElement("div");
testManagerTestsList.classList.add("window__tests");

testManagerTopBar.appendChild(testManagerSearchField);
testManagerTopBar.appendChild(testManagerCreateButton);
testManagerTopBar.appendChild(testManagerRefreshButton);
testManagerTopBar.appendChild(testManagerUploadButton);
testManager.content.appendChild(testManagerTopBar);
testManager.content.appendChild(testManagerTestsList);

const debounce = (fn, delay) => {
	let debTimeoutId;

	return () => {
		clearTimeout(debTimeoutId);
		debTimeoutId = setTimeout(fn, delay);
	};
};

const percentFrom = (nominator, denominator) => {
	const result = ((nominator / denominator) * 100).toString();
	const resultNum = (nominator / denominator) * 100;
	const dot = result.indexOf(".");
	if (result.length > 4 && result.charAt(dot + 1) === "0") return resultNum.toFixed();
	else if (result.length > 3 && result < 100) return resultNum.toFixed(1);
	return resultNum;
};

HTMLElement.prototype.addLoader = function () {
	const loader = document.createElement("div");
	loader.classList.add("loader");
	const height = 30;
	const width = 30;
	loader.style.height = `${height}px`;
	loader.style.width = `${width}px`;
	const content = this.closest(".window__content");
	const contentHeight = content.clientHeight;
	const contentWidth = content.clientWidth;

	this.style = "position: relative;";
	loader.style.position = "absolute";
	loader.style.setProperty("top", `${contentHeight / 2 - height}px`);
	loader.style.setProperty("left", `${contentWidth / 2 - width}px`);
	this.innerHTML = "";
	this.appendChild(loader);
	this.appendChild(loader);
};

HTMLElement.prototype.removeLoader = function () {
	const loader = this.querySelector(".loader");
	this.removeAttribute("style");
	loader.remove();
};

testManagerSearchField.addEventListener(
	"input",
	debounce(() => {
		testManager.read({name: testManagerSearchField.value});
	}, 300)
);

testManager.searchTest = async testId => {
	try {
		let selectedTest = null;
		selectedTest = await getTests().then(tests => {
			tests.every(test => {
				if (test._id === testId) {
					selectedTest = test;
					return false;
				}
				return true;
			});
			return selectedTest;
		});
		return selectedTest;
	} catch {
		return addCommunicat("We cannot connect with server");
	}
};

testManager.creatingTestItem = async (configWindow = null, status) => {
	const winContent = configWindow.window;
	const title = winContent.querySelector(".window__input").value;
	const solutions = winContent.querySelectorAll(".window__sol-box");

	const test = document.createElement("div");
	test.classList.add("test");
	const config = {
		name: title,
		public: status,
		quests: [],
		solvedBy: []
	};

	solutions.forEach((el, num) => {
		const title = el.querySelector(".tox-edit-area__iframe").contentWindow.document.querySelector("body").innerHTML;
		const optionsValue = [];
		let correctOption = [];
		const questionType = el.querySelector(".window__answears").dataset.type;
		if (questionType === "single" || questionType === "multiple") {
			const options = el.querySelectorAll(".window__answear");
			options.forEach(option => {
				optionsValue.push(option.querySelectorAll("input")[1].value);
				if (option.querySelectorAll("input")[0].checked) {
					correctOption.push(option.querySelectorAll("input")[0].value);
				}
			});

			let question;
			if (questionType === "single") {
				question = {
					index: `quest${num + 1}`,
					name: title,
					type: el.querySelector(".window__answears").dataset.type,
					options: optionsValue,
					correctOption: correctOption,
					points: +el.querySelector(".window__input--points").value
				};
			} else {
				question = {
					index: `quest${num + 1}`,
					name: title,
					type: el.querySelector(".window__answears").dataset.type,
					options: optionsValue,
					correctOption: correctOption,
					points: +el.querySelector(".window__input--points").value,
					negativePoints: +el.querySelector(".window__input--negative-points").value,
					bonusPoints: +el.querySelector(".window__input--bonus-points").value
				};
			}
			config.quests.push(question);
		} else if (el.querySelector(".window__answears").dataset.type === "written") {
			const option = el.querySelector(".window__answear");
			correctOption.push(option.querySelector("input").value);

			const question = {
				index: `quest${num + 1}`,
				name: title,
				type: el.querySelector(".window__answears").dataset.type,
				options: correctOption,
				correctOption: correctOption,
				letterSize: option.querySelector(`input[type="checkbox"]`).checked,
				points: +el.querySelector(".window__input--points").value,
				negativePoints: +el.querySelector(".window__input--negative-points").value
			};
			config.quests.push(question);
		}
	});
	const data = JSON.stringify(config);
	const testToEdit = await testManager.searchTest(config.id);
	if (winContent.querySelector(".window__title").textContent === "Test Editor") {
		const id = winContent.dataset.id;
		fetch(`/tests/${id}`, {
			method: "PUT",
			headers: {
				"Content-type": "application/json"
			},
			body: data
		})
			.then(res => testManager.read())
			.catch(err => addCommunicat("We cannot connect with server"));
	} else {
		if (testToEdit) {
			addCommunicat("This test name is busy");
		} else {
			fetch("/tests", {
				method: "POST",
				headers: {
					"Content-type": "application/json"
				},
				body: data
			})
				.then(res => testManager.read())
				.catch(err => addCommunicat("We cannot connect with server"));
		}
	}

	if (configWindow) configWindow.removeWindow();
};

testManager.read = (filter = {}) => {
	testManagerTestsList.addLoader();
	getTests()
		.then(tests => {
			tests.forEach(config => {
				const test = document.createElement("div");
				const testInfo = document.createElement("div");
				const testName = document.createElement("span");
				const testDate = document.createElement("span");
				const containerBtn = document.createElement("div");
				const publicBtn = document.createElement("div");
				const removeBtn = document.createElement("button");
				const setBtn = document.createElement("button");
				const openBtn = document.createElement("button");
				const editBtn = document.createElement("button");
				containerBtn.classList.add("test-manager__container-btn");
				publicBtn.classList.add("test-manager__public-btn");
				if (config.public) {
					publicBtn.classList.add("test-manager__public-btn--active");
				}
				removeBtn.classList.add("window__item-button", "window__item-button--remove");
				setBtn.classList.add("window__item-button", "window__item-button--set");
				openBtn.classList.add("window__item-button", "window__item-button--open");
				editBtn.classList.add("window__item-button", "window__item-button--edit");
				removeBtn.innerHTML = `<i class="fas fa-times"></i>`;
				openBtn.innerHTML = `<i class="far fa-eye"></i>`;
				setBtn.innerHTML = `<i class="fas fa-cog"></i>`;
				editBtn.innerHTML = `<i class="fas fa-edit"></i>`;
				testName.classList.add("test-manager__name");
				testDate.classList.add("test-manager__date");
				test.dataset.id = config._id;
				testDate.innerHTML = `Created at: ${config.createdAt.slice(0, 10)} ${config.createdAt.substring(11, 19)}`;
				test.classList.add("window__test");
				testName.textContent = config.name;
				testInfo.appendChild(testName);
				testInfo.appendChild(testDate);
				test.appendChild(testInfo);
				containerBtn.appendChild(setBtn);
				containerBtn.appendChild(openBtn);
				containerBtn.appendChild(editBtn);
				containerBtn.appendChild(removeBtn);
				containerBtn.appendChild(publicBtn);
				test.appendChild(containerBtn);
				if (Object.entries(filter).length) {
					let found = false;
					for (property in filter) {
						if (filter.hasOwnProperty(property)) {
							if (config[property].toLowerCase().trim().includes(filter[property].toLowerCase().trim())) {
								found = true;
								testManagerTestsList.appendChild(test);
							}
						}
						if (found) break;
					}
				} else {
					testManagerTestsList.appendChild(test);
				}
			});
		})
		.catch(err => addCommunicat("We cannot connect with server"))
		.finally(() => testManagerTestsList.removeLoader());
};

testManager.testReader = config => {
	const reader = new Window(config.name, 70, 90);
	reader.addWindow();
	reader.window.classList.add("reader");
	const solutions = document.createElement("div");
	solutions.classList.add("reader__solutions");
	reader.content.appendChild(solutions);
	config.quests.forEach((solution, i) => {
		const box = document.createElement("div");
		box.classList.add("reader__box");
		const header = document.createElement("div");
		header.classList.add("reader__header");
		const answears = document.createElement("div");
		header.innerHTML = solution.name;
		const pointsContainer = document.createElement("div");
		pointsContainer.classList.add("reader__points-cnt");
		if (solution.type !== "written") {
			solution.options.forEach((option, j) => {
				const answear = document.createElement("div");
				answear.classList.add("reader__answear");
				const input = document.createElement("input");
				const content = document.createElement("label");
				content.classList.add("reader__label");
				input.value = `answear${j + 1}`;
				input.name = `answear${i + 1}`;
				if (solution.type === "single") {
					input.type = "radio";
				} else if (solution.type === "multiple") {
					input.type = "checkbox";
				}
				input.classList.add("reader__input");
				input.setAttribute("disabled", "");
				answears.classList.add("reader__answears");
				content.appendChild(input);
				content.append(option);
				answear.appendChild(content);
				answears.appendChild(answear);
			});
		} else {
			solution.correctOption.forEach(correct => {
				const answear = document.createElement("div");
				answear.classList.add("reader__answear");
				const typeAnswear = document.createElement("span");
				typeAnswear.textContent = correct;
				typeAnswear.classList.add("reader__type-answear");
				answears.classList.add("reader__answears");
				answear.appendChild(typeAnswear);
				answears.appendChild(answear);
				if (solution.letterSize) {
					const info = document.createElement("p");
					info.classList.add("reader__info");
					info.textContent = "Letter size is included";
					answears.appendChild(info);
				}
			});
		}
		pointsContainer.textContent = `${solution.points}p`;
		box.appendChild(header);
		box.appendChild(answears);
		box.appendChild(pointsContainer);
		solutions.appendChild(box);
		if (solution.type !== "written") {
			if (!solution.solvedCorrectOption) {
				solution.correctOption.forEach(correct => {
					Array.from(answears.children).forEach(answear => {
						if (answear.querySelector(".reader__input").value === correct) {
							answear.querySelector("label").classList.add("reader__label--correct");
						}
					});
				});
			} else {
				solution.solvedCorrectOption.forEach(correct => {
					Array.from(answears.children).forEach(answear => {
						if (answear.querySelector(".reader__input").value === correct) {
							if (answear.classList.contains("reader__answear")) {
								answear.querySelector(".reader__label").classList.add("reader__label--correct");
							}
						}
					});
				});
			}

			if (solution.badOption) {
				solution.badOption.forEach(bad => {
					Array.from(answears.children).forEach(answear => {
						if (answear.querySelector(".reader__input").value === bad) {
							if (answear.classList.contains("reader__answear")) {
								answear.querySelector(".reader__label").classList.add("reader__label--bad");
							}
						}
					});
				});
			}
		} else {
			if (solution.badOption || solution.someBadOption) {
				if (solution.badOption.length) {
					solution.badOption.forEach(bad => {
						Array.from(answears.querySelectorAll(".reader__answear")).forEach(answear => {
							const badAnswear = document.createElement("span");
							if (bad.length) {
								badAnswear.textContent = bad;
							} else {
								const com = document.createElement("div");
								com.classList.add("reader__com");
								com.textContent = "No answear";
								badAnswear.appendChild(com);
							}
							badAnswear.classList.add("reader__type-answear", "reader__type-answear--bad");
							answear.querySelector(".reader__type-answear").replaceWith(badAnswear);
						});
					});
				} else if (solution.someBadOption.length) {
					solution.someBadOption.forEach(someBad => {
						Array.from(answears.querySelectorAll(".reader__answear")).forEach(answear => {
							const someBadAnswear = document.createElement("span");
							someBadAnswear.textContent = someBad;
							someBadAnswear.classList.add("reader__type-answear", "reader__type-answear--some-bad");
							answear.querySelector(".reader__type-answear").replaceWith(someBadAnswear);
						});
					});
				}
			} else {
				Array.from(answears.children).forEach(answear => {
					if (answear.classList.contains("reader__answear")) {
						answear.querySelector(".reader__type-answear").classList.add("reader__type-answear--correct");
					}
				});
			}
		}
	});
};

testManager.testEditor = config => {
	const reader = new Window(config.name, 50, 70);
	reader.addWindow();
	const solutions = document.createElement("div");
	solutions.classList.add("editer__solutions");
	reader.content.appendChild(solutions);
	config.quests.forEach((solution, i) => {
		const box = document.createElement("div");
		box.classList.add("editer__box");
		const header = document.createElement("div");
		header.classList.add("editer__header");
		const answears = document.createElement("div");
		header.textContent = solution.name;
		const pointsContainer = document.createElement("div");
		pointsContainer.classList.add("editer__points-cnt");
		if (solution.type !== "written") {
			solution.options.forEach((option, j) => {
				const answear = document.createElement("div");
				answear.classList.add("editer__answear");
				const input = document.createElement("input");
				const content = document.createElement("label");
				content.classList.add("editer__label");
				input.value = `answear${j + 1}`;
				input.name = `answear${i + 1}`;
				if (solution.type === "single") {
					input.type = "radio";
				} else if (solution.type === "multiple") {
					input.type = "checkbox";
				}
				input.classList.add("editer__input");
				input.setAttribute("disabled", "");
				answears.classList.add("editer__answears");
				content.appendChild(input);
				content.append(option);
				answear.appendChild(content);
				answears.appendChild(answear);
			});
		} else {
			solution.correctOption.forEach(correct => {
				const answear = document.createElement("div");
				answear.classList.add("editer__answear");
				const typeAnswear = document.createElement("span");
				typeAnswear.textContent = correct;
				typeAnswear.classList.add("editer__type-answear");
				answears.classList.add("editer__answears");
				answear.appendChild(typeAnswear);
				answears.appendChild(answear);
				if (solution.letterSize) {
					const info = document.createElement("p");
					info.classList.add("editer__info");
					info.textContent = "Letter size is included";
					answears.appendChild(info);
				}
			});
		}
		pointsContainer.textContent = `${solution.points}p`;
		box.appendChild(header);
		box.appendChild(answears);
		box.appendChild(pointsContainer);
		solutions.appendChild(box);
		if (solution.type !== "written") {
			solution.correctOption.forEach(correct => {
				Array.from(answears.children).forEach(answear => {
					if (answear.querySelector(".editer__input").value === correct) {
						answear.querySelector("label").classList.add("editer__label--correct");
					}
				});
			});
		} else {
			Array.from(answears.children).forEach(answear => {
				if (answear.classList.contains("editer__answear")) {
					answear.querySelector(".editer__type-answear").classList.add("editer__type-answear--correct");
				}
			});
		}
	});
};

testManager.testUploader = () => {
	const uploader = new Window("Test uploader", 20, 30, {
		maximizable: false
	});
	uploader.window.classList.add("uploader");
	const input = document.createElement("textarea");
	input.setAttribute("spellcheck", "false");
	input.placeholder = "Here paste your test code";
	input.classList.add("uploader__input");
	const bottomBar = document.createElement("div");
	const uploadButton = document.createElement("button");
	uploadButton.classList.add("window__button", "uploader__upload-button");
	uploadButton.textContent = "Upload test";
	bottomBar.classList.add("window__bottom-bar");
	bottomBar.appendChild(uploadButton);
	uploader.content.appendChild(input);
	uploader.content.appendChild(bottomBar);

	uploader.window.addEventListener("click", async e => {
		if (e.target.closest(".uploader__upload-button")) {
			const config = input.value;
			const test = await testManager.searchTest(JSON.parse(config).name);
			if (!test) {
				fetch("/tests", {
					method: "POST",
					headers: {
						"Content-type": "application/json"
					},
					body: config
				})
					.then(res => testManager.read())
					.catch(err => addCommunicat("We cannot connect with server"));
			} else {
				addCommunicat("This test name is busy");
			}
			uploader.removeWindow();
		}
	});

	uploader.addWindow();
};

testManager.window.addEventListener("click", async e => {
	if (e.target.closest(".window__button--create") || e.target.closest(".window__item-button--edit")) {
		let title = "Test Creator";
		let id;
		let status = false;
		if (e.target.closest(".window__item-button--edit")) {
			title = "Test Editor";
			id = e.target.closest(".window__test").dataset.id;
			status = !!e.target.closest(".window__test").querySelector(".test-manager__public-btn--active");
		}
		const creatingTest = new Window(title, 70, 80);
		creatingTest.addWindow();

		creatingTest.window.classList.add("creating-test");
		if (id) creatingTest.window.dataset.id = id;
		const creatingTestTitle = document.createElement("input");
		creatingTestTitle.type = "text";
		creatingTestTitle.classList.add("window__input");
		const creatingTestHeader = document.createElement("div");
		creatingTestHeader.classList.add("window__test-title");
		creatingTestTitle.placeholder = "Test name";
		creatingTestHeader.appendChild(creatingTestTitle);
		const creatingTestAddSol = document.createElement("button");
		creatingTestAddSol.classList.add("window__button", "window__button--add-sol");
		creatingTestAddSol.innerHTML = "Add solution";
		const creatingTestSaveTest = document.createElement("button");
		creatingTestSaveTest.innerHTML = "Save";
		creatingTestSaveTest.classList.add("window__button", "window__button--save");
		creatingTestSaveTest.dataset.status = status;
		creatingTestHeader.appendChild(creatingTestAddSol);
		creatingTestHeader.appendChild(creatingTestSaveTest);
		const solutionsList = document.createElement("div");
		solutionsList.classList.add("window__solutions");
		creatingTest.content.appendChild(creatingTestHeader);
		creatingTest.content.appendChild(solutionsList);

		const createSolution = (num, place) => {
			for (let i = 1; i <= num; i++) {
				const creatingTestSolAnswear = document.createElement("div");
				creatingTestSolAnswear.classList.add("window__answear");
				const creatingTestSolAnswearRadio = document.createElement("input");

				if (place.dataset.type !== "written") {
					if (place.dataset.type === "single") {
						creatingTestSolAnswearRadio.type = "radio";
						creatingTestSolAnswearRadio.classList.add("window__radio");
					} else if (place.dataset.type === "multiple") {
						creatingTestSolAnswearRadio.type = "checkbox";
						creatingTestSolAnswearRadio.classList.add("window__checkbox");
					}

					creatingTestSolAnswearRadio.name = `answear${
						Array.prototype.indexOf.call(place.closest(".window__solutions").querySelectorAll(".window__sol-box"), place.closest(".window__sol-box")) + 1
					}`;
					const creatingTestSolAnswearLabel = document.createElement("input");
					creatingTestSolAnswearLabel.classList.add("window__input");

					solutionsList.querySelectorAll(".window_box-sol");

					creatingTestSolAnswear.appendChild(creatingTestSolAnswearRadio);
					creatingTestSolAnswear.appendChild(creatingTestSolAnswearLabel);

					place.appendChild(creatingTestSolAnswear);

					const creatingTestSolAnswearDel = document.createElement("div");
					creatingTestSolAnswearDel.classList.add("window__ans-button", "window__ans-button--remove");
					creatingTestSolAnswearDel.innerHTML = `<i class="fas fa-times"></i>`;
					creatingTestSolAnswear.appendChild(creatingTestSolAnswearDel);
					const allRadio = creatingTestSolAnswear.closest(".window__answears").children;
					creatingTestSolAnswearLabel.placeholder = `Answear ${allRadio.length}`;
					creatingTestSolAnswearRadio.value = `answear${allRadio.length}`;
				} else {
					if (place.children.length === 0) {
						creatingTestSolAnswearRadio.placeholder = "Type your answear";
						creatingTestSolAnswearRadio.classList.add("window__input", "window__input--answear-type");
						const letterTypes = document.createElement("input");
						letterTypes.type = "checkbox";
						letterTypes.classList.add("window__checkbox");
						const label = document.createElement("label");
						label.appendChild(letterTypes);
						label.append("To include letters size");
						label.classList.add("window__label");
						creatingTestSolAnswearRadio.type = "text";
						creatingTestSolAnswearRadio.classList.add("window__input");
						creatingTestSolAnswear.appendChild(creatingTestSolAnswearRadio);
						creatingTestSolAnswear.appendChild(label);
						place.appendChild(creatingTestSolAnswear);
					} else {
						addCommunicat("You cannot add next written answear");
					}
				}
			}

			tinymce.init({
				selector: ".window__text-editor",
				resize: false
			});
		};

		const createQuestion = (num = 3) => {
			const solBoxMain = document.createElement("div");
			solBoxMain.classList.add("window__answears");
			solBoxMain.dataset.type = "single";

			const solBox = document.createElement("div");
			solBox.classList.add("window__sol-box");

			const solBoxHeader = document.createElement("div");
			solBoxHeader.classList.add("window__sol-box-header");

			const solBoxToolBar = document.createElement("div");
			solBoxToolBar.classList.add("window__tool-bar");

			const solBoxClose = document.createElement("button");
			solBoxClose.classList.add("window__box-button", "window__box-button--close");
			solBoxClose.innerHTML = `<i class="fas fa-times"></i>`;

			const solBoxKind = document.createElement("button");
			solBoxKind.classList.add("window__box-button", "window__box-button--kind");
			solBoxKind.innerHTML = `<i class="fas fa-list"></i>`;

			const solBoxAdd = document.createElement("button");
			solBoxAdd.classList.add("window__box-button", "window__box-button--add");
			solBoxAdd.innerHTML = `<i class="fas fa-plus"></i>`;

			const solBoxSet = document.createElement("button");
			solBoxSet.classList.add("window__box-button", "window__box-button--set");
			solBoxSet.innerHTML = `<i class="fas fa-cog"></i>`;

			const solBoxPoints = document.createElement("input");
			solBoxPoints.type = "number";
			solBoxPoints.min = 0;
			solBoxPoints.max = 100;
			solBoxPoints.value = "1";
			solBoxPoints.placeholder = "Points";
			solBoxPoints.classList.add("window__input", "window__input--option", "window__input--points");
			solBoxPoints.name = "points";
			solBoxPoints.disabled = true;

			let solBoxNegativePoints;
			let solBoxBonusPoints;

			if (solBoxMain.dataset.type !== "single") {
				solBoxNegativePoints = document.createElement("input");
				solBoxNegativePoints.type = "number";
				solBoxNegativePoints.min = 0;
				solBoxNegativePoints.max = 100;
				solBoxNegativePoints.value = 1;
				solBoxNegativePoints.placeholder = "minus points";
				solBoxNegativePoints.classList.add("window__input", "window__input--negative-points");
				solBoxNegativePoints.name = "negativePoints";
				solBoxNegativePoints.disabled = true;

				if (solBoxMain.dataset.type !== "written") {
					solBoxBonusPoints = document.createElement("input");
					solBoxBonusPoints.type = "number";
					solBoxBonusPoints.min = 0;
					solBoxBonusPoints.max = 100;
					solBoxBonusPoints.value = 0;
					solBoxBonusPoints.placeholder = "minus points";
					solBoxBonusPoints.classList.add("window__input", "window__input--option", "window__input--bonus-points");
					solBoxBonusPoints.name = "bonusPoints";
					solBoxBonusPoints.disabled = true;
				}
			}

			const solBoxTitle = document.createElement("div");
			const solTitle = document.createElement("textarea");
			solTitle.classList.add("window__text-editor", "window__text-editor--title");
			solTitle.placeholder = "Type your question";
			solBoxHeader.appendChild(solBoxClose);
			solBox.appendChild(solBoxHeader);
			const solBoxOptions = document.createElement("div");
			solBoxOptions.classList.add("options");
			solBoxToolBar.appendChild(solBoxOptions);

			if (solBoxNegativePoints) {
				solBoxOptions.appendChild(solBoxNegativePoints);
			}

			if (solBoxBonusPoints) {
				solBoxOptions.appendChild(solBoxBonusPoints);
			}

			solBoxToolBar.appendChild(solBoxPoints);
			solBoxToolBar.appendChild(solBoxSet);
			solBoxToolBar.appendChild(solBoxAdd);
			solBoxToolBar.appendChild(solBoxKind);
			solBox.appendChild(solBoxToolBar);
			solBox.appendChild(solBoxTitle);
			solBoxTitle.appendChild(solTitle);
			solBox.appendChild(solBoxMain);
			solutionsList.appendChild(solBox);
			createSolution(num, solBoxMain);
			const allBoxes = solutionsList.children;
			Array.from(allBoxes).forEach((item, num) => {
				const allRadio = item.querySelectorAll(".window__radio");
				for (const radio of allRadio) {
					radio.name = `answear${num}`;
				}
			});
		};

		if (e.target.closest(".window__button--create")) {
			createQuestion(3);
		} else {
			const testId = e.target.closest(".window__test").dataset.id;
			const config = await testManager.searchTest(testId);

			creatingTestTitle.value = config.name;

			config.quests.forEach(quest => {
				const solBox = document.createElement("div");
				solBox.classList.add("window__sol-box");

				const solBoxHeader = document.createElement("div");
				solBoxHeader.classList.add("window__sol-box-header");

				const solBoxToolBar = document.createElement("div");
				solBoxToolBar.classList.add("window__tool-bar");

				const solBoxClose = document.createElement("button");
				solBoxClose.classList.add("window__box-button", "window__box-button--close");
				solBoxClose.innerHTML = `<i class="fas fa-times"></i>`;

				const solBoxKind = document.createElement("button");
				solBoxKind.classList.add("window__box-button", "window__box-button--kind");
				solBoxKind.innerHTML = `<i class="fas fa-list"></i>`;

				const solBoxAdd = document.createElement("button");
				solBoxAdd.classList.add("window__box-button", "window__box-button--add");
				solBoxAdd.innerHTML = `<i class="fas fa-plus"></i>`;

				const solBoxSet = document.createElement("button");
				solBoxSet.classList.add("window__box-button", "window__box-button--set");
				solBoxSet.innerHTML = `<i class="fas fa-cog"></i>`;

				const solBoxPoints = document.createElement("input");
				solBoxPoints.type = "number";
				solBoxPoints.value = quest.points;
				solBoxPoints.placeholder = "Points";
				solBoxPoints.classList.add("window__input", "window__input--points");
				solBoxPoints.name = "points";
				solBoxPoints.disabled = true;

				let solBoxNegativePoints;
				let solBoxBonusPoints;

				if (quest.type !== "single") {
					solBoxNegativePoints = document.createElement("input");
					solBoxNegativePoints.type = "number";
					solBoxNegativePoints.min = 0;
					solBoxNegativePoints.max = 100;
					solBoxNegativePoints.value = quest.negativePoints;
					solBoxNegativePoints.placeholder = "minus points";
					solBoxNegativePoints.classList.add("window__input", "window__input--negative-points");
					solBoxNegativePoints.name = "negativePoints";
					solBoxNegativePoints.disabled = true;

					if (quest.type !== "written") {
						solBoxBonusPoints = document.createElement("input");
						solBoxBonusPoints.type = "number";
						solBoxBonusPoints.min = 0;
						solBoxBonusPoints.max = 100;
						solBoxBonusPoints.value = quest.bonusPoints;
						solBoxBonusPoints.placeholder = "minus points";
						solBoxBonusPoints.classList.add("window__input", "window__input--option", "window__input--bonus-points");
						solBoxBonusPoints.name = "bonusPoints";
						solBoxBonusPoints.disabled = true;
					}
				}

				const solBoxTitle = document.createElement("div");
				const solTitle = document.createElement("textarea");
				solTitle.classList.add("window__text-editor", "window__text-editor--title");
				solTitle.placeholder = "Type your question";
				solTitle.value = quest.name;
				const solBoxMain = document.createElement("div");
				solBoxMain.classList.add("window__answears");
				solBoxMain.dataset.type = quest.type;
				solBoxHeader.appendChild(solBoxClose);
				solBox.appendChild(solBoxHeader);
				const solBoxOptions = document.createElement("div");
				solBoxOptions.classList.add("options");
				solBoxToolBar.appendChild(solBoxOptions);

				if (solBoxNegativePoints) {
					solBoxOptions.appendChild(solBoxNegativePoints);
				}

				if (solBoxBonusPoints) {
					solBoxOptions.appendChild(solBoxBonusPoints);
				}

				solBoxToolBar.appendChild(solBoxPoints);
				solBoxToolBar.appendChild(solBoxSet);
				solBoxToolBar.appendChild(solBoxAdd);
				solBoxToolBar.appendChild(solBoxKind);
				solBox.appendChild(solBoxToolBar);
				solBox.appendChild(solBoxTitle);
				solBoxTitle.appendChild(solTitle);
				solBox.appendChild(solBoxMain);
				solutionsList.appendChild(solBox);
				createSolution(quest.options.length, solBoxMain);
				const allBoxes = solutionsList.children;
				Array.from(allBoxes).forEach((item, num) => {
					const allRadio = item.querySelectorAll(".window__radio");
					for (const radio of allRadio) {
						radio.name = `answear${num}`;
					}
				});

				quest.options.forEach((option, i) => {
					solBoxMain.children[i].querySelector(".window__input").value = option;
					if (solBoxMain.dataset.type !== "written" && quest.correctOption.includes(`answear${i + 1}`)) {
						solBoxMain.children[i].querySelector(`input`).checked = true;
					} else {
						if (quest.letterSize) {
							solBoxMain.querySelector(".window__checkbox").checked = true;
						}
					}
				});
			});
		}

		creatingTest.window.addEventListener("click", e => {
			e.stopImmediatePropagation();
			if (e.target.closest(".window__button--add-sol")) {
				createQuestion(3);
			} else if (e.target.closest(".window__box-button--close")) {
				if (e.currentTarget.querySelectorAll(".window__sol-box").length > 1) {
					e.target.closest(".window__sol-box").remove();
				} else {
					addCommunicat("You cannot remove last solution");
				}
			} else if (e.target.closest(".window__box-button--set")) {
				const question = e.target.closest(".window__sol-box");
				const solType = question.querySelector(".window__answears").dataset.type;
				let titleType;

				let points = question.querySelector(`input[name="points"]`);
				let negativePoints = question.querySelector(`input[name="negativePoints"]`);
				let bonusPoints = question.querySelector(`input[name="bonusPoints"]`);

				if (negativePoints === null) bonusPoints = 1;
				else negativePoints = negativePoints.value;
				if (bonusPoints === null) bonusPoints = 0;
				else bonusPoints = bonusPoints.value;

				if (solType === "multiple") titleType = "Multiple choice";
				else if (solType === "single") titleType = "Single choice";
				else if (solType === "written") titleType = "Written choice";
				let solTitle = question.querySelector(".window__text-editor--title").value;
				const temporaryElement = document.createElement("div");
				temporaryElement.innerHTML = solTitle;
				let convertedSolTitle = temporaryElement.textContent;

				if (!convertedSolTitle.length) convertedSolTitle = "";
				else convertedSolTitle = convertedSolTitle;
				const solSettings = new Window(`Solution: ${convertedSolTitle}`, 55, 90);
				solSettings.window.classList.add("solution-settings");
				solSettings.content.classList.add("content");

				let rulesSection;

				const pointsOption =
					/*HTML*/
					`
				<div class="option">
					<h2 class="box-content__header box-content__header--h2">Amount of points for correct answear</h2>
					<label class="box-content__label">
						Points for each correct answear:
						<input class="window__input" name="points" type="number" value="${points.value}" min="0">
					</label>
				</div>
				`;

				const negativePointsOption =
					/*HTML*/
					`
					<div class="option">
						<h2 class="box-content__header box-content__header--h2">Amount of negative points for wrong answear</h2>
							<label class="box-content__label">
							Negative points for each wrong answear:
							<input class="window__input" type="number" name="negativePoints" value="${negativePoints}" min="0">
							<p class="box-content__small-text box-content__small-text--info">
								<i class="fas fa-info-circle icon"></i> This scores are negative, for example: If you enter "1", when user will select wrong answear, he's gonna lose<strong class="strong"> 1 point</strong>.
							</p>
						</label>
					</div>
				`;

				const bonusPointsOption =
					/*HTML*/
					`
					<div class="option">
						<h2 class="box-content__header box-content__header--h2">Bonus points, when user selected all correct answears</h2>
						<label class="box-content__label">
							Bonus amount of points
							<input class="window__input" type="number" name="bonusPoints" value="${bonusPoints}" min="0">
							<p class="box-content__small-text box-content__small-text--info">
								<i class="fas fa-info-circle icon"></i>These points are not in range of maximum points of test. As result <strong class="strong">user can get more points than maximum points for that test</strong>.
							</p>
						</label>
					</div>
				`;

				rulesSection += pointsOption;

				if (solType === "multiple") {
					rulesSection += negativePointsOption;
					rulesSection += bonusPointsOption;
				} else if (solType === "written") {
					rulesSection += negativePointsOption;
				}

				const saveSection =
					/*HTML*/
					`
					<div class="save-section">
						<button class="window__button window__button--save">Save</button>
					</div>
				`;

				const section =
					/*HTML*/
					`
				<div class="box">
					<div class="box-header">
						<h1 class="box-header__header box-header__header--h1">Scoring Rules</h1>
					</div>
					<div class="box-content">
						<h2 class="box-content__header box-content__header--h3">Solution Type: <strong class="strong strong--info">${titleType}</strong></h2>
						${rulesSection}
					</div>
				${saveSection}
				`;

				const content = section;
				solSettings.content.innerHTML = content;
				solSettings.addWindow();

				const save = solSettings.content.querySelector(".window__button--save");
				const options = solSettings.content.querySelectorAll(".option");
				save.addEventListener("click", e => {
					let data = {};
					options.forEach(option => {
						const input = option.querySelector(".window__input");
						data[input.name] = input.value;
					});

					for (const [key, value] of Object.entries(data)) {
						const input = question.querySelector(`input[name="${key}"]`);
						input.value = value;
						input.setAttribute("value", value);
					}
				});
			} else if (e.target.closest(".window__box-button--add")) {
				const boxSol = e.target.closest(".window__sol-box").querySelector(".window__answears");
				createSolution(1, boxSol);
			} else if (e.target.closest(".window__ans-button--remove")) {
				const sol = e.target.closest(".window__answear");
				const sols = sol.closest(".window__answears").children;
				if (sols.length > 1) {
					sol.remove();
					Array.from(sols).forEach((item, num) => {
						item.querySelectorAll("input")[1].placeholder = `Answear ${num + 1}`;
					});
				} else {
					addCommunicat("You cannot remove last option");
				}

				Array.from(sols).forEach(sol => {
					sol.querySelector("input[type=radio]").value = `answear${Array.prototype.indexOf.call(sols, sol) + 1}`;
				});
			} else if (e.target.closest(".window__box-button--kind")) {
				const answearTypeList = addSelectList("Choose Type", 20, 14, "Single choice", "Multiple choice", "Written answear");
				const container = e.target.closest(".window__sol-box").querySelector(".window__answears");
				answearTypeList.window.addEventListener("click", e => {
					e.stopImmediatePropagation();

					const solBoxNegativePoints = document.createElement("input");
					const solBoxBonusPoints = document.createElement("input");
					const options = container.closest(".window__sol-box").querySelector(".options");

					solBoxNegativePoints.type = "number";
					solBoxNegativePoints.min = 0;
					solBoxNegativePoints.max = 100;
					solBoxNegativePoints.value = "1";
					solBoxNegativePoints.placeholder = "minus points";
					solBoxNegativePoints.classList.add("window__input", "window__input--negative-points");
					solBoxNegativePoints.name = "negativePoints";
					solBoxNegativePoints.disabled = true;

					solBoxBonusPoints.type = "number";
					solBoxBonusPoints.min = 0;
					solBoxBonusPoints.max = 100;
					solBoxBonusPoints.value = "0";
					solBoxBonusPoints.placeholder = "minus points";
					solBoxBonusPoints.classList.add("window__input", "window__input--option", "window__input--bonus-points");
					solBoxBonusPoints.name = "bonusPoints";
					solBoxBonusPoints.disabled = true;

					if (e.target.classList.contains("select-list__item") && e.target.textContent === "Single choice") {
						if (container.dataset.type !== "single") {
							container.dataset.type = "single";
							container.innerHTML = "";
							createSolution(3, container);
						}
					} else if (e.target.classList.contains("select-list__item") && e.target.textContent === "Multiple choice") {
						if (container.dataset.type !== "multiple") {
							container.dataset.type = "multiple";
							container.innerHTML = "";
							createSolution(3, container);
							options.appendChild(solBoxNegativePoints);
							options.appendChild(solBoxBonusPoints);
						}
					} else if (e.target.classList.contains("select-list__item") && e.target.textContent === "Written answear") {
						if (container.dataset.type !== "written") {
							container.dataset.type = "written";
							container.innerHTML = "";
							createSolution(1, container);
							options.appendChild(solBoxNegativePoints);
						}
					}
					answearTypeList.removeWindow();
				});
			} else if (e.target.closest(".window__button--save")) {
				if (creatingTestTitle.value.length) testManager.creatingTestItem(creatingTest, e.target.closest(".window__button--save").dataset.status);
			}
		});
	} else if (e.target.closest(".window__button--refresh")) {
		testManager.read(); // You will change it
	} else if (e.target.closest(".window__button--upload")) {
		testManager.testUploader();
	} else if (e.target.closest(".window__item-button--remove")) {
		const testId = e.target.closest(".window__item-button--remove").closest(".window__test").dataset.id;
		fetch(`/tests/${testId}`, {
			method: "DELETE",
			headers: {
				"Content-type": "application/json"
			}
		})
			.then(res => testManager.read())
			.catch(err => addCommunicat("We cannot connect with server"));
	} else if (e.target.closest(".window__item-button--open")) {
		const testId = e.target.closest(".window__item-button--open").closest(".window__test").dataset.id;
		const test = await testManager.searchTest(testId);

		testManager.testReader(test);
	} else if (e.target.closest(".window__item-button--set")) {
		let test;
		const testId = e.target.closest(".window__item-button--set").closest(".window__test").dataset.id;
		const settings = new Window("Test Settings", 60, 95);
		settings.window.classList.add("test-settings");
		settings.addWindow();

		settings.content.classList.add("explorer");

		const header = document.createElement("div");
		header.classList.add("explorer__header");
		const confTab = document.createElement("div");
		const infoTab = document.createElement("div");
		const accessTab = document.createElement("div");

		const content = document.createElement("div");
		content.classList.add("explorer__content");

		confTab.classList.add("explorer__tab", "explorer__tab--active", "explorer__tab--conf");
		infoTab.classList.add("explorer__tab", "explorer__tab--info");
		accessTab.classList.add("explorer__tab", "explorer__tab--access");

		confTab.innerHTML = `<span class="explorer__tab-text">Configuration</span> <i class="explorer__tab-icon fas fa-tools"></i>`;
		infoTab.innerHTML = `<span class="explorer__tab-text">Information</span> <i class="explorer__tab-icon fas fa-info"></i>`;
		accessTab.innerHTML = `<span class="explorer__tab-text">Access</span> <i class="explorer__tab-icon fas fa-share-alt"></i>`;

		header.appendChild(confTab);
		header.appendChild(accessTab);
		header.appendChild(infoTab);
		settings.content.appendChild(header);
		settings.content.appendChild(content);

		let currentTab = header.querySelector(".explorer__tab--active").textContent.trim();

		header.addEventListener("click", e => {
			e.stopImmediatePropagation();

			if (e.target.closest(".explorer__tab")) {
				Array.from(header.children).forEach(tab => {
					tab.classList.remove("explorer__tab--active");
				});
				e.target.closest(".explorer__tab").classList.add("explorer__tab--active");
				content.classList.remove(`explorer__content--${currentTab.toLowerCase()}`);
				currentTab = e.target.closest(".explorer__tab--active").textContent.trim();
				content.classList.add(`explorer__content--${currentTab.toLowerCase()}`);
			}
		});

		const refreshAccessTab = async e => {
			//test info update
			test = await testManager.searchTest(testId);
			let value = "";
			let checked = ``;
			let disabled = `disabled`;

			if (test.bonusLock) {
				value = test.bonusLock;
				checked = `checked`;
				disabled = ``;
			}

			const link = `/check?tid=${testId}`;
			const falseLink = `https://testitly.pl/check?tid=${testId}`; //for test
			content.innerHTML =
				/*HTML*/
				`
			<div class="box">
				<div class="box-header">
					<h1 class="box-header__header box-header__header--h1">Choose access option to your test</h1>
				</div>
					<div class="box-content">

					<div class="option">
						<h2 class="box-content__header box-content__header--h3">Link</h2>
						<h3 class="box-content__label">Test will active at this link for everyone:</h3>
						<a class="box-content__link" target="_blank" href=${link}>${falseLink}</a>
					</div>

					<div class="option">
					<h2 class="box-content__header box-content__header--h3">Code</h2>
						<p class="box-content__small-text box-content__small-text--info">
							<i class="fas fa-info-circle icon"></i>You can set the bonus lock, by setting a code for your test. Everyone, who has a link <strong class="strong">will need also this code</strong>
						</p>
						<label class="box-content__label">Test will be active for everyone, who knows this code: <input ${checked} class="window__input window__input--set-test-code window__input--radio" type="checkbox" name="bonusLockTest" value="${!!checked}"></label>
						<span class="info"><input type="text" class="window__input window__input--test-code" name="code" placeholder="code" ${disabled} value="${value}"></span>
					</div>
				</div>
				<button class="window__button window__button--save">Save</button>
			</div>
		`;
		};

		const refreshConfTab = async e => {
			test = await testManager.searchTest(testId);
			content.innerHTML =
				/*HTML*/
				`
				<div class="box">
					<div class="box-header">
						<h1 class="box-header__header box-header__header--h1">Configure your test</h1>
					</div>
						<div class="box-content">
						<div class="option">
							<h2 class="box-content__header box-content__header--h2">Test time</h2>
							<p class="box-content__small-text box-content__small-text--info">
							<i class="fas fa-info-circle icon"></i>You can set the time in your test, by setting time for your test, everyone, who starts test, will have defined time to solve it. <strong class="strong">Each Person will have same time</strong>, not dependly, when they started.
							</p>
							<span class="info">
								<div>
									<h3 class="box-content__header box-content__header--h3">For</h3>
									<input type="text" class="window__input window__input--test-start-time window__input--time" name="testStartTime" placeholder="MM:SS" value="${addZero(
										new Date().getHours()
									)}:${addZero(new Date().getMinutes())}" >
									<input type="text" class="window__input window__input--test-start-date window__input--date" name="testStartDate" placeholder="month/day/year" value="${addZero(
										new Date().getMonth() + 1
									)}/${addZero(new Date().getDate())}/${addZero(new Date().getFullYear())}">
								</div>
							</span>
							<span class="info">
								<div>
									<h3 class="box-content__header box-content__header--h3">To</h3>
									<input type="text" class="window__input window__input--test-end-time window__input--time" name="testEndTime" placeholder="MM:SS" value="${addZero(
										new Date().getHours() + 1
									)}:${addZero(new Date().getMinutes())}">
									<input type="text" class="window__input window__input--test-end--date window__input--date" name="testEndDate" placeholder="month/day/year" value="${addZero(
										new Date().getMonth() + 1
									)}/${addZero(new Date().getDate())}/${addZero(new Date().getFullYear())}">
								</div>
							</span>
						</div>
						<div class="option">
							<h2 class="box-content__header box-content__header--h2">Limited Solutions Count</h2>
							<p class="box-content__small-text box-content__small-text--info">
							<i class="fas fa-info-circle icon"></i>If you don't wanna to each person can solve your test unlimited amount of times, you can set the number of solutions of each person, for this test, below.
								<strong class="strong">0 represents unlimited amount of times.</strong> 
							</p>
							<span class="info"><input type="text" class="window__input window__input--test-solutions-num" name="solutionsCount" placeholder="Solutions number" value="0"></span>
						</div>
					</div>
					<button class="window__button window__button--save">Save</button>
				</div>
			`;

			const testTimeInputs = document.querySelectorAll(".window__input--date");
			Array.from(testTimeInputs).forEach(input => {
				const calendar = new Calendar(input);
				calendar.main();
			});
		};

		const refreshInfoTab = async e => {
			//test info update
			test = await testManager.searchTest(testId);
			let persons = "";
			test.solvedBy.forEach(person => {
				persons +=
					/*HTML*/
					`
				<div class="table__item" data-name="${person.name}" data-surname="${person.surname}">
					<div class="profile">
						<i class="far fa-user-circle profile__img"></i>
						<span class="profile__info">
							${person.name} ${person.surname}
						</span>
					</div>
					<div class="info info--person">
						<span class="info__item info__item--time">
							<div class="info__header">Time</div>
							<div class="info__content">${person.time}</div>
						</span>
						<span class="info__item info__item--points">
							<div class="info__header">Points</div>
							<div class="info__content">${person.points}/${person.maxPoints}</div>
						</span>
						<span class="info__item info__item--points">
							<div class="info__header">Percents</div>
							<div class="info__content">${percentFrom(person.points, person.maxPoints)}%</div>
						</span>
						<div class="options">
							<span class="options__item options__item--details">
								<i class="fas fa-eye"></i>
							</span>
							<span class="options__item options__item--delete">
								<i class="fas fa-trash"></i>
							</span>
						</div>
					</div>
				</div>
				`;
			});

			content.innerHTML =
				/*HTML*/
				`
			<div class="box">
				<div class="box-header">
					<h1 class="box-header__header box-header__header--h1">Informations</h1>
				</div>
					<div class="box-content box-content--view">
					<div class="option">
						<h2 class="box-content__header box-content__header--h2">People, that solved test</h2>
						<div class="table">
							${persons}
						</div>
					</div>
				</div>
				<button class="window__button window__button--save">Save</button>
			</div>
			`;
		};

		accessTab.addEventListener("click", refreshAccessTab);

		confTab.addEventListener("click", refreshConfTab);

		infoTab.addEventListener("click", refreshInfoTab);

		content.addEventListener("click", e => {
			const options = content.querySelectorAll(".option");
			const saveBtn = e.target.closest(".window__button--save");

			if (content.classList.contains("explorer__content--configuration")) {
			} else if (content.classList.contains("explorer__content--access")) {
				const codeCheck = content.querySelector(".window__input--set-test-code");
				const testCode = content.querySelector(".window__input--test-code");

				codeCheck.addEventListener("change", e => {
					e.stopImmediatePropagation();

					if (e.currentTarget.checked) {
						e.currentTarget.value = "true";
						testCode.disabled = false;
					} else {
						e.currentTarget.value = "false";
						testCode.disabled = true;
					}
				});
			} else if (content.classList.contains("explorer__content--information")) {
				if (e.target.closest(".options__item--delete")) {
					const item = e.target.closest(".table__item");
					const personIndex = test.solvedBy.findIndex(person => person.name === item.dataset.name && person.surname === item.dataset.surname);
					test.solvedBy.splice(personIndex, 1);
					fetch(`/tests/${test._id}`, {
						method: "PATCH",
						headers: {
							"Content-type": "application/json"
						},
						body: JSON.stringify({solvedBy: test.solvedBy})
					})
						.then(res => refreshInfoTab())
						.catch(err => addCommunicat("We cannot connect with server"));
				} else if (e.target.closest(".options__item--details")) {
					const item = e.target.closest(".table__item");
					const person = test.solvedBy.find(person => person.name === item.dataset.name && person.surname === item.dataset.surname);

					testManager.testReader(person.solvedTest);
				}
			}

			if (saveBtn) {
				let data = {};

				options.forEach(option => {
					const inputs = option.querySelectorAll(".window__input");
					if (inputs) {
						inputs.forEach(input => {
							data[input.name] = input.value;
						});
					}
				});

				fetch(`/tests/${test._id}`, {
					method: "PATCH",
					headers: {
						"Content-type": "application/json"
					},
					body: JSON.stringify(data)
				})
					.then(res => {
						saveBtn.disabled = true;
					})
					.catch(err => addCommunicat("We cannot connect with server"))
					.finally(() => {
						saveBtn.disabled = false;
					});
			}
		});

		confTab.click();
	} else if (e.target.closest(".test-manager__public-btn")) {
		const testId = e.target.closest(".test-manager__public-btn").closest(".window__test").dataset.id;
		const config = await testManager.searchTest(testId);
		const button = e.target.closest(".test-manager__public-btn");
		let public = false;
		if (config.public) {
			button.classList.remove("test-manager__public-btn--active");
		} else {
			public = true;
			button.classList.add("test-manager__public-btn--active");
		}
		fetch(`/tests/${config._id}`, {
			method: "PATCH",
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify({public})
		})
			.then(res => testManager.read())
			.catch(err => addCommunicat("We cannot connect with server"));
	}
});
