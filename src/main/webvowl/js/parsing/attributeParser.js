import { BaseElement } from "../elements/BaseElement"
import { BaseProperty } from "../elements/properties/BaseProperty"

// Style
const ANONYMOUS = "anonymous"
const DATATYPE = "datatype"
const DEPRECATED = "deprecated"
const EXTERNAL = "external"
const OBJECT = "object"
const RDF = "rdf"

// Representations
const ASYMMETRIC = "asymmetric"
const FUNCTIONAL = "functional"
const INVERSE_FUNCTIONAL = "inverse functional"
const IRREFLEXIVE = "irreflexive"
const KEY = "key"
const REFLEXIVE = "reflexive"
const SYMMETRIC = "symmetric"
const TRANSITIVE = "transitive"

// Attribute groups
const VISUAL_ATTRIBUTE_GROUPS = [
    [DEPRECATED, DATATYPE, OBJECT, RDF],
    [ANONYMOUS]
]
const CLASS_INDICATIONS = [DEPRECATED, EXTERNAL]
const PROPERTY_INDICATIONS = [
    ASYMMETRIC,
    FUNCTIONAL,
    INVERSE_FUNCTIONAL,
    IRREFLEXIVE,
    KEY,
    REFLEXIVE,
    SYMMETRIC,
    TRANSITIVE
]


/**
 * Parses the attributes an element has and sets the corresponding attributes.
 * @returns {Function}
 */
export class AttributeParser {
    /**
     * @param {BaseElement} property
     */
    static #parsePropertyIndications(property) {
        for (const indication of PROPERTY_INDICATIONS) {
            if (property.attributes.indexOf(indication) >= 0) {
                property.indications.push(indication);
            }
        }
    }

    /**
     * @param {BaseElement} element
     */
    static #parseVisualAttributes(element) {
        for (const attributeGroup of VISUAL_ATTRIBUTE_GROUPS) {
            this.#setVisualAttributeOfGroup(element, attributeGroup);
        }
    }

    /**
     * @param {BaseElement} element
     * @param {string[]} group
     */
    static #setVisualAttributeOfGroup(element, group) {
        for (const attribute of group) {
            if (element.attributes.indexOf(attribute) >= 0) {
                element.visualAttributes.push(attribute);
                break; // Just a single attribute is possible
            }
        }
    }

    /**
     * @param {BaseElement} element
     */
    static #parseClassIndications(element) {
        for (const indication of CLASS_INDICATIONS) {
            if (element.attributes.indexOf(indication) >= 0) {
                element.indications.push(indication);
            }
        }
    }

    /**
     * Parses and sets the attributes of a class.
     * @param {BaseElement} element
     */
    static parseClassAttributes(element) {
        if (!(element.attributes instanceof Array)) {
            return;
        }
        this.#parseVisualAttributes(element);
        this.#parseClassIndications(element);
    }

    /**
     * Parses and sets the attributes of a property.
     * @param {BaseProperty} property
     */
    static parsePropertyAttributes(property) {
        if (!(property.attributes instanceof Array)) {
            return;
        }
        // @ts-ignore
        this.#parseVisualAttributes(property);
        // @ts-ignore
        this.#parsePropertyIndications(property);
    }
}