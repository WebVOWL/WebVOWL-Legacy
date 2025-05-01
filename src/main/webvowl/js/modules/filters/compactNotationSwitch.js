import BaseNode from "../../elements/nodes/BaseNode"
import BaseProperty from "../../elements/properties/BaseProperty"
import Graph from "../../graph"
import AbstractFilter from "./abstractFilter"

export default class CompactNotationSwitch extends AbstractFilter {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(false)
        this.graph = graph
    }

    /**
     * If enabled, redundant details won't be drawn anymore.
     * @note This mutates the input!
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        this.graph.options.compactNotation = this.enabled
        this.filteredNodes = nodes
        this.filteredProperties = properties
    }
}
