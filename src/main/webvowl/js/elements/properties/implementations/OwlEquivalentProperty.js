import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"


export default class OwlEquivalentProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.styleClass = "equivalentproperty"
        this.type = "owl:equivalentProperty"
    }
}