import Graph from "../../../graph"
import RoundNode from "../RoundNode"

export default class RdfsResource extends RoundNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["rdf"]
        this.label = "Resource"
        this.radius = 30
        this.styleClass = "rdfsresource"
        this.type = "rdfs:Resource"
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} element
     */
    draw(element) {
        super.draw(element, ["rdf", "dashed"])
    }
}
