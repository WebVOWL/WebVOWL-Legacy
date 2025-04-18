import d3 from "d3";

export default class ResetMenu {
    /**
     * Contains the logic for the reset button.
     * @param {any} graph the associated webvowl graph
     */
    constructor(graph) {
        this.graph = graph;

        this.options = graph.options;
        /**
         * @type {any[] | undefined}
         */
        this.resettableModules = undefined;
        this.untouchedOptions = webvowl.options();
    }

    /**
     * Adds the reset button to the website.
     * @param {any} _resettableModules modules that can be resetted
     */
    setup(_resettableModules) {
        this.resettableModules = _resettableModules;
        d3.select("#reset-button").on("click", this.resetGraph);
        const menuEntry = d3.select("#resetOption");
        menuEntry.on("mouseover", () => {
            const searchMenu = this.graph.options.searchMenu;
            searchMenu.hideSearchEntries();
        });
    }

    resetGraph() {
        this.graph.resetSearchHighlight();
        this.graph.options.searchMenu.clearText();
        this.options.classDistance = this.untouchedOptions.classDistance;
        this.options.datatypeDistance = this.untouchedOptions.datatypeDistance;
        this.options.charge(this.untouchedOptions.charge);
        this.options.gravity = this.untouchedOptions.gravity;
        this.options.linkStrength = this.untouchedOptions.linkStrength;
        this.graph.reset();

        for (const module of this.resettableModules) {
            module.reset()
        }
        this.graph.updateStyle();
    }
}