import { BaseNode } from "../../elements/nodes/BaseNode";
import { BaseProperty } from "../../elements/properties/BaseProperty";
import { AbstractFilter } from "./abstractFilter";


export class CompactNotationSwitch extends AbstractFilter {
    constructor(graph) {
        super(false)
        this.graph = graph

    }

    // REVIEW: This does not filter anything. Check if this method can be combined in a class elsewhere
    /**
     * If enabled, redundant details won't be drawn anymore.
     * This mutates the input!
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        this.graph.options.compactNotation(this.enabled);
        this.filteredNodes = nodes;
        this.filteredProperties = properties;
    }
}