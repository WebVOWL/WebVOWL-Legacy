import d3 from "d3";

export default class {
    /**
     * @param {any} graph
     */
    constructor(graph) {
        this.graph = graph;

        this.URL_PREFIX = "o2v/"
        this.loadingInfo = d3.select("#loading-info");
        this.loadingProgress = d3.select("#loading-progress");

        this.ontologyMenuTimeout = undefined;
        this.fileToLoad = undefined;
        this.stopTimer = false;
        this.loadingError = false;
        this.loadingStatusTimer = undefined;
        this.conversion_sessionId = undefined;
        this.cachedConversions = {};
        this.loadingModule = undefined;
        this.currentLoadedOntologyName = "";
    }

    clearCachedVersion() {
        // @ts-ignore
        if (this.cachedConversions[this.currentLoadedOntologyName]) {
            // @ts-ignore
            this.cachedConversions[this.currentLoadedOntologyName] = undefined;
        }
    };

    reloadCachedOntology() {
        this.clearCachedVersion();
        this.graph.clearGraphData();
        this.loadingModule.parseUrlAndLoadOntology(false);
    };

    /**
     * @param {any} ontoName
     */
    cachedOntology(ontoName) {
        this.currentLoadedOntologyName = ontoName;
        // @ts-ignore
        if (this.cachedConversions[ontoName]) {
            var locStr = String(location.hash);
            // @ts-ignore
            d3.select("#reloadSvgIcon").node().disabled = false;
            this.graph.showReloadButtonAfterLayoutOptimization(true);
            if (locStr.indexOf("#file") > -1) {
                // @ts-ignore
                d3.select("#reloadSvgIcon").node().disabled = true;
                // @ts-ignore
                d3.select("#reloadCachedOntology").node().title = "reloading original version not possible, please reload the file";
                d3.select("#reloadSvgIcon").classed("disabledReloadElement", true);
                d3.select("#svgStringText").style("fill", "gray");
                d3.select("#svgStringText").classed("noselect", true);
            }
            else {
                // @ts-ignore
                d3.select("#reloadCachedOntology").node().title = "generate new visualization and overwrite cached ontology";
                d3.select("#reloadSvgIcon").classed("disabledReloadElement", false);
                d3.select("#svgStringText").style("fill", "black");
                d3.select("#svgStringText").classed("noselect", true);
            }
        } else {
            this.graph.showReloadButtonAfterLayoutOptimization(false);
        }
        // @ts-ignore
        return this.cachedConversions[ontoName];
    };
    /**
     * @param {any} ontoName
     * @param {any} ontoContent
     */
    setCachedOntology(ontoName, ontoContent) {
        if (this.shouldCacheOntology(ontoContent)) {
            // @ts-ignore
            this.cachedConversions[ontoName] = ontoContent;
            this.currentLoadedOntologyName = ontoName;
        }
    };

    /**
     * Only cache ontology if it is less than 50 MB
     * @param {string} text
     * @returns
     */
    shouldCacheOntology(text) {
        return !(text.length > 50000000); // 50 MB
    };

    getErrorStatus() {
        return this.loadingError;
    };

    setup() {
        const _this = this;
        this.loadingModule = this.graph.options().loadingModule();
        var menuEntry = d3.select("#m_select");
        menuEntry.on("mouseover", function () {
            var searchMenu = _this.graph.options().searchMenu();
            searchMenu.hideSearchEntries();
        });

        this.setupConverterButtons();
        this.setupUploadButton();

        var descriptionButton = d3.select("#error-description-button").datum({ open: false });
        descriptionButton.on("click", function (data) {
            var errorContainer = d3.select("#error-description-container");
            var errorDetailsButton = d3.select(this);

            // toggle the state
            data.open = !data.open;
            var descriptionVisible = data.open;
            if (descriptionVisible) {
                errorDetailsButton.text("Hide error details");
            } else {
                errorDetailsButton.text("Show error details");
            }
            errorContainer.classed("hidden", !descriptionVisible);
        });
        this.setupUriListener();
        this.loadingModule.setOntologyMenu(this);
    };

