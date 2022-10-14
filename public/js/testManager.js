const testManager = new Window("My tests");

testManager.window.classList.add("test-manager");

const testManagerCreateButton = document.createElement("button");
const testManagerRefreshButton = document.createElement("button");
const testManagerUploadButton = document.createElement("button");
const testManagerSearchField = document.createElement("input");
testManagerSearchField.type = "text";
testManagerSearchField.placeholder = "Search a test";
testManagerSearchField.classList.add("window__input");
testManagerCreateButton.classList.add("window__button", "window__button--create");
testManagerRefreshButton.classList.add("window__button", "window__button--ico", "window__button--refresh");
testManagerUploadButton.classList.add("window__button", "window__button--ico", "window__button--upload");
testManagerCreateButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 14V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H10V5H5V19H19V14H21Z" fill="white"/>
<path d="M21 7H17V3H15V7H11V9H15V13H17V9H21V7Z" fill="white"/>
</svg>

`;
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
				testDate.innerHTML = `${config.createdAt.slice(8, 10)}-${config.createdAt.slice(5, 7)}-${config.createdAt.slice(0, 4)}`;
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
		creatingTestAddSol.innerHTML = `
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M21 10.5V12H12V21H10.5V12H1.5V10.5H10.5V1.5H12V10.5H21Z" fill="white"/>
		</svg>	
		`;
		const creatingTestSaveTest = document.createElement("button");
		creatingTestSaveTest.innerHTML = `
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0392 21 19.5305 21 19V8.00002C21.0008 7.86841 20.9755 7.73795 20.9258 7.61611C20.876 7.49427 20.8027 7.38346 20.71 7.29002L16.71 3.29002C16.6166 3.19734 16.5057 3.12401 16.3839 3.07425C16.2621 3.02448 16.1316 2.99926 16 3.00002H5C4.46957 3.00002 3.96086 3.21073 3.58579 3.5858C3.21071 3.96088 3 4.46958 3 5.00002V19C3 19.5305 3.21071 20.0392 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21ZM15 19H9V14H15V19ZM13 7.00002H11V5.00002H13V7.00002ZM5 5.00002H7V9.00002H15V5.00002H15.59L19 8.41002V19H17V14C17 13.4696 16.7893 12.9609 16.4142 12.5858C16.0391 12.2107 15.5304 12 15 12H9C8.46957 12 7.96086 12.2107 7.58579 12.5858C7.21071 12.9609 7 13.4696 7 14V19H5V5.00002Z" fill="white"/>
		</svg>

		`;
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
					<h2 class="box-content__header box-content__header--h2">Points</h2>
					<label class="box-content__label">
						<div>
							Points for each correct answear:
						</div>
						<input class="window__input" name="points" type="number" value="${points.value}" min="0">
					</label>
				</div>
				`;

				const negativePointsOption =
					/*HTML*/
					`
					<div class="option">
						<h2 class="box-content__header box-content__header--h2">Negative Points</h2>
							<label class="box-content__label">
							<div>
								Negative points for each wrong answear:
							</div>
							<input class="window__input" type="number" name="negativePoints" value="${negativePoints}" min="0">
						</label>
					</div>
				`;

				const bonusPointsOption =
					/*HTML*/
					`
					<div class="option">
						<h2 class="box-content__header box-content__header--h2">Bonus Points</h2>
						<label class="box-content__label">
							Bonus amount of points
							<input class="window__input" type="number" name="bonusPoints" value="${bonusPoints}" min="0">
							<div>
							<p class="box-content__small-text box-content__small-text--info">
								<i class="fas fa-info-circle icon"></i>When user will select all answears correctly, these points is gonna be added additionaly. These points are not in range of maximum points of test. As result <strong class="strong">user can get more points than maximum points for that test</strong>.
							</p>
							</div>
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

		confTab.innerHTML = `<span class="explorer__tab-text">Configuration</span>
		<svg class="explorer__tab-ico" width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M14.773 2.48485L13.993 2.30085L11.885 4.39685L10.691 3.18085L12.747 1.02385L12.567 0.231848C12.1326 0.0864985 11.6781 0.00957988 11.22 0.0038483C10.7203 -0.00383647 10.2243 0.0914766 9.76303 0.283848C9.31763 0.485459 8.91503 0.770607 8.57703 1.12385C8.20078 1.48026 7.9028 1.91106 7.70203 2.38885C7.31548 3.33973 7.31548 4.40396 7.70203 5.35485C5.61727 7.40584 3.55942 9.48402 1.52903 11.5888C1.31903 11.8638 1.21903 12.2068 1.24503 12.5518C1.26552 12.9229 1.43239 13.2707 1.70903 13.5188C1.83303 13.6538 1.98103 13.7658 2.14603 13.8468C2.31603 13.9218 2.49903 13.9648 2.68403 13.9738C3.00003 13.9678 3.30303 13.8478 3.53803 13.6368C5.08603 12.1798 8.05203 9.18685 9.73703 7.43285C10.194 7.62685 10.685 7.72685 11.181 7.72585C11.6803 7.72545 12.1744 7.62499 12.6342 7.43039C13.094 7.23579 13.5102 6.951 13.858 6.59285C14.5726 5.86411 14.9717 4.88345 14.969 3.86285C14.9806 3.39582 14.9143 2.93013 14.773 2.48485ZM2.93303 12.9278C2.89454 12.962 2.84814 12.9861 2.79803 12.9978C2.74873 13.0064 2.69833 13.0064 2.64903 12.9978C2.59734 12.99 2.5481 12.9705 2.50503 12.9408C2.4588 12.9138 2.41972 12.8761 2.39103 12.8308C2.25103 12.6878 2.12003 12.4158 2.25103 12.2628C3.62103 10.8058 6.44203 7.95785 8.20603 6.21685C8.30603 6.34885 8.41603 6.47485 8.53403 6.59285C8.65203 6.71585 8.77903 6.82985 8.91403 6.93385C7.20803 8.68385 4.42603 11.4978 2.93403 12.9278H2.93303ZM14.051 3.86285C14.053 4.62785 13.755 5.36285 13.219 5.91085C12.6842 6.43554 11.9648 6.72947 11.2155 6.72947C10.4663 6.72947 9.7469 6.43554 9.21203 5.91085C8.82001 5.50174 8.55222 4.98974 8.43981 4.43439C8.32739 3.87905 8.37498 3.3032 8.57703 2.77385C8.71152 2.41358 8.92013 2.08555 9.18937 1.81098C9.4586 1.5364 9.78247 1.32139 10.14 1.17985C10.4795 1.03776 10.844 0.964996 11.212 0.965848H11.466L9.64903 2.83885V3.53485L11.544 5.42085H12.204L14.051 3.60485V3.86285ZM3.24003 5.68785H4.77103L5.47603 6.40485L6.15403 5.73085L5.48903 5.05285V5.00985L5.54603 3.36085L5.32603 2.92385L2.46603 1.04185L1.87503 1.10785L1.04403 1.95685L0.978027 2.55585L2.81603 5.47385L3.24003 5.68885V5.68785ZM2.29503 2.05585L4.60903 3.57985L4.57003 4.70285H3.49403L2.00203 2.34085L2.29503 2.05585ZM9.40003 9.01585L10.074 8.34285L13.18 11.5278C13.4416 11.8028 13.5876 12.1678 13.5876 12.5473C13.5876 12.9269 13.4416 13.2919 13.18 13.5668C12.9833 13.7688 12.7303 13.9069 12.4541 13.963C12.1778 14.0192 11.891 13.9909 11.631 13.8818C11.4651 13.8083 11.3163 13.701 11.194 13.5668L8.05203 10.3638L8.73103 9.68585L11.863 12.8798C11.9051 12.9263 11.9575 12.9623 12.016 12.9848C12.1311 13.0316 12.2599 13.0316 12.375 12.9848C12.4335 12.9622 12.4859 12.9263 12.528 12.8798C12.5718 12.8365 12.6059 12.7843 12.628 12.7268C12.651 12.6682 12.6632 12.6058 12.664 12.5428C12.663 12.48 12.6512 12.4177 12.629 12.3588C12.6069 12.3014 12.5728 12.2492 12.529 12.2058L9.40003 9.01585Z" fill="none"/>
		</svg>
		`;
		infoTab.innerHTML = `<span class="explorer__tab-text">Information</span>
		<svg class="explorer__tab-ico" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M7.5 3.5C7.5 3.76522 7.60536 4.01957 7.79289 4.20711C7.98043 4.39464 8.23478 4.5 8.5 4.5C8.76522 4.5 9.01957 4.39464 9.20711 4.20711C9.39464 4.01957 9.5 3.76522 9.5 3.5C9.5 3.23478 9.39464 2.98043 9.20711 2.79289C9.01957 2.60536 8.76522 2.5 8.5 2.5C8.23478 2.5 7.98043 2.60536 7.79289 2.79289C7.60536 2.98043 7.5 3.23478 7.5 3.5ZM9 6.125H8C7.93125 6.125 7.875 6.18125 7.875 6.25V13.5C7.875 13.5688 7.93125 13.625 8 13.625H9C9.06875 13.625 9.125 13.5688 9.125 13.5V6.25C9.125 6.18125 9.06875 6.125 9 6.125Z" fill="none"/>
		</svg> 
		`;

		accessTab.innerHTML = `<span class="explorer__tab-text">Access</span>
		<svg class="explorer__tab-ico" width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 5.5C2.67157 5.5 2 6.17157 2 7C2 7.82843 2.67157 8.5 3.5 8.5C4.32843 8.5 5 7.82843 5 7C5 6.17157 4.32843 5.5 3.5 5.5ZM0.5 7C0.5 5.34315 1.84315 4 3.5 4C5.15685 4 6.5 5.34315 6.5 7C6.5 8.65685 5.15685 10 3.5 10C1.84315 10 0.5 8.65685 0.5 7Z" fill="none"/>
			<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5 9.5C10.6716 9.5 10 10.1716 10 11C10 11.8284 10.6716 12.5 11.5 12.5C12.3284 12.5 13 11.8284 13 11C13 10.1716 12.3284 9.5 11.5 9.5ZM8.5 11C8.5 9.34315 9.84315 8 11.5 8C13.1569 8 14.5 9.34315 14.5 11C14.5 12.6569 13.1569 14 11.5 14C9.84315 14 8.5 12.6569 8.5 11Z" fill="none"/>
			<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5 1.5C10.6716 1.5 10 2.17157 10 3C10 3.82843 10.6716 4.5 11.5 4.5C12.3284 4.5 13 3.82843 13 3C13 2.17157 12.3284 1.5 11.5 1.5ZM8.5 3C8.5 1.34315 9.84315 0 11.5 0C13.1569 0 14.5 1.34315 14.5 3C14.5 4.65685 13.1569 6 11.5 6C9.84315 6 8.5 4.65685 8.5 3Z" fill="none"/>
			<path fill-rule="evenodd" clip-rule="evenodd" d="M10.1708 3.66475C10.356 4.03524 10.2059 4.48574 9.83539 4.67098L5.83539 6.67098C5.46491 6.85623 5.0144 6.70606 4.82916 6.33557C4.64392 5.96509 4.79409 5.51459 5.16457 5.32934L9.16457 3.32934C9.53506 3.1441 9.98556 3.29427 10.1708 3.66475ZM4.82916 7.66475C5.0144 7.29427 5.46491 7.1441 5.83539 7.32934L9.83539 9.32934C10.2059 9.51459 10.356 9.96509 10.1708 10.3356C9.98556 10.7061 9.53506 10.8562 9.16457 10.671L5.16457 8.67098C4.79409 8.48574 4.64392 8.03524 4.82916 7.66475Z" fill="none"/>
		</svg>

		`;

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
					<h1 class="box-header__header box-header__header--h1">Test Access</h1>
				</div>
					<div class="box-content">

					<div class="option">
						<h2 class="box-content__header box-content__header--h2">Link</h2>
						<h3 class="box-content__label">Test will be active at this link for everyone:</h3>
						<a class="box-content__link" target="_blank" href=${link}>${falseLink}</a>
					</div>

					<div class="option">
					<h2 class="box-content__header box-content__header--h2">Test Code</h2>
						<label class="box-content__label">Require code for your test <input ${checked} class="window__input window__input--set-test-code window__input--radio" type="checkbox" name="bonusLockTest" value="${!!checked}"></label>
						<span class="info"><input type="text" class="window__input window__input--test-code" name="code" placeholder="Enter your code" ${disabled} value="${value}"></span>
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
						<h1 class="box-header__header box-header__header--h1">Test Configuration</h1>
					</div>
						<div class="box-content">
						<div class="option">
							<h2 class="box-content__header box-content__header--h2">Test time</h2>
							<span class="info">
								<div>
									<h3 class="box-content__header box-content__header--h3">Starts at</h3>
									<input type="text" class="window__input window__input--test-start-time window__input--time" name="testStartTime" placeholder="HH:MM" value="${addZero(
										new Date().getHours()
									)}:${addZero(new Date().getMinutes())}" >
									<input disabled type="text" class="window__input window__input--test-start-date window__input--date" name="testStartDate" placeholder="mm/dd/yyyy" value="${addZero(
										new Date().getMonth() + 1
									)}/${addZero(new Date().getDate())}/${addZero(new Date().getFullYear())}">
								</div>
							</span>
							<span class="info">
								<div>
									<h3 class="box-content__header box-content__header--h3">Ends at</h3>
									<input type="text" class="window__input window__input--test-end-time window__input--time" name="testEndTime" placeholder="HH:MM" value="${addZero(
										new Date().getHours() + 1
									)}:${addZero(new Date().getMinutes())}">
									<input disabled type="text" class="window__input window__input--test-end--date window__input--date" name="testEndDate" placeholder="mm/dd/yyyy" value="${addZero(
										new Date().getMonth() + 1
									)}/${addZero(new Date().getDate())}/${addZero(new Date().getFullYear())}">
								</div>
							</span>
						</div>
						<div class="option">
							<h2 class="box-content__header box-content__header--h2">Limited Solutions Count</h2>
							<h3 class="box-content__header box-content__header--h3">Amount of tries <span class="gray">(0 - Infinity)</span></h3>
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
							<div class="info__header">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M22.1484 9.65625H16.1484C16.0453 9.65625 15.9609 9.74062 15.9609 9.84375V10.9688C15.9609 11.0719 16.0453 11.1562 16.1484 11.1562H22.1484C22.2516 11.1562 22.3359 11.0719 22.3359 10.9688V9.84375C22.3359 9.74062 22.2516 9.65625 22.1484 9.65625ZM19.0078 12.8438H16.1484C16.0453 12.8438 15.9609 12.9281 15.9609 13.0312V14.1562C15.9609 14.2594 16.0453 14.3438 16.1484 14.3438H19.0078C19.1109 14.3438 19.1953 14.2594 19.1953 14.1562V13.0312C19.1953 12.9281 19.1109 12.8438 19.0078 12.8438ZM11.1867 7.55859H10.1719C10.0266 7.55859 9.90936 7.67578 9.90936 7.82109V13.6336C9.90936 13.718 9.94921 13.7953 10.0172 13.8445L13.507 16.3898C13.6242 16.4742 13.7883 16.4508 13.8726 16.3336L14.475 15.5109V15.5086C14.5594 15.3914 14.5336 15.2273 14.4164 15.143L11.4469 12.9961V7.82109C11.4492 7.67578 11.3297 7.55859 11.1867 7.55859V7.55859Z" fill="#B3B3B3"/>
							<path d="M18.8625 15.7944H17.5078C17.3766 15.7944 17.2524 15.8623 17.182 15.9748C16.8844 16.4459 16.5375 16.8819 16.1391 17.2803C15.4524 17.967 14.6531 18.5061 13.7649 18.8811C12.8438 19.2701 11.8664 19.467 10.8586 19.467C9.84845 19.467 8.87111 19.2701 7.95236 18.8811C7.06408 18.5061 6.26486 17.967 5.57814 17.2803C4.89142 16.5936 4.35236 15.7944 3.97736 14.9061C3.5883 13.9873 3.39142 13.01 3.39142 11.9998C3.39142 10.9897 3.5883 10.0147 3.97736 9.09359C4.35236 8.2053 4.89142 7.40609 5.57814 6.71937C6.26486 6.03265 7.06408 5.49359 7.95236 5.11859C8.87111 4.72952 9.8508 4.53265 10.8586 4.53265C11.8688 4.53265 12.8461 4.72952 13.7649 5.11859C14.6531 5.49359 15.4524 6.03265 16.1391 6.71937C16.5375 7.11781 16.8844 7.55374 17.182 8.02484C17.2524 8.13734 17.3766 8.20531 17.5078 8.20531H18.8625C19.0242 8.20531 19.1274 8.03655 19.0547 7.89359C17.5266 4.85374 14.4281 2.87796 10.9688 2.83812C5.90392 2.77484 1.69689 6.92093 1.68752 11.9811C1.67814 17.0506 5.78673 21.1639 10.8563 21.1639C14.3602 21.1639 17.5102 19.1811 19.0547 16.1061C19.1274 15.9631 19.0219 15.7944 18.8625 15.7944V15.7944Z" fill="#B3B3B3"/>
							</svg>							
							</div>
							<div class="info__content">${person.time}</div>
						</span>
						<span class="info__item info__item--points">
							<div class="info__header"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M20.68 9.27L20.69 9.21C20.7283 9.06746 20.7332 8.91802 20.7043 8.77328C20.6755 8.62854 20.6137 8.49239 20.5238 8.37537C20.4339 8.25836 20.3182 8.16363 20.1857 8.09853C20.0533 8.03344 19.9076 7.99972 19.76 8H17L17.7 5.21C17.7362 5.06679 17.7392 4.91722 17.709 4.77266C17.6787 4.62809 17.6158 4.49233 17.5252 4.37569C17.4346 4.25904 17.3186 4.16458 17.186 4.09949C17.0534 4.03439 16.9077 4.00037 16.76 4C16.31 4 15.93 4.3 15.82 4.73L15 8H11L11.7 5.21C11.7362 5.06679 11.7392 4.91722 11.709 4.77266C11.6787 4.62809 11.6158 4.49233 11.5252 4.37569C11.4346 4.25904 11.3186 4.16458 11.186 4.09949C11.0534 4.03439 10.9077 4.00037 10.76 4C10.31 4 9.93003 4.3 9.82003 4.73L9.00003 8H5.76003C5.31003 8 4.92003 8.3 4.82003 8.73L4.80003 8.79C4.65003 9.41 5.11003 10 5.74003 10H8.50003L7.50003 14H4.26003C3.81003 14 3.43003 14.3 3.32003 14.73L3.30003 14.79C3.15003 15.41 3.61003 16 4.24003 16H7.00003L6.30003 18.79C6.15003 19.41 6.61003 20 7.24003 20C7.69003 20 8.07003 19.7 8.18003 19.27L9.00003 16H13L12.3 18.79C12.15 19.41 12.61 20 13.24 20C13.69 20 14.07 19.7 14.18 19.27L15 16H18.24C18.69 16 19.07 15.7 19.18 15.27L19.19 15.21C19.2254 15.0669 19.2278 14.9176 19.1972 14.7733C19.1666 14.6291 19.1037 14.4936 19.0132 14.3772C18.9228 14.2608 18.8071 14.1663 18.6749 14.101C18.5427 14.0357 18.3975 14.0011 18.25 14H15.5L16.5 10H19.74C20.19 10 20.58 9.7 20.68 9.27V9.27ZM13.5 14H9.50003L10.5 10H14.5L13.5 14Z" fill="#B3B3B3"/>
							</svg>
							
							
							</div>
							<div class="info__content">${person.points}/${person.maxPoints}</div>
						</span>
						<span class="info__item info__item--points">
							<div class="info__header"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M5.91598 1.57218C9.95665 1.0736 14.0433 1.0736 18.084 1.57218C18.7267 1.65503 19.3169 1.97003 19.7435 2.45783C20.17 2.94563 20.4035 3.57257 20.4 4.22058V21.9002C20.4 22.0524 20.3614 22.2022 20.2878 22.3354C20.2142 22.4687 20.108 22.5811 19.9791 22.6621C19.8502 22.7432 19.7029 22.7902 19.5509 22.7988C19.3989 22.8074 19.2472 22.7773 19.11 22.7114L15.75 21.0986L12.39 22.7114C12.2683 22.7699 12.135 22.8003 12 22.8003C11.865 22.8003 11.7317 22.7699 11.61 22.7114L8.24998 21.0986L4.88998 22.7114C4.75277 22.7773 4.60107 22.8074 4.44908 22.7988C4.29708 22.7902 4.14975 22.7432 4.02088 22.6621C3.892 22.5811 3.78579 22.4687 3.71218 22.3354C3.63856 22.2022 3.59996 22.0524 3.59998 21.9002V4.22058C3.59998 2.89698 4.56718 1.73898 5.91598 1.57218ZM16.536 8.73618C16.695 8.56557 16.7815 8.33991 16.7774 8.10675C16.7733 7.87359 16.6788 7.65112 16.5139 7.48623C16.349 7.32133 16.1266 7.22688 15.8934 7.22277C15.6602 7.21865 15.4346 7.3052 15.264 7.46418L7.46398 15.2642C7.37555 15.3466 7.30463 15.4459 7.25544 15.5563C7.20625 15.6667 7.1798 15.7859 7.17767 15.9067C7.17553 16.0276 7.19776 16.1476 7.24303 16.2597C7.28829 16.3718 7.35567 16.4736 7.44113 16.559C7.52659 16.6445 7.62839 16.7119 7.74046 16.7571C7.85252 16.8024 7.97256 16.8246 8.0934 16.8225C8.21425 16.8204 8.33342 16.7939 8.44382 16.7447C8.55422 16.6955 8.65358 16.6246 8.73598 16.5362L16.536 8.73618ZM10.8 9.60018C10.8 9.91844 10.6735 10.2237 10.4485 10.4487C10.2235 10.6737 9.91824 10.8002 9.59998 10.8002C9.28172 10.8002 8.97649 10.6737 8.75145 10.4487C8.5264 10.2237 8.39998 9.91844 8.39998 9.60018C8.39998 9.28192 8.5264 8.97669 8.75145 8.75165C8.97649 8.5266 9.28172 8.40018 9.59998 8.40018C9.91824 8.40018 10.2235 8.5266 10.4485 8.75165C10.6735 8.97669 10.8 9.28192 10.8 9.60018ZM14.4 15.6002C14.7182 15.6002 15.0235 15.4737 15.2485 15.2487C15.4735 15.0237 15.6 14.7184 15.6 14.4002C15.6 14.0819 15.4735 13.7767 15.2485 13.5516C15.0235 13.3266 14.7182 13.2002 14.4 13.2002C14.0817 13.2002 13.7765 13.3266 13.5514 13.5516C13.3264 13.7767 13.2 14.0819 13.2 14.4002C13.2 14.7184 13.3264 15.0237 13.5514 15.2487C13.7765 15.4737 14.0817 15.6002 14.4 15.6002V15.6002Z" fill="#B3B3B3"/>
							</svg>
							
							</div>
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
						<h2 class="box-content__header box-content__header--h2">People who solved test</h2>
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
