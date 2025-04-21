/**
 * Contains reusable function for drawing nodes
 */
export default class DrawTools {
    /**
     * Append a circular class node with the passed attributes.
     * @param {d3.Selection<any, any, null, undefined>} parent the parent element to which the circle will be appended
     * @param {number} radius
     * @param {string | string[]} cssClasses an array of additional css classes
     * @param {string} tooltip
     * @param {string} backgroundColor
     */
    static appendCircularClass(
        parent,
        radius,
        cssClasses,
        tooltip = undefined,
        backgroundColor = undefined,
    ) {
        const circle = parent
            .append("circle")
            .classed("class", true)
            .attr("r", radius)
        this.#addCssClasses(circle, cssClasses)
        this.#addToolTip(circle, tooltip)
        this.#addBackgroundColor(circle, backgroundColor)
        return circle
    }

    /**
     *
     * @param {d3.Selection<any, any, null, undefined>} element
     * @param {string | string[]} cssClasses
     */
    static #addCssClasses(element, cssClasses) {
        if (cssClasses instanceof Array) {
            for (const cssClass of cssClasses) {
                element.classed(cssClass, true)
            }
        }
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} element
     * @param {string} tooltip
     */
    static #addToolTip(element, tooltip) {
        if (tooltip) {
            element.append("title").text(tooltip)
        }
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} element
     * @param {string} backgroundColor
     */
    static #addBackgroundColor(element, backgroundColor) {
        if (backgroundColor) {
            element.style("fill", backgroundColor)
        }
    }

    /**
     * Appends a rectangular class node with the passed attributes.
     * @param {d3.Selection<any, any, null, undefined>} parent the parent element to which the rectangle will be appended
     * @param {number} width
     * @param {number} height
     * @param {string | string[]} cssClasses an array of additional css classes
     * @param {string} tooltip
     * @param {string} backgroundColor
     */
    static appendRectangularClass(
        parent,
        width,
        height,
        cssClasses,
        tooltip = undefined,
        backgroundColor = undefined,
    ) {
        const rectangle = parent
            .append("rect")
            .classed("class", true)
            .attr("x", -width / 2)
            .attr("y", -height / 2)
            .attr("width", width)
            .attr("height", height)
        this.#addCssClasses(rectangle, cssClasses)
        this.#addToolTip(rectangle, tooltip)
        this.#addBackgroundColor(rectangle, backgroundColor)
        return rectangle
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} container
     * @param {string | number} dx
     * @param {string | number} dy
     * @param {() => any} onClick
     * @param {boolean} accuraciesHelper
     * @param {boolean} useAccuracyHelper
     */
    static drawPin(
        container,
        dx,
        dy,
        onClick,
        accuraciesHelper,
        useAccuracyHelper,
    ) {
        const pinGroupElement = container
            .append("g")
            .classed("hidden-in-export", true)
            .attr("transform", "translate(" + dx + "," + dy + ")")

        const base = pinGroupElement
            .append("circle")
            .classed("class pin feature", true)
            .attr("r", 12)
            .on("click", function () {
                if (onClick) {
                    onClick()
                }
                d3.event.stopPropagation()
            })
        pinGroupElement
            .append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 12)
            .attr("y2", 16)

        if (useAccuracyHelper === true) {
            pinGroupElement
                .append("circle")
                .attr("r", 15)
                .attr("cx", -7)
                .attr("cy", -7)
                .classed("superHiddenElement ", true)
                .classed("superOpacityElement", !accuraciesHelper)
                .on("click", function () {
                    if (onClick) {
                        onClick()
                    }
                    d3.event.stopPropagation()
                })
                .on("mouseover", function () {
                    base.classed("feature_hover", true)
                })
                .on("mouseout", function () {
                    base.classed("feature_hover", false)
                })
        }
        return pinGroupElement
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} container
     * @param {number} width
     * @param {number} height
     * @param {number} offset
     */
    static drawRectHalo(container, width, height, offset) {
        if (!container) {
            return undefined
        }

        const haloGroupElement = container
            .append("g")
            .classed("hidden-in-export", true)

        haloGroupElement
            .append("rect")
            .classed("searchResultA", true)
            .attr("x", (-width - offset) / 2)
            .attr("y", (-offset - height) / 2)
            .attr("width", width + offset)
            .attr("height", height + offset)
        haloGroupElement.attr("animationRunning", true)

        haloGroupElement.node().addEventListener("webkitAnimationEnd", () => {
            const test = haloGroupElement.selectAll(".searchResultA")
            test.classed("searchResultA", false).classed("searchResultB", true)
            haloGroupElement.attr("animationRunning", false)
        })

        haloGroupElement.node().addEventListener("animationend", () => {
            const test = haloGroupElement.selectAll(".searchResultA")
            test.classed("searchResultA", false).classed("searchResultB", true)
            haloGroupElement.attr("animationRunning", false)
        })
        return haloGroupElement
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} container
     * @param {number} radius
     */
    static drawHalo(container, radius) {
        if (container === undefined) {
            return null
            // there is no element to add the halo to;
            // this means the node was not rendered previously
        }

        const haloGroupElement = container
            .append("g")
            .classed("hidden-in-export", true)

        haloGroupElement
            .append("circle", ":first-child")
            .classed("searchResultA", true)
            .attr("r", radius + 15)
        haloGroupElement.attr("animationRunning", true)

        haloGroupElement.node().addEventListener("webkitAnimationEnd", () => {
            const test = haloGroupElement.selectAll(".searchResultA")
            test.classed("searchResultA", false)
                .classed("searchResultB", true)
                .attr("animationRunning", false)
            haloGroupElement.attr("animationRunning", false)
        })

        haloGroupElement.node().addEventListener("animationend", () => {
            const test = haloGroupElement.selectAll(".searchResultA")
            test.classed("searchResultA", false)
                .classed("searchResultB", true)
                .attr("animationRunning", false)
            haloGroupElement.attr("animationRunning", false)
        })
        return haloGroupElement
    }
}
