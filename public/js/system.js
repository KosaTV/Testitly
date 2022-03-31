const addCommunicat = content => {
	const communicat = new Window("Communicat", 20, 23, {
		maximizable: false
	});
	communicat.window.classList.add("communicat");
	communicat.content.innerHTML = content;
	communicat.addWindow();
};

const addSelectList = (title, width, height, ...rest) => {
	const selectList = new Window(title, width, height, {
		maximizable: false,
		closeOnBlur: true,
		headerBar: false
	});
	selectList.window.classList.add("select-list");
	for (const item of rest) {
		const option = document.createElement("div");
		option.textContent = item;
		option.classList.add("select-list__item");
		selectList.content.appendChild(option);
	}
	selectList.addWindow();
	return selectList;
};
