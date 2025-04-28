import Constants from "./constants"

/**
 * Encapsulates methods which return a label in a specific language for a preferred language.
 */
export default class LanguageTools {
    /**
     * @param {object | string | undefined} textObject
     * @param {string | null} preferredLanguage
     * @returns {string}
     */
    static textInLanguage(textObject, preferredLanguage = null) {
        if (typeof textObject === "undefined") {
            return undefined
        }

        if (typeof textObject === "string") {
            return textObject
        }

        if (preferredLanguage && textObject.hasOwnProperty(preferredLanguage)) {
            return textObject[preferredLanguage]
        }

        let textForLanguage = this.#searchLanguage(textObject, "en")
        if (textForLanguage) {
            return textForLanguage
        }
        textForLanguage = this.#searchLanguage(
            textObject,
            Constants.LANG_UNDEFINED,
        )
        if (textForLanguage) {
            return textForLanguage
        }
        return textObject[Constants.LANG_IRIBASED]
    }

    /**
     * @param {object} textObject
     * @param {string | null} preferredLanguage
     * @returns {string | void}
     */
    static #searchLanguage(textObject, preferredLanguage) {
        for (const language in textObject) {
            if (
                language === preferredLanguage &&
                textObject.hasOwnProperty(language)
            ) {
                return textObject[language]
            }
        }
    }
}
