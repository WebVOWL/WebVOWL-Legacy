import AbsoluteTextElement from "../util/AbsoluteTextElement";
import CenteringTextElement from "../util/CenteringTextElement";
import { LanguageTools } from "../util/languageTools";
import { BaseNode } from "./nodes/BaseNode";
import { BaseProperty } from "./properties/BaseProperty";

/**
 * The base element for all visual elements of webvowl.
 */
export class BaseElement {
    /**
     * @param {any} graph
     */
    constructor(graph) {
        if (this.constructor === BaseNode) {
            throw new Error("Abstract classes can't be instantiated")
        }

        this.graph = graph // TODO: This must be a global reference to save memory.

        // Basic attributes
        /**
         * @type {BaseElement[]}
         */
        this.equivalents = []
        /**
         * @type {string | undefined}
         */
        this.id = undefined
        /**
         * @type {string | undefined}
         */
        this.label = undefined
        /**
         * @type {string | undefined}
         */
        this.type = undefined
        /**
         * @type {string | undefined}
         */
        this.iri = undefined
        /**
         * @type {string | undefined}
         */
        this.baseIri = undefined


        // Additional attributes
        /**
         * @type {{}[]}
         */
        this.annotations = []
        /**
         * @type {string[]}
         */
        this.attributes = []
        /**
         * @type {string | undefined | null}
         */
        this.backgroundColor = undefined
        /**
         * @type {string | undefined}
         */
        this.comment = undefined
        /**
         * @type {string | undefined}
         */
        this.description = undefined
        /**
         * @type {BaseNode | BaseProperty | undefined}
         */
        this.equivalentBase = undefined
        /**
         * @type {string[]}
         */
        this.visualAttributes = []
        /**
         * @type {boolean}
         */
        this.ignoreLocalHoverEvents = false
        /**
         * @type {string | undefined}
         */
        this.backupFullIri = undefined


        // Element containers
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.pinGroupElement = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.haloGroupElement = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.foreignerObject = undefined // foreigner object for editing


        // Style attributes
        /**
         * @type {boolean}
         */
        this.focused = false
        /**
         * @type {string[]}
         */
        this.indications = []
        /**
         * @type {boolean}
         */
        this.mouseEntered = false
        /**
         * @type {string | undefined}
         */
        this.styleClass = undefined
        /**
         * @type {boolean}
         */
        this.visible = true
        /**
         * @type {string | undefined}
         */
        this.backupLabel = undefined

        // Force layout attributes
        /**
         * @type {boolean}
         */
        this._locked = false
        /**
         * @type {boolean}
         */
        this._frozen = false
        /**
         * @type {boolean}
         */
        this._halo = false
        /**
         * @type {boolean}
         */
        this._pinned = false


        // Other
        /**
         * @type {CenteringTextElement | AbsoluteTextElement | undefined}
         */
        this.textBlock = undefined
    }

    // NOTE: Disabled to save memory while this method is not used
    // #applyFixedLocationAttributes() {
    //     this.fixed = this.locked || this.frozen || node.pinned;
    // }

    redrawElement() {
        throw new Error("Method redrawElement() must be implemented")
    }

    /**
     * @returns {number}
     */
    actualRadius() {
        throw new Error("Method actualRadius() must be implemented")
    }

    get locked() {
        return this._locked;
    }

    set locked(p) {
        this._locked = p;
        // this.#applyFixedLocationAttributes();
    }

    get frozen() {
        return this._frozen;
    }

    set frozen(p) {
        this._frozen = p;
        // this.#applyFixedLocationAttributes();
    }

    get halo() {
        return this._halo;
    }

    set halo(p) {
        this._halo = p;
        // this.#applyFixedLocationAttributes();
    }

    get pinned() {
        return this._pinned;
    }

    set pinned(p) {
        this._pinned = p;
        // this.#applyFixedLocationAttributes();
    }

    commentForCurrentLanguage() {
        return LanguageTools.textInLanguage(this.comment, this.graph.language());
    }

    descriptionForCurrentLanguage() {
        return LanguageTools.textInLanguage(this.description, this.graph.language());
    }

    defaultLabel() {
        return LanguageTools.textInLanguage(this.label, "default");
    }

    indicationString() {
        return this.indications.join(", ");
    }

    labelForCurrentLanguage() {
        const preferredLanguage = this.graph && this.graph.language ? this.graph.language() : null;
        return LanguageTools.textInLanguage(this.label, preferredLanguage);
    }

    /**
     * @param {any} other
     */
    equals(other) {
        return other instanceof BaseElement && this.id === other.id;
    }

    toString() {
        return this.labelForCurrentLanguage() + " (" + this.type + ")";
    }
}