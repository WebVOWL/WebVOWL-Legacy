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
    static #parsePropertyIndications(property) {
        for (const indication of PROPERTY_INDICATIONS) {
            if (property.attributes.indexOf(indication) >= 0) {
                property.indications.push(indication);
            }
        }
    }

    static #parseVisualAttributes(element) {
        for (const attributeGroup of VISUAL_ATTRIBUTE_GROUPS) {
            this.#setVisualAttributeOfGroup(element, attributeGroup);
        }
    }

    static #setVisualAttributeOfGroup(element, group) {
        for (const attribute of group) {
            if (element.attributes.indexOf(attribute) >= 0) {
                element.visualAttributes.push(attribute);
                break; // Just a single attribute is possible
            }
        }
    }

    static #parseClassIndications(_class) {
        for (const indication of CLASS_INDICATIONS) {
            if (_class.attributes.indexOf(indication) >= 0) {
                _class.indications.push(indication);
            }
        }
    }

    /**
     * Parses and sets the attributes of a class.
     * @param _class
     */
    static parseClassAttributes(_class) {
        if (!(_class.attributes instanceof Array)) {
            return;
        }
        this.#parseVisualAttributes(_class);
        this.#parseClassIndications(_class);
    }

    /**
     * Parses and sets the attributes of a property.
     * @param property
     */
    static parsePropertyAttributes(property) {
        if (!(property.attributes instanceof Array)) {
            return;
        }
        this.#parseVisualAttributes(property);
        this.#parsePropertyIndications(property);
    }
}