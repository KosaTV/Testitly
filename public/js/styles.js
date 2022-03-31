const page = document.querySelector(".page");

Scrollbar.init(page, {
	continuousScrolling: true,
	alwaysShowTracks: false,
	damping: 0.7
});

Scrollbar.detachStyle();
