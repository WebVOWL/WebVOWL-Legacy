import CenteringTextElement from '../../util/CenteringTextElement';
import DrawTools from '../DrawTools';
import BaseNode from './BaseNode';

export class RoundNode extends BaseNode {
    constructor(graph) {
        this.collapsible = false
        this.radius = 50
        this.collapsingGroupElement
        this.pinGroupElement
        this.haloGroupElement = null
        this.rectangularRepresentation = false
        this.renderingElement
        this.textBlock;
    }

    setRectangularRepresentation(val) {
        rectangularRepresentation = val;
    }

    getRectangularRepresentation() {
        return rectangularRepresentation;
    }

    getHalos() {
        return haloGroupElement;
    }

    // Properties
    collapsible(p) {
        if (!arguments.length) return collapsible;
        collapsible = p;
        return this;
    }

    textBlock(p) {
        if (!arguments.length) return textBlock;
        textBlock = p;
        return this;
    }

    /**
     * This might not be equal to the actual radius, because the instance count is used for its calculation.
     * @param p
     * @returns {*}
     */
    radius(p) {
        if (!arguments.length) return radius;
        radius = p;
        return this;
    }

    // Functions
    setHoverHighlighting(enable) {
        this.nodeElement.selectAll("circle").classed("hovered", enable);
    }

    textWidth(yOffset) {
        var availableWidth = this.smallestRadius * 2;
        // if the text is not placed in the center of the circle, it can't have the full width
        if (yOffset) {
            var relativeOffset = Math.abs(yOffset) / this.smallestRadius;
            var isOffsetInsideOfNode = relativeOffset <= 1;

            if (isOffsetInsideOfNode) {
                availableWidth = Math.cos(relativeOffset) * availableWidth;
            } else {
                availableWidth = 0;
            }
        }
        return availableWidth;
    }

    toggleFocus() {
        this.focused = !this.focused;
        if (this.nodeElement) {
            this.nodeElement.select("circle").classed("focused", this.focused);
        }
        graph.resetSearchHighlight();
        graph.options().searchMenu().clearText();

    }

    actualRadius() {
        if (!graph.options().scaleNodesByIndividuals() || this.individuals.length <= 0) {
            return this.radius();
        } else {
            // we could "listen" for radius and individualCount changes, but this is easier
            var MULTIPLIER = 8, additionalRadius = Math.log(this.individuals.length + 1) * MULTIPLIER + 5;
            return this.radius() + additionalRadius;
        }
    }

    distanceToBorder() {
        return this.smallestRadius;
    }

    removeHalo() {
        if (this.halo) {
            this.halo = false;
            if (haloGroupElement) {
                haloGroupElement.remove();
            }
        }
    }

    drawHalo(pulseAnimation) {
        this.halo = true;
        if (rectangularRepresentation === true) {
            haloGroupElement = DrawTools.drawRectHalo(this.nodeElement, 80, 80, 5);
        } else {
            haloGroupElement = DrawTools.drawHalo(this.nodeElement, this.smallestRadius, this.removeHalo);
        }
        if (pulseAnimation === false) {
            var pulseItem = haloGroupElement.selectAll(".searchResultA");
            pulseItem.classed("searchResultA", false);
            pulseItem.classed("searchResultB", true);
            pulseItem.attr("animationRunning", false);
        }
    }

    /**
     * Draws the pin on a round node on a position depending on its radius.
     */
    drawPin() {
        this.pinned = true;
        var dx = (-3.5 / 5) * this.smallestRadius, dy = (-7 / 10) * this.smallestRadius;
        pinGroupElement = DrawTools.drawPin(this.nodeElement, dx, dy, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());
    }

    /**
     * Removes the pin and refreshs the graph to update the force layout.
     */
    removePin() {
        this.pinned = false;
        if (pinGroupElement) {
            pinGroupElement.remove();
        }
        graph.updateStyle();
    }

