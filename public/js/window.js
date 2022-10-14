class Window {
	constructor(title = "new window", width = 42, height = 60, options) {
		this.title = title;
		this.width = width;
		this.height = height;
		this.left = window.innerWidth / 2 - ((width / 100) * innerWidth) / 2;
		this.top = window.innerHeight / 2 - ((height / 100) * innerHeight) / 2;
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
		window.onresize = () => {
			this.setResponsive();
		};

		const defaultOptions = {
			maximizable: true,
			closeOnBlur: false,
			headerBar: true
		};

		this.options = Object.assign({}, defaultOptions, options);

		this.styling();
		this.config();
	}

	setResponsive() {
		if (DEVICE_ENVIROMENT === "MOBILE") {
			this.window.style.top = 0;
			this.window.style.left = 0;
			this.window.classList.add("window--max");
			this.options.maximizable = false;
		}
	}

	styling() {
		this.setResponsive();
		this.window.classList.add("window");
		this.window.style.width = `${this.width}%`;
		this.window.style.height = `${this.height}%`;
		console.log(this.width);
		this.window.style.setProperty("--top-center", `${this.top}px`);
		this.window.style.setProperty("--left-center", `${this.left}px`);
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
		this.closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M9.61143 8L14.5257 3.09715C14.7409 2.88194 14.8618 2.59006 14.8618 2.28572C14.8618 1.98137 14.7409 1.68949 14.5257 1.47429C14.3105 1.25908 14.0186 1.13818 13.7143 1.13818C13.4099 1.13818 13.1181 1.25908 12.9029 1.47429L8 6.38857L3.09714 1.47429C2.88194 1.25908 2.59006 1.13818 2.28571 1.13818C1.98137 1.13818 1.68949 1.25908 1.47429 1.47429C1.25908 1.68949 1.13818 1.98137 1.13818 2.28572C1.13818 2.59006 1.25908 2.88194 1.47429 3.09715L6.38857 8L1.47429 12.9029C1.36717 13.0091 1.28215 13.1355 1.22412 13.2748C1.1661 13.414 1.13623 13.5634 1.13623 13.7143C1.13623 13.8652 1.1661 14.0145 1.22412 14.1538C1.28215 14.2931 1.36717 14.4195 1.47429 14.5257C1.58053 14.6328 1.70693 14.7179 1.8462 14.7759C1.98547 14.8339 2.13484 14.8638 2.28571 14.8638C2.43659 14.8638 2.58596 14.8339 2.72523 14.7759C2.8645 14.7179 2.9909 14.6328 3.09714 14.5257L8 9.61143L12.9029 14.5257C13.0091 14.6328 13.1355 14.7179 13.2748 14.7759C13.414 14.8339 13.5634 14.8638 13.7143 14.8638C13.8652 14.8638 14.0145 14.8339 14.1538 14.7759C14.2931 14.7179 14.4195 14.6328 14.5257 14.5257C14.6328 14.4195 14.7179 14.2931 14.7759 14.1538C14.8339 14.0145 14.8638 13.8652 14.8638 13.7143C14.8638 13.5634 14.8339 13.414 14.7759 13.2748C14.7179 13.1355 14.6328 13.0091 14.5257 12.9029L9.61143 8Z" fill="black"/>
		</svg>
		
		`;
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
		this.window.style.transition = "none";
		this.draggable = true;
		document.addEventListener("mousemove", this.dragging.bind(this));
		document.addEventListener("touchmove", this.dragging.bind(this));
	}

	dragging(e) {
		if (this.draggable) {
			if (e.type === "mousemove") {
				this.top = e.clientY - this.posY;
				this.left = e.clientX - this.posX;

				this.window.style.top = `${this.top}px`;
				this.window.style.left = `${this.left}px`;

				const {top, left, bottom, right, width, height} = this.window.getBoundingClientRect();
				const {top: desktopTop, left: desktopLeft, bottom: desktopBottom, right: desktopRight} = document.body.getBoundingClientRect();

				if (top < desktopTop) this.window.style.top = `0`;
				if (left < desktopLeft) this.window.style.left = `0`;
				if (right > desktopRight) this.window.style.left = `${desktopRight - width}px`;
				if (bottom > desktopBottom) this.window.style.top = `${desktopBottom - height}px`;
			}
		}
	}

	dragEnd() {
		this.window.style.transition = "width 0.4s 0s ease, height 0.4s 0s ease, top 0.4s 0s ease, left 0.4s 0s ease";
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
		this.window.style.transition = "width 0.4s 0s ease, height 0.4s 0s ease, top 0.4s 0s ease, left 0.4s 0s ease";
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
