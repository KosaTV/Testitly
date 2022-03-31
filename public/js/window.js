class Window {
	constructor(title = "new window", width = 42, height = 60, options) {
		this.title = title;
		this.width = width;
		this.height = height;
		this.left = window.innerWidth / 2 - (title * window.innerWidth) / 100 / 2;
		this.top = window.innerHeight / 2 - (title * window.innerWidth) / 100 / 2;
		this.window = document.createElement("div");
		this.content = document.createElement("div");
		this.header = document.createElement("div");
		this.headerTitle = document.createElement("div");
		this.buttonCnt = document.createElement("div");
		this.closeBtn = document.createElement("button");
		this.maxBtn = document.createElement("button");
		this.dragable = false;
		this.posX = null;
		this.posY = null;
		this.maximalize = false;

		const defaultOptions = {
			maximizable: true,
			closeOnBlur: false,
			headerBar: true
		};

		this.options = Object.assign({}, defaultOptions, options);

		this.styling();
		this.config();
	}

	styling() {
		if (DEVICE_ENVIROMENT === "MOBILE") {
			this.makeMaximalize();
			this.options.maximizable = false;
		}

		this.window.classList.add("window");
		this.window.style.width = `${this.width}%`;
		this.window.style.height = `${this.height}%`;
		this.window.style.top = `${this.top}px`;
		this.window.style.left = `${this.left}px`;
		this.content.classList.add("window__content");
		this.header.classList.add("window__header");
		if (!this.options.headerBar) this.header.classList.add("window__header--disabled");
		this.headerTitle.classList.add("window__title");
		this.buttonCnt.classList.add("window__button-cnt");
		this.closeBtn.classList.add("window__win-button", "window__win-button--close");
		if (this.options.maximizable) this.maxBtn.classList.add("window__win-button", "window__win-button--max");
		else this.maxBtn.classList.add("window__win-button", "window__win-button--blocked");
		this.window.appendChild(this.header);
		this.header.appendChild(this.headerTitle);
		this.headerTitle.textContent = this.title;
		this.header.appendChild(this.buttonCnt);
		this.buttonCnt.appendChild(this.maxBtn);
		this.buttonCnt.appendChild(this.closeBtn);
		this.maxBtn.innerHTML = `<i class="far fa-window-maximize"></i>`;
		this.closeBtn.innerHTML = `<i class="fas fa-times"></i>`;
		this.window.appendChild(this.content);
		if (this.options.closeOnBlur) {
			const canvas = document.createElement("div");
			canvas.classList.add("window__canvas");
			this.window.appendChild(canvas);
		}
	}

	config() {
		const moveWindow = e => {
			e.stopImmediatePropagation();
			if (e.target.classList.contains("window__header") && !this.maximalize) {
				const {top, left} = this.window.getBoundingClientRect();
				if (e.type === "mousedown") {
					this.posX = e.clientX - left;
					this.posY = e.clientY - top;
				} else {
					this.posX = e.targetTouches[0].clientX - left;
					this.posY = e.targetTouches[0].clientY - top;
				}

				this.dragStart();
			}
			this.focus();
		};
		this.window.addEventListener("mousedown", moveWindow);
		this.window.addEventListener("touchstart", moveWindow);

		this.window.addEventListener("click", e => {
			if (e.target.closest(".window__win-button--close")) {
				this.removeWindow();
			} else if (e.target.closest(".window__win-button--max")) {
				this.maxWindow();
			}
		});

		const maxWindowOnDBLClick = e => {
			if (e.target.closest(".window__header")) {
				this.maxWindow();
			}
		};

		this.window.addEventListener("dblclick", maxWindowOnDBLClick);

		document.addEventListener("mouseup", e => {
			this.dragEnd(e);
		});

		document.addEventListener("touchend", e => {
			this.dragEnd(e);
		});

		document.addEventListener("mousedown", e => {
			if (this.options.closeOnBlur) {
				this.removeWindow();
			}
		});
	}

	dragStart() {
		this.draggable = true;
		document.addEventListener("mousemove", this.dragging.bind(this));
		document.addEventListener("touchmove", this.dragging.bind(this));
	}

	dragging(e) {
		if (this.draggable) {
			if (e.type === "mousemove") {
				this.top = e.clientY - this.posY;
				this.left = e.clientX - this.posX;
			} else {
				this.top = e.targetTouches[0].clientY - this.posY;
				this.left = e.targetTouches[0].clientX - this.posX;
			}

			this.window.style.top = `${this.top}px`;
			this.window.style.left = `${this.left}px`;
		}
	}

	dragEnd() {
		this.draggable = false;
	}

	addWindow(source = document.body) {
		const windows = document.querySelectorAll(".window");
		this.window.style.setProperty("z-index", windows.length);
		source.appendChild(this.window);

		this.window.classList.add("window--open");
		this.window.addEventListener("animationend", e => {
			if (this.window.classList.contains("window--open")) {
				e.stopImmediatePropagation();
				this.window.classList.remove("window--open");
			}
		});
	}

	removeWindow() {
		this.window.classList.add("window--close");
		this.window.addEventListener("animationend", e => {
			if (this.window.classList.contains("window--close")) {
				e.stopImmediatePropagation();
				this.window.classList.remove("window--close");
				this.window.remove();
			}
		});
	}

	makeMaximalize() {
		this.maximalize = true;
		this.window.style.top = 0;
		this.window.style.left = 0;
		this.window.classList.add("window--max");
	}

	makeDemaximalize() {
		this.maximalize = false;
		this.window.style.width = `${this.width}%`;
		this.window.style.height = `${this.height}%`;
		this.window.style.top = `${this.top}px`;
		this.window.style.left = `${this.left}px`;
		this.window.classList.remove("window--max");
	}

	maxWindow() {
		if (this.options.maximizable) {
			if (!this.maximalize) {
				this.makeMaximalize();
			} else {
				this.makeDemaximalize();
			}
		}
	}

	focus() {
		const zIndex = +this.window.style.getPropertyValue("z-index");

		const ws = Array.from(document.querySelectorAll(".window")).sort((prev, next) => {
			return +prev.style.getPropertyValue("z-index") - +next.style.getPropertyValue("z-index");
		});

		const windowsSorted = ws.filter(el => {
			return +el.style.getPropertyValue("z-index") >= zIndex;
		});

		if (windowsSorted[0]) {
			const theHeighst = windowsSorted[windowsSorted.length - 1].style.getPropertyValue("z-index");
			windowsSorted.map((el, i) => {
				if (i !== 0) {
					const zIndex = +el.style.getPropertyValue("z-index");
					el.style.setProperty("z-index", `${zIndex - 1}`);
					return el;
				}
			});

			this.window.style.setProperty("z-index", theHeighst);
		}
	}
}
