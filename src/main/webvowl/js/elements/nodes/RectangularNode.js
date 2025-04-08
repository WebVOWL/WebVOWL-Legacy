import CenteringTextElement from '../../util/CenteringTextElement';
import { DrawTools } from '../drawTools';
import { RectangularElementToolsMixin } from '../rectangularElementTools';
import { BaseNode } from './BaseNode';

export class RectangularNode extends RectangularElementToolsMixin(BaseNode) {
    constructor(graph) {
        super(graph)

        this.pinGroupElement    // HTMLElement | undefined
        this.haloGroupElement   // HTMLElement | null
        this.height = 20
        this.width = 60
        this.labelWidth = 80
        this.defaultWidth = 80
        this.shapeElement       // HTMLElement | undefined
        this.textBlock          // HTMLElement | undefined
        this.smallestRadius = height / 2
        this.renderType = "rect"
    }

    setHoverHighlighting(enable) {
        this.nodeElement.selectAll("rect").classed("hovered", enable);
        const haloGroup = this.haloGroupElement;
        if (haloGroup) {
            var test = haloGroup.selectAll(".searchResultA");
            test.classed("searchResultA", false);
            test.classed("searchResultB", true);
        }
    }

    // Required for class interface compatibility
    textWidth() {
        return this.labelWidth;
    }

    // REVIEW: Check if not having this causes issues
    // get width() {
    //     return this.labelWidth;
    // }

    toggleFocus() {
        this.focused = !this.focused;
        this.nodeElement.select("rect").classed("focused", this.focused);
        graph.resetSearchHighlight();
        graph.options().searchMenu().clearText();
    }

    /**
     * Draws the rectangular node.
     * @param parentElement the element to which this node will be appended
     * @param {Array} additionalCssClasses additional css classes
     */
    draw(parentElement, additionalCssClasses) {
        var cssClasses = this.collectCssClasses();
        this.nodeElement = parentElement;

        if (additionalCssClasses instanceof Array) {
            cssClasses = cssClasses.concat(additionalCssClasses);
        }

        // set the value for this.width
        // update labelWidth Value;
        if (graph.options().dynamicLabelWidth() === true) {
            this.labelWidth = Math.min(RectangularElementTools.getMyWidth(this.labelForCurrentLanguage(), this.indicationString()), graph.options().maxLabelWidth());
        }
        else {
            this.labelWidth = this.defaultWidth;
        }
        width = this.labelWidth;
        this.shapeElement = DrawTools.appendRectangularClass(parentElement, this.width, this.height, cssClasses, this.labelForCurrentLanguage(), this.backgroundColor);

        this.textBlock = new CenteringTextElement(parentElement, this.backgroundColor);
        this.textBlock.addText(this.labelForCurrentLanguage());

        this.addMouseListeners();

        if (this.pinned) {
            this.drawPin();
        }
        if (this.halo) {
            this.drawHalo(false);
        }
    }

    drawPin() {
        this.pinned = true;
        // if (graph.options().dynamicLabelWidth()===true) this.labelWidth=RectangularElementTools.getMyWidth(this.labelForCurrentLanguage(), this.indicationString());
        // else                							this.labelWidth=this.defaultWidth;
        // width=this.labelWidth;
        // console.log("this element label Width is "+this.labelWidth);
        const dx = -0.5 * this.labelWidth + 5,
            dy = -1.1 * this.height;
        this.pinGroupElement = DrawTools.drawPin(this.nodeElement, dx, dy, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());
    }

    removePin() {
        this.pinned = false;
        if (this.pinGroupElement) {
            this.pinGroupElement.remove();
        }
        graph.updateStyle();
    }

    removeHalo() {
        this.halo = false;
        if (this.haloGroupElement) {
            this.haloGroupElement.remove();
            this.haloGroupElement = null;
        }
    }

    drawHalo(pulseAnimation) {
        this.halo = true;
        const offset = 0;
        this.haloGroupElement = DrawTools.drawRectHalo(this, this.width, this.height, offset);

        if (pulseAnimation === false) {
            var pulseItem = this.haloGroupElement.selectAll(".searchResultA");
            pulseItem.classed("searchResultA", false);
            pulseItem.classed("searchResultB", true);
            pulseItem.attr("animationRunning", false);
        }

        if (this.pinned) {
            const selectedNode = this.pinGroupElement.node();
            var nodeContainer = selectedNode.parentNode;
            nodeContainer.appendChild(selectedNode);
        }
    }

    updateTextElement() {
        this.textBlock.updateAllTextElements();
    }

    redrawLabelText() {
        this.textBlock.remove();
        this.textBlock = new CenteringTextElement(this.nodeElement, this.backgroundColor);
        this.textBlock.addText(this.labelForCurrentLanguage());
        this.animateDynamicLabelWidth(graph.options().dynamicLabelWidth());
        this.shapeElement.select("title").text(this.labelForCurrentLanguage());
    }

    // REVIEW: Almost identical to BaseProperty
    animateDynamicLabelWidth(dynamic) {
        this.removeHalo();
        const height = this.height;
        if (dynamic === true) {
            this.labelWidth = Math.min(RectangularElementTools.getMyWidth(this.labelForCurrentLanguage(), this.indicationString()), graph.options().maxLabelWidth());
            this.shapeElement.transition().tween("attr", function () {
            })
                .ease('linear')
                .duration(100)
                .attr({ x: -this.labelWidth / 2, y: -height / 2, width: this.labelWidth, height: height })
                .each("end", function () {
                    this.updateTextElement();
                });
        } else {
            this.labelWidth = this.defaultWidth;
            this.updateTextElement();
            this.shapeElement.transition().tween("attr", function () {
            })
                .ease('linear')
                .duration(100)
                .attr({ x: -this.labelWidth / 2, y: -height / 2, width: this.labelWidth, height: height });
        }

        // for the pin we dont need to differ between different widths -- they are already set
        if (this.pinned === true && this.pinGroupElement) {
            const dx = 0.5 * this.labelWidth - 10,
                dy = -1.1 * height;
            this.pinGroupElement.transition()
                .tween("attr.translate", function () {
                })
                .attr("transform", "translate(" + dx + "," + dy + ")")
                .ease('linear')
                .duration(100);
        }
    }

    addTextLabelElement() {
        this.textBlock = new CenteringTextElement(this.nodeElement, this.backgroundColor);
        this.textBlock.addText(this.labelForCurrentLanguage());
    }
}