import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"

export default class OwlInverseFunctionalProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["inverse functional"]
        this.styleClass = "inversefunctionalproperty"
        this.type = "owl:InverseFunctionalProperty"
    }
}
