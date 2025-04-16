// const wasm = require("../../../../target/pkg/index.js");


export class OnologyLoading {
    /** some constants **/
    PREDEFINED = 0
    FILE_UPLOAD = 1
    JSON_URL = 2
    IRI_URL = 3

    PROGRESS_BAR_ERROR = 0
    PROGRESS_BAR_BUSY = 1
    PROGRESS_BAR_PERCENT = 2

    DEFAULT_JSON_NAME = "foaf" // This file is loaded by default
    URL_PREFIX = "o2v/" // Path to the OWL2VOWL converter

    /**
     * @param {any} graph
     */
    constructor(graph) {
        this.graph = graph
        this.progressBarMode = 1
        this.newOntologyCounter = 1;

        this.loadingWasSuccessFul = false
        this.missingImportsWarning = false
        this.showLoadingDetails = false
        this.visibilityStatus = true

        this.conversion_sessionId = undefined
        this.jsonText = undefined
        this.statistics = undefined
        this.adjustSizeCallable = undefined

        this.menuContainer = d3.select("#loading-info")
        this.loadingInfoContainer = d3.select("#loadingInfo-container")
        this.detailsButton = d3.select("#show-loadingInfo-button")
        this.closeButton = d3.select("#loadingIndicator_closeButton")
        this.ontologyMenu = undefined
        this.ontologyIdentifierFromURL = undefined
    }

    checkForScreenSize() {
        // checks for window size and adjusts the loading indicator
        const w = this.graph.options.width();
        const h = this.graph.options.height();

        if (w < 270) {
            d3.select("#loading-info").classed("hidden", true);
        } else {
            // check if it should be visible
            if (this.visibilityStatus) {
                d3.select("#loading-info").classed("hidden", false);
            } else {
                d3.select("#loading-info").classed("hidden", true);
            }
        }
        if (h < 150) {
            d3.select("#loadingInfo_msgBox").classed("hidden", true);
        } else {
            d3.select("#loadingInfo_msgBox").classed("hidden", false);
        }
        if (h < 80) {
            d3.select("#progressBarContext").classed("hidden", true);
            d3.select("#layoutLoadingProgressBarContainer").style("height", "20px");
        } else {
            d3.select("#progressBarContext").classed("hidden", false);
            d3.select("#layoutLoadingProgressBarContainer").style("height", "50px");
        }
    }

    /**
     * @param {any} m
     */
    setOntologyMenu(m) {
        this.ontologyMenu = m;
    }

    showErrorDetailsMessage() {
        this.showLoadingIndicator();
        this.expandDetails();
        d3.select("#loadingIndicator_closeButton").classed("hidden", true);
        this.scrollDownDetails();
    }

    showWarningDetailsMessage() {
        d3.select("#currentLoadingStep").style("color", "#ff0");
        this.showLoadingIndicator();
        this.expandDetails();
        d3.select("#loadingIndicator_closeButton").classed("hidden", false);
        this.scrollDownDetails();
    }

    scrollDownDetails() {
        const scrollingElement = d3.select("#loadingInfo-container").node();
        scrollingElement.scrollTop = scrollingElement.scrollHeight;
    }

    hideLoadingIndicator() {
        d3.select("#loading-info").classed("hidden", true);
        this.visibilityStatus = false;
    }

    showLoadingIndicator() {
        d3.select("#loading-info").classed("hidden", false);
        this.visibilityStatus = true;

    }

    /**
     * @param {[any, any]} args
     */
    setup(args) {
        [this.statistics, this.adjustSizeCallable] = args;

        // create connections for close and details button;
        this.loadingInfoContainer.classed("hidden", !this.showLoadingDetails);
        this.detailsButton.on("click", () => {
            this.showLoadingDetails = !this.showLoadingDetails;
            this.loadingInfoContainer.classed("hidden", !this.showLoadingDetails);
            this.detailsButton.classed("accordion-trigger-active", this.showLoadingDetails);
        });

        this.closeButton.on("click", () => {
            this.menuContainer.classed("hidden", true);
        });
        this.setBusyMode();
    }

