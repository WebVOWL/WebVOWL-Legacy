import Graph from "../../webvowl/js/graph";


export default class DirectInputModule {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        this.graph = graph
        this.inputContainer = d3.select("#DirectInputContent");
        this.textArea = d3.select("#directInputTextArea");
        this.visibleContainer = false;

        this.inputContainer.style("top", "0");
        this.inputContainer.style("position", "absolute");
        this.inputContainer.style("border", "1px solid black");
        this.inputContainer.style("padding", "5px");
        this.inputContainer.style("background", "#fff");
        d3.select("#directUploadBtn").on("click", this.handleDirectUpload);
        d3.select("#close_directUploadBtn").on("click", this.handleCloseButton);
    }

    // connect upload and close button;
    handleDirectUpload() {
        const text = this.textArea.node().value;
        try {
            const jsonOBJ = JSON.parse(text);
            this.graph.options.loadingModule.directInput(text);
            // close if successful
            if (jsonOBJ.class.length > 0) {
                this.setDirectInputMode(false);
            }
        }
        catch (e) {
            try {
                // Initialize;
                this.graph.options.loadingModule.initializeLoader();
                this.graph.options.loadingModule.requestServerTimeStampForDirectInput(
                    this.graph.options.ontologyMenu.callbackLoad_Ontology_From_DirectInput,
                    text
                );
            } catch (error2) {
                console.log("Error " + error2);
                d3.select("#Error_onLoad").classed("hidden", false);
                d3.select("#Error_onLoad").node().innerHTML = "Failed to convert the input!";
            }
        }
    }

    handleCloseButton() {
        this.setDirectInputMode(false);
    }

    updateLayout() {
        const w = this.graph.options.width;
        const h = this.graph.options.height;
        this.textArea.style("width", 0.4 * w + "px");
        this.textArea.style("height", 0.7 * h + "px");
    }

    /**
     * @param {boolean} isVisible Defaults to false
     */
    setDirectInputMode(isVisible = false) {
        if (!isVisible) {
            this.visibleContainer = !this.visibleContainer;
        }
        else {
            this.visibleContainer = isVisible;
        }
        // update visibility;
        this.updateLayout();
        d3.select("#Error_onLoad").classed("hidden", true);
        this.inputContainer.classed("hidden", !this.visibleContainer);
    }
}