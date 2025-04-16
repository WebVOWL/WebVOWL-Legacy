import d3 from "d3";

export default class ResetMenu {
    /**
     * Contains the logic for the reset button.
     * @param {any} graph the associated webvowl graph
     */
    constructor(graph) {
        this.graph = graph;

        this.options = graph.graphOptions();
        this.resettableModules = undefined;
        // @ts-ignore
        this.untouchedOptions = webvowl.options();
    }

    /**
     * Adds the reset button to the website.
     * @param {any} _resettableModules modules that can be resetted
     */
    setup(_resettableModules) {
        this.resettableModules = _resettableModules;
        d3.select("#reset-button").on("click", this.resetGraph);
        var menuEntry = d3.select("#resetOption");
        menuEntry.on("mouseover", function () {
            // @ts-ignore
            var searchMenu = graph.options.searchMenu();
            searchMenu.hideSearchEntries();
        });
    };

    resetGraph() {
        // @ts-ignore
        this.graph.resetSearchHighlight();
        // @ts-ignore
        this.graph.options.searchMenu().clearText();
        this.options.classDistance(this.untouchedOptions.classDistance());
        this.options.datatypeDistance(this.untouchedOptions.datatypeDistance());
        this.options.charge(this.untouchedOptions.charge());
        this.options.gravity(this.untouchedOptions.gravity());
        this.options.linkStrength(this.untouchedOptions.linkStrength());
        // @ts-ignore
        this.graph.reset();

        this.resettableModules.forEach(function ( /** @type {{ reset: () => void; }} */ module) {
            module.reset();
        });

        // @ts-ignore
        this.graph.updateStyle();
    }
};
