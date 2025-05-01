import Graph from "../../../webvowl/js/graph"

export default class PauseMenu {
    /**
     * Contains the logic for the pause and resume button.
     * @param {Graph} graph the associated webvowl graph
     */
    constructor(graph) {
        this.graph = graph
        this.pauseButton = undefined
    }

    /**
     * Adds the pause button to the website.
     */
    setup() {
        const _this = this
        const menuEntry = d3.select("#pauseOption")
        menuEntry.on("mouseover", () => {
            const searchMenu = this.graph.options.searchMenu
            searchMenu.hideSearchEntries()
        })
        this.pauseButton = d3
            .select("#pause-button")
            .datum({ paused: false })
            .on("click", function (d) {
                _this.graph.paused = !d.paused
                d.paused = !d.paused
                _this.updatePauseButton()
                _this.pauseButton.classed("highlighted", d.paused)
            })
        // Set these properties the first time manually
        this.updatePauseButton()
    }

    /**
     * @param {boolean} value
     */
    setPauseValue(value) {
        this.pauseButton.datum().paused = value
        this.graph.paused = value
        this.pauseButton.classed("highlighted", value)
        this.updatePauseButton()
    }

    updatePauseButton() {
        this.updatePauseButtonClass()
        this.updatePauseButtonText()
    }

    updatePauseButtonClass() {
        this.pauseButton.classed("paused", function (d) {
            return d.paused
        })
    }

    updatePauseButtonText() {
        if (this.pauseButton.datum().paused) {
            this.pauseButton.text("Resume")
        } else {
            this.pauseButton.text("Pause")
        }
    }

    reset() {
        // resuming
        this.setPauseValue(false)
    }
}
