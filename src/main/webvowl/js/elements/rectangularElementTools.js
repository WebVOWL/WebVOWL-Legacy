import Graph from "../graph"

/**
 * Mixin class for shared methods
 * @param {any} Base Inherit from this class
 * @returns
 */
export const RectangularElementToolsMixin = (Base) =>
    class extends Base {
        /**
         * @param {Graph} graph
         */
        constructor(graph) {
            super(graph)
        }

        /**
         * @param {number} dx
         * @param {number} dy
         */
        distanceToBorder(dx, dy) {
            let innerDistance
            const width = this.labelWidth
            const height = this.height
            const m_link = Math.abs(dy / dx)
            const m_rect = height / width

            if (m_link <= m_rect) {
                const timesX = dx / (width / 2)
                const rectY = dy / timesX
                innerDistance = Math.sqrt(
                    Math.pow(width / 2, 2) + Math.pow(rectY, 2),
                )
            } else {
                const timesY = dy / (height / 2)
                const rectX = dx / timesY
                innerDistance = Math.sqrt(
                    Math.pow(height / 2, 2) + Math.pow(rectX, 2),
                )
            }
            return innerDistance
        }

        /**
         * @param {string} text
         * @param {string} textStyle
         */
        #measureTextWidth(text, textStyle) {
            // Set a default value
            if (!textStyle) {
                textStyle = "text"
            }
            const d = d3
                    .select("body")
                    .append("div")
                    .attr("class", textStyle)
                    .attr("id", "width-test") // tag this element to identify it
                    .attr(
                        "style",
                        "position:absolute; float:left; white-space:nowrap; visibility:hidden;",
                    )
                    .text(text),
                w = document.getElementById("width-test").offsetWidth
            d.remove()
            return w
        }

        getMyWidth() {
            // use a simple heuristic
            let myWidth =
                this.#measureTextWidth(this.labelForCurrentLanguage(), "text") +
                20

            // check for sub names;
            const indicatorWidth =
                this.#measureTextWidth(this.indicationString(), "subtext") + 20
            if (indicatorWidth > myWidth) myWidth = indicatorWidth
            return myWidth
        }

        /**
         * @param {boolean} dynamic
         * @param {() => number[]} transitionFunc
         */
        animateDynamicLabelWidth(dynamic, transitionFunc) {
            const _this = this
            if (dynamic) {
                this.setTextWidth(
                    Math.min(
                        this.getMyWidth(),
                        this.graph.options.maxLabelWidth,
                    ),
                )
                this.shapeElement
                    .transition()
                    .tween("attr", function () {})
                    .ease("linear")
                    .duration(100)
                    .attr({
                        x: -_this.getTextWidth() / 2,
                        y: -_this.height / 2,
                        width: _this.getTextWidth(),
                        height: _this.height,
                    })
                    .each("end", function () {
                        _this.updateTextElement()
                    })
            } else {
                this.setTextWidth(this.defaultWidth)
                this.updateTextElement()
                this.shapeElement
                    .transition()
                    .tween("attr", function () {})
                    .ease("linear")
                    .duration(100)
                    .attr({
                        x: -_this.getTextWidth() / 2,
                        y: -_this.height / 2,
                        width: _this.getTextWidth(),
                        height: _this.height,
                    })
            }

            // for the pin we dont need to differ between different widths -- they are already set
            if (this.pinned && this.pinGroupElement) {
                const [dx, dy] = transitionFunc()
                this.pinGroupElement
                    .transition()
                    .tween("attr.translate", function () {})
                    .attr("transform", "translate(" + dx + "," + dy + ")")
                    .ease("linear")
                    .duration(100)
            }
        }
    }
