/**
 * typeOf
 * returns the type of the item sent to it.
 */
const typeOf = function (Item, skeletonMode) {
	if (typeof Item == "object") {
		if (Array.isArray(Item)) {
			return "array"
		} else {
			return "object"
		}
	}
	if (skeletonMode) {
		return Item
	}
	return typeof Item
}

/**
 * Services.ParamMapper
 * used to check if the given object has the corresponding
 * properties and the type checking
 * given the skeleton obj
 */
const mapper = function (obj, skeleton) {
	let newObj = false
	let missingFields = false
	let missingOne = (key, Item) => {
		if (!missingFields) {
			missingFields = {}
		}
		missingFields[key] = Item
	}
	let addOne = (key, Item) => {
		if (!newObj) {
			newObj = {}
		}
		newObj[key] = Item
	}
	for (let key in skeleton) {
		let typeExpected = typeOf(skeleton[key], true)
		let typeIs = typeOf(obj[key], false)
		if (!obj.hasOwnProperty(key) || obj[key] == "") {
			missingOne(key, {
				key,
				typeIs,
				typeExpected,
				reason: "value not present, expecting: " + typeExpected,
				code: 101,
			})
		} else if (typeExpected != typeIs) {
			missingOne(key, {
				key,
				typeIs,
				typeExpected,
				reason: "value present, but not " + typeExpected,
				code: 102,
			})
		} else {
			if (typeExpected == "object") {
				let mapped = mapper(obj[key], skeleton[key])
				if (mapped.newObj) {
					addOne(key, mapped.newObj)
				}
				if (mapped.missingFields) {
					missingOne(key, mapped.missingFields)
				}
			} else {
				addOne(key, obj[key])
			}
		}
	}
	return { newObj, missingFields }
	//  : ((missingFields == {}) ? null : missingFields)
}
module.exports = mapper
/*
// a is source object
var a = {
            name: "string",
            marks: "number",
            love: [],
            kites: {
                //blue: "number",
                white: "number"
            },
            grass: {
                name: {
                    first: "string",
                    last: "string"
                },
                //hill: "string",
                baki: "string"
            },
        }

// b is input object
var b = {
            name: "barkha",
            marks: 9878.99,
            love: [77, 88],
            kites: {
                blue: 96,
                joey: 989,
                white: 97
            },
            grass: {
                name:{
                    first:"lal",
                    last:"dongar"
                },
                //hill:"sdkn",
                baki: "bad"
            }
        }
var t = mapper(a, b)
// t is the final object
*/
