import BaseNode from "../../elements/nodes/BaseNode"
import BaseProperty from "../../elements/properties/BaseProperty"
import ElementTools from "../../util/elementTools"
import AbstractFilter from "./abstractFilter"

export default class ObjectPropertyFilter extends AbstractFilter {
    constructor() {
        super(false)
    }

    /**
     * If enabled, all object properties and things without any other property are filtered.
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        if (this.enabled) {
            const filteredData = this.#removeObjectProperties(nodes, properties)
            this.filteredNodes = filteredData.nodes
            this.filteredProperties = filteredData.properties
        } else {
            this.filteredNodes = nodes
            this.filteredProperties = properties
        }
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    #removeObjectProperties(nodes, properties) {
        let filteredProperties = []
        let filteredNodes = []

        for (const node of nodes) {
            if (
                this.#isNoFloatingThing(node) ||
                this.#hasPropertiesOtherThanObjectProperties(node)
            ) {
                filteredNodes.push(node)
            }
        }
        for (const property of properties) {
            if (this.#isNoObjectProperty(property)) {
                filteredProperties.push(property)
            }
        }

        return {
            nodes: nodes.filter(this.#isNoFloatingThing),
            properties: properties.filter(this.#isNoObjectProperty),
        }
    }

    /**
     * @param {BaseProperty} property
     */
    #isNoObjectProperty(property) {
        return !ElementTools.isObjectProperty(property)
    }

    /**
     * @param {BaseNode} node
     */
    #isNoFloatingThing(node) {
        return !ElementTools.isThing(node)
    }

    /**
     * @param {BaseNode} node
     */
    #hasPropertiesOtherThanObjectProperties(node) {
        // REVIEW: Nodes must have a reference to their links
        for (const link of node.links) {
            if (this.#isNoObjectProperty(link.property)) {
                return true
            }
        }
        return false
    }
}
