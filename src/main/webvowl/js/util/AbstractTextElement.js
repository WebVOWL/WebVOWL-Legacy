export class AbstractTextElement {
    static LINE_DISTANCE = 1
    static CSS_CLASSES = {
        default: "text",
        subtext: "subtext",
        instanceCount: "instance-count"
    }
    static DARK_TEXT_COLOR = "#000"
    static LIGHT_TEXT_COLOR = "#fff"

    /**
     * @param {d3.Selection<any,any,null,undefined>} container
     * @param {string} backgroundColor
     */
    constructor(container, backgroundColor) {
        this.textBlock = container.append("text")
            .classed("text", true)
            .style("fill", this.#getTextColor(backgroundColor))
            .attr("text-anchor", "middle")
    }

    /**
     *
     * @param {Number} x
     * @param {Number} y
     */
    translation(x, y) {
        this.textBlock.attr("transform", "translate(" + x + ", " + y + ")");
        return this;
    }

    remove() {
        this.textBlock.remove();
        return this;
    }

    /**
     * @param {String} text
     * @param {String} prefix
     * @param {String} postfix
     */
    applyPreAndPostFix(text, prefix, postfix) {
        if (prefix) {
            text = prefix + text;
        }
        if (postfix) {
            text += postfix;
        }
        return text;
    }

    /**
     * @param {string} rawBackgroundColor
     */
    #getTextColor(rawBackgroundColor) {
        if (!rawBackgroundColor) {
            return AbstractTextElement.DARK_TEXT_COLOR;
        }

        var backgroundColor = d3.rgb(rawBackgroundColor);
        if (this.#calculateLuminance(backgroundColor) > 0.5) {
            return AbstractTextElement.DARK_TEXT_COLOR;
        } else {
            return AbstractTextElement.LIGHT_TEXT_COLOR;
        }
    }

    /**
     * @param {{ r: number; g: number; b: number; }} color
     */
    #calculateLuminance(color) {
        return 0.3 * (color.r / 255) + 0.59 * (color.g / 255) + 0.11 * (color.b / 255);
    }
}