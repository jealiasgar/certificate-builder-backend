module.exports = {
	/* Considered as tables in postgres*/
	collections: [
		"auth_credentials",
		"mortals", // all users
		"test",
	],
	// Just For postgres database otherwise skip
	schema: {
		/*
			auth_credentials: {
				id: "TEXT PRIMARY KEY",
				username: "TEXT NOT NULL",
				password: "TEXT NOT NULL",
				created_on: "DATE",
				updated_on: "DATE",
				active: "BOOLEAN NOT NULL"
			},
			mortals: {
				id: "TEXT PRIMARY KEY",
				owner: "TEXT NOT NULL references auth_credentials(id)",
				username: "TEXT NOT NULL references auth_credentials(username)",
				type: "INT NOT NULL",
				active: "BOOLEAN NOT NULL",
				name: "TEXT NOT NULL",
				email: "TEXT NOT NULL",
				created_on: "DATE",
				updated_on: "DATE",
			}
		*/
	},
	indexes: {
		/* for mongo indexes */
		auth_credentials: [
			[{ username: 1, _id: 1 }, { unique: true }],
			[{ username: 1 }, { unique: true }],
		],
		/* for postgres indexes */
		/*
			auth_credentials: [
				{ expression: "IF NOT EXISTS ON auth_credentials(username)" },
				{ unique: true, expression: "IF NOT EXISTS ON auth_credentials(username)" },
			]
		*/
	},
}
