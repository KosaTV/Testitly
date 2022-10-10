const registerForm = document.querySelector(".form--register");
const registerSubmit = document.querySelector(".form__button--submit");

registerForm.onsubmit = e => {
	e.preventDefault();
	const method = registerForm.method;
	const action = registerForm.action;
	const body = new FormData(registerForm);
	registerSubmit.disabled = true;

	registerSubmit.classList.add("form__submit--active");
	registerSubmit.textContent = "";

	fetch(action, {
		method,
		body
	})
		.then(res => res.json())
		.then(res => {
			location.href = res.redirect;
		});
};
