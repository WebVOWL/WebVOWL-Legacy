import BaseNode from "../../elements/nodes/BaseNode"
import SetOperatorNode from "../../elements/nodes/SetOperatorNode"
import BaseProperty from "../../elements/properties/BaseProperty"
import FilterTools from "../../util/filterTools"
import AbstractFilter from "./abstractFilter"

export default class SetOperatorFilter extends AbstractFilter {
    constructor() {
        super(false)
    }

    /**
     * If enabled, all set operators including connected properties are filtered.
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        if (this.enabled) {
            // remove set operators
            const filteredData = FilterTools.filterNodesAndTidy(
                nodes,
                properties,
                this.#isNoSetOperator,
            )
            this.filteredNodes = filteredData.nodes
            this.filteredProperties = filteredData.properties
        } else {
            this.filteredNodes = nodes
            this.filteredProperties = properties
        }
    }

    /**
     * @param {BaseNode} node
     */
    #isNoSetOperator(node) {
        return !(node instanceof SetOperatorNode)
    }
}
