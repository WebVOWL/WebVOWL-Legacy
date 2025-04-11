/** @WORKAROUND CODE:
 * clears empty literals that are provided by owl2vowl: 0.2.2x
*/

import { BaseNode } from "../../elements/nodes/BaseNode";
import { BaseProperty } from "../../elements/properties/BaseProperty";
import { AbstractFilter } from "./abstractFilter";


export class EmptyLiteralFilter extends AbstractFilter {
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
        if (this.enabled === false) {
            this.filteredNodes = nodes;
            this.filteredProperties = properties;
            this.removedNodes = new Set();
            return;
        }

        /**
         * @type {any[]}
         */
        let literalUsageMap = [];
        /**
         * @type {any[]}
         */
        let thingUsageMap = [];
        for (const property of properties) {
            // checking for owl:Thing and rdfs:Literal across domain and range
            if (property.range) {
                const node = property.range;
                if (node.type === "rdfs:Literal") {
                    literalUsageMap[node.id] = 1;
                } else if (node.type === "owl:Thing") {
                    thingUsageMap[node.id] = 1;
                }
            }
            if (property.domain) {
                const node = property.domain;
                if (node.type === "owl:Thing") {
                    thingUsageMap[node.id] = 1;
                }
            }
        }

        // REVIEW: Check if it is necessary to loop through properties. Maybe doing the check on nodes is enough?
        let nodeIDsToRemove = new Set();
        var newNodes = [];
        for (const node of nodes) {
            const nodeId = node.id;
            const nodeType = node.type;
            if (nodeType === "rdfs:Literal") {
                nodeIDsToRemove.add(nodeId) ? literalUsageMap[nodeId] === undefined : newNodes.push(node);
            } else if (nodeType === "owl:Thing") {
                nodeIDsToRemove.add(nodeId) ? thingUsageMap[nodeId] === undefined : newNodes.push(node);
            } else {
                newNodes.push(node);
            }
        }
        this.filteredNodes = newNodes;
        this.filteredProperties = properties;
        this.removedNodes = nodeIDsToRemove;
    }
}