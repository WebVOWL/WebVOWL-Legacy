import { AbstractDomainRangeDragger } from "./abstractDomainRangeDragger";

export class RangeDragger extends AbstractDomainRangeDragger {
    constructor(graph) {
        super(graph)

        this.id = 10002 // Sharing ID with DomainDragger
        this.type = "Range_dragger"
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} newRange A node selection
     */
    updateRange(newRange) {
        if (this.graph.genericPropertySanityCheck(
            this.parentNode.domain,
            newRange,
            this.parentNode.type,
            "Could not update range",
            "Restoring previous range"
        ) === false
        ) {
            return;
        }

        // check for triple duplicates!
        if (this.graph.propertyCheckExistenceChecker(this.parentNode, this.parentNode.domain, newRange) === false) {
            return;
        }

        if (this.parentNode.labelElement === undefined) {
            return;
        }

        if (this.parentNode.labelElement.attr("transform") === "translate(0,15)" ||
            this.parentNode.labelElement.attr("transform") === "translate(0,-15)"
        ) {
            this.parentNode.inverse.inverse = null;
            this.parentNode.inverse = null;
            this.parentNode.range = newRange;
        }
        else {
            this.parentNode.range = newRange;
        }
        // update the position of the new range
        const rX = newRange.x;
        const rY = newRange.y;
        const dX = this.parentNode.domain.x;
        const dY = this.parentNode.domain.y;

        // center
        const cX = 0.49 * (dX + rX);
        const cY = 0.49 * (dY + rY);

        // put position there;
        this.parentNode.labelElement.x = cX;
        this.parentNode.labelElement.px = cX;
        this.parentNode.labelElement.y = cY;
        this.parentNode.labelElement.py = cY;
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} parentProperty A property selection
     */
    setParentProperty(parentProperty, inversed = false) {
        const labelObject = parentProperty.labelObject;
        super.setParentProperty(
            parentProperty,
            inversed,
            labelObject.linkDomainIntersection,
            labelObject.linkRangeIntersection,
            labelObject.linkRangeIntersection
        )
    }

    drawNode() {
        super.drawNode("M 61,40 C 41,15 41,-15 61,-40 L 1,0 Z")
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    updateElementViaDomainDragger(x, y) {
        const range_x = x;
        const range_y = y;

        const dex = this.parentNode.range.x;
        const dey = this.parentNode.range.y;

        const dir_X = x - dex;
        const dir_Y = y - dey;

        let len = Math.sqrt(dir_X * dir_X + dir_Y * dir_Y);

        let nX = dir_X / len;
        let nY = dir_Y / len;


        const ep_range_x = dex + nX * this.parentNode.range.smallestRadius;
        const ep_range_y = dey + nY * this.parentNode.range.smallestRadius;


        const dx = range_x - ep_range_x;
        const dy = range_y - ep_range_y;
        len = Math.sqrt(dx * dx + dy * dy);
        nX = dx / len;
        nY = dy / len;

        const angle = Math.atan2(ep_range_y - range_y, ep_range_x - range_x) * 180 / Math.PI + 180;
        this.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
        const doX = ep_range_x + nX * 40;
        const doY = ep_range_y + nY * 40;
        this.draggerObject.attr("transform", "translate(" + doX + "," + doY + ")");
    }

    updateElement() {
        if (this.mouseButtonPressed === true || this.parentNode === undefined) {
            return;
        }

        let range = this.parentNode.range;
        let iP = this.parentNode.labelObject.linkRangeIntersection;
        if (this.parentNode.labelElement === undefined) {
            return;
        }

        let offsetForLoop = 48;
        if (this.parentNode.labelElement.attr("transform") === "translate(0,15)") {
            range = this.parentNode.inverse.domain;
            iP = this.parentNode.labelObject.linkDomainIntersection;
            offsetForLoop = -48;
        }

        if (iP === undefined) {
            return;
        }
        const range_x = range.x;
        const range_y = range.y;

        const ep_range_x = iP.x;
        const ep_range_y = iP.y;

        // offset for dragger object
        const dx = range_x - ep_range_x;
        const dy = range_y - ep_range_y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nX = dx / len;
        const nY = dy / len;

        const doX = ep_range_x - nX * 40;
        const doY = ep_range_y - nY * 40;

        let angle = Math.atan2(ep_range_y - range_y, ep_range_x - range_x) * 180 / Math.PI;

        if (this.isLoopProperty === true) {
            angle -= offsetForLoop;
        }

        this.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
        this.draggerObject.attr("transform", "translate(" + doX + "," + doY + ")");
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        const range_x = this.parentNode.domain.x;
        const range_y = this.parentNode.domain.y;

        // const position of the rangeEndPoint
        const ep_range_x = x;
        const ep_range_y = y;

        // offset for dragger object
        const dx = range_x - ep_range_x;
        const dy = range_y - ep_range_y;

        const len = Math.sqrt(dx * dx + dy * dy);

        const nX = dx / len;
        const nY = dy / len;
        const doX = ep_range_x + nX * 40;
        const doY = ep_range_y + nY * 40;

        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        this.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
        this.draggerObject.attr("transform", "translate(" + doX + "," + doY + ")");

        this.x = x;
        this.y = y;
    }
}