    setupUriListener() {
        const _this = this;
        // reload ontology when hash parameter gets changed manually
        d3.select(window).on("hashchange", function () {
            // @ts-ignore
            var oldURL = d3.event.oldURL, newURL = d3.event.newURL;
            if (oldURL !== newURL) {
                // don't reload when just the hash parameter gets appended
                if (newURL === oldURL + "#") {
                    return;
                }
                _this.updateNavigationHrefs();
                _this.loadingModule.parseUrlAndLoadOntology();
            }
        });
        this.updateNavigationHrefs();
    }

    stopLoadingTimer() {
        this.stopTimer = true;
        clearTimeout(this.loadingStatusTimer);
    };

    /**
     * Quick fix: update all anchor tags that are used as buttons because a click on them
     * changes the url and this will load an other ontology.
     */
    updateNavigationHrefs() {
        d3.selectAll("#menuElementContainer > li > a").attr("href", location.hash || "#");
    }

    /**
     * @param {any} text
     */
    setIriText(text) {
        // @ts-ignore
        d3.select("#iri-converter-input").node().value = text;
        d3.select("#iri-converter-button").attr("disabled", false);
        // @ts-ignore
        d3.select("#iri-converter-form").on("submit")();
    };

    clearDetailInformation() {
        var bpContainer = d3.select("#bulletPoint_container");
        // @ts-ignore
        var htmlCollection = bpContainer.node().children;
        var numEntries = htmlCollection.length;

        for (var i = 0; i < numEntries; i++) {
            htmlCollection[0].remove();
        }
    };

    /**
     * @param {string} msg
     */
    append_message(msg) {
        var bpContainer = d3.select("#bulletPoint_container");
        var div = bpContainer.append("div");
        div.node().innerHTML = msg;
        this.loadingModule.scrollDownDetails();
    }

    /**
     * @param {any} msg
     */
    append_message_toLastBulletPoint(msg) {
        var bpContainer = d3.select("#bulletPoint_container");
        // @ts-ignore
        var htmlCollection = bpContainer.node().getElementsByTagName("LI");
        var lastItem = htmlCollection.length - 1;
        if (lastItem >= 0) {
            var oldText = htmlCollection[lastItem].innerHTML;
            htmlCollection[lastItem].innerHTML = oldText + msg;
        }
        this.loadingModule.scrollDownDetails();
    }

    /**
     * @param {string} msg
     */
    append_bulletPoint(msg) {
        var bp_container = d3.select("#bulletPoint_container");
        var bp = bp_container.append("li");
        bp.node().innerHTML = msg;
        // @ts-ignore
        d3.select("#currentLoadingStep").node().innerHTML = msg;
        this.loadingModule.scrollDownDetails();
    }

    setupConverterButtons() {
        const _this = this;
        var iriConverterButton = d3.select("#iri-converter-button");
        var iriConverterInput = d3.select("#iri-converter-input");

        iriConverterInput.on("input", function () {
            _this.keepOntologySelectionOpenShortly();

            var inputIsEmpty = iriConverterInput.property("value") === "";
            iriConverterButton.attr("disabled", inputIsEmpty || undefined);
        }).on("click", function () {
            _this.keepOntologySelectionOpenShortly();
        });

        d3.select("#iri-converter-form").on("submit", function () {
            /**
             * @type {string}
             */
            var inputName = iriConverterInput.property("value");

            // remove first spaces
            var clearedName = inputName.replace(/%20/g, " ");
            while (clearedName.startsWith(" ")) {
                clearedName = clearedName.substr(1, clearedName.length);
            }
            // remove ending spaces
            while (clearedName.endsWith(" ")) {
                clearedName = clearedName.substr(0, clearedName.length - 1);
            }
            // check if iri is actually an url for a json file (ends with .json)
            // create lowercase filenames;
            inputName = clearedName;
            var lc_iri = inputName.toLowerCase();
            if (lc_iri.endsWith(".json")) {
                location.hash = "url=" + inputName;
                iriConverterInput.property("value", "");
                // @ts-ignore
                iriConverterInput.on("input")();
            } else {
                location.hash = "iri=" + inputName;
                iriConverterInput.property("value", "");
                // @ts-ignore
                iriConverterInput.on("input")();
            }
            // @ts-ignore
            d3.event.preventDefault();
            return false;
        });
    }