    // NOTE: Disabled to save memory while this method is not used
    // updateSize () {
    //     this. showLoadingDetails = !(this.loadingInfoContainer.classed("hidden"));
    //     this. loadingInfoContainer.classed("hidden", !this.showLoadingDetails);
    //     this. detailsButton.classed("accordion-trigger-active", this.showLoadingDetails);
    // }

    expandDetails() {
        this.showLoadingDetails = true;
        this.loadingInfoContainer.classed("hidden", !this.showLoadingDetails);
        this.detailsButton.classed("accordion-trigger-active", this.showLoadingDetails);
    }

    collapseDetails() {
        this.showLoadingDetails = false;
        this.loadingInfoContainer.classed("hidden", !this.showLoadingDetails);
        this.detailsButton.classed("accordion-trigger-active", this.showLoadingDetails);
    }

    setBusyMode() {
        d3.select("#currentLoadingStep").style("color", "#fff");
        d3.select("#progressBarValue").node().innherHTML = "";
        d3.select("#progressBarValue").style("width", "20%");
        d3.select("#progressBarValue").classed("busyProgressBar", true);
        this.progressBarMode = this.PROGRESS_BAR_BUSY;
    }

    setSuccessful() {
        d3.select("#currentLoadingStep").style("color", "#0f0");
    }

    setErrorMode() {
        d3.select("#currentLoadingStep").style("color", "#f00");
        d3.select("#progressBarValue").style("width", "0%");
        d3.select("#progressBarValue").classed("busyProgressBar", false);
        d3.select("#progressBarValue").node().innherHTML = "";
        this.progressBarMode = this.PROGRESS_BAR_ERROR;
    }

    setPercentMode() {
        d3.select("#currentLoadingStep").style("color", "#fff");
        d3.select("#progressBarValue").classed("busyProgressBar", false);
        d3.select("#progressBarValue").node().innherHTML = "0%";
        d3.select("#progressBarValue").style("width", "0%");
        this.progressBarMode = this.PROGRESS_BAR_PERCENT;
    }

    /**
     * @param {string} val
     */
    setPercentValue(val) {
        d3.select("#progressBarValue").node().innherHTML = val;
    }

    emptyGraphContentError() {
        this.graph.clearGraphData();
        this.ontologyMenu.append_message_toLastBulletPoint("<span style='color:red;'>failed</span>");
        this.ontologyMenu.append_message_toLastBulletPoint("<br><span style=\"color:red;\">Error: Received empty graph</span>");
        this.loadingWasSuccessFul = false;
        this.graph.handleOnLoadingError();
        this.setErrorMode();
    }

    /**
     * @param {boolean} storeCache
     */
    initializeLoader(storeCache) {
        if (storeCache === true && this.graph.getCachedJsonObj() !== null) {
            // save cached ontology;
            const cachedContent = JSON.stringify(this.graph.getCachedJsonObj());
            const cachedName = this.ontologyIdentifierFromURL;
            this.ontologyMenu.setCachedOntology(cachedName, cachedContent);
        }
        this.conversion_sessionId = -10000;
        this.ontologyMenu.setConversionID(this.conversion_sessionId);
        this.ontologyMenu.stopLoadingTimer();
        this.graph.clearGraphData();
        this.setBusyMode();
        this.showLoadingIndicator();
        this.collapseDetails();
        this.missingImportsWarning = false;
        d3.select("#loadingIndicator_closeButton").classed("hidden", true);
        this.ontologyMenu.clearDetailInformation();
    }

