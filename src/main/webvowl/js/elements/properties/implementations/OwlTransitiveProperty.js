import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"


export default class OwlTransitiveProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["transitive"]
        this.styleClass = "transitiveproperty"
        this.type = "owl:TransitiveProperty"
    }
}