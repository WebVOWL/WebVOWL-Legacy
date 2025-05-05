import BaseElement from "../../elements/BaseElement"
import BaseNode from "../../elements/nodes/BaseNode"
import BaseProperty from "../../elements/properties/BaseProperty"
import ElementTools from "../../util/elementTools"
import AbstractFilter from "./abstractFilter"

export default class SubclassFilter extends AbstractFilter {
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
            const filteredData = this.#hideSubclassesWithoutOwnProperties(
                nodes,
                properties,
            )
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
     * @returns {{ nodes: BaseNode[]; properties: BaseProperty[] }}
     */
    #hideSubclassesWithoutOwnProperties(nodes, properties) {
        /**
         * A mapping of properties' domain or range IDs to properties
         * @type {Map<string,BaseProperty[]>}
         */
        let propertyMap = new Map()
        /**
         * @type {BaseProperty[]}
         */
        let unneededProperties = []
        let unneededClasses = []
        let subclasses = []
        let connectedProperties

        for (const property of properties) {
            if (ElementTools.isRdfsSubClassOf(property)) {
                subclasses.push(property.domain)
            }
            let domain = property.domain;
            let range = property.range;
        
            if (domain) {
                if (!propertyMap.has(domain.id)) propertyMap.set(domain.id, []);
                propertyMap.get(domain.id).push(property);
            }
            if (range && range !== domain) {
                if (!propertyMap.has(range.id)) propertyMap.set(range.id, []);
                propertyMap.get(range.id).push(property);
            }
        }

        for (const subclass of subclasses) {
            connectedProperties = this.#findRelevantConnectedProperties(
                subclass,
                propertyMap
            )

            // Only remove the node and its properties if they're all subclassOf properties
            if (
                this.#areOnlySubclassProperties(connectedProperties) &&
                this.#doesNotInheritFromMultipleClasses(
                    subclass,
                    connectedProperties,
                )
            ) {
                unneededProperties =
                    unneededProperties.concat(connectedProperties)
                unneededClasses.push(subclass)
            }
        }
        return {
            nodes: this.#removeUnneededElements(nodes, unneededClasses),
            properties: this.#removeUnneededElements(
                properties,
                unneededProperties,
            ),
        }
    }

    /**
     * Looks recursively for connected properties. Because just subclasses are relevant,
     * we just look recursively for their properties.
     * @param {BaseNode} node
     * @param {Map<String,BaseProperty[]>} propertyMap
     * @param {Set<string>} visitedNodeIDs A set of visited node IDs which is used on recursive invocation
     */
    #findRelevantConnectedProperties(
        node,
        propertyMap,
        visitedNodeIDs = new Set(),
    ) {
        /**
         * @type {BaseProperty[]}
         */
        let connectedProperties = []

        let properties = propertyMap.get(node.id) || [];

        for (const property of properties) {
            connectedProperties.push(property)
            /* Special case: SuperClass <-(1) Subclass <-(2) Subclass ->(3) e.g. Datatype
             * We need to find the last property recursively. Otherwise, we would remove the subClassOf
             * property (1) because we didn't see the datatype property (3).
             */

            // Look only for subclass properties, because these are the relevant properties
            if (ElementTools.isRdfsSubClassOf(property)) {
                const domain = property.domain
                // If we have the range, there might be a nested property on the domain
                if (node === property.range && !visitedNodeIDs.has(domain.id)) {
                    visitedNodeIDs.add(domain.id)
                    const nestedConnectedProperties =
                        this.#findRelevantConnectedProperties(
                            domain,
                            propertyMap,
                            visitedNodeIDs,
                        )
                    connectedProperties = connectedProperties.concat(
                        nestedConnectedProperties,
                    )
                }
            }
        }
        return connectedProperties
    }

    /**
     * @param {BaseProperty[]} connectedProperties
     */
    #areOnlySubclassProperties(connectedProperties) {
        let onlySubclassProperties = true

        for (const property of connectedProperties) {
            if (!ElementTools.isRdfsSubClassOf(property)) {
                onlySubclassProperties = false
                break
            }
        }
        return onlySubclassProperties
    }

    /**
     * @param {BaseNode} subclass
     * @param {BaseProperty[]} connectedProperties
     */
    #doesNotInheritFromMultipleClasses(subclass, connectedProperties) {
        let superClassCount = 0

        for (const property of connectedProperties) {
            if (property.domain === subclass) {
                superClassCount += 1
            }
            if (superClassCount > 1) {
                return false
            }
        }
        return true
    }

    /**
     * @param {BaseElement[]} allElements
     * @param {BaseElement[]} removableElements
     */
    #removeUnneededElements(allElements, removableElements) {
        let disjoint = []

        for (const element of allElements) {
            if (removableElements.indexOf(element) === -1) {
                disjoint.push(element)
            }
        }
        return disjoint
    }
}