    // ------------------ URL Interpreter -------------- //
    /**
     * @param {boolean} storeCache
     */
    parseUrlAndLoadOntology(storeCache) {
        let autoStore = true;
        if (storeCache === false) {
            autoStore = false;
        }

        this.graph.clearAllGraphData();
        this.initializeLoader(autoStore);
        const urlString = String(location);
        const parameterArray = this.#identifyParameter(urlString);
        this.ontologyIdentifierFromURL = this.DEFAULT_JSON_NAME;
        this.#loadGraphOptions(parameterArray); // identifies and loads configuration values
        const loadingMethod = this.#identifyOntologyLoadingMethod(this.ontologyIdentifierFromURL);
        d3.select("#progressBarValue").node().innerHTML = " ";
        switch (loadingMethod) {
            case 0:
                this.from_presetOntology(this.ontologyIdentifierFromURL);
                break;
            case 1:
                this.from_FileUpload(this.ontologyIdentifierFromURL);
                break;
            case 2:
                this.from_JSON_URL(this.ontologyIdentifierFromURL);
                break;
            case 3:
                this.from_IRI_URL(this.ontologyIdentifierFromURL);
                break;
            default:
                console.log("Could not identify loading method , or not IMPLEMENTED YET");
        }
    }

    // ------------------- LOADING --------------------- **/
    // the loading module splits into 3 branches
    // 1] PresetOntology Loading
    // 2] File Upload
    // 3] Load From URL / IRI

    /**
     * @param {string} fileName
     */
    from_JSON_URL(fileName) {
        const filename = decodeURIComponent(fileName.slice("url=".length));
        this.ontologyIdentifierFromURL = filename;

        if (this.ontologyMenu.cachedOntology(filename)) {
            this.ontologyMenu.append_bulletPoint("Loading already cached ontology: " + filename);
            this.loadingWasSuccessFul = true; // cached Ontology should be true;
            this.#loadOntologyContent(this.#parseOntologyContent(this.ontologyMenu.cachedOntology(filename)));
        } else {
            // involve the o2v conveter;
            this.ontologyMenu.append_message("Retrieving ontology from JSON URL " + filename);
            this.#requestServerTimeStampForJSON_URL(this.ontologyMenu.callbackLoad_JSON_FromURL, ["read?json=" + filename, filename]);
        }
    }

