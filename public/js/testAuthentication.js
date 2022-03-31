const form = document.querySelector(".form--mini");

form.onsubmit = e => {
	e.preventDefault();
	const id = new URLSearchParams(window.location.search).get("tid");
	const method = form.method;
	const action = form.action;
	const body = new FormData(form);
	body.append("id", id);
	const idInput = document.createElement("input");
	idInput.type = "hidden";
	idInput.name = "id";
	idInput.value = id;
	form.appendChild(idInput);
	form.submit();
};
