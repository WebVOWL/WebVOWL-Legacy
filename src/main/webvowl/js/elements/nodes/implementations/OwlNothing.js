import Graph from "../../../graph"
import OwlThing from "./OwlThing"


export default class OwlNothing extends OwlThing {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.label = "Nothing"
        this.type = "owl:Nothing"
        this.iri = "http://www.w3.org/2002/07/owl#Nothing"
    }
}