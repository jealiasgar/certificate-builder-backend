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
 * Services.ParamsValidator
 * checks keys and on the obj provided
 * also runs type checking and validators
 */
const mapper = function (obj, validators) {
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
		if (obj.hasOwnProperty(v.key)) {
			if (typeOf(obj[v.key]) === v.dataType) {
				if (
					v.hasOwnProperty("validatorFunc") &&
					typeof v.validatorFunc === "function"
				) {
					if (!v.validatorFunc(obj[v.key])) {
						errorOne(
							v.key,
							`validation has failed for key: "${
								v.key
							}" invalid value: ${obj[v.key]}`
						)
					} else {
						addOne(v.key, obj[v.key])
					}
				} else {
					addOne(v.key, obj[v.key])
				}
			} else {
				errorOne(
					v.key,
					`validation failed for value: ${
						obj[v.key]
					} - expected data type: ${
						v.dataType
					} - received data type ${typeof v.dataType}`
				)
			}
		} else {
			missingOne(v.key)
		}
	}
	return { newObj, errorFields, missingFields }
	//  : ((missingFields == {}) ? null : missingFields)
}
module.exports = mapper

// if(!module.parent){
//     let a = module.exports({ a:1, asdasd: 1, type: 20 }, [
//         { key: "type", dataType: "number", validatorFunc: (e) => [20,30].includes(e) },
//         { key: "email", dataType: "string", validatorFunc: (e) => /@/.test(e) },
//         { key: "active", dataType: "boolean" },
//         { key: "name", dataType: "string" }
//     ])
// }
