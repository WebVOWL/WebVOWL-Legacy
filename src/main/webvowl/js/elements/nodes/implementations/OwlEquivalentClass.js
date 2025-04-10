import { DrawTools } from '../../drawTools';
import { RoundNode } from '../RoundNode';

const CIRCLE_SIZE_DIFFERENCE = 4;

export class OwlEquivalentClass extends RoundNode {
    constructor(graph) {
        super(graph)

        this.renderingElement   // HTMLElement | undefined
        this.styleClass = "equivalentclass"
        this.type = "owl:equivalentClass"
    }

    actualRadius() {
        return super.actualRadius() + CIRCLE_SIZE_DIFFERENCE;
    }

    redrawElement() {
        this.renderingElement.remove();
        this.textBlock.remove();
        var bgColor = this.backgroundColor;

        if (this.attributes.indexOf("deprecated") > -1) {
            bgColor = undefined;
        }
        const cssClasses = this.collectCssClasses();
        this.renderingElement = this.nodeElement.append("g");

        if (this.rectangularRepresentation === true) {
            DrawTools.appendRectangularClass(
                this.renderingElement,
                84,
                84,
                ["white", "embedded"],
            );
            DrawTools.appendRectangularClass(
                this.renderingElement,
                80 - CIRCLE_SIZE_DIFFERENCE,
                80 - CIRCLE_SIZE_DIFFERENCE,
                cssClasses,
                this.labelForCurrentLanguage(),
                bgColor
            );
        } else {
            DrawTools.appendCircularClass(
                this.renderingElement,
                this.actualRadius(),
                ["white", "embedded"]
            );
            DrawTools.appendCircularClass(
                this.renderingElement,
                this.actualRadius() - CIRCLE_SIZE_DIFFERENCE,
                cssClasses,
                this.labelForCurrentLanguage(),
                bgColor
            );
        }
        this.postDrawActions();
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} parentElement
     */
    draw(parentElement) {
        const cssClasses = this.collectCssClasses();
        this.nodeElement = parentElement;
        this.renderingElement = parentElement.append("g");
        var bgColor = this.backgroundColor;

        if (this.attributes.indexOf("deprecated") > -1) {
            bgColor = undefined;
        }
        // draw the outer circle at first and afterwards the inner circle
        if (this.rectangularRepresentation === true) {
            DrawTools.appendRectangularClass(
                this.renderingElement,
                84,
                84,
                ["white", "embedded"]
            );
            DrawTools.appendRectangularClass(
                this.renderingElement,
                80 - CIRCLE_SIZE_DIFFERENCE,
                80 - CIRCLE_SIZE_DIFFERENCE,
                cssClasses,
                this.labelForCurrentLanguage(),
                bgColor
            );
        } else {
            DrawTools.appendCircularClass(
                this.renderingElement,
                this.actualRadius(),
                ["white", "embedded"]
            );
            DrawTools.appendCircularClass(
                this.renderingElement,
                this.actualRadius() - CIRCLE_SIZE_DIFFERENCE,
                cssClasses,
                this.labelForCurrentLanguage(),
                bgColor
            );
        }
        this.postDrawActions();
    }

    /**
     * Sets the hover highlighting of this node.
     * @param {boolean} enable
     */
    setHoverHighlighting(enable) {
        this.nodeElement.selectAll("circle:last-of-type").classed("hovered", enable);
    }
}
