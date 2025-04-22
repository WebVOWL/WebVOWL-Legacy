import Graph from "../../../webvowl/js/graph"

export default class GravityMenu {
    /**
     * Contains the logic for setting up the gravity sliders.
     * @param {Graph} graph the associated webvowl graph
     */
    constructor(graph) {
        this.graph = graph
        /**
         * @type {d3.Selection<HTMLInputElement, { distanceFunction: (arg0?: number) => any; }, HTMLElement, any>[]}
         */
        this.sliders = []
        this.options = graph.options
        this.defaultCharge = this.options.charge
    }

    /**
     * Adds the gravity sliders to the website.
     */
    setup() {
        const _this = this
        const menuEntry = d3.select("#m_gravity")
        menuEntry.on("mouseover", function () {
            const searchMenu = _this.graph.options.searchMenu
            searchMenu.hideSearchEntries()
        })
        this.#addDistanceSlider(
            "#classSliderOption",
            "class",
            "Class distance",
            (val) => {
                if (val === undefined) return this.options.classDistance
                else this.options.classDistance = val
            },
        )
        this.#addDistanceSlider(
            "#datatypeSliderOption",
            "datatype",
            "Datatype distance",
            (val) => {
                if (val === undefined) return this.options.datatypeDistance
                else this.options.datatypeDistance = val
            },
        )
    }

    /**
     * @param {string} selector
     * @param {string} identifier
     * @param {string} label
     * @param {(arg0?: number) => any} distanceFunction
     */
    #addDistanceSlider(selector, identifier, label, distanceFunction) {
        const defaultLinkDistance = distanceFunction()
        const sliderContainer = d3
            .select(selector)
            .append("div")
            .datum({ distanceFunction: distanceFunction }) // connect the options-function with the slider
            .classed("distanceSliderContainer", true)
        const slider = sliderContainer
            .append("input")
            .attr("id", identifier + "DistanceSlider")
            .attr("type", "range")
            .attr("min", 10)
            .attr("max", 600)
            .attr("value", distanceFunction())
            .attr("step", 10)
        sliderContainer
            .append("label")
            .classed("description", true)
            .attr("for", identifier + "DistanceSlider")
            .text(label)
        const sliderValueLabel = sliderContainer
            .append("label")
            .classed("value", true)
            .attr("for", identifier + "DistanceSlider")
            .text(distanceFunction())
        // Store slider for easier resetting
        this.sliders.push(slider)

        slider.on("focusout", () => {
            this.graph.updateStyle()
        })
        slider.on("input", () => {
            const distance = slider.property("value")
            distanceFunction(distance)
            this.adjustCharge(defaultLinkDistance)
            sliderValueLabel.text(distance)
            this.graph.updateStyle()
        })
        // add wheel event to the slider
        slider.on("wheel", function () {
            const wheelEvent = d3.event
            let offset
            if (wheelEvent.deltaY < 0) {
                offset = 10
            }
            if (wheelEvent.deltaY > 0) {
                offset = -10
            }
            const oldVal = parseInt(slider.property("value"))
            const newSliderValue = oldVal + offset
            if (newSliderValue !== oldVal) {
                slider.property("value", newSliderValue)
                distanceFunction(newSliderValue)
                slider.on("input").call(slider.node(), d3.event) // << set text and update the graphStyles
            }
            d3.event.preventDefault()
        })
    }

    /**
     * @param {number} defaultLinkDistance
     */
    adjustCharge(defaultLinkDistance) {
        const greaterDistance = Math.max(
            this.options.classDistance,
            this.options.datatypeDistance,
        )
        const ratio = greaterDistance / defaultLinkDistance
        const newCharge = this.defaultCharge * ratio
        this.options.charge = newCharge
    }

    /**
     * Resets the gravity sliders to their default.
     */
    reset() {
        this.sliders.forEach(function (slider) {
            slider.property(
                "value",
                function (/** @type {{ distanceFunction: () => any; }} */ d) {
                    // Simply reload the distance from the options
                    return d.distanceFunction()
                },
            )
            slider.on("input")()
        })
    }
}
