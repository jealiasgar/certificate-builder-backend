/**
 * Controllers.Common
 * all endpoints which do not have any authorization are defined here
 */

module.exports.policies = []
module.exports.routes = {
	/**
	 * Test endpoint to see if controller loaded correctly
	 * @route {GET} /Common/v0.1/hello
	 */
	"GET /hello": async (req, res) => {
		res.json({
			ok: true,
			message: "Hello world!",
		})
	},

	/**
	 * Endpoint to log in to the system.
	 * @route {POST} /Common/v0.1/login
	 */
	"POST /login": {
		policies: [],
		handler: async (req, res) => {
			try {
				let data = Services.ParamsMapValidate(req.body, [
					"username",
					"password",
				])
				if (!data.missing) {
					let result = await Services.Auth.checkUserExists(data)
					if (result.ok) {
						let tokenInfo = await Services.Auth.issueToken(result)
						res.json(tokenInfo)
					} else {
						res.json({
							ok: false,
							message: "Inactive/ Invalid username or password",
						})
					}
				} else {
					Services.Respond.missingParams(res, data.missing)
				}
			} catch (e) {
				log.e(e)
				Services.Respond.serverError(res, e.message)
			}
		},
	},
}
