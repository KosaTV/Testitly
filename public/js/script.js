const bgLoader = document.querySelector(".bg-loader");

window.addEventListener("load", e => {
	bgLoader.classList.add("bg-loader--finished");
	document.body.querySelector(".loader").addEventListener("animationend", e => {
		bgLoader.remove();
	});
});

const getTests = async () => {
	return await fetch("/tests")
		.then(res => res.json())
		.catch(err => console.log(err));
};

const mainBox = document.querySelector(".box");

mainBox.addEventListener("click", e => {
	if (e.target.closest(".box__button--my-tests")) {
		testManager.addWindow();
		testManager.read();
	}
});
