const DEVICE_ENVIROMENT = "ontouchstart" in document.documentElement && window.innerWidth < 1000 ? "MOBILE" : "PC";
const hideContent = e => {
	if (DEVICE_ENVIROMENT === "MOBILE") {
		//* Communicat for mobile devices
		// document.body.classList.add("page--blocked");
		// const communicatBg = document.createElement("div");
		// const communicatText = document.createElement("p");
		// communicatBg.classList.add("communicat");
		// communicatText.classList.add("communicat__text");
		// communicatBg.appendChild(communicatText);
		// document.body.appendChild(communicatBg);
		// communicatText.innerText = "Admin Panel is not currently available on mobile devices";
	}
};

window.addEventListener("DOMContentLoaded", e => {
	hideContent();
});
