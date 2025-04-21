import Graph from "../../../graph";
import SetOperatorNode from "../SetOperatorNode";


export default class OwlDisjointUnionOf extends SetOperatorNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.styleClass = "disjointunionof"
        this.type = "owl:disjointUnionOf"
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} element
     */
    draw(element) {
        super.draw(element);
        const symbol = element.append("g").classed("embedded", true);
        const symbolRadius = 10;

        symbol.append("circle")
            .attr("class", "symbol")
            .attr("r", symbolRadius);
        symbol.append("circle")
            .attr("cx", 10)
            .attr("class", "symbol")
            .classed("fineline", true)
            .attr("r", symbolRadius);
        symbol.append("circle")
            .attr("class", "nofill")
            .classed("fineline", true)
            .attr("r", symbolRadius);
        symbol.append("text")
            .attr("class", "link")
            .text("1")
            .attr("transform", "scale(.7)translate(3,5)");
        symbol.attr("transform", "translate(-" + (this.radius - 15) / 7 + ",-" + (this.radius - 15) / 100 + ")");
        this.postDrawActions();
    }
}
