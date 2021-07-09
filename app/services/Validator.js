const typeOf = function (Item) {
	if (typeof Item == "object") {
		if (Array.isArray(Item)) {
			return "array"
		} else {
			return "object"
		}
	}
	return typeof Item
}
/**
 * Services.Validator
 * checks keys and on the obj provided
 * also runs type checking and validators
 */
module.exports = function ({ Services, config }) {
	return async function (obj, validators) {
		let newObj = false
		let missingFields = false
		let errorFields = false
		let missingOne = (key) => {
			if (!missingFields) {
				missingFields = []
			}
			missingFields.push(key)
		}
		let errorOne = (key, Item) => {
			if (!errorFields) {
				errorFields = {}
			}
			errorFields[key] = Item
		}
		let addOne = (key, Item) => {
			if (!newObj) {
				newObj = {}
			}
			newObj[key] = Item
		}
		for (let v of validators) {
			/**
			 * sample config object "v" looks like this
			 * {
			 * 		key: "slug", // name of the property to be checked
			 *
			 * 		// if dataType is date and string is sent "string date" validation to be done manually in validatorFunc
			 * 		// this will define what the javascript datatype of the key should be
			 * 		dataType: "string",
			 *
			 * 		// can also be an async function returns boolean or object
			 * 		// validatorFunc is an optional key
			 * 		// validatorFunc if returns an object should have keys { isValid, transformedVal, errorMessage }
			 * 		// "isValid" is the boolean value (required)
			 * 		// "transformedVal" is to transform the input value after validating (optional)
			 * 		// "errorMessage" custom error message (optional)
			 * 		validatorFunc: validatorFunc: async (e) => /@/.test(e),
			 *
			 * 		// allows the value of the key to be null
			 * 		// allowNull is an optional key
			 * 		allowNull: true,
			 *
			 * 		// if dataType is string then maximun string length can be checked by this
			 * 		// strLen is an optional key
			 * 		strLen: 10,
			 *
			 * 		// boolean value to make the key required / not required
			 * 		// required is an optional key
			 * 		// if "required" not defined by default required is assumed for checking
			 * 		required: false
			 * }
			 */
			if (obj.hasOwnProperty(v.key)) {
				if (
					typeOf(obj[v.key]) === v.dataType ||
					(typeOf(obj[v.key]) === "string" &&
						v.dataType === "date") ||
					(v.allowNull && obj[v.key] === null)
				) {
					if (
						v.hasOwnProperty("strLen") &&
						typeOf(obj[v.key]) === "string" &&
						typeOf(v.strLen) === "number" &&
						obj[v.key].length > v.strLen
					) {
						errorOne(
							v.key,
							`The length of the field: ${v.key} should not be greater than ${v.strLen}`
						)
					} else {
						if (
							v.hasOwnProperty("validatorFunc") &&
							typeof v.validatorFunc === "function" &&
							!(v.allowNull && obj[v.key] === null)
						) {
							let result = await v.validatorFunc(
								obj[v.key],
								obj,
								{ Services, config }
							)
							let isValid = result
							if (
								typeof result === "object" &&
								(result.hasOwnProperty("transformedVal") ||
									result.hasOwnProperty("errorMessage"))
							) {
								isValid = result.isValid
							}

							if (!isValid) {
								errorOne(
									v.key,
									result.errorMessage ||
										`validation has failed for key: "${
											v.key
										}" \n invalid value: ${obj[v.key]}`
								)
							} else {
								addOne(
									v.key,
									isValid &&
										result.hasOwnProperty("transformedVal")
										? result.transformedVal
										: obj[v.key]
								)
							}
						} else {
							addOne(v.key, obj[v.key])
						}
					}
				} else {
					errorOne(
						v.key,
						`validation failed for "${v.key}": ${
							obj[v.key]
						} - expected data type: ${
							v.allowNull
								? `${v.dataType} or expected value: null`
								: v.dataType
						} - received data type ${typeof obj[v.key]}`
					)
				}
			} else {
				if (v.required !== false) missingOne(v.key)
			}
		}
		return { newObj, errorFields, missingFields }
		//  : ((missingFields == {}) ? null : missingFields)
	}
}

/*
    if(!module.parent) {
        let a = module.exports({ a:1, asdasd: 1, type: 20 }, [
            { key: "type", dataType: "number", validatorFunc: (e) => [20,30].includes(e) },
            { key: "email", dataType: "string", validatorFunc: (e) => /@/.test(e) },
            { key: "active", dataType: "boolean" },
            { key: "name", dataType: "string" }
        ])
    }
*/
