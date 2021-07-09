module.exports = {
	origins: ["http://localhost:8080", "http://localhost:8080/", "*"],
	middleware: (Services) => [
		// async function (socket, next) {
		// 	log.d(Services)
		// 	switch (socket.nsp.server._path) {
		// 		case "/test":
		// 			log.d("_query", socket.request._query)
		// 			if (socket.request._query["user"]) {
		// 				return next()
		// 			} else {
		// 				return next(new Error("authentication Failure"))
		// 			}
		// 	}
		// },
	],
}
