import Graph from "../../../graph";
import DatatypeNode from "../DatatypeNode";


export default class RdfsLiteral extends DatatypeNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["datatype"];
        this.label = "Literal";
        this.styleClass = "literal";
        this.type = "rdfs:Literal";
        this.iri = "http://www.w3.org/2000/01/rdf-schema#Literal";
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} element
     */
    draw(element) {
        super.draw(element, ["dashed"]);
    }
}
