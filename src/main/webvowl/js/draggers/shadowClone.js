import Graph from "../graph"
import CenteringTextElement from "../util/CenteringTextElement"
import ElementTools from "../util/elementTools"
import MathUtils from "../util/math"
import AbstractDragger from "./abstractDragger"

export default class ShadowClone extends AbstractDragger {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.id = 10003
        this.s_x = 0
        this.s_y = 0
        this.e_x = 0
        this.e_y = 0
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} parentProperty A property selection
     * @param {boolean} inverted
     */
    setParentProperty(parentProperty, inverted = false) {
        this.invertedProperty = inverted
        this.parent = parentProperty
        let renElment
        if (inverted) {
            renElment = parentProperty.inverse.labelObject
            if (
                renElment.linkRangeIntersection &&
                renElment.linkDomainIntersection
            ) {
                const iiP_range = renElment.linkDomainIntersection
                const iiP_domain = renElment.linkRangeIntersection
                this.s_x = iiP_domain.x
                this.s_y = iiP_domain.y
                this.e_x = iiP_range.x
                this.e_y = iiP_range.y
            }
        } else {
            renElment = parentProperty.labelObject
            if (
                renElment.linkRangeIntersection &&
                renElment.linkDomainIntersection
            ) {
                const iP_range = renElment.linkRangeIntersection
                const iP_domain = renElment.linkDomainIntersection
                this.s_x = iP_domain.x
                this.s_y = iP_domain.y
                this.e_x = iP_range.x
                this.e_y = iP_range.y
            }
        }
        this.rootNodeLayer.remove()
        this.rootNodeLayer = this.rootElement.append("g")
        this.rootNodeLayer.datum(parentProperty)
        this.pathElement.remove()
        this.pathElement = this.pathLayer.append("line")
        this.markerElement = this.pathLayer.append("marker")
        this.markerElement.attr("id", "shadowCloneMarker")
        this.pathElement
            .attr("x1", this.e_x)
            .attr("y1", this.e_y)
            .attr("x2", this.s_x)
            .attr("y2", this.s_y)
        this.pathElement.classed(parentProperty.linkType, true)

        if (parentProperty.markerElement) {
            this.markerElement
                .attr("viewBox", parentProperty.markerElement.attr("viewBox"))
                .attr(
                    "markerWidth",
                    parentProperty.markerElement.attr("markerWidth"),
                )
                .attr(
                    "markerHeight",
                    parentProperty.markerElement.attr("markerHeight"),
                )
                .attr("orient", parentProperty.markerElement.attr("orient"))

            const markerPath = parentProperty.markerElement.select("path")
            this.markerElement
                .append("path")
                .attr("d", markerPath.attr("d"))
                .classed(parentProperty.markerType, true)
            this.pathElement.attr(
                "marker-end",
                "url(#" + "shadowCloneMarker" + ")",
            )
            this.markerElement.classed(
                "hidden",
                !ElementTools.isDatatypeProperty(parentProperty),
            )
        }
        const rect = this.rootNodeLayer
            .append("rect")
            .classed(parentProperty.styleClass, true)
            .classed("property", true)
            .attr("x", -parentProperty.labelWidth / 2)
            .attr("y", -parentProperty.height / 2)
            .attr("width", parentProperty.labelWidth)
            .attr("height", parentProperty.height)

        if (
            parentProperty.visualAttributes &&
            parentProperty.visualAttributes
        ) {
            rect.classed(parentProperty.visualAttributes, true)
        }
        rect.classed("datatype", false)
        let bgColor = parentProperty.backgroundColor

        if (
            parentProperty.attributes &&
            parentProperty.attributes.indexOf("deprecated") > -1
        ) {
            bgColor = undefined
            rect.classed("deprecatedproperty", true)
        } else {
            rect.classed("deprecatedproperty", false)
        }
        rect.style("fill", bgColor)

        // add Text;
        const equivalentsString = parentProperty.equivalentsString()
        const suffixForFollowingEquivalents = equivalentsString ? "," : ""
        const textElement = new CenteringTextElement(
            this.rootNodeLayer,
            bgColor,
        )
        textElement.addText(
            parentProperty.labelForCurrentLanguage(),
            "",
            suffixForFollowingEquivalents,
        )
        textElement.addEquivalents(equivalentsString)
        textElement.addSubText(parentProperty.indicationString())

        const cx = 0.5 * (this.s_x + this.e_x)
        const cy = 0.5 * (this.s_y + this.e_y)
        this.rootNodeLayer.attr("transform", "translate(" + cx + "," + cy + ")")
        this.rootNodeLayer.classed("hidden", true)
        this.pathElement.classed("hidden", true)
    }

    /**
     * @param {boolean} val
     */
    hideClone(val) {
        if (this.rootNodeLayer) {
            this.rootNodeLayer.classed("hidden", val)
        }
        if (this.pathElement) {
            this.pathElement.classed("hidden", val)
        }
    }

    /**
     * @param {boolean} val
     */
    hideParentProperty(val) {
        if (this.parent.labelObject) {
            if (
                this.parent.labelElement.attr("transform") ===
                    "translate(0,15)" ||
                this.parent.labelElement.attr("transform") ===
                    "translate(0,-15)"
            ) {
                this.parent.inverse.hide(val)
            }
        }
        this.parent.hide(val)
    }

    drawClone() {
        this.pathElement = this.pathLayer.append("line")
        this.pathElement.attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 0)
    }

    updateElement() {
        this.pathElement
            .attr("x1", this.e_x)
            .attr("y1", this.e_y)
            .attr("x2", this.s_x)
            .attr("y2", this.s_y)
        const cx = 0.5 * (this.s_x + this.e_x)
        const cy = 0.5 * (this.s_y + this.e_y)
        this.rootNodeLayer.attr("transform", "translate(" + cx + "," + cy + ")")
    }

    setInitialPosition() {
        const renElment = this.parent.labelObject
        if (
            renElment.linkRangeIntersection &&
            renElment.linkDomainIntersection
        ) {
            const iP_range = renElment.linkRangeIntersection
            const iP_domain = renElment.linkDomainIntersection
            this.e_x = iP_domain.x
            this.e_y = iP_domain.y
            this.s_x = iP_range.x
            this.s_y = iP_range.y
        }
        this.updateElement()
    }

    /**
     * @param {number} e_x
     * @param {number} e_y
     */
    setPositionDomain(e_x, e_y) {
        const rex = this.parent.range.x
        const rey = this.parent.range.y
        if (ElementTools.isDatatype(this.parent.range)) {
            const intersection = MathUtils.calculateIntersection(
                { x: e_x, y: e_y },
                this.parent.range,
                0,
            )
            this.s_x = intersection.x
            this.s_y = intersection.y
        } else {
            const dir_X = rex - e_x
            const dir_Y = rey - e_y

            const len = Math.sqrt(dir_X * dir_X + dir_Y * dir_Y)

            const nX = dir_X / len
            const nY = dir_Y / len
            this.s_x = rex - nX * this.parent.range.smallestRadius
            this.s_y = rey - nY * this.parent.range.smallestRadius
        }
        this.e_x = e_x
        this.e_y = e_y
        this.updateElement()
    }

    /**
     * @param {number} s_x
     * @param {number} s_y
     */
    setPosition(s_x, s_y) {
        this.s_x = s_x
        this.s_y = s_y

        // add normalized dir;
        const dex = this.parent.domain.x
        const dey = this.parent.domain.y

        const dir_X = s_x - dex
        const dir_Y = s_y - dey

        const len = Math.sqrt(dir_X * dir_X + dir_Y * dir_Y)

        const nX = dir_X / len
        const nY = dir_Y / len

        this.e_x = dex + nX * this.parent.domain.smallestRadius
        this.e_y = dey + nY * this.parent.domain.smallestRadius
        this.updateElement()
    }
}
