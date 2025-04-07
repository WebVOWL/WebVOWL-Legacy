

/**
 * Mixin class for shared methods
 * @param {*} Base Inherit from this class
 * @returns
 */
export const RectangularElementToolsMixin = (Base) =>
    class extends Base {
        distanceToBorder(dx, dy) {
            var innerDistance;
            const width = this.labelWidth;
            const height = this.height;
            const m_link = Math.abs(dy / dx);
            const m_rect = height / width;

            if (m_link <= m_rect) {
                const timesX = dx / (width / 2);
                const rectY = dy / timesX;
                innerDistance = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(rectY, 2));
            } else {
                const timesY = dy / (height / 2);
                const rectX = dx / timesY;
                innerDistance = Math.sqrt(Math.pow(height / 2, 2) + Math.pow(rectX, 2));
            }
            return innerDistance;
        }

        #measureTextWidth(text, textStyle) {
            // Set a default value
            if (!textStyle) {
                textStyle = "text";
            }
            var d = d3.select("body")
                .append("div")
                .attr("class", textStyle)
                .attr("id", "width-test") // tag this element to identify it
                .attr("style", "position:absolute; float:left; white-space:nowrap; visibility:hidden;")
                .text(text), w = document.getElementById("width-test").offsetWidth;
            d.remove();
            return w;
        }

        getMyWidth() {
            // use a simple heuristic
            let myWidth = this.#measureTextWidth(this.labelForCurrentLanguage(), "text") + 20;

            // check for sub names;
            const indicatorWidth = this.#measureTextWidth(this.indicationString(), "subtext") + 20;
            if (indicatorWidth > myWidth)
                myWidth = indicatorWidth;
            return myWidth;
        }

        // TODO: Ensure version in Property/RectangularNode uses its special values
        animateDynamicLabelWidth(dynamic) {
            this.removeHalo();
            const height = this.height;
            if (dynamic === true) {
                this.labelWidth = Math.min(this.getMyWidth(), graph.options().maxLabelWidth());
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
    }