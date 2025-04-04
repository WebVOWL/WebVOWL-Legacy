/**
 * Contains reusable function for drawing nodes.
 */
class DrawTools {
    constructor() { }

    /**
     * Append a circular class node with the passed attributes.
     * @param parent the parent element to which the circle will be appended
     * @param radius
     * @param [cssClasses] an array of additional css classes
     * @param [tooltip]
     * @param [backgroundColor]
     * @returns {*}
     */
    appendCircularClass(parent, radius, cssClasses, tooltip, backgroundColor) {
        var circle = parent.append("circle")
            .classed("class", true)
            .attr("r", radius);

        this._addCssClasses(circle, cssClasses);
        this._addToolTip(circle, tooltip);
        this._addBackgroundColor(circle, backgroundColor);
        return circle;
    }

    _addCssClasses(element, cssClasses) {
        if (cssClasses instanceof Array) {
            cssClasses.forEach(function (cssClass) {
                element.classed(cssClass, true);
            });
        }
    }

    _addToolTip(element, tooltip) {
        if (tooltip) {
            element.append("title").text(tooltip);
        }
    }

    _addBackgroundColor(element, backgroundColor) {
        if (backgroundColor) {
            element.style("fill", backgroundColor);
        }
    }

    /**
     * Appends a rectangular class node with the passed attributes.
     * @param parent the parent element to which the rectangle will be appended
     * @param width
     * @param height
     * @param [cssClasses] an array of additional css classes
     * @param [tooltip]
     * @param [backgroundColor]
     * @returns {*}
     */
    appendRectangularClass(parent, width, height, cssClasses, tooltip, backgroundColor) {
        var rectangle = parent.append("rect")
            .classed("class", true)
            .attr("x", -width / 2)
            .attr("y", -height / 2)
            .attr("width", width)
            .attr("height", height);

        this._addCssClasses(rectangle, cssClasses);
        this._addToolTip(rectangle, tooltip);
        this._addBackgroundColor(rectangle, backgroundColor);
        return rectangle;
    }

    drawPin(container, dx, dy, onClick, accuraciesHelperFunction, useAccuracyHelper) {
        var pinGroupElement = container
            .append("g")
            .classed("hidden-in-export", true)
            .attr("transform", "translate(" + dx + "," + dy + ")");

        var base = pinGroupElement.append("circle")
            .classed("class pin feature", true)
            .attr("r", 12)
            .on("click", function () {
                if (onClick) {
                    onClick();
                }
                d3.event.stopPropagation();
            });

        pinGroupElement.append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 12)
            .attr("y2", 16);

        if (useAccuracyHelper === true) {
            pinGroupElement.append("circle")
                .attr("r", 15)
                .attr("cx", -7)
                .attr("cy", -7)
                .classed("superHiddenElement ", true)
                .classed("superOpacityElement", !accuraciesHelperFunction())
                .on("click", function () {
                    if (onClick) {
                        onClick();
                    }
                    d3.event.stopPropagation();
                })
                .on("mouseover", function () {
                    base.classed("feature_hover", true);
                })
                .on("mouseout", function () {
                    base.classed("feature_hover", false);
                });
        }
        return pinGroupElement;
    }

    drawRectHalo(node, width, height, offset) {
        var container;
        if (node.nodeElement)
            container = node.nodeElement();
        else
            container = node.labelElement();

        if (!container) {
            // console.log("no container found");
            return;
        }

        var haloGroupElement = container
            .append("g")
            .classed("hidden-in-export", true);

        haloGroupElement.append("rect")
            .classed("searchResultA", true)
            .attr("x", (-width - offset) / 2)
            .attr("y", (-offset - height) / 2)
            .attr("width", width + offset)
            .attr("height", height + offset);
        haloGroupElement.attr("animationRunning", true);

        haloGroupElement.node().addEventListener("webkitAnimationEnd", () => {
            var test = haloGroupElement.selectAll(".searchResultA");
            test.classed("searchResultA", false)
                .classed("searchResultB", true);
            haloGroupElement.attr("animationRunning", false);
        });

        haloGroupElement.node().addEventListener("animationend", () => {
            var test = haloGroupElement.selectAll(".searchResultA");
            test.classed("searchResultA", false)
                .classed("searchResultB", true);
            haloGroupElement.attr("animationRunning", false);
        });
        return haloGroupElement;
    }

    drawHalo(container, radius) {
        if (container === undefined) {
            return null;
            // there is no element to add the halo to;
            // this means the node was not rendered previously
        }

        var haloGroupElement = container
            .append("g")
            .classed("hidden-in-export", true);

        haloGroupElement.append("circle", ":first-child")
            .classed("searchResultA", true)
            .attr("r", radius + 15);
        haloGroupElement.attr("animationRunning", true);

        haloGroupElement.node().addEventListener("webkitAnimationEnd", () => {
            var test = haloGroupElement.selectAll(".searchResultA");
            test.classed("searchResultA", false)
                .classed("searchResultB", true)
                .attr("animationRunning", false);
            haloGroupElement.attr("animationRunning", false);
        });

        haloGroupElement.node().addEventListener("animationend", () => {
            var test = haloGroupElement.selectAll(".searchResultA");
            test.classed("searchResultA", false)
                .classed("searchResultB", true)
                .attr("animationRunning", false);
            haloGroupElement.attr("animationRunning", false);
        });
        return haloGroupElement;
    }
}

export default {
    DrawTools
}