    setupUploadButton() {
        const _this = this;
        var input = d3.select("#file-converter-input"),
            inputLabel = d3.select("#file-converter-label"),
            uploadButton = d3.select("#file-converter-button");

        input.on("change", function () {
            var selectedFiles = input.property("files");
            if (selectedFiles.length <= 0) {
                inputLabel.text("Select ontology file");
                uploadButton.property("disabled", true);
            } else {
                inputLabel.text(selectedFiles[0].name);
                _this.fileToLoad = selectedFiles[0].name;
                uploadButton.property("disabled", false);
                // @ts-ignore
                uploadButton.node().click();
                // close menu;
                _this.graph.options().navigationMenu().hideAllMenus();
            }
        });

        // @ts-ignore
        uploadButton.on("click", function () {
            var selectedFile = input.property("files")[0];
            if (!selectedFile) {
                return false;
            }
            var newHashParameter = "file=" + selectedFile.name;
            // Trigger the reupload manually, because the iri is not changing
            if (location.hash === "#" + newHashParameter) {
                _this.loadingModule.parseUrlAndLoadOntology();
            } else {
                location.hash = newHashParameter;
            }
        });
    }

    /**
     * @param {string} message
     */
    setLoadingStatusInfo(message) {
        // check if there is a owl2vowl li item;
        var o2vConverterContainer = d3.select("#o2vConverterContainer");
        if (!o2vConverterContainer.node()) {
            var bp_container = d3.select("#bulletPoint_container");
            var div = bp_container.append("div");
            o2vConverterContainer = div.append("ul");
            o2vConverterContainer.attr("id", "o2vConverterContainer");
            o2vConverterContainer.style("margin-left", "-25px");
        }
        // clear o2vConverterContainer;
        // @ts-ignore
        var htmlCollection = o2vConverterContainer.node().children;
        var numEntries = htmlCollection.length;
        for (var i = 0; i < numEntries; i++) {
            htmlCollection[0].remove();
        }
        // split tokens provided by o2v messages
        var tokens = message.split("* ");
        var liForToken;
        for (var t = 0; t < tokens.length; t++) {
            var tokenMessage = tokens[t];
            // create li for tokens;
            if (tokenMessage.length > 0) {
                liForToken = o2vConverterContainer.append("li");
                liForToken.attr("type", "disc");
                liForToken.node().innerHTML = tokenMessage.replace(/\n/g, "<br>");
            }
        }
        if (liForToken)
            liForToken.node().innerHTML += "<br>";

        this.loadingModule.scrollDownDetails();
    }

    /**
     * @param {(arg0: any) => any} callback
     * @param {any} parameter
     */
    getLoadingStatusOnceCallBacked(callback, parameter) {
        const _this = this;
        // @ts-ignore
        d3.xhr(this.URL_PREFIX + "loadingStatus?sessionId=" + this.conversion_sessionId, "application/text", function (/** @type {any} */ error, /** @type {{ responseText: any; }} */ request) {
            if (error) {
                console.log("ontologyMenu getLoadingStatusOnceCallBacked throws error");
                console.log("---------Error -----------");
                console.log(error);
                console.log("---------Request -----------");
                console.log(request);
            }
            _this.setLoadingStatusInfo(request.responseText);
            const parseResult = callback(parameter); // FIXME: Use the result
        });
    }

