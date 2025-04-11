import { BaseElement } from "../../elements/BaseElement";
import { BaseNode } from "../../elements/nodes/BaseNode";
import { BaseProperty } from "../../elements/properties/BaseProperty";
import { ElementTools } from "../../util/elementTools";
import { AbstractFilter } from "./abstractFilter";

export class SubclassFilter extends AbstractFilter {
    constructor() {
        super(false)
    }

    /**
     * If enabled subclasses that have only subclass properties are filtered.
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        if (this.enabled) {
            // remove set operators
            const filteredData = this.#hideSubclassesWithoutOwnProperties(nodes, properties);
            this.filteredNodes = filteredData.nodes;
            this.filteredProperties = filteredData.properties;
        } else {
            this.filteredNodes = nodes
            this.filteredProperties = properties
        }
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     * @returns {{ nodes: BaseNode[]; properties: BaseProperty[] }}
     */
    #hideSubclassesWithoutOwnProperties(nodes, properties) {
        /**
         * @type {BaseProperty[]}
         */
        let unneededProperties = [];
        let unneededClasses = [];
        let subclasses = [];
        let connectedProperties;

        for (const property of properties) {
            if (ElementTools.isRdfsSubClassOf(property)) {
                subclasses.push(property.domain);
            }
        }

        for (const subclass of subclasses) {
            connectedProperties = this.#findRelevantConnectedProperties(subclass, properties);

            // Only remove the node and its properties, if they're all subclassOf properties
            if (this.#areOnlySubclassProperties(connectedProperties) &&
                this.#doesNotInheritFromMultipleClasses(subclass, connectedProperties)) {

                unneededProperties = unneededProperties.concat(connectedProperties);
                unneededClasses.push(subclass);
            }
        }
        return {
            nodes: this.#removeUnneededElements(nodes, unneededClasses),
            properties: this.#removeUnneededElements(properties, unneededProperties)
        }
    }

    /**
     * Looks recursively for connected properties. Because just subclasses are relevant,
     * we just look recursively for their properties.
     * @param {BaseNode} node
     * @param {BaseProperty[]} allProperties
     * @param {Set<string>} visitedNodeIDs a set of visited node ids which is used on recursive invocation
     */
    #findRelevantConnectedProperties(node, allProperties, visitedNodeIDs = new Set()) {
        /**
         * @type {BaseProperty[]}
         */
        let connectedProperties = []

        for (const property of allProperties) {
            if (property.domain === node || property.range === node) {
                connectedProperties.push(property);
                /* Special case: SuperClass <-(1) Subclass <-(2) Subclass ->(3) e.g. Datatype
                 * We need to find the last property recursively. Otherwise, we would remove the subClassOf
                 * property (1) because we didn't see the datatype property (3).
                 */

                // Look only for subclass properties, because these are the relevant properties
                if (ElementTools.isRdfsSubClassOf(property)) {
                    const domain = property.domain;
                    // If we have the range, there might be a nested property on the domain
                    if (node === property.range && !visitedNodeIDs.has(domain.id)) {
                        visitedNodeIDs.add(domain.id);
                        const nestedConnectedProperties = this.#findRelevantConnectedProperties(domain, allProperties, visitedNodeIDs);
                        connectedProperties = connectedProperties.concat(nestedConnectedProperties);
                    }
                }
            }
        }
        return connectedProperties;
    }

    /**
     * @param {BaseProperty[]} connectedProperties
     */
    #areOnlySubclassProperties(connectedProperties) {
        let onlySubclassProperties = true

        for (const property of connectedProperties) {
            if (!ElementTools.isRdfsSubClassOf(property)) {
                onlySubclassProperties = false;
                break;
            }
        }
        return onlySubclassProperties;
    }

    /**
     * @param {BaseNode} subclass
     * @param {BaseProperty[]} connectedProperties
     */
    #doesNotInheritFromMultipleClasses(subclass, connectedProperties) {
        let superClassCount = 0;

        for (const property of connectedProperties) {
            if (property.domain === subclass) {
                superClassCount += 1;
            }
            if (superClassCount > 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param {BaseElement[]} allElements
     * @param {BaseElement[]} removableElements
     */
    #removeUnneededElements(allElements, removableElements) {
        let disjoint = []

        for (const element of allElements) {
            if (removableElements.indexOf(element) === -1) {
                disjoint.push(element);
            }
        }
        return disjoint;
    }
}