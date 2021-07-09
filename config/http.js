let bodyParser = require("body-parser").json({ limit: "50mb" })
let compression = require("compression")
let cors = require("cors")
/* This whitelist can only filter requests from the browser clients */
var whitelist = ["http://localhost:8080", "http://localhost:8080/"]

var corsOptions = {
	origin: function (origin, callback) {
		// log.d("HTTP Origin given = ", origin)
		if (!origin) {
			// log.d("origin undefined")
			callback(null, true)
		} else if (whitelist.indexOf(origin) !== -1) {
			callback(null, true)
		} else if (origin == null) {
			// log.d("origin null")
			callback(null, true)
		} else if (origin.indexOf("chrome-extension") >= 0) {
			callback(null, true)
		} else {
			log.d("[Not allowed by CORS] but allowed temporarily", origin)
			callback(null, true)
			// callback("Not allowed by CORS", false)
			// callback(new Error("Not allowed by CORS"), false)
		}
		return
	},
}
let corsMiddle = cors(corsOptions)

module.exports = {
	middleware: [
		bodyParser,
		compression(),
		function (req, res, next) {
			// log.d("REQ = ", (req))
			next()
		},
		corsMiddle,
	],
	static: {
		"/": "/web-app/dist",
	},
}
