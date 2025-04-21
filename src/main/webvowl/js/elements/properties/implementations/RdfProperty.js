import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"


export default class RdfProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["rdf"]
        this.styleClass = "rdfproperty"
        this.type = "rdf:Property"
    }
}