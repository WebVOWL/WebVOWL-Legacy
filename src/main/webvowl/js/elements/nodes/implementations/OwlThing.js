import { RoundNode } from "../RoundNode"


export class OwlThing extends RoundNode {
    constructor(graph) {
        super(graph)

        this.label = "Thing"
        this.type = "owl:Thing"
        this.iri = "http://www.w3.org/2002/07/owl#Thing"
        this.radius = 30
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} element
     */
    draw(element) {
        super.draw(element, ["white", "dashed"]);
    }
}
