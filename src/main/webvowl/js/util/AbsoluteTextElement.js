
import { AbstractTextElement } from './AbstractTextElement';
import { TextTools } from './textTools';


export class AbsoluteTextElement extends AbstractTextElement {
    /**
     * @param {d3.Selection<any, any, null, undefined>} container
     * @param {string} backgroundColor
     */
    constructor(container, backgroundColor) {
        super(container, backgroundColor)
    }

    /**
     * @param {string} text
     * @param {number} yShift
     * @param {string} prefix
     * @param {string} suffix
     */
    addText(text, yShift, prefix, suffix) {
        if (text) {
            this.addTextline(text, AbstractTextElement.CSS_CLASSES.default, yShift, prefix, suffix);
        }
    }

    /**
     * @param {string} text
     * @param {number} yShift
     */
    addSubText(text, yShift) {
        if (text) {
            this.addTextline(text, AbstractTextElement.CSS_CLASSES.subtext, yShift, "(", ")");
        }
    }

    /**
     * @param {string} text
     * @param {number} yShift
     */
    addEquivalents(text, yShift) {
        if (text) {
            this.addTextline(text, AbstractTextElement.CSS_CLASSES.default, yShift);
        }
    }

    /**
     * @param {any} instanceCount
     * @param {number} yShift
     */
    addInstanceCount(instanceCount, yShift) {
        if (instanceCount) {
            this.addTextline(instanceCount.toString(), AbstractTextElement.CSS_CLASSES.instanceCount, yShift);
        }
    }

    /**
     * @param {string} text
     * @param {string} style
     * @param {number} yShift
     * @param {string} [prefix]
     * @param {string} [postfix]
     */
    addTextline(text, style, yShift, prefix, postfix) {
        const truncatedText = TextTools.truncate(
            text,
            this.textBlock.datum().textWidth(yShift),
            style,
            0
        );
        const tspan = this.textBlock.append("tspan")
            .classed(AbstractTextElement.CSS_CLASSES.default, true)
            .classed(style, true)
            .text(this.applyPreAndPostFix(truncatedText, prefix, postfix))
            .attr("x", 0);
        this.#repositionTextLine(tspan, yShift);
    }

    /**
     *
     * @param {d3.Selection<any, any, null, undefined>} tspan
     * @param {number} yShift
     */
    #repositionTextLine(tspan, yShift) {
        const fontSizeProperty = window.getComputedStyle(tspan.node()).getPropertyValue("font-size");
        const fontSize = parseFloat(fontSizeProperty);

        /* BBox height is not supported in Firefox for tspans and dominant-baseline doesn't work in some SVG editors */
        const approximatedShiftForVerticalCentering = (1 / 3) * fontSize;
        tspan.attr("y", approximatedShiftForVerticalCentering + (yShift || 0) + "px");
    }
}