    getLoadingStatusTimeLooped() {
        const _this = this;
        // @ts-ignore
        d3.xhr(this.URL_PREFIX + "loadingStatus?sessionId=" + this.conversion_sessionId, "application/text", function (/** @type {any} */ error, /** @type {{ responseText: any; }} */ request) {
            if (error) {
                console.log("ontologyMenu getLoadingStatusTimeLooped throws error");
                console.log("---------Error -----------");
                console.log(error);
                console.log("---------Request -----------");
                console.log(request);
            }
            if (_this.stopTimer === false) {
                _this.setLoadingStatusInfo(request.responseText);
                _this.timedLoadingStatusLogger();
            }
        });
    }

    timedLoadingStatusLogger() {
        const _this = this;
        clearTimeout(this.loadingStatusTimer);
        if (this.stopTimer === false) {
            this.loadingStatusTimer = setTimeout(function () {
                _this.getLoadingStatusTimeLooped();
            }, 1000);
        }
    }

    /**
     * @param {string} msg
     */
    callbackUpdateLoadingMessage(msg) {
        const _this = this;
        // @ts-ignore
        d3.xhr(this.URL_PREFIX + "loadingStatus", "application/text", function (_error, request) {
            if (request !== undefined) {
                _this.setLoadingStatusInfo(request.responseText + "<br>" + msg);
            } else {
                _this.append_message(msg);
            }
        });
    }

    /**
     * @param {any} id
     */
    setConversionID(id) {
        this.conversion_sessionId = id;
    };

    callbackLoad_Ontology_FromIRI(/** @type {any[]} */ parameter) {
        const _this = this;
        var relativePath = parameter[0];
        var ontoName = parameter[1];
        var localThreadId = parameter[2];
        this.stopTimer = false;
        this.timedLoadingStatusLogger();
        // @ts-ignore
        d3.xhr(this.URL_PREFIX + relativePath, "application/json", function (error, request) {
            var loadingSuccessful = !error;
            // check if error occurred or responseText is empty
            if ((error !== null && error.status === 500) || (request && request.responseText.length === 0)) {
                clearTimeout(_this.loadingStatusTimer);
                _this.stopTimer = true;
                _this.getLoadingStatusOnceCallBacked(_this.callbackFromIRI_URL_ERROR, [error, request, localThreadId]);
            }
            if (loadingSuccessful) {
                clearTimeout(_this.loadingStatusTimer);
                _this.stopTimer = true;
                _this.loadingModule.jsonText = request.responseText;
                request = undefined // Nuke reference to save memory
                _this.getLoadingStatusOnceCallBacked(_this.callbackFromIRI_Success, [ontoName, localThreadId]);
            }
        });
    };

    /**
     * @param {any} text
     * @param {any[]} parameter
     */
    callbackLoad_Ontology_From_DirectInput(text, parameter) {
        const _this = this;
        var input = text;
        var sessionId = parameter[1];
        this.stopTimer = false;
        this.timedLoadingStatusLogger();

        var formData = new FormData();
        formData.append("input", input);
        formData.append("sessionId", sessionId);
        var xhr = new XMLHttpRequest();

        xhr.open("POST", this.URL_PREFIX + "directInput", true);
        xhr.onload = function () {
            clearTimeout(_this.loadingStatusTimer);
            _this.stopTimer = true;
            _this.getLoadingStatusOnceCallBacked(_this.callbackForConvert, [xhr, input, sessionId]);
        };
        this.timedLoadingStatusLogger();
        xhr.send(formData);
    };

    /**
     * @param {any[]} parameter
     */
    callbackFromIRI_Success(parameter) {
        var local_conversionId = parameter[2];
        if (local_conversionId !== this.conversion_sessionId) {
            console.log("The conversion process for file:" + parameter[1] + " has been canceled!");
            this.conversionFinished(local_conversionId);
            return;
        }
        this.loadingModule.loadOntologyContent(this.loadingModule.loadFromOWL2VOWL(parameter[1]));
        this.conversionFinished();
    }

    getConversionId() {
        return this.conversion_sessionId;
    };

