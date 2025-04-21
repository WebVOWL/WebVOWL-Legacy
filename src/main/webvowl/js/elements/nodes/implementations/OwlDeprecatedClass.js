import Graph from "../../../graph"
import RoundNode from "../RoundNode"


export default class OwlDeprecatedClass extends RoundNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["deprecated"]
        this.type = "owl:DeprecatedClass"
        this.styleClass = "deprecated"
        this.indications = ["deprecated"]
    }
}
