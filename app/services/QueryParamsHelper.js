const { logger } = require("../utils")
module.exports = function ({ Services, config }) {
	return {
		parseFilterObject: function ({ filterText, collectionName }) {
			let tempFilterObject
			try {
				tempFilterObject = JSON.parse(filterText)
			} catch (e) {
				logger.warn("Could not parse filter json")
				return {
					filter: {},
					filterJsonObject: {},
				}
			}

			let filterObject = []
			let globalFilterObj = { $or: [] }
			let conf = require(config.rootDir +
				"/config/validatorConfigs/" +
				collectionName)

			// if (tempFilterObject.hasOwnProperty("searchText")) {
			// 	globalFilterObj = Services.QueryParamsHelper.parseSearchText({
			// 		searchText: tempFilterObject.searchText,
			// 		collectionName,
			// 	});
			// }

			for (let obj of conf /* .filter((e) => e.searchKey)*/) {
				// check if global filter search text exists
				if (obj.globalSearch && tempFilterObject.searchText) {
					let searchRegex =
						Services.DataTypeConverters.convertToRegex(
							tempFilterObject.searchText
						)
					if (searchRegex !== config.CONSTANTS.FILTER_ERROR_STRING) {
						globalFilterObj["$or"].push({
							[obj.searchKey]: searchRegex,
						})
					}
				}

				// if searchKey doesn't exist or if the key has value undefined then skip loop
				if (
					!obj.searchKey ||
					typeof tempFilterObject[obj.key] == "undefined"
				)
					continue

				let dataType =
					obj.isObjectId == true ? "ObjectId" : obj.dataType
				let customKey = obj.searchKey
				let transformVal

				switch (dataType) {
					case "number": {
						transformVal =
							Services.DataTypeConverters.convertToNumber(
								tempFilterObject[obj.key]
							)
						break
					}
					case "string": {
						transformVal =
							Services.DataTypeConverters.convertToRegex(
								tempFilterObject[obj.key]
							)
						break
					}
					case "date": {
						let date = Services.DataTypeConverters.convertToDate(
							tempFilterObject[obj.key],
							obj.advanceCompare
						)
						// prettier-ignore
						transformVal =
								date !== config.CONSTANTS.FILTER_ERROR_STRING && obj.advanceCompare
									? {
										[obj.advanceCompare]: date,
									}
									: date
						break
					}
					case "array": {
						transformVal =
							Services.DataTypeConverters.convertToArray(
								tempFilterObject[obj.key]
							)
						break
					}
					case "ObjectId": {
						transformVal =
							Services.DataTypeConverters.convertToObjectId(
								tempFilterObject[obj.key]
							)
						break
					}
					case "arrayOfObjectId": {
						transformVal =
							Services.DataTypeConverters.convertToArrayOfObjectId(
								tempFilterObject[obj.key]
							)
						break
					}
					case "boolean": {
						transformVal =
							Services.DataTypeConverters.convertToBoolean(
								tempFilterObject[obj.key]
							)
						break
					}
				}

				// In searches strings are converted to regex, but type is an exception.
				if (
					customKey === "type" &&
					tempFilterObject.type &&
					collectionName == "adminUsers"
				) {
					transformVal = Services.Mortals.getType(
						tempFilterObject.type
					)
					tempFilterObject[obj.key] = transformVal
				}

				if (transformVal !== config.CONSTANTS.FILTER_ERROR_STRING) {
					if (customKey.indexOf("|") > -1) {
						let keys = customKey.split("|")
						let customFilter = keys.reduce((acc, cv) => {
							acc.push({ [cv]: transformVal })
							return acc
						}, [])

						filterObject.push({
							$or: customFilter,
						})
					} else {
						filterObject.push({
							[customKey]: transformVal,
						})
					}
				}
			}

			// let finalFilterObject = [];

			// for (let obj of filterObject) {
			// 	for (let key in obj) {
			// 		if (obj[key] === config.CONSTANTS.FILTER_ERROR_STRING) delete obj[key];

			// 		// In searches strings are converted to regex, but type is an exception.
			// 		if (obj["type"]) obj["type"] = Services.Users.getType(tempFilterObject.type);

			// 		if (Object.keys(obj).length > 0) {
			// 			finalFilterObject.push(obj);
			// 		}
			// 	}
			// }

			if (globalFilterObj["$or"].length) {
				if (filterObject.length === 0) {
					return {
						filter: { $and: [globalFilterObj] },
						filterJsonObject: tempFilterObject,
					}
				}
				return {
					filter: { $and: [{ $and: filterObject }, globalFilterObj] },
					filterJsonObject: tempFilterObject,
				}
			}

			return {
				filter: filterObject.length === 0 ? {} : { $and: filterObject },
				filterJsonObject: tempFilterObject,
			}
		},

		// parseSearchText: function ({ searchText, collectionName }) {
		// 	let conf = require(config.rootDir + "/config/validatorConfigs/" + collectionName);

		// 	let orArr = [];

		// 	let search = Services.DataTypeConverters.convertToRegex(searchText);
		// 	if (search !== config.CONSTANTS.FILTER_ERROR_STRING) {
		// 		for (let obj of conf.filter((e) => e.globalSearch)) {
		// 			orArr.push({
		// 				[obj.searchKey]: search,
		// 			});
		// 		}
		// 	}
		// 	return { $or: orArr };
		// },

		parse: function ({ queryParams, collectionName }) {
			if (typeof queryParams.filter == "string") {
				return Services.QueryParamsHelper.parseFilterObject({
					filterText: queryParams.filter,
					collectionName,
				})
			} else {
				return {
					filter: {},
					filterJsonObject: {},
				}
			}
		},
	}
}
