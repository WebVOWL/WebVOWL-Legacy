import { AbstractTextElement } from "./AbstractTextElement";
import { TextTools } from "./textTools";

export class CenteringTextElement extends AbstractTextElement {
    /**
     * @param {d3.Selection<any,any,null,undefined>} container
     * @param {string} backgroundColor
     */
    constructor(container, backgroundColor) {
        super(container, backgroundColor)

        /**
         * @type {string[]}
         */
        this.storedFullTextLines = [];
        /**
         * @type {d3.Selection<SVGTSpanElement, any, null, undefined>[]}
         */
        this.storedSpanArrays = [];
        /**
         * @type {string[]}
         */
        this.storedStyle = [];
    }

    /**
     * @param {string} text
     * @param {string} prefix
     * @param {string} suffix
     */
    addText(text, prefix, suffix) {
        if (text) {
            this.addTextline(text, CenteringTextElement.CSS_CLASSES.default, prefix, suffix);
        }
    }

    /**
     * @param {string} text
     */
    addSubText(text) {
        if (text) {
            this.addTextline(text, CenteringTextElement.CSS_CLASSES.subtext, "(", ")");
        }
    }

    /**
     * @param {string} text
     */
    addEquivalents(text) {
        if (text) {
            this.addTextline(text, CenteringTextElement.CSS_CLASSES.default);
        }
    }

    /**
     * @param {string} instanceCount
     */
    addInstanceCount(instanceCount) {
        if (instanceCount) {
            this.addTextline(instanceCount.toString(), CenteringTextElement.CSS_CLASSES.instanceCount);
        }
    }

    /**
     * @param {d3.Selection<SVGTSpanElement, any, null, undefined>} correspondingSpan
     */
    saveCorrespondingSpan(correspondingSpan) {
        this.storedSpanArrays.push(correspondingSpan);
    }

    /**
     * @param {string} fullText
     */
    saveFullTextLine(fullText) {
        this.storedFullTextLines.push(fullText);
    }

    /**
     * @param {string} style
     */
    saveStyle(style) {
        this.storedStyle.push(style);
    }

    updateAllTextElements() {
        // TODO : TEST THIS postPrefix >>>  _applyPreAndPostFix
        for (var i = 0; i < this.storedSpanArrays.length; i++) {
            const truncatedText = TextTools.truncate(
                this.storedFullTextLines[i],
                this.textBlock.datum().textWidth(),
                this.storedStyle[i],
                0
            );
            this.storedSpanArrays[i].text(truncatedText);
        }
    }

    /**
     * @param {string} text
     * @param {string} style
     * @param {string} [prefix]
     * @param {string} [postfix]
     */
    addTextline(text, style, prefix, postfix) {
        const truncatedText = TextTools.truncate(
            text,
            this.textBlock.datum().textWidth(),
            style,
            0
        );
        this.saveFullTextLine(text);
        this.saveStyle(style);
        const tspan = this.textBlock.append("tspan")
            .classed(CenteringTextElement.CSS_CLASSES.default, true)
            .classed(style, true)
            .text(this.applyPreAndPostFix(truncatedText, prefix, postfix))
            .attr("x", 0);
        this.#repositionTextLine(tspan);
        this.saveCorrespondingSpan(tspan);
        this.#repositionTextBlock();
    }

    /**
     * @param {{ node: () => Element; attr: (arg0: string, arg1: string) => void; }} tspan
     */
    #repositionTextLine(tspan) {
        const fontSizeProperty = window.getComputedStyle(tspan.node()).getPropertyValue("font-size");
        const fontSize = parseFloat(fontSizeProperty);
        const siblingCount = this.#lineCount() - 1;
        const lineDistance = siblingCount > 0 ? CenteringTextElement.LINE_DISTANCE : 0;
        tspan.attr("dy", fontSize + lineDistance + "px");
    }

    #repositionTextBlock() {
        // Nothing to do if no child elements exist
        if (this.#lineCount() < 1) {
            this.textBlock.attr("y", 0);
            return;
        }
        const textBlockHeight = this.textBlock.node().getBBox().height;
        this.textBlock.attr("y", -textBlockHeight * 0.5 + "px");
    }

    #lineCount() {
        return this.textBlock.property("childElementCount");
    }
}











