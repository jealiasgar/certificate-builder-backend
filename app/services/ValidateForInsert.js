module.exports = function ({ Services, config }) {
	return async function ({
		body,
		collectionName,
		include = [],
		exclude = [],
	}) {
		// get the validation config for the collectionName
		let conf = require(config.rootDir +
			"/config/validatorConfigs/" +
			collectionName)
		// filter out objects which are not to be validated for insertion
		let insertConf = conf.filter((e) => e.runValidation)

		// keep any specific validation objects which are explicitly given
		if (include.length)
			insertConf = insertConf.filter((e) => include.includes(e.key))
		// remove any specific validation objects which are explicitly given
		if (exclude.length)
			insertConf = insertConf.filter((e) => !exclude.includes(e.key))

		// pass the final configuration and data to the validator
		let data = await Services.Validator(body, insertConf)

		return data
	}
}
