const sendOptions = {root: __dirname + "/.."};

const root = (req, res) => {
	res.sendFile("index.html", sendOptions);
};

module.exports = {
	root
};
