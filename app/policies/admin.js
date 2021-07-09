/**
 * middleware for checking if the request token is of a admin user.
 * admin
 */
module.exports = (req, res, next) => {
	if (req.mortal && Services.Mortals.matchType(req.mortal.type, "admin")) {
		next()
	} else {
		Services.Respond.unAuthorized(
			res,
			"Auth Denied: you are not authorized to access this route"
		)
	}
}
