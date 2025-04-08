const ADDITIONAL_TEXT_SPACE = 4;

export class TextTools {
    static #measureTextWidth(text, textStyle) {
        // Set a default value
        if (!textStyle) {
            textStyle = "text";
        }
        var d = d3.select("body")
            .append("div")
            .attr("class", textStyle)
            .attr("id", "width-test") // tag this element to identify it
            .attr("style", "position:absolute; float:left; white-space:nowrap; visibility:hidden;")
            .text(text),
            w = document.getElementById("width-test").offsetWidth;
        d.remove();
        return w;
    }

    static truncate(text, maxWidth, textStyle, additionalTextSpace) {
        maxWidth -= isNaN(additionalTextSpace) ? ADDITIONAL_TEXT_SPACE : additionalTextSpace;
        if (isNaN(maxWidth) || maxWidth <= 0) {
            return text;
        }

        var truncatedText = text
        while (true) {
            const textWidth = this.#measureTextWidth(truncatedText, textStyle);
            if (textWidth <= maxWidth) {
                break;
            }

            const ratio = textWidth / maxWidth;
            const newTruncatedTextLength = Math.floor(truncatedText.length / ratio);

            // detect if nothing changes
            if (truncatedText.length === newTruncatedTextLength) {
                break;
            }
            truncatedText = truncatedText.substring(0, newTruncatedTextLength);
        }

        if (text.length > truncatedText.length) {
            return text.substring(0, truncatedText.length - 3) + "...";
        }
        return text;
    }
}