    /**
     * @param {(arg0: any) => void} callback
     * @param {any[]} parameter
     */
    #requestServerTimeStampForJSON_URL(callback, parameter) {
        d3.xhr(this.URL_PREFIX + "serverTimeStamp", "application/text", (/** @type {any} */ error, /** @type {{ responseText: any; }} */ request) => {
            if (error) {
                // could not get server timestamp -> no connection to owl2vowl
                this.ontologyMenu.append_bulletPoint("Could not establish connection to OWL2VOWL service");
                this.#fallbackForJSON_URL(callback, parameter);
            } else {
                this.conversion_sessionId = request.responseText;
                this.ontologyMenu.setConversionID(this.conversion_sessionId);
                parameter.push(this.conversion_sessionId);
                callback(parameter);
            }
        });
    }

    /**
     * @param {(arg0: any, arg1: any[]) => void} callback
     * @param {string} text
     */
    requestServerTimeStampForDirectInput(callback, text) {
        d3.xhr(this.URL_PREFIX + "serverTimeStamp", "application/text", (/** @type {any} */ error, /** @type {{ responseText: any; }} */ request) => {
            if (error) {
                // could not get server timestamp -> no connection to owl2vowl
                this.ontologyMenu.append_bulletPoint("Could not establish connection to OWL2VOWL service");
                this.setErrorMode();
                this.ontologyMenu.append_message_toLastBulletPoint("<br><span style='color:red'>Could not connect to OWL2VOWL service </span>");
                this.showErrorDetailsMessage();
                d3.select("#progressBarValue").style("width", "0%");
                d3.select("#progressBarValue").classed("busyProgressBar", false);
                d3.select("#progressBarValue").text("0%");
            } else {
                this.conversion_sessionId = request.responseText;
                this.ontologyMenu.setConversionID(this.conversion_sessionId);
                callback(text, ["conversionID" + this.conversion_sessionId, this.conversion_sessionId]);
            }
        });
    }

    /**
     * @param {string} fileName
     */
    from_IRI_URL(fileName) {
        // owl2vowl converters the given ontology url and returns json file;
        const filename = decodeURIComponent(fileName.slice("iri=".length));
        this.ontologyIdentifierFromURL = filename;

        if (this.ontologyMenu.cachedOntology(filename)) {
            this.ontologyMenu.append_bulletPoint("Loading already cached ontology: " + filename);
            this.loadingWasSuccessFul = true; // cached Ontology should be true;
            this.#loadOntologyContent(this.#parseOntologyContent(this.ontologyMenu.cachedOntology(filename)));
        } else {
            // involve the o2v conveter;
            const encoded = encodeURIComponent(filename);
            this.ontologyMenu.append_bulletPoint("Retrieving ontology from IRI: " + filename);
            this.#requestServerTimeStampForIRI_Converte(this.ontologyMenu.callbackLoad_Ontology_FromIRI, ["convert?iri=" + encoded, filename]);
        }
    }

    /**
     * @param {string} fileName
     * @param {any} file
     */
    async fromFileDrop(fileName, file) {
        d3.select("#progressBarValue").node().innerHTML = " ";
        this.initializeLoader(false);
        this.ontologyMenu.append_bulletPoint("Retrieving ontology from dropped file: " + fileName);

        // two options here
        //1] Direct Json Upload
        if (fileName.match(/\.json$/)) {
            this.ontologyMenu.setConversionID(-10000);
            this.ontologyIdentifierFromURL = fileName;
            this.#loadOntologyContent(this.#parseOntologyContent(await wasm.parse_json(file))); // FIXME
        } else {
            //2] File Upload to OWL2VOWL Converter
            // 1) check if we can get a timeStamp;
            const parameterArray = [file, fileName];
            this.#requestServerTimeStamp(this.ontologyMenu.callbackLoadFromOntology, parameterArray);
        }
    }

    /**
     * @param {string} fileName
     */
    async from_FileUpload(fileName) {
        this.setBusyMode();
        let filename = decodeURIComponent(fileName.slice("file=".length));
        this.ontologyIdentifierFromURL = filename;

        if (this.ontologyMenu.cachedOntology(filename)) {
            this.ontologyMenu.append_bulletPoint("Loading already cached ontology: " + filename);
            this.loadingWasSuccessFul = true; // cached Ontology should be true;
            this.#loadOntologyContent(this.#parseOntologyContent(this.ontologyMenu.cachedOntology(filename)));
        } else {
            // d3.select("#currentLoadingStep").node().innerHTML="Loading ontology from file "+ filename;
            this.ontologyMenu.append_bulletPoint("Retrieving ontology from file: " + filename);
            // get the file
            const selectedFile = d3.select("#file-converter-input").property("files")[0];
            // No selection -> this was triggered by the iri. Unequal names -> reuploading another file
            if (!selectedFile || (filename && (filename !== selectedFile.name))) {
                this.ontologyMenu.append_message_toLastBulletPoint("<br><span style=\"color:red;\">No cached version of \"" + filename + "\" was found.</span><br>Please reupload the file.");
                this.setErrorMode();
                d3.select("#progressBarValue").classed("busyProgressBar", false);
                this.graph.handleOnLoadingError();
                return;
            } else {
                filename = selectedFile.name;
            }
            // two options here
            //1] Direct Json Upload
            if (filename.match(/\.json$/)) {
                this.ontologyMenu.setConversionID(-10000);
                this.ontologyIdentifierFromURL = filename;
                this.#loadOntologyContent(this.#parseOntologyContent(await wasm.parse_json(selectedFile))); // FIXME
            } else {
                //2] File Upload to OWL2VOWL Converter
                // 1) check if we can get a timeStamp;
                const parameterArray = [selectedFile, filename];
                this.#requestServerTimeStamp(this.ontologyMenu.callbackLoadFromOntology, parameterArray);
            }
        }
    }

    /**
     * @param {(arg0: any) => void} callback
     * @param {any} parameter
     */
    #fallbackForJSON_URL(callback, parameter) {
        this.ontologyMenu.append_message_toLastBulletPoint("<br>Trying to convert with other communication protocol.");
        callback(parameter);
    }

    /**
     * @param {any[]} parameter
     */
    #fallbackConversion(parameter) {
        this.ontologyMenu.append_message_toLastBulletPoint("<br>Trying to convert with other communication protocol.");
        const file = parameter[0];
        const name = parameter[1];
        const formData = new FormData();
        formData.append("ontology", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", this.URL_PREFIX + "convert", true);
        xhr.onload = () => {
            if (xhr.status === 200) {
                const ontologyContent = xhr.responseText; // Memory leak as text is only garbage collected when this function returns (thus only when the graph, is loaded). This can be several GB if the ontology is large
                this.ontologyMenu.setCachedOntology(name, ontologyContent);
                this.ontologyIdentifierFromURL = name;
                this.missingImportsWarning = true; // using this variable for warnings
                this.ontologyMenu.append_message_toLastBulletPoint("<br>Success, <span style='color:yellow'>but you are using a deprecated OWL2VOWL service!<span>");
                const parseResult = this.#parseOntologyContent(ontologyContent);
                this.#loadOntologyContent(parseResult);
            }
        };

        // check what this thing is doing;
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 0) {
                this.ontologyMenu.append_message_toLastBulletPoint("<br>Old protocol also failed to establish connection to OWL2VOWL service!");
                this.setErrorMode();
                this.ontologyMenu.append_bulletPoint("Failed to load ontology");
                this.ontologyMenu.append_message_toLastBulletPoint("<br><span style='color:red'>Could not connect to OWL2VOWL service </span>");
                this.showErrorDetailsMessage();
            }
        };
        xhr.send(formData);
    }

    /**
     * @param {(arg0: any) => void} callback
     * @param {any[]} parameterArray
     */
    #requestServerTimeStampForIRI_Converte(callback, parameterArray) {
        d3.xhr(this.URL_PREFIX + "serverTimeStamp", "application/text", (/** @type {any} */ error, /** @type {{ responseText: any; }} */ request) => {
            this.setBusyMode();
            if (error) {
                // could not get server timestamp -> no connection to owl2vowl
                this.ontologyMenu.append_bulletPoint("Could not establish connection to OWL2VOWL service");
                this.setErrorMode();
                this.ontologyMenu.append_bulletPoint("Failed to load ontology");
                this.ontologyMenu.append_message_toLastBulletPoint("<br><span style='color:red'>Could not connect to OWL2VOWL service </span>");
                this.showErrorDetailsMessage();
            } else {
                this.conversion_sessionId = request.responseText;
                this.ontologyMenu.setConversionID(this.conversion_sessionId);
                // update paramater for new communication paradigm
                parameterArray[0] = parameterArray[0] + "&sessionId=" + this.conversion_sessionId;
                parameterArray.push(this.conversion_sessionId);
                callback(parameterArray);
            }
        });
    }

    /**
     * @param {(arg0: any, arg1: any, arg2: any) => void} callback
     * @param {any[]} parameterArray
     */
    #requestServerTimeStamp(callback, parameterArray) {
        d3.xhr(this.URL_PREFIX + "serverTimeStamp", "application/text", (/** @type {any} */ error, /** @type {{ responseText: any; }} */ request) => {
            if (error) {
                // could not get server timestamp -> no connection to owl2vowl
                this.ontologyMenu.append_bulletPoint("Could not establish connection to OWL2VOWL service");
                this.#fallbackConversion(parameterArray); // tries o2v version0.3.4 communication
            } else {
                this.conversion_sessionId = request.responseText;
                this.ontologyMenu.setConversionID(this.conversion_sessionId);
                console.log("Request Session ID:" + this.conversion_sessionId);
                callback(parameterArray[0], parameterArray[1], this.conversion_sessionId);
            }
        });
    }

    /**
     * This method is not well-suited for large ontologies as `text`
     * is only garbage collected when the entire graph is loaded.
     * @param {string} text
     */
    directInput(text) {
        this.ontologyMenu.clearDetailInformation();
        this.#loadOntologyContent(this.#parseOntologyContent(text));
    };

    /**
     * @param {string} filename
     */
    loadFromOWL2VOWL(filename) {
        this.loadingWasSuccessFul = false;

        const old = d3.select("#bulletPoint_container").node().innerHTML;
        if (old.indexOf("(with warnings)") !== -1) {
            this.missingImportsWarning = true;
        }
        if (this.ontologyMenu.cachedOntology(this.jsonText)) {
            this.ontologyMenu.append_bulletPoint("Loading already cached ontology: " + filename);
        }
        const parseResult = this.#parseOntologyContent(this.jsonText);
        this.jsonText = ""; // Nuke reference to save memory
        return parseResult;
    }

    /**
     * @param {string} selectedOntology
     */
    from_presetOntology(selectedOntology) {
        this.ontologyMenu.append_bulletPoint("Retrieving ontology: " + selectedOntology);
        this.#loadPresetOntology(selectedOntology);
    }

    /**
     * @param {string} ontology
     */
    #loadPresetOntology(ontology) {
        // check if already cached in ontology menu?
        let f2r;
        let loadingNewOntologyForEditor = false;
        if (ontology.indexOf("new_ontology") !== -1) {
            this.hideLoadingIndicator();
            this.graph.showEditorHintIfNeeded();
            f2r = "./data/new_ontology.json";
            loadingNewOntologyForEditor = true;
        }
        this.loadingWasSuccessFul = false;
        if (this.ontologyMenu.cachedOntology(ontology)) {
            this.ontologyMenu.append_bulletPoint("Loading already cached ontology: " + ontology);
            this.loadingWasSuccessFul = true; // cached Ontology should be true;
            this.showLoadingIndicator();
            this.#loadOntologyContent(this.#parseOntologyContent(this.ontologyMenu.cachedOntology(ontology)));
        } else {
            // read the file name
            let fileToRead = "./data/" + ontology + ".json";
            if (f2r) {
                // overwrite the newOntology Index
                fileToRead = f2r;
            }
            // read file
            d3.xhr(fileToRead, "application/json", (/** @type {{ status: string | number; }} */ error, /** @type {{ responseText: string; }} */ request) => {
                const loadingSuccessful = !error;
                if (loadingSuccessful) {
                    const parseResult = this.#parseOntologyContent(request.responseText);
                    request = undefined
                    error = undefined // Nuke references to save memory
                    this.#loadOntologyContent(parseResult);
                } else {
                    if (loadingNewOntologyForEditor) {
                        const ontologyContent = '{\n' +
                            '  "_comment": "Empty ontology for WebVOWL Editor",\n' +
                            '  "header": {\n' +
                            '    "languages": [\n' +
                            '      "en"\n' +
                            '    ],\n' +
                            '    "baseIris": [\n' +
                            '      "http://www.w3.org/2000/01/rdf-schema"\n' +
                            '    ],\n' +
                            '    "iri": "http://visualdataweb.org/newOntology/",\n' +
                            '    "title": {\n' +
                            '      "en": "New ontology"\n' +
                            '    },\n' +
                            '    "description": {\n' +
                            '      "en": "New ontology description"\n' +
                            '    }\n' +
                            '  },\n' +
                            '  "namespace": [],\n' +
                            '  "metrics": {\n' +
                            '    "classCount": 0,\n' +
                            '    "datatypeCount": 0,\n' +
                            '    "objectPropertyCount": 0,\n' +
                            '    "datatypePropertyCount": 0,\n' +
                            '    "propertyCount": 0,\n' +
                            '    "nodeCount": 0,\n' +
                            '    "individualCount": 0\n' +
                            '  }\n' +
                            '}\n';
                        this.#loadOntologyContent(this.#parseOntologyContent(ontologyContent));
                    } else {
                        // some error occurred
                        this.ontologyMenu.append_bulletPoint("Failed to load: " + ontology);
                        if (error.status === 0) { // assumption this is CORS error when running locally (error status == 0)
                            this.ontologyMenu.append_message_toLastBulletPoint(" <span style='color: red'>ERROR STATUS:</span> " + error.status);
                            if (window.location.toString().startsWith("file:/")) {
                                this.ontologyMenu.append_message_toLastBulletPoint("<br><p>WebVOWL runs in a local instance.</p>");
                                this.ontologyMenu.append_message_toLastBulletPoint("<p>CORS prevents to automatically load files on host system.</p>");
                                this.ontologyMenu.append_message_toLastBulletPoint("<p>You can load preprocessed ontologies (i.e. VOWL-JSON files) using the upload feature in the ontology menu or by dragging the files and dropping them on the canvas.</p>");
                                this.ontologyMenu.append_message_toLastBulletPoint("<p><i>Hint: </i>Note that the conversion of ontologies into the VOWL-JSON format is not part of WebVOWL but requires an additional converter such as OWL2VOWL.</p>");
                                this.ontologyMenu.append_message_toLastBulletPoint("<p>Ontologies can be created using the editor mode (i.e. activate editing mode in <b>Modes</b> menu and create a new ontology using the <b>Ontology</b> menu.</p>");
                            }
                        } else {
                            this.ontologyMenu.append_message_toLastBulletPoint(" <span style='color: red'>ERROR STATUS:</span> " + error.status);
                        }
                        this.graph.handleOnLoadingError();
                        this.setErrorMode();
                    }
                }
            });
        }
    }

    /**
     * Parse JSON content
     * @param {string} content
     */
    #parseOntologyContent(content) {
        this.ontologyMenu.append_bulletPoint("Reading ontology graph ... ");
        const _parser = this.graph.parser().parseOntologyFromText;
        return _parser(content, this.ontologyIdentifierFromURL, "noAlternativeNameYet")
    }

    /**
     * Load parsed JSON object
     * @param {[{} | undefined, boolean]} parseResult
     */
    #loadOntologyContent(parseResult) {
        const [data, isValidData] = parseResult;
        d3.select("#reloadCachedOntology").classed("hidden", true);
        this.graph.options.pauseMenu().reset();
        this.graph.options.navigationMenu().hideAllMenus();
        this.graph.editorMode(); // updates the checkbox

        let loadEmptyOntologyForEditing = false;
        if (location.hash.indexOf("#new_ontology") !== -1) {
            loadEmptyOntologyForEditing = true;
            this.newOntologyCounter++;
            d3.select("#empty").node().href = "#opts=editorMode=true;#new_ontology" + this.newOntologyCounter;
        }
        if (!isValidData && this.graph.editorMode() === false && loadEmptyOntologyForEditing === false) {
            // generate message for the user;
            this.emptyGraphContentError();
        } else {
            this.graph.options.this().setPercentMode();
            if (loadEmptyOntologyForEditing === true) {
                this.graph.editorMode(true);
            }
            this.graph.load();
            this.graph.options.sidebar().updateOntologyInformation(data, this.statistics);
            this.graph.updateZoomSliderValueFromOutside();
            this.adjustSizeCallable();

            const flagOfCheckBox = d3.select("#editorModeModuleCheckbox").node().checked;
            this.graph.editorMode(flagOfCheckBox);// update gui
        }
    }

    notValidJsonFile() {
        this.graph.clearGraphData();
        this.ontologyMenu.append_message_toLastBulletPoint(" <span style='color:red;'>failed</span>");
        this.ontologyMenu.append_message_toLastBulletPoint("<br><span style='color:red;'>Error: Received empty graph</span>");
        this.loadingWasSuccessFul = false;
        this.graph.handleOnLoadingError();
    }

    validJsonFile() {
        this.ontologyMenu.append_message_toLastBulletPoint("done");
        this.loadingWasSuccessFul = true;
    }

    /**
     * --- HELPER FUNCTIONS *
     * @param {string} url
     */
    #identifyParameter(url) {
        const numParameters = (url.match(/#/g) || []).length;
        // create parameters array
        /**
         * @type {string[]}
         */
        let paramArray = [];
        if (numParameters > 0) {
            const tokens = url.split("#");
            // skip the first token since it is the address of the server
            for (let i = 1; i < tokens.length; i++) {
                if (tokens[i].length === 0) {
                    // this token belongs actually to the last paramArray
                    paramArray[paramArray.length - 1] = paramArray[paramArray.length - 1] + "#";
                } else {
                    paramArray.push(tokens[i]);
                }
            }
        }
        return paramArray;
    }

    /**
     * @param {string[]} parameterArray
     */
    #loadGraphOptions(parameterArray) {
        const optString = "opts=";
        const _this = this

        function loadDefaultConfig() {
            _this.graph.options.setOptionsFromURL(_this.graph.options.defaultConfig(), false);
        }

        /**
         * @param {string[]} opts
         */
        function loadCustomConfig(opts) {
            let changeEditingFlag = false;
            const defObj = _this.graph.options.defaultConfig();
            for (const i = 0; i < opts.length; i++) {
                const keyVal = opts[i].split('=');
                if (keyVal[0] === "editorMode") {
                    changeEditingFlag = true;
                }
                defObj[keyVal[0]] = keyVal[1];
            }
            _this.graph.options.setOptionsFromURL(defObj, changeEditingFlag);
        }

        /**
         * @param {string[]} paramArray
         */
        function identifyOptions(paramArray) {
            if (paramArray[0].indexOf(optString) >= 0) {
                // parse the parameters;
                const parameterLength = paramArray[0].length;
                const givenOptionsStr = paramArray[0].substr(5, parameterLength - 6);
                const optionsArray = givenOptionsStr.split(';');
                loadCustomConfig(optionsArray);
            } else {
                _this.ontologyIdentifierFromURL = paramArray[0];
                loadDefaultConfig();
            }
        }

        /**
         * @param {string[]} paramArray
         */
        function identifyOptionsAndOntology(paramArray) {
            if (paramArray[0].indexOf(optString) >= 0) {
                // parse the parameters;
                const parameterLength = paramArray[0].length;
                const givenOptionsStr = paramArray[0].substr(5, parameterLength - 6);
                const optionsArray = givenOptionsStr.split(';');
                loadCustomConfig(optionsArray);
            } else {
                loadDefaultConfig();
            }
            _this.ontologyIdentifierFromURL = paramArray[1];
        }

        switch (parameterArray.length) {
            case 0:
                loadDefaultConfig();
                break;
            case 1:
                identifyOptions(parameterArray);
                break;
            case 2:
                identifyOptionsAndOntology(parameterArray);
                break;
            default:
                console.log("To many input parameters , loading default config");
                loadDefaultConfig();
                this.ontologyIdentifierFromURL = "ERROR_TO_MANY_INPUT_PARAMETERS";
        }
    }

    /**
     * @param {string} url
     */
    #identifyOntologyLoadingMethod(url) {
        const iriKey = "iri=";
        const urlKey = "url=";
        const fileKey = "file=";

        let method = -1;
        if (url.substr(0, fileKey.length) === fileKey) {
            method = this.FILE_UPLOAD;
        } else if (url.substr(0, urlKey.length) === urlKey) {
            method = this.JSON_URL;
        } else if (url.substr(0, iriKey.length) === iriKey) {
            method = this.IRI_URL;
        } else {
            method = this.PREDEFINED;
        }
        return method;
    }
}