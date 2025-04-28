/** @WORKAROUND CODE:
 * clears empty literals that are provided by owl2vowl: 0.2.2x
 */

import BaseNode from "../../elements/nodes/BaseNode"
import BaseProperty from "../../elements/properties/BaseProperty"
import AbstractFilter from "./abstractFilter"

export default class EmptyLiteralFilter extends AbstractFilter {
    constructor() {
        super(true)
        /**
         * @type {Set<string>}
         */
        this.removedNodes
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        if (!this.enabled) {
            this.filteredNodes = nodes
            this.filteredProperties = properties
            this.removedNodes = new Set()
            return
        }

        /**
         * @type {Set<string>}
         */
        let literalUsageSet = new Set()
        /**
         * @type {Set<string>}
         */
        let thingUsageSet = new Set()

        for (const property of properties) {
            // checking for owl:Thing and rdfs:Literal across domain and range
            if (property.range) {
                const node = property.range
                if (node.type === "rdfs:Literal") {
                    literalUsageSet.add(node.id)
                } else if (node.type === "owl:Thing") {
                    thingUsageSet.add(node.id)
                }
            }
            if (property.domain) {
                const node = property.domain
                if (node.type === "owl:Thing") {
                    thingUsageSet.add(node.id)
                }
            }
        }
        let nodeIDsToRemove = new Set()
        const newNodes = []
        for (const node of nodes) {
            const nodeId = node.id
            const nodeType = node.type
            if (nodeType === "rdfs:Literal") {
                literalUsageSet.has(nodeId)
                    ? newNodes.push(node)
                    : nodeIDsToRemove.add(nodeId)
            } else if (nodeType === "owl:Thing") {
                thingUsageSet.has(nodeId)
                    ? newNodes.push(node)
                    : nodeIDsToRemove.add(nodeId)
            } else {
                newNodes.push(node)
            }
        }
        this.filteredNodes = newNodes
        this.filteredProperties = properties
        this.removedNodes = nodeIDsToRemove
    }
}
