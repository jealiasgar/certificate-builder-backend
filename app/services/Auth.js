/**
 * Services.Auth
 */
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const encryptionAlgo = "aes-256-ctr"
const encryptionSecret = "dashcbksjudbcvio7wg7euvt6rdy"
const ObjectID = require("mongodb").ObjectID

let authConfig = config.auth

/**
 * _private
 * functions that are only private to this Service
 * these functions are not exported
 */
const _private = {
	/**
	 * encode
	 * uses the JWT library to sign the given data object
	 * containing the user information
	 * and returns the token
	 */
	encode: (data, jwtAccessTokenSigningParams) => {
		return jwt.sign(
			data,
			authConfig.privateKey,
			jwtAccessTokenSigningParams ||
				authConfig.jwtAccessTokenSigningParams
		)
	},

	/**
	 * encodeRefreshToken
	 * uses the JWT library to sign the given data object
	 * containing the refresh token information
	 * and returns the refreshToken
	 */
	encodeRefreshToken: (data, jwtRefreshTokenSigningParams) => {
		return jwt.sign(
			data,
			authConfig.refreshSuperSecret,
			jwtRefreshTokenSigningParams ||
				authConfig.jwtRefreshTokenSigningParams
		)
	},

	/**
	 * verifyRefreshToken
	 * verify the refresh token if it valid and has not expired
	 */
	verifyRefreshToken: (token) => {
		return new Promise(async function (resolve, reject) {
			if (typeof token == "string") {
				jwt.verify(
					token,
					authConfig.refreshSuperSecret,
					async function (err, decoded) {
						if (!!err) {
							if (err.name) {
								if (err.name == "TokenExpiredError") {
									reject({
										ok: false,
										message: "TokenExpiredError",
									})
								}
							}
							reject({
								ok: false,
								message:
									"Failed to authenticate refresh token.",
							})
						} else {
							let hasRefreshToken = await db.userSession
								.findOne({
									username: decoded.username,
									refreshToken: token,
									refreshTokenCreatedOn:
										decoded.tokenCreatedOn,
								})
								.catch((e) => {
									return reject({
										ok: false,
										message:
											"refresh token verification error " +
											e.message,
									})
								})
							if (hasRefreshToken) {
								resolve(decoded)
							} else {
								reject({
									ok: false,
									message:
										"Failed to authenticate refresh token.",
								})
							}
						}
					}
				)
			} else {
				reject({ ok: false, message: "issue with refresh token." })
			}
		})
	},

	/**
	 * verify
	 * verify the user token if it valid and has not expired
	 */
	verify: (token) => {
		return new Promise(function (resolve, reject) {
			jwt.verify(token, authConfig.publicKey, (err, decoded) => {
				if (err) {
					reject({
						ok: false,
						message: "Failed to authenticate token.",
					})
				} else {
					resolve(decoded)
				}
			})
		})
	},

	/**
	 * encrypt
	 * encrypts the given string text using the encryptionAlgo and secret defined
	 */
	encrypt: (text) => {
		var cipher = crypto.createCipheriv(encryptionAlgo, encryptionSecret)
		var crypted = cipher.update(text, "utf8", "hex")
		crypted += cipher.final("hex")
		return crypted
	},

	/**
	 * decrypt
	 * decrypt the given string text using the encryptionAlgo and secret defined
	 */
	decrypt: (crypted) => {
		// const algorithm = "aes-256-ctr"
		// const password = "d6F3Efeq"
		var decipher = crypto.createDecipheriv(encryptionAlgo, encryptionSecret)
		var dec = decipher.update(crypted, "hex", "utf8")
		dec += decipher.final("utf8")
		return dec
	},
}

module.exports = {
	/**
	 * Services.Auth.checkUserExists
	 * check if the provided user data exists in the database
	 * given the username and password
	 */
	checkUserExists: async (data) => {
		let opts = {
			"record.active": true,
		}

		let query = {
			username: data.username.toLowerCase(),
			password: await Services.Auth.hashPassword(data.password),
			...opts,
		}

		let projection = {
			_id: 1,
			type: 1,
			owner: 1,
			usr_data: 1,
			record: 1,
		}

		// auth db transaction for checking if the credentials are correct in auth_creds and then verifying the user in mortals as well.
		try {
			var cResult = await db.auth_credentials.findOne(query, {
				projection: { _id: 1 },
			})
			var cResult1 = await db.mortals.findOne(
				{ _id: new ObjectID(cResult._id) },
				{ projection: projection }
			)
			if (!cResult || !cResult1) {
				return {
					ok: false,
					message: "No such user or maybe wrong password",
				}
			} else {
				return { ok: true, cResult, cResult1, username: query.username }
			}
		} catch (e) {
			return { ok: false, message: e.message }
		}
	},

	/**
	 * Services.Auth.issueToken
	 * issue a user token and corresponding refreshToken
	 * using the user information encoded inside the token
	 */
	issueToken: async (result) => {
		if (!result.ok) {
			return result
		}

		let { cResult, cResult1, username } = result

		let mortal = Services.ParamsMapper(cResult1, {
			type: "number",
			owner: "string",
		})
		if (mortal.missingFields) {
			return {
				ok: false,
				message: "user record broken",
			}
		} else {
			mortal = mortal.newObj
			mortal.id = cResult._id.toString()
			mortal.username = username
			mortal.usr_data = cResult1.usr_data
		}

		let accessTokenCreatedOn = moment().unix()
		let refreshTokenCreatedOn = moment().unix()

		let refreshTokenParams = {
			username: username,
			tokenCreatedOn: accessTokenCreatedOn,
		}

		let accessTokenParams = {
			...mortal,
			tokenCreatedOn: refreshTokenCreatedOn,
		}

		// add extra checking based on the user param here.
		log.d("mortal", mortal)
		return {
			ok: true,
			mortal: mortal,
			accessTokenCreatedOn,
			refreshTokenCreatedOn,
			token: _private.encode(accessTokenParams),
			refreshToken: _private.encodeRefreshToken(refreshTokenParams),
		}
	},

	/**
	 * Services.Auth.authenticate
	 * verifies the user token
	 */
	authenticate: (token) => {
		return _private.verify(token)
	},

	// generatePublicToken: data => {
	// 	return _private.encrypt(JSON.stringify(data)) // 8 days
	// },

	// decodePublicToken: token => {
	// 	return JSON.parse(_private.decrypt(token))
	// },

	/**
	 * Services.Auth.hashPassword
	 * create a password hash for the given password string
	 * using sha1 technique
	 */
	hashPassword: (password) => {
		return crypto
			.createHmac("sha1", authConfig.pwHashSecret)
			.update(password)
			.digest("hex")
	},
}
