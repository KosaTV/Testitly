let DEVICE_ENVIROMENT = matchMedia("(max-width: 579px)").matches ? "MOBILE" : "PC";

window.onresize = e => {
	DEVICE_ENVIROMENT = matchMedia("(max-width: 579px)").matches ? "MOBILE" : "PC";
};