    drawCollapsingButton() {
        collapsingGroupElement = this.nodeElement
            .append("g")
            .classed("hidden-in-export", true)
            .attr("transform", function () {
                var dx = (-2 / 5) * this.smallestRadius, dy = (1 / 2) * this.smallestRadius;
                return "translate(" + dx + "," + dy + ")";
            });
        collapsingGroupElement.append("rect")
            .classed("class pin feature", true)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 40)
            .attr("height", 24);
        collapsingGroupElement.append("line")
            .attr("x1", 13)
            .attr("y1", 12)
            .attr("x2", 27)
            .attr("y2", 12);
        collapsingGroupElement.append("line")
            .attr("x1", 20)
            .attr("y1", 6)
            .attr("x2", 20)
            .attr("y2", 18);
    }

    /**
     * Draws a circular node.
     * @param parentElement the element to which this node will be appended
     * @param [additionalCssClasses] additional css classes
     */
    draw(parentElement, additionalCssClasses) {
        var cssClasses = this.collectCssClasses();
        this.nodeElement = parentElement;
        var bgColor = this.backgroundColor;

        if (bgColor === null) {
            bgColor = undefined;
        }
        if (this.attributes.indexOf("deprecated") > -1) {
            bgColor = undefined;
        }
        if (additionalCssClasses instanceof Array) {
            cssClasses = cssClasses.concat(additionalCssClasses);
        }
        if (rectangularRepresentation === true) {
            renderingElement = DrawTools.appendRectangularClass(parentElement, 80, 80, cssClasses, this.labelForCurrentLanguage(), bgColor);
        } else {
            renderingElement = DrawTools.appendCircularClass(parentElement, this.smallestRadius, cssClasses, this.labelForCurrentLanguage(), bgColor);
        }
        this.postDrawActions(parentElement);
    }

    redrawElement() {
        renderingElement.remove();
        textBlock.remove();
        var bgColor = this.backgroundColor;
        if (this.attributes.indexOf("deprecated") > -1) {
            bgColor = undefined;
        }

        var cssClasses = this.collectCssClasses();
        if (rectangularRepresentation === true) {
            renderingElement = DrawTools.appendRectangularClass(this.nodeElement, 80, 80, cssClasses, this.labelForCurrentLanguage(), bgColor);
        } else {
            renderingElement = DrawTools.appendCircularClass(this.nodeElement, this.smallestRadius, cssClasses, this.labelForCurrentLanguage(), bgColor);
        }
        this.postDrawActions(this.nodeElement);
    }
    /**
     * Common actions this should be invoked after drawing a node.
     */
    postDrawActions() {
        this.textBlock(_createTextBlock());
        this.addMouseListeners();
        if (this.pinned) {
            this.drawPin();
        }
        if (this.halo) {
            this.drawHalo(false);
        }
        if (this.collapsible()) {
            this.drawCollapsingButton();
        }
    }

    redrawLabelText() {
        this.textBlock().remove();
        this.textBlock(_createTextBlock());
        renderingElement.select("title").text(this.labelForCurrentLanguage());
    }

    _createTextBlock() {
        var bgColor = this.backgroundColor;
        if (this.attributes.indexOf("deprecated") > -1)
            bgColor = undefined;

        var textBlock = new CenteringTextElement(this.nodeElement, bgColor);
        var equivalentsString = this.equivalentsString();
        var suffixForFollowingEquivalents = equivalentsString ? "," : "";

        textBlock.addText(this.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
        textBlock.addEquivalents(equivalentsString);
        if (!graph.options().compactNotation()) {
            textBlock.addSubText(this.indicationString());
        }
        textBlock.addInstanceCount(this.individuals.length);
        return textBlock;
    }

    equivalentsString() {
        var equivalentClasses = this.equivalents;
        if (!equivalentClasses) {
            return;
        }
        return equivalentClasses
            .map(function (node) {
                return node.labelForCurrentLanguage();
            })
            .join(", ");
    }
}