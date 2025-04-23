import BaseNode from "../../elements/nodes/BaseNode"
import BaseProperty from "../../elements/properties/BaseProperty"
import ElementTools from "../../util/elementTools"
import AbstractFilter from "./abstractFilter"

export default class Collapsing extends AbstractFilter {
    constructor() {
        super(false)
    }

    // REVIEW: This does not filter anything. Check if this method can be combined in a class elsewhere
    /**
     * Assigns a "collapsible" boolean to all elements
     * @note This mutates the input!
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        // Nothing is filtered, we just need to draw everywehere
        this.filteredNodes = nodes
        this.filteredProperties = properties
        for (const node of nodes) {
            if (!ElementTools.isDatatype(node)) {
                node.collapsible = this.enabled // This only applies to DataTypeNode which inherits from RectangularNode (so this is fine)
            }
        }
    }
}