    /**
     * @param {any[]} parameter
     */
    callbackLoad_JSON_FromURL(parameter) {
        const _this = this;
        var relativePath = parameter[0];
        var ontoName = parameter[1];
        var local_conversionId = parameter[2];
        this.stopTimer = false;
        this.timedLoadingStatusLogger();
        // @ts-ignore
        d3.xhr(this.URL_PREFIX + relativePath, "application/json", function (error, request) {
            var loadingSuccessful = !error;
            // check if error occurred or responseText is empty
            if ((error !== null && error.status === 500) || (request && request.responseText.length === 0)) {
                clearTimeout(_this.loadingStatusTimer);
                _this.stopTimer = true;
                loadingSuccessful = false;
                console.log(request);
                console.log(request.responseText.length);
                _this.getLoadingStatusOnceCallBacked(_this.callbackFromJSON_URL_ERROR, [error, request, local_conversionId]);
            }
            if (loadingSuccessful) {
                clearTimeout(_this.loadingStatusTimer);
                _this.stopTimer = true;
                _this.loadingModule.jsonText = request.responseText;
                request = undefined // Nuke reference to save memory
                _this.getLoadingStatusOnceCallBacked(_this.callbackFromJSON_Success, [ontoName, local_conversionId]);
            }
        });
    };

    /**
     * @param {any[]} parameter
     */
    callbackFromJSON_Success(parameter) {
        var local_conversionId = parameter[2];
        if (local_conversionId !== this.conversion_sessionId) {
            console.log("The conversion process for file:" + parameter[1] + " has been canceled!");
            return;
        }
        this.loadingModule.loadOntologyContent(this.loadingModule.loadFromOWL2VOWL(parameter[1]));
    }

    /**
     * @param {any[]} parameter
     */
    callbackFromJSON_URL_ERROR(parameter) {
        var error = parameter[0];
        var request = parameter[1];
        var local_conversionId = parameter[2];
        if (local_conversionId !== this.conversion_sessionId) {
            console.log("This thread has been canceled!!");
            this.conversionFinished(local_conversionId);
            return;
        }
        this.callbackUpdateLoadingMessage("<br><span style='color:red'> Failed to convert the file.</span> " +
            " Ontology could not be loaded.<br>Is it a valid OWL ontology? Please check with <a target=\"_blank\"" +
            "href=\"http://visualdataweb.de/validator/\">OWL Validator</a>");

        if (error !== null && error.status === 500) {
            this.append_message("<span style='color:red'>Could not find ontology  at the URL</span>");
        }
        if (request && request.responseText.length === 0) {
            this.append_message("<span style='color:red'>Received empty graph</span>");
        }
        this.graph.handleOnLoadingError();
        this.conversionFinished();
    }

    /**
     * @param {any[]} parameter
     */
    callbackFromIRI_URL_ERROR(parameter) {
        var error = parameter[0];
        var request = parameter[1];
        var local_conversionId = parameter[2];
        if (local_conversionId !== this.conversion_sessionId) {
            console.log("This thread has been canceled!!");
            this.conversionFinished(local_conversionId);
            return;
        }
        this.callbackUpdateLoadingMessage("<br><span style='color:red'> Failed to convert the file.</span> " +
            " Ontology could not be loaded.<br>Is it a valid OWL ontology? Please check with <a target=\"_blank\"" +
            "href=\"http://visualdataweb.de/validator/\">OWL Validator</a>");

        if (error !== null && error.status === 500) {
            this.append_message("<span style='color:red'>Could not find ontology  at the URL</span>");
        }
        if (request && request.responseText.length === 0) {
            this.append_message("<span style='color:red'>Received empty graph</span>");
        }
        this.graph.handleOnLoadingError();
        this.conversionFinished();
    }

