import { BaseNode } from "../../elements/nodes/BaseNode";
import { BaseProperty } from "../../elements/properties/BaseProperty";
import { AbstractFilter } from "./abstractFilter";


export class NodeScalingSwitch extends AbstractFilter {
    constructor(graph) {
        super(true)
        this.graph = graph
    }

    // REVIEW: This does not filter anything. Check if this method can be combined in a class elsewhere
    /**
     * If enabled, the scaling of nodes according to individuals will be enabled.
     * @param {BaseNode[]} untouchedNodes
     * @param {BaseProperty[]} untouchedProperties
     */
    filter(untouchedNodes, untouchedProperties) {
        this.graph.options.scaleNodesByIndividuals = this.enabled;
        this.filteredNodes = untouchedNodes;
        this.filteredProperties = untouchedProperties;
    }
}