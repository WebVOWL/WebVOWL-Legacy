import Graph from "../../../graph"
import RoundNode from "../RoundNode"


export default class RdfsClass extends RoundNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["rdf"]
        this.type = "rdfs:Class"
    }
}