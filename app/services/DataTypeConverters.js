const ObjectID = require("mongodb").ObjectID
const { logger } = require("../utils")
const isRegexSafe = require("safe-regex")

module.exports = function ({ Services, config }) {
	return {
		/**
		 * Services.DataTypeConverters.convertToRegex
		 * converts a text to a regex after checking for safe regex
		 */
		convertToRegex: function (text) {
			if (typeof text !== "string")
				return config.CONSTANTS.FILTER_ERROR_STRING
			let regExp = new RegExp(
				Services.Utility.escapeStringForRegex(text),
				"ig"
			)
			return isRegexSafe(regExp)
				? regExp
				: config.CONSTANTS.FILTER_ERROR_STRING
		},

		/**
		 * Services.DataTypeConverters.convertToObjectId
		 * converts a string value to a ObjectId
		 */
		convertToObjectId: function (text) {
			try {
				if (!text || typeof text !== "string")
					return config.CONSTANTS.FILTER_ERROR_STRING
				return new ObjectID(text)
			} catch (e) {
				logger.error("ObjectId conversion failed")
				return config.CONSTANTS.FILTER_ERROR_STRING
			}
		},

		/**
		 * Services.DataTypeConverters.convertToArrayOfObjectId
		 * converts array of string values to a ObjectIds
		 */
		convertToArrayOfObjectId: function (arr) {
			if (!arr || !Array.isArray(arr))
				return config.CONSTANTS.FILTER_ERROR_STRING
			try {
				return { $in: arr.map((elem) => new ObjectID(elem)) }
			} catch (e) {
				logger.error("arrayOfObjectId conversion failed")
				return config.CONSTANTS.FILTER_ERROR_STRING
			}
		},

		/**
		 * Services.DataTypeConverters.convertToBoolean
		 * converts string value to boolean
		 */
		convertToBoolean: function (text) {
			if (
				typeof text === "undefined" ||
				text === null ||
				typeof text !== "boolean"
			)
				return config.CONSTANTS.FILTER_ERROR_STRING
			return text
		},

		/**
		 * Services.DataTypeConverters.convertToNumber
		 * converts string value to number
		 */
		convertToNumber: function (text) {
			if (typeof text !== "number")
				return config.CONSTANTS.FILTER_ERROR_STRING
			return Number(text)
		},

		/**
		 * Services.DataTypeConverters.convertToArray
		 * returns a mongodb array check filter after checking if the input provided is an array
		 */
		convertToArray: function (arr) {
			if (!Array.isArray(arr)) return config.CONSTANTS.FILTER_ERROR_STRING

			return {
				$in: arr,
			}
		},

		/**
		 * Services.DataTypeConverters.convertToDate
		 * converts string value to date
		 */
		convertToDate: function (text, advanceCompare) {
			if (
				!Services.Utility.isTextValidDate(text) ||
				typeof text !== "string"
			)
				return config.CONSTANTS.FILTER_ERROR_STRING
			// prettier-ignore
			return advanceCompare && advanceCompare == "$lte"
				? Services.Utility.getCurrentMomentInstance(text)
					.endOf("day")
					.toDate()
				: Services.Utility.getCurrentMomentInstance(text)
					.startOf("day")
					.toDate()
		},
	}
}
