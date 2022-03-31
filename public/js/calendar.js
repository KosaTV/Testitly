class Calendar {
	constructor(input) {
		this.now = new Date();
		this.input = input;
		this.year = this.now.getFullYear();
		this.month = this.now.getMonth();
		this.day = this.now.getDate();

		this.inputCnt = null;
		this.container = null;
		this.upElement = null;
		this.calendarContent = null;
		this.calendarHeader = null;
		this.calendarTable = null;
		this.downElement = null;
		this.icoButton = null;
	}

	toggleCalendar(e) {
		e.target.classList.toggle("calendar-ico-focus");
		this.container.classList.toggle("show");
	}

	closeCalendar() {
		this.icoButton.classList.remove("calendar-ico-focus");
		this.container.classList.remove("show");
	}

	main() {
		this.input.classList.add("calendar-input");
		this.icoButton = document.createElement("button");
		this.icoButton.classList.add("calendar-ico");
		this.icoButton.type = "button";
		this.icoButton.innerHTML = `<i class="far fa-calendar"></i>`;
		this.inputCnt = document.createElement("div");
		this.inputCnt.classList.add("input-cnt");
		this.inputCnt.style.width = getComputedStyle(this.input).getPropertyValue("width");
		this.inputCnt.style.height = getComputedStyle(this.input).getPropertyValue("height");
		this.input.parentElement.insertBefore(this.inputCnt, this.input);
		this.icoButton.style.borderTopRightRadius = ".2rem";
		this.icoButton.style.borderBottomRightRadius = ".2rem";
		this.inputCnt.appendChild(this.input);
		this.inputCnt.appendChild(this.icoButton);

		this.container = document.createElement("div");
		this.container.classList.add("calendar-container");
		this.inputCnt.appendChild(this.container);

		this.upElement = document.createElement("div");
		this.upElement.classList.add("calendar-up-element");
		this.container.appendChild(this.upElement);

		this.calendarHeader = document.createElement("div");
		this.calendarHeader.classList.add("calendar-header");
		this.upElement.appendChild(this.calendarHeader);

		this.calendarContent = document.createElement("div");
		this.calendarContent.classList.add("calendar-content");
		this.container.appendChild(this.calendarContent);

		this.calendarTable = document.createElement("div");
		this.calendarTable.classList.add("calendar-table");
		this.calendarContent.appendChild(this.calendarTable);

		this.downElement = document.createElement("div");
		this.downElement.innerHTML = `<i class="fad fa-chevron-double-up"></i>`;
		this.downElement.classList.add("calendar-down-element");
		this.container.appendChild(this.downElement);

		this.generateHeader();
		this.generateTable();
		this.downElement.addEventListener("click", this.mini.bind(this));
		this.icoButton.addEventListener("click", this.toggleCalendar.bind(this));
		this.calendarContent.addEventListener("click", this.selectDay.bind(this));
		this.icoButton.addEventListener("click", e => e.stopImmediatePropagation());
		this.container.addEventListener("click", e => e.stopImmediatePropagation());
		document.addEventListener("click", this.closeCalendar.bind(this));
	}

	mini() {
		if (this.container.classList.contains("calendar-container")) {
			this.container.classList.replace("calendar-container", "mini-calendar");
			this.calendarHeader.classList.replace("calendar-header", "calendar-mini-header");
			this.upElement.classList.replace("calendar-up-element", "calendar-mini-up-element");
			this.calendarContent.classList.replace("calendar-content", "mini-content");
			this.calendarTable.classList.replace("calendar-table", "mini-table");
			this.downElement.classList.replace("calendar-down-element", "calendar-mini-down-element");
			this.downElement.innerHTML = `<i class="fad fa-chevron-double-down"></i>`;
		} else {
			this.container.classList.replace("mini-calendar", "calendar-container");
			this.calendarHeader.classList.replace("calendar-mini-header", "calendar-header");
			this.upElement.classList.replace("calendar-mini-up-element", "calendar-up-element");
			this.calendarContent.classList.replace("mini-content", "calendar-content");
			this.calendarTable.classList.replace("mini-table", "calendar-table");
			this.downElement.classList.replace("calendar-mini-down-element", "calendar-down-element");
			this.downElement.innerHTML = `<i class="fad fa-chevron-double-up"></i>`;
		}
		this.generateTable();
	}

	generateTable() {
		this.calendarTable.innerHTML = "";
		if (this.calendarContent.classList.contains("calendar-content")) {
			const weekDays = document.createElement("div");
			weekDays.classList.add("week-days");
			const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
			days.forEach(el => {
				const weekDay = document.createElement("span");
				weekDay.innerText = el;
				weekDays.appendChild(weekDay);
			});
			this.calendarTable.appendChild(weekDays);

			const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
			const firstDay = new Date(this.year, this.month, 1).getDay();

			let week = document.createElement("div");
			week.classList.add("week");

			if (firstDay !== 0) {
				this.calendarTable.appendChild(week);
			}

			for (let i = 0; i < firstDay; i++) {
				const daysInPreviousMonth = new Date(this.year, this.month, 0).getDate();
				const prevDay = document.createElement("span");
				prevDay.classList.add("empty");
				prevDay.innerText = daysInPreviousMonth + 1 - (firstDay - i);
				week.appendChild(prevDay);
			}

			const newDay = daysInMonth - firstDay;

			for (let i = 0; i < daysInMonth; i++) {
				const day = document.createElement("div");
				day.classList.add("day");
				day.dayNr = firstDay + i;
				day.innerText = i + 1;
				if (day.dayNr % 7 === 0) {
					week = document.createElement("div");
					week.classList.add("week");
					this.calendarTable.appendChild(week);
				}

				if (i + 1 === this.now.getDate() && this.month === this.now.getMonth() && this.year === this.now.getFullYear()) {
					day.classList.add("current-day");
				}
				week.appendChild(day);
			}

			let i = 0;

			while (week.children.length !== 7) {
				i++;
				const prevDay = document.createElement("span");
				prevDay.classList.add("empty");
				prevDay.innerText = i;
				week.appendChild(prevDay);
			}
		} else {
			const weekDays = document.createElement("div");
			weekDays.classList.add("week-days");
			const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
			const day = document.createElement("div");
			day.classList.add("day");
			day.innerText = this.day;

			const weekDay = document.createElement("div");
			weekDay.classList.add("week-day");
			const wD = document.createElement("span");
			wD.innerText = days[new Date(this.year, this.month, this.day).getDay()];
			weekDay.appendChild(wD);

			const prevButton = document.createElement("button");
			const nextButton = document.createElement("button");
			prevButton.classList.add("mini-prev-day");
			nextButton.classList.add("mini-next-day");

			prevButton.type = "button";
			nextButton.type = "button";
			prevButton.innerHTML = `<i class="fas fa-arrow-left"></i>`;
			nextButton.innerHTML = `<i class="fas fa-arrow-right"></i>`;
			const calendarDays = document.createElement("div");
			calendarDays.classList.add("calendar-days");
			calendarDays.appendChild(prevButton);
			calendarDays.appendChild(nextButton);
			calendarDays.insertBefore(day, nextButton);
			this.calendarTable.appendChild(calendarDays);
			this.calendarTable.appendChild(weekDay);

			prevButton.addEventListener("click", e => {
				if (this.day === 1) {
					if (this.month === 0) {
						this.year--;
						this.month = 11;
					} else {
						this.month--;
					}
					this.day = new Date(this.year, this.month + 1, 0).getDate();
					this.generateHeader();
				} else {
					this.day--;
				}
				this.generateTable();
			});

			nextButton.addEventListener("click", e => {
				if (this.day === new Date(this.year, this.month + 1, 0).getDate()) {
					if (this.month === 11) {
						this.year++;
						this.month = 0;
					} else {
						this.month++;
					}
					this.day = 1;
					this.generateHeader();
				} else {
					this.day++;
				}
				if (this.day > new Date(this.year, this.month + 1, 0).getDate()) {
					this.day = 1;
				}
				this.generateTable();
			});
		}
	}

	selectDay(e) {
		if (e.target.classList.contains("day")) {
			this.input.value = `${addZero(this.month + 1)}/${addZero(e.target.innerText)}/${this.year}`;
		}
	}

	generateHeader() {
		this.upElement.innerHTML = "";
		this.calendarHeader.innerHTML = "";
		const prevButton = document.createElement("button");
		const nextButton = document.createElement("button");
		if (this.upElement.classList.contains("calendar-header")) {
			prevButton.classList.add("prev-btn");
			nextButton.classList.add("next-btn");
		} else {
			prevButton.classList.add("mini-prev-btn");
			nextButton.classList.add("mini-next-btn");
		}
		prevButton.type = "button";
		nextButton.type = "button";
		prevButton.innerHTML = `<i class="fas fa-arrow-left"></i>`;
		nextButton.innerHTML = `<i class="fas fa-arrow-right"></i>`;
		this.upElement.appendChild(prevButton);
		this.upElement.appendChild(nextButton);

		this.calendarheader = document.createElement("div");
		const content = document.createElement("h2");
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		content.innerHTML = `${months[this.month]} ${this.year}`;
		this.calendarHeader.appendChild(content);
		this.upElement.insertBefore(this.calendarHeader, nextButton);

		prevButton.addEventListener("click", e => {
			if (this.month === 0) {
				this.year--;
				this.month = 11;
			} else {
				this.month--;
			}

			content.innerHTML = `${months[this.month]} ${this.year}`;
			console.log(this.month);
			console.log(this.year);
			this.generateTable();
		});

		nextButton.addEventListener("click", e => {
			if (this.month === 11) {
				this.year++;
				this.month = 0;
			} else {
				this.month++;
			}

			if (this.day > new Date(this.year, this.month + 1, 0).getDate()) {
				this.day = 1;
			}
			content.innerHTML = `${months[this.month]} ${this.year}`;
			this.generateTable();
		});
	}
}
