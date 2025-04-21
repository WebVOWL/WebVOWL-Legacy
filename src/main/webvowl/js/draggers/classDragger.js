import AbstractDomainRangeDragger from "./abstractDomainRangeDragger";


export default class ClassDragger extends AbstractDomainRangeDragger {
    /**
     * @param {any} graph
     */
    constructor(graph) {
        super(graph)

        this.id = 10001
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} parentNode A node selection
     */
    setParentNode(parentNode) {
        this.parentNode = parentNode;
        if (this.mouseButtonPressed === false) {
            if (this.parentNode.actualRadius() && this.parentNode.smallestRadius) {
                this.x = this.parentNode.x + 10 + this.parentNode.smallestRadius;
                this.y = this.parentNode.y + 10 + this.parentNode.smallestRadius;
            } else {
                this.x = this.parentNode.x + 60;
                this.y = this.parentNode.y + 60;
            }
        }
        this.updateElement();
    }

    drawNode() {
        super.drawNode("M 20,40 C 0,15 0,-15 20,-40 L -40,0 Z")
    }

    updateElement() {
        if (this.pathElement) {
            // compute start point ;
            const sX = this.parentNode.x;
            const sY = this.parentNode.y;
            const eX = this.x;
            const eY = this.y;

            // this is used only when you dont have a proper layout ordering;
            const dirX = eX - sX;
            const dirY = eY - sY;
            const len = Math.sqrt((dirX * dirX) + (dirY * dirY));

            const nX = dirX / len;
            const nY = dirY / len;

            const ppX = sX + nX * this.parentNode.smallestRadius;
            const ppY = sY + nY * this.parentNode.smallestRadius;

            const ncx = nX * 15;
            const ncy = nY * 15;
            this.draggerObject.attr("cx", ncx)
                .attr("cy", ncy);
            this.pathElement.attr("x1", ppX)
                .attr("y1", ppY)
                .attr("x2", eX)
                .attr("y2", eY);
        }
        const angle = Math.atan2(this.parentNode.y - this.y, this.parentNode.x - this.x) * 180 / Math.PI;
        this.nodeElement.attr("transform", "translate(" + this.x + "," + this.y + ")" + "rotate(" + angle + ")");
        this.draggerObject.attr("transform", "translate(" + this.x + "," + this.y + ")");
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updateElement();
    }
}