import Label from "../elements/links/Label"
import BaseNode from "../elements/nodes/BaseNode"
import DatatypeNode from "../elements/nodes/DatatypeNode"
import OwlThing from "../elements/nodes/implementations/OwlThing"
import BaseProperty from "../elements/properties/BaseProperty"
import OwlDatatypeProperty from "../elements/properties/implementations/OwlDatatypeProperty"
import OwlObjectProperty from "../elements/properties/implementations/OwlObjectProperty"
import RdfsSubClassOf from "../elements/properties/implementations/RdfsSubClassOf"

export default class ElementTools {
    /**
     * @param {any} element
     */
    static isLabel(element) {
        return element instanceof Label
    }

    /**
     * @param {any} element
     */
    static isNode(element) {
        return element instanceof BaseNode
    }

    /**
     * @param {any} node
     */
    static isDatatype(node) {
        return node instanceof DatatypeNode
    }

    /**
     * @param {any} node
     */
    static isThing(node) {
        return node instanceof OwlThing
    }

    /**
     * @param {any} element
     */
    static isProperty(element) {
        return element instanceof BaseProperty
    }

    /**
     * @param {any} element
     */
    static isObjectProperty(element) {
        return element instanceof OwlObjectProperty
    }

    /**
     * @param {any} element
     */
    static isDatatypeProperty(element) {
        return element instanceof OwlDatatypeProperty
    }

    /**
     * @param {any} property
     */
    static isRdfsSubClassOf(property) {
        return property instanceof RdfsSubClassOf
    }
}
