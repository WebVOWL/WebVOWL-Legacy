import Graph from "../../../graph"
import SetOperatorNode from "../SetOperatorNode"

function createIntersectionPath() {
    const height = 18

    const offsetX = 5
    const offsetY = -(height / 2)

    const bezierX = 7
    const bezierY = 5
    const bottomBezierY = height - bezierY

    const startPosition = "M" + offsetX + "," + offsetY
    const rightSide =
        "c" +
        bezierX +
        "," +
        bezierY +
        " " +
        bezierX +
        "," +
        bottomBezierY +
        " 0," +
        height
    const leftSide =
        "c" +
        -bezierX +
        "," +
        -bezierY +
        " " +
        -bezierX +
        "," +
        -bottomBezierY +
        " 0," +
        -height

    return startPosition + rightSide + leftSide
}

const INTERSECTION_BACKGROUND_PATH = createIntersectionPath()

export default class OwlIntersectionOf extends SetOperatorNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.styleClass = "intersectionof"
        this.type = "owl:intersectionOf"
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} element
     */
    draw(element) {
        super.draw(element)
        const symbol = element.append("g").classed("embedded", true)
        const symbolRadius = 10

        symbol
            .append("path")
            .attr("class", "nostroke")
            .classed("symbol", true)
            .attr("d", INTERSECTION_BACKGROUND_PATH)
        symbol
            .append("circle")
            .attr("class", "nofill")
            .classed("fineline", true)
            .attr("r", symbolRadius)
        symbol
            .append("circle")
            .attr("cx", 10)
            .attr("class", "nofill")
            .classed("fineline", true)
            .attr("r", symbolRadius)
        symbol
            .append("path")
            .attr("class", "nofill")
            .attr(
                "d",
                "m 9,5 c 0,-2 0,-4 0,-6 0,0 0,0 0,0 0,0 0,-1.8 -1,-2.3 -0.7,-0.6 -1.7,-0.8 -2.9," +
                    "-0.8 -1.2,0 -2,0 -3,0.8 -0.7,0.5 -1,1.4 -1,2.3 0,2 0,4 0,6",
            )
            .attr("transform", "scale(.5)translate(5,0)")

        symbol.attr(
            "transform",
            "translate(-" +
                (this.radius - 15) / 7 +
                ",-" +
                (this.radius - 15) / 100 +
                ")",
        )
        this.postDrawActions()
    }
}
