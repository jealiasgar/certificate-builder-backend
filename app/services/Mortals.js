/**
 * Services.Mortals
 */
const randomstring = require("randomstring")
const ObjectID = require("mongodb").ObjectID
const mortalTypes = {
	admin: 10,
	user: 20,
}

module.exports = {
	/**
	 * Services.Mortals.getType
	 * return whether the user type key provided isValid
	 */
	getType: (typeClaimed) => {
		if (Object.keys(mortalTypes).includes(typeClaimed)) {
			return mortalTypes[typeClaimed]
		} else {
			return false
		}
	},

	/**
	 * Services.Mortals.getTypeString
	 * return the type numeric value when user type key is provided
	 */
	getTypeString: (typeClaimed) => {
		if (Object.values(mortalTypes).includes(typeClaimed)) {
			for (let typeKey in mortalTypes) {
				if (mortalTypes[typeKey] == typeClaimed) {
					return typeKey
				}
			}
			return false // new Error("invalid mortal type")
		} else {
			return false
		}
	},

	/**
	 * Services.Mortals.matchType
	 * return if the key value pair of the user type is valid
	 */
	matchType: (typeCode, typeToMatch) => {
		if (!!mortalTypes[typeToMatch]) {
			return mortalTypes[typeToMatch] === typeCode
		} else {
			return false // new Error("invalid mortal type")
		}
	},

	/**
	 * Services.Mortals.create
	 * creates and inserts the user information
	 * inside the mortals and auth_credentials thereby creating a user in the system
	 */
	create: async (data) => {
		let userObject = {}
		let authObject = {}
		// if (!/^[_A-z][_A-z0-9]*$/.test(data.username)) {
		//     return { ok: false, message: "Username string invalid" }
		// }
		if (
			!/^(([^<>()[\]\\.,:\s@"]+(\.[^<>()[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
				data.username
			)
		) {
			return { ok: false, message: "Email string is invalid" }
		}

		authObject._id = userObject._id = new ObjectID()

		authObject.last_login = null
		authObject.record = userObject.record = {
			created_on: new Date(),
			updated_on: new Date(),
			active: true,
		}
		userObject.credentials = {
			username: data.username.toLowerCase(),
		}
		userObject.type = data.type
		userObject.usr_data = {
			name: data.name,
			email: data.email.toLowerCase(),
		}

		authObject.username = userObject.credentials.username
		authObject.password = await Services.Auth.hashPassword(data.password)

		try {
			const opts = {}
			userObject.owner = data.owner
			let re = await db.mortals.insertOne(userObject, opts)
			let re1 = await db.auth_credentials.insertOne(authObject, opts)
			if (
				re.result.ok == 1 &&
				re1.result.ok == 1 &&
				re.result.n == 1 &&
				re1.result.n
			) {
				let insrtd = re.ops[0]
				return { ok: true, mortal: insrtd, message: "Created mortal." }
			} else {
				await db.mortals.deleteOne({ _id: authObject._id })
				await db.auth_credentials.deleteOne({ _id: authObject._id })

				return { ok: false, message: "Failed to create user" }
			}
		} catch (er) {
			if (er.code == 11000) {
				return {
					ok: false,
					message: "Duplicate entry for email/username",
				}
			} else {
				return {
					ok: false,
					message:
						"Maybe Email already registered or issue with db index constraints",
				}
			}
		}
	},

	/**
	 * Services.Mortals.delete
	 * deletes all the user information form
	 * mortals and auth_credentials thereby deleting a user in the system
	 */
	delete: async (username) => {
		// check if the user of the username exists or not
		if (!(await Services.Mortals.userExists({ username })))
			return { ok: false, message: "Username does not exist" }

		const opts = {}
		let deleteFilterMortals = {
			"credentials.username": username,
		}

		let deleteFilterAuthCreds = {
			username: username,
		}

		await db.mortals
			.findOneAndDelete(deleteFilterMortals, opts)
			.catch((e) => {
				throw new Error(
					"Mongo Error: Could not delete user " + e.message
				)
			})

		await db.auth_credentials
			.findOneAndDelete(deleteFilterAuthCreds, opts)
			.catch((e) => {
				log.e(
					`Mongo Error: Failed to delete user from Auth Credentials for username ${username}`
				)
				log.e(e.message)
			})

		return { ok: true, message: `Successfully Deleted user ${username}` }
	},

	/**
	 * Services.Mortals.getAll
	 * gets all the user objects that have been registered inside the system
	 */
	getAll: async ({ filter, projection }) => {
		let mortals = await db.mortals.find(filter, { projection }).toArray()
		return {
			ok: true,
			data: mortals,
			fetchCount: mortals.length,
			totalCount: await db.mortals.countDocuments(),
		}
	},

	/**
	 * Services.Mortals.updateMortalInfo
	 * used to update information about any user the system
	 */
	updateMortalInfo: async ({ username, type, active, email, name }) => {
		// check if the user of the username exists or not
		if (!(await Services.Mortals.userExists({ username })))
			return new Error("Username does not exist")

		var updateOnDate = moment().toDate()

		// create an authCollUpdate object where we check if the active key is not undefined, and if not,
		// we set the record.active key to the active parameter provided with the record.updated_on to updated_on param.
		// We also update the email if it is provided. (If the email is changed, the username also needs to be changed as the
		// login is done by the username.)
		let authCollUpdate = {
			...(active != undefined && {
				"record.active": active,
			}),
			...(email && {
				username: email,
			}),
			"record.updated_on": updateOnDate,
		}

		// create a mortalsCollUpdate object and add the required params after checking the params.
		let mortalsCollUpdate = {
			...(type && { type }),
			...(active != undefined && { "record.active": active }),
			...(email && {
				"credentials.username": email,
				"usr_data.email": email,
			}),
			...(name && { "usr_data.name": name }),
			"record.updated_on": updateOnDate,
		}

		// create two update objects as we have to update this information in two collections.
		if (Object.keys(authCollUpdate).length > 1) {
			let u1 = await db.auth_credentials.updateOne(
				{ username },
				{ $set: authCollUpdate }
			)
			if (u1.result.ok != 1) {
				return new Error("User update has failed")
			}
			if (u1.matchedCount == 0) {
				return new Error("Couldn't find user to update")
			}
		}

		if (Object.keys(mortalsCollUpdate).length > 1) {
			let u2 = await db.mortals.updateOne(
				{ "credentials.username": username },
				{ $set: mortalsCollUpdate }
			)
			if (u2.result.ok != 1) {
				return new Error("User update has failed")
			}
			if (u2.matchedCount == 0) {
				return new Error("Couldn't find user to update")
			}
		}

		return null
	},

	/**
	 * Services.Mortals.updateMortalLoginStatus
	 * updates the last_login value for users when they log in
	 */
	updateMortalLoginStatus: async ({ username }) => {
		let updateObj = {
			"record.last_login": moment().toDate(),
		}
		// let updateResult = {}
		await db.auth_credentials.updateOne({ username }, { $set: updateObj })
		await db.mortals.updateOne(
			{ "credentials.username": username },
			{ $set: updateObj }
		)
		return updateObj["record.last_login"].toISOString()
	},

	/**
	 * Services.Mortals.userExists
	 * checks if the user exists in system
	 * checks by username
	 */
	userExists: async ({ username }) => {
		return !!(await db.auth_credentials.findOne(
			{ username },
			{ projection: { username: 1 } }
		))
	},

	/**
	 * Services.Mortals.getRandomPwd
	 * generates random password string to
	 * to be used while resetting user password
	 */
	getRandomPwd: () => {
		var pwdString = randomstring.generate({
			length: 8,
			charset: "alphanumeric",
		})
		return pwdString
	},
}
