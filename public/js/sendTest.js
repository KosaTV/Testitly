const form = document.querySelector(".form");
const submit = form.querySelector(".form__submit");
const nameInput = document.querySelector(".info__input--name");
const surnameInput = document.querySelector(".info__input--surname");
const infoInputs = document.querySelectorAll(".info__input");
const solutions = document.querySelector(".solutions");

const addError = (inputCnt, text) => {
	const error = document.createElement("div");
	error.classList.add("error");
	const com = document.createElement("span");
	com.classList.add("error__com");
	com.textContent = text;
	error.appendChild(com);
	inputCnt.appendChild(error);
};

const removeError = inputCnt => {
	const error = inputCnt.querySelector(".error");
	if (error) inputCnt.removeChild(error);
};

solutions.addEventListener("click", e => {
	const target = e.target.closest(".answears__label");
	if (target) {
		const input = target.querySelector(".answears__input");
		input.click();
	}
});

const percentFrom = (nominator, denominator) => {
	const result = ((nominator / denominator) * 100).toString();
	const resultNum = (nominator / denominator) * 100;
	const dot = result.indexOf(".");
	if (result.length > 4 && result.charAt(dot + 1) === "0") return resultNum.toFixed();
	else if (result.length > 3 && result < 100) return resultNum.toFixed(1);
	return resultNum;
};

infoInputs.forEach(input => {
	input.onblur = e => {
		if (input.checkValidity()) {
			removeError(input.parentElement);
		}
	};
});

form.onsubmit = e => {
	e.preventDefault();
	const id = new URLSearchParams(window.location.search).get("tid");
	const method = form.method;
	const action = form.action;
	const body = new FormData(form);
	body.append("id", id);
	submit.disabled = true;

	const communicats = document.querySelectorAll(".error");
	if (communicats) Array.from(communicats).forEach(error => error.remove());

	if (nameInput.value.length && surnameInput.value.length) {
		submit.classList.add("form__submit--active");
		submit.textContent = "";

		fetch(action, {
			method,
			body
		})
			.then(res => res.json())
			.then(res => {
				if (!res.errors) {
					document.documentElement.innerHTML = /*HTML*/ `
				<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8" />
						<meta http-equiv="X-UA-Compatible" content="IE=edge" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0" />
						<title>Result</title>
						<link rel="stylesheet" href="../css/test.css" />
						<script defer="defer" src="../js/sendTest.js"></script>
					</head>
					<body class="page">
						<div class="result">
							<h1 class="result__name">Your score</h1>
							<span class="result__points"> ${res.points}/${res.maxPoints}</span>
							<p class="result__percent">${percentFrom(res.points, res.maxPoints)}%</p>
						</div>
						<!-- <footer class="footer">Copyright &copy; 2021 All rights reserved</footer> -->
					</body>
				</html>

				`;
				} else {
					if (res.errors.includes("no-public")) {
						submit.insertAdjacentHTML("beforebegin", `<span class="error">This test is not currently accept answears</span>`);
					} else if (res.errors.includes("no-exist")) {
						submit.insertAdjacentHTML("beforebegin", `<span class="error">This test doesn't exist</span>`);
					} else if (res.errors.includes("already-exists")) {
						submit.insertAdjacentHTML("beforebegin", `<span class="error">You solved this test earlier already</span>`);
					} else if (res.errors.includes("novalid")) {
						if (!nameInput.value.length) {
							addError(nameInput.parentElement, "Name field is required");
						}

						if (!surnameInput.value.length) {
							addError(surnameInput.parentElement, "Surname is required");
						}

						submit.insertAdjacentHTML("beforebegin", `<span class="error">Please, fill fields with name and surname</span>`);
					}
				}
			})
			.catch(err => submit.insertAdjacentHTML("beforebegin", `<span class="error">We have a problem with server, try next time</span>`))
			.finally(() => {
				submit.classList.remove("form__submit--active");
				submit.textContent = "Try again";
				submit.disabled = false;
			});
	} else {
		submit.disabled = false;
		if (!nameInput.value.length) {
			addError(nameInput.parentElement, "Name field is required");
		}

		if (!surnameInput.value.length) {
			addError(surnameInput.parentElement, "Surname is required");
		}
		submit.insertAdjacentHTML("beforebegin", `<span class="error">Please, fill fields with name and surname</span>`);
	}
};
