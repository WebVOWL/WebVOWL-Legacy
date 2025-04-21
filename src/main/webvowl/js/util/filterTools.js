import BaseNode from "../elements/nodes/BaseNode";
import BaseProperty from "../elements/properties/BaseProperty";
import ElementTools from "./elementTools";


export default class FilterTools {
    /**
     * Filters the passed nodes and removes dangling properties.
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     * @param {(arg0: BaseNode) => boolean} shouldKeepNode function that returns true if the node should be kept
     * @returns {{ nodes: BaseNode[]; properties: BaseProperty[]; }} the filtered nodes and properties
     */
    static filterNodesAndTidy(nodes, properties, shouldKeepNode) {
        let removedNodes = new Set();
        let cleanedNodes = new Map();
        let cleanedProperties = [];

        for (const node of nodes) {
            if (shouldKeepNode(node)) {
                cleanedNodes.set(node.id, node);
            } else {
                removedNodes.add(node.id);
            }
        }

        for (const property of properties) {
            if (this.#propertyHasVisibleNodes(removedNodes, property)) {
                cleanedProperties.push(property);
            } else if (ElementTools.isDatatypeProperty(property)) {
                // Remove floating datatypes/literals, because they belong to their datatype property
                cleanedNodes.delete(property.range.id);
            }
        }
        return {
            nodes: Array.from(cleanedNodes.values()), // TODO: This should return a map
            properties: cleanedProperties
        };
    }

    /**
     * Returns true, if the domain and the range of this property have not been removed.
     * @param {Set<string>} removedNodes
     * @param {BaseProperty} property
     * @returns {boolean} true if property isn't dangling
     */
    static #propertyHasVisibleNodes(removedNodes, property) {
        return !removedNodes.has(property.domain.id) && !removedNodes.has(property.range.id);
    }
}