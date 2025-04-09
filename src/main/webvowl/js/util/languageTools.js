import { Constants } from "./constants";

/**
 * Encapsulates methods which return a label in a specific language for a preferred language.
 */
export class LanguageTools {
    /**
     * @param {object | string | undefined} textObject
     * @param {string | null} preferredLanguage
     * @returns {string}
     */
    static textInLanguage(textObject, preferredLanguage) {
        if (typeof textObject === "undefined") {
            return undefined;
        }

        if (typeof textObject === "string") {
            return textObject;
        }

        if (preferredLanguage && textObject.hasOwnProperty(preferredLanguage)) {
            return textObject[preferredLanguage];
        }

        var textForLanguage = this.#searchLanguage(textObject, "en");
        if (textForLanguage) {
            return textForLanguage;
        }
        textForLanguage = this.#searchLanguage(textObject, Constants.LANG_UNDEFINED);
        if (textForLanguage) {
            return textForLanguage;
        }
        return textObject[Constants.LANG_IRIBASED];
    }

    /**
     * @param {object | string | undefined} textObject
     * @param {string | null} preferredLanguage
     * @returns {string | void}
     */
    static #searchLanguage(textObject, preferredLanguage) {
        for (const language of textObject) {
            if (language === preferredLanguage && textObject.hasOwnProperty(language)) {
                return textObject[language];
            }
        }
    }
}

