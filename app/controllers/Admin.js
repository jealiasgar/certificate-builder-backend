/**
 * Controllers.Admin
 * all admin endpoints defined here
 */

// module.exports.policies = ["isLoggedIn", "admin"]
module.exports.routes = {
	/**
	 * Test endpoint to see if controller loaded correctly
	 * @route {GET} /Admin/v0.1/hello
	 */
	"GET /hello": async (req, res) => {
		console.log(await db.test.findOne())
		res.json({
			ok: true,
			message: "Hello world!",
		})
	},

	/**
	 * Endpoint to create a user.
	 * @route {POST} /Admin/v0.1/mortals
	 */
	"POST /mortals": async (req, res) => {
		try {
			let data = Services.ParamsMapValidate(req.body, [
				"name",
				"email",
				"type",
			])

			if (data.missing) {
				Services.Respond.missingParams(res, data.missing)
				return
			}
			data.username = data.email
			data.password = Services.Mortals.getRandomPwd()
			let type = Services.Mortals.getType(data.type)
			if (!!type) {
				data.type = type
				data.owner = req.mortal.id
				let responseToSend = await Services.Mortals.create(data)
				res.json(responseToSend)
			} else {
				Services.Respond.bad(res, "invalid type or some other reason")
				return
			}
		} catch (e) {
			log.e(e)
			Services.Respond.serverError(res, e.message)
		}
	},

	/**
	 * Endpoint to get users.
	 * @route {GET} /Admin/v0.1/mortals
	 */
	"GET /mortals": async (req, res) => {
		var projection = {}
		var filter = {}
		try {
			if (req.query.hasOwnProperty("projection")) {
				projection = JSON.parse(req.query.projection)
			}
		} catch (e) {
			return Services.Respond.bad(res, "invalid projection")
		}

		try {
			res.json(await Services.Mortals.getAll({ filter, projection }))
		} catch (e) {
			Services.Respond.serverError(
				res,
				"Could not get mortals. " + e.message
			)
		}
	},

	/**
	 * Endpoint to delete a user.
	 * @route {DELETE} /Admin/v0.1/mortals
	 */
	"DELETE /mortals": async (req, res) => {
		let data = Services.ParamsMapValidate(req.body, ["username"])

		if (data.missing) {
			return Services.Respond.missingParams(res, data.missing)
		}

		if (data.username === req.mortal.username) {
			return Services.Respond.bad(res, "Cannot delete Self")
		}

		try {
			res.json(await Services.Mortals.delete(data.username))
		} catch (e) {
			log.e(e)
			Services.Respond.serverError(res, e.message)
		}
	},

	/**
	 * Endpoint to update a user.
	 * @route {PUT} /Admin/v0.1/mortals
	 */
	"PUT /mortals": async (req, res) => {
		try {
			let data = Services.ParamsMapValidate(req.body, ["username"])

			if (data.missing)
				return Services.Respond.missingParams(res, ["username"])

			if (req.body.type)
				req.body.type = Services.Mortals.getType(req.body.type)

			let allowedParams = [
				{
					key: "type",
					dataType: "number",
					validatorFunc: (e) => [20, 30].includes(e),
				},
				{
					key: "email",
					dataType: "string",
					validatorFunc: (e) =>
						/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/gi.test(e),
				},
				{ key: "active", dataType: "boolean" },
				{ key: "name", dataType: "string" },
			]
			let resp = Services.ParamsValidator(req.body, allowedParams)
			if (resp.newObj && !resp.errorFields) {
				resp.newObj.username = req.body.username
				let err = await Services.Mortals.updateMortalInfo(resp.newObj)

				if (err) {
					res.json({
						ok: false,
						message: err.message,
					})
				} else {
					res.json({
						ok: true,
						message: "User details have been updated.",
					})
				}
			} else {
				if (resp.errorFields) {
					Services.Respond.bad(
						res,
						Object.values(resp.errorFields).join("\n")
					)
				} else
					Services.Respond.missingParams(
						res,
						`Only ${allowedParams
							.map((e) => e.key)
							.join(",")} are allowed`
					)
			}
		} catch (e) {
			log.e(e)
			Services.Respond.serverError(res, e.message)
		}
	},
}
