import { AbstractDomainRangeDragger } from "./abstractDomainRangeDragger";


export class DomainDragger extends AbstractDomainRangeDragger {
    /**
     * @param {any} graph
     */
    constructor(graph) {
        super(graph)

        this.id = 10002 // Sharing ID with RangeDragger
        this.type = "Domain_dragger"
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} newDomain A node selection
     */
    updateDomain(newDomain) {
        if (this.graph.genericPropertySanityCheck(
            this.parent.range,
            newDomain,
            this.parent.type,
            "Could not update domain",
            "Restoring previous domain"
        ) === false
        ) {
            this.updateElement();
            return;
        }

        // check for triple duplicates!
        if (this.graph.propertyCheckExistenceChecker(this.parent, newDomain, this.parent.range) === false)
            return;

        if (this.parent.labelElement === undefined) {
            this.updateElement();
            return;
        }

        if (this.parent.labelElement.attr("transform") === "translate(0,15)" ||
            this.parent.labelElement.attr("transform") === "translate(0,-15)"
        ) {
            this.parent.inverse.inverse = null;
            this.parent.inverse = null;
            this.parent.domain = newDomain;
        }
        else {
            this.parent.domain = newDomain;
        }

        // update the position of the new range
        const rX = this.parent.range.x;
        const rY = this.parent.range.y;
        const dX = newDomain.x;
        const dY = newDomain.y;

        // center
        const cX = 0.49 * (dX + rX);
        const cY = 0.49 * (dY + rY);

        // put position there;
        this.parent.labelObject.x = cX;
        this.parent.labelObject.px = cX;
        this.parent.labelObject.y = cY;
        this.parent.labelObject.py = cY;
        this.updateElement();
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} parentProperty A property selection
     */
    setParentProperty(parentProperty, inversed = false) {
        const labelObject = parentProperty.labelObject;
        super.setParentProperty(
            parentProperty,
            inversed,
            labelObject.linkRangeIntersection,
            labelObject.linkDomainIntersection,
            labelObject.linkDomainIntersection
        )
    }

    drawNode() {
        super.drawNode("M 10,40 C -10,15 -10,-15 10,-40 -8.8233455,-13.641384 -36.711107,-5.1228436 -50,0 -36.696429,4.9079017 -8.6403157,13.745728 10,40 Z")
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    updateElementViaRangeDragger(x, y) {
        const range_x = x;
        const range_y = y;

        const dex = this.parent.domain.x;
        const dey = this.parent.domain.y;

        const dir_X = x - dex;
        const dir_Y = y - dey;

        const len = Math.sqrt(dir_X * dir_X + dir_Y * dir_Y);

        const nX = dir_X / len;
        const nY = dir_Y / len;


        const ep_range_x = dex + nX * this.parent.domain.smallestRadius;
        const ep_range_y = dey + nY * this.parent.domain.smallestRadius;

        const angle = Math.atan2(ep_range_y - range_y, ep_range_x - range_x) * 180 / Math.PI;

        this.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
        const dox = ep_range_x + nX * 20;
        const doy = ep_range_y + nY * 20;
        this.draggerObject.attr("transform", "translate(" + dox + "," + doy + ")");
    }

    updateElement() {
        if (this.mouseButtonPressed === true || this.parent === undefined) {
            return;
        }

        const domain = this.parent.domain;
        let iP = this.parent.labelObject.linkDomainIntersection;
        if (this.parent.labelElement === undefined) {
            return;
        }

        if (this.parent.labelElement.attr("transform") === "translate(0,15)") {
            this.parent.inverse.domain;
            iP = this.parent.labelObject.linkRangeIntersection;
        }

        if (iP === undefined) {
            return;
        }

        const range_x = domain.x;
        const range_y = domain.y;

        const ep_range_x = iP.x;
        const ep_range_y = iP.y;

        // offset for dragger object
        const dx = range_x - ep_range_x;
        const dy = range_y - ep_range_y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nX = dx / len;
        const nY = dy / len;

        const dox = ep_range_x - nX * 20;
        const doy = ep_range_y - nY * 20;

        const angle = Math.atan2(ep_range_y - range_y, ep_range_x - range_x) * 180 / Math.PI + 180;

        this.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
        this.draggerObject.attr("transform", "translate(" + dox + "," + doy + ")");
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        const range_x = this.parent.range.x;
        const range_y = this.parent.range.y;

        // const position of the rangeEndPoint
        const ep_range_x = x;
        const ep_range_y = y;

        // offset for dragger object
        const dx = range_x - ep_range_x;
        const dy = range_y - ep_range_y;

        const len = Math.sqrt(dx * dx + dy * dy);

        const nX = dx / len;
        const nY = dy / len;
        const dox = ep_range_x + nX * 20;
        const doy = ep_range_y + nY * 20;

        const angle = Math.atan2(range_y - ep_range_y, range_x - ep_range_x) * 180 / Math.PI + 180;

        this.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
        this.draggerObject.attr("transform", "translate(" + dox + "," + doy + ")");

        this.x = x;
        this.y = y;
    }
}