    /**
     * @param {string | Blob} selectedFile
     * @param {any} filename
     * @param {string | Blob} local_threadId
     */
    callbackLoadFromOntology(selectedFile, filename, local_threadId) {
        const _this = this;
        this.stopTimer = false;
        this.timedLoadingStatusLogger();

        var formData = new FormData();
        formData.append("ontology", selectedFile);
        formData.append("sessionId", local_threadId);
        var xhr = new XMLHttpRequest();

        xhr.open("POST", this.URL_PREFIX + "convert", true);
        xhr.onload = function () {
            clearTimeout(_this.loadingStatusTimer);
            _this.stopTimer = true;
            _this.getLoadingStatusOnceCallBacked(_this.callbackForConvert, [xhr, filename, local_threadId]);
        };
        this.timedLoadingStatusLogger();
        xhr.send(formData);
    }

    /**
     * @param {any[]} parameter
     */
    callbackForConvert(parameter) {
        var xhr = parameter[0];
        var filename = parameter[1];
        var local_threadId = parameter[2];
        if (local_threadId !== this.conversion_sessionId) {
            console.log("The conversion process for file:" + filename + " has been canceled!");
            this.conversionFinished(local_threadId);
            return;
        }
        if (xhr.status === 200) {
            this.loadingModule.jsonText = xhr.responseText
            xhr = undefined // Nuke reference to save memory
            this.loadingModule.loadOntologyContent(this.loadingModule.loadFromOWL2VOWL(filename));
            this.conversionFinished();
        } else {
            // @ts-ignore
            let niceJSON = JSON.stringify(JSON.parse(xhr.responseText), 'null', '  ');
            niceJSON = niceJSON.replace(new RegExp('\r?\n', 'g'), '<br />');
            this.callbackUpdateLoadingMessage("Failed to convert the file. " +
                "<br />Server answer: <br />" +
                "<hr>" + niceJSON + "<hr>" +
                "Ontology could not be loaded.<br />Is it a valid OWL ontology?");
            this.graph.handleOnLoadingError();
            this.conversionFinished();
        }
    }

    /**
     * @param {undefined} [id]
     */
    conversionFinished(id) {
        var local_id = this.conversion_sessionId;
        if (id) {
            local_id = id;
        }
        // @ts-ignore
        d3.xhr(this.URL_PREFIX + "conversionDone?sessionId=" + local_id, "application/text", function (error, request) {
            if (error) {
                console.log("ontologyMenu conversionFinished throws error");
                console.log("---------Error -----------");
                console.log(error);
                console.log("---------Request -----------");
                console.log(request);
            }
        });
    };

    keepOntologySelectionOpenShortly() {
        const _this = this;
        // Events in the menu should not be considered
        var ontologySelection = d3.select("#select .toolTipMenu");
        ontologySelection.on("click", function () {
            // @ts-ignore
            d3.event.stopPropagation();
        }).on("keydown", function () {
            // @ts-ignore
            d3.event.stopPropagation();
        });

        ontologySelection.style("display", "block");

        function disableKeepingOpen() {
            ontologySelection.style("display", undefined);

            clearTimeout(_this.ontologyMenuTimeout);
            d3.select(window).on("click", undefined).on("keydown", undefined);
            ontologySelection.on("mouseover", undefined);
        }

        // Clear the timeout to handle fast calls of this function
        clearTimeout(this.ontologyMenuTimeout);
        this.ontologyMenuTimeout = setTimeout(function () {
            disableKeepingOpen();
        }, 3000);

        // Disable forced open selection on interaction
        d3.select(window).on("click", function () {
            disableKeepingOpen();
        }).on("keydown", function () {
            disableKeepingOpen();
        });

        ontologySelection.on("mouseover", function () {
            disableKeepingOpen();
        });
    }

    /**
     * @param {boolean} visible
     */
    showLoadingStatus(visible) {
        if (visible === true) {
            this.displayLoadingIndicators();
        }
        else {
            this.hideLoadingInformations();
        }
    };

    displayLoadingIndicators() {
        d3.select("#layoutLoadingProgressBarContainer").classed("hidden", false);
        this.loadingInfo.classed("hidden", false);
        this.loadingProgress.classed("hidden", false);
    }

    hideLoadingInformations() {
        this.loadingInfo.classed("hidden", true);
    }
};
