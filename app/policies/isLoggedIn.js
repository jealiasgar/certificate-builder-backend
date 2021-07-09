/**
 * middleware for if the user has a valid JWT token
 * isLoggedIn
 */
module.exports = async (req, res, next) => {
	if (req.headers.Authorization) {
		req.headers.authorization = req.headers.Authorization
	}
	if (req.headers.authorization) {
		try {
			req.mortal = await Services.Auth.authenticate(
				req.headers.authorization
			)
			next()
		} catch (invalidToken) {
			log.e("invalidToken: ", invalidToken)
			Services.Respond.unAuthorized(res, "Invalid token")
		}
	} else {
		Services.Respond.unAuthorized(res, "Missing Authorization header")
	}
}
