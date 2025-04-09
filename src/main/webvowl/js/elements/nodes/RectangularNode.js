import CenteringTextElement from '../../util/CenteringTextElement';
import { DrawTools } from '../drawTools';
import { RectangularElementToolsMixin } from '../rectangularElementTools';
import { BaseNode } from './BaseNode';

export class RectangularNode extends RectangularElementToolsMixin(BaseNode) {
    constructor(graph) {
        super(graph)

        // Size attributes
        /**
         * @type {number}
         */
        this.height = 20
        /**
         * @type {number}
         */
        this.width = 60
        /**
         * @type {number}
         */
        this.labelWidth = 80
        /**
         * @type {number}
         */
        this.defaultWidth = 80
        /**
         * @type {number}
         */
        this.smallestRadius = this.height / 2

        // Render attributes
        /**
         * @type {string}
         */
        this.renderType = "rect"

        // Element containers
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.shapeElement
    }

    /**
     * @param {boolean} enable
     */
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
        this.graph.resetSearchHighlight();
        this.graph.options().searchMenu().clearText();
    }

    /**
     * Draws the rectangular node.
     * @param {d3.Selection<any,any,null,undefined>} parentElement the element to which this node will be appended
     * @param {string[]} additionalCssClasses additional css classes
     */
    draw(parentElement, additionalCssClasses) {
        var cssClasses = this.collectCssClasses();
        this.nodeElement = parentElement;

        if (additionalCssClasses instanceof Array) {
            cssClasses = cssClasses.concat(additionalCssClasses);
        }

        // set the value for this.width
        // update labelWidth Value;
        if (this.graph.options().dynamicLabelWidth() === true) {
            this.labelWidth = Math.min(this.getMyWidth(), this.graph.options().maxLabelWidth());
        }
        else {
            this.labelWidth = this.defaultWidth;
        }
        this.width = this.labelWidth;
        this.shapeElement = DrawTools.appendRectangularClass(
            parentElement,
            this.width,
            this.height,
            cssClasses,
            this.labelForCurrentLanguage(),
            this.backgroundColor
        );

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
        this.pinGroupElement = DrawTools.drawPin(
            this.nodeElement,
            dx,
            dy,
            this.removePin,
            this.graph.options().showDraggerObject,
            this.graph.options().useAccuracyHelper()
        );
    }

    removePin() {
        this.pinned = false;
        if (this.pinGroupElement) {
            this.pinGroupElement.remove();
        }
        this.graph.updateStyle();
    }

    removeHalo() {
        this.halo = false;
        if (this.haloGroupElement) {
            this.haloGroupElement.remove();
            this.haloGroupElement = undefined;
        }
    }

    /**
     * @param {boolean} pulseAnimation
     */
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
        this.animateDynamicLabelWidth(this.graph.options().dynamicLabelWidth());
        this.shapeElement.select("title").text(this.labelForCurrentLanguage());
    }

    // REVIEW: Almost identical to BaseProperty
    /**
     * @param {boolean} dynamic
     */
    animateDynamicLabelWidth(dynamic) {
        this.removeHalo();
        const _this = this
        if (dynamic === true) {
            this.labelWidth = Math.min(this.getMyWidth(), this.graph.options().maxLabelWidth());
            this.shapeElement.transition().tween("attr", function () {
            })
                .ease('linear')
                .duration(100)
                .attr({ x: -_this.labelWidth / 2, y: -_this.height / 2, width: _this.labelWidth, height: _this.height })
                .each("end", function () {
                    _this.updateTextElement();
                });
        } else {
            this.labelWidth = this.defaultWidth;
            this.updateTextElement();
            this.shapeElement.transition().tween("attr", function () {
            })
                .ease('linear')
                .duration(100)
                .attr({ x: -this.labelWidth / 2, y: -_this.height / 2, width: _this.labelWidth, height: _this.height });
        }

        // for the pin we dont need to differ between different widths -- they are already set
        if (this.pinned === true && this.pinGroupElement) {
            const dx = 0.5 * this.labelWidth - 10;
            const dy = -1.1 * this.height;
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