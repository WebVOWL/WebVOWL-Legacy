module.exports = function (graph) {
    const URL_PREFIX = "o2v/"
    let ontologyMenu = {},
        loadingInfo = d3.select("#loading-info"),
        loadingProgress = d3.select("#loading-progress"),
        ontologyMenuTimeout,
        fileToLoad,
        stopTimer = false,
        loadingError = false,
        loadingStatusTimer,
        conversion_sessionId,
        cachedConversions = {},
        loadingModule,
        loadOntologyFromText;
    currentLoadedOntologyName = "";

    String.prototype.beginsWith = function (string) {
        return (this.indexOf(string) === 0);
    };

    ontologyMenu.getLoadingFunction = function () {
        return loadOntologyFromText;
    };

    ontologyMenu.clearCachedVersion = function () {
        if (cachedConversions[currentLoadedOntologyName]) {
            cachedConversions[currentLoadedOntologyName] = undefined;
        }
    };

    ontologyMenu.reloadCachedOntology = function () {
        ontologyMenu.clearCachedVersion();
        graph.clearGraphData();
        loadingModule.parseUrlAndLoadOntology(false);
    };

    ontologyMenu.cachedOntology = function (ontoName) {
        currentLoadedOntologyName = ontoName;
        if (cachedConversions[ontoName]) {
            let locStr = String(location.hash);
            d3.select("#reloadSvgIcon").node().disabled = false;
            graph.showReloadButtonAfterLayoutOptimization(true);
            if (locStr.indexOf("#file") > -1) {
                d3.select("#reloadSvgIcon").node().disabled = true;
                d3.select("#reloadCachedOntology").node().title = "reloading original version not possible, please reload the file";
                d3.select("#reloadSvgIcon").classed("disabledReloadElement", true);
                d3.select("#svgStringText").style("fill", "gray");
                d3.select("#svgStringText").classed("noselect", true);
            }
            else {
                d3.select("#reloadCachedOntology").node().title = "generate new visualization and overwrite cached ontology";
                d3.select("#reloadSvgIcon").classed("disabledReloadElement", false);
                d3.select("#svgStringText").style("fill", "black");
                d3.select("#svgStringText").classed("noselect", true);
            }
        } else {
            graph.showReloadButtonAfterLayoutOptimization(false);
        }
        return cachedConversions[ontoName];
    };
    ontologyMenu.setCachedOntology = function (ontoName, ontoContent) {
        cachedConversions[ontoName] = ontoContent;
        currentLoadedOntologyName = ontoName;
    };

    ontologyMenu.getErrorStatus = function () {
        return loadingError;
    };

    ontologyMenu.setup = function (_loadOntologyFromText) {
        loadOntologyFromText = _loadOntologyFromText;
        loadingModule = graph.options().loadingModule();
        let menuEntry = d3.select("#m_select");
        menuEntry.on("mouseover", function (event) {
            let searchMenu = graph.options().searchMenu();
            searchMenu.hideSearchEntries();
        });

        setupConverterButtons();
        setupUploadButton();

        let descriptionButton = d3.select("#error-description-button").datum({ open: false });
        descriptionButton.on("click", function (event, data) {
            let errorContainer = d3.select("#error-description-container");
            let errorDetailsButton = d3.select(this);

            // toggle the state
            data.open = !data.open;
            let descriptionVisible = data.open;
            if (descriptionVisible) {
                errorDetailsButton.text("Hide error details");
            } else {
                errorDetailsButton.text("Show error details");
            }
            errorContainer.classed("hidden", !descriptionVisible);
        });

        setupUriListener();
        loadingModule.setOntologyMenu(ontologyMenu);
    };

    function setupUriListener() {
        // reload ontology when hash parameter gets changed manually
        d3.select(window).on("hashchange", function (event) {
            let oldURL = event.oldURL, newURL = event.newURL;
            if (oldURL !== newURL) {
                // don't reload when just the hash parameter gets appended
                if (newURL === oldURL + "#") {
                    return;
                }
                updateNavigationHrefs();
                loadingModule.parseUrlAndLoadOntology();
            }
        });
        updateNavigationHrefs();
    }

    ontologyMenu.stopLoadingTimer = function () {
        stopTimer = true;
        clearTimeout(loadingStatusTimer);
    };

    /**
     * Quick fix: update all anchor tags that are used as buttons because a click on them
     * changes the url and this will load an other ontology.
     */
    function updateNavigationHrefs() {
        d3.selectAll("#menuElementContainer > li > a").attr("href", location.hash || "#");
    }

    ontologyMenu.setIriText = function (text) {
        d3.select("#iri-converter-input").node().value = text;
        d3.select("#iri-converter-button").attr("disabled", false);
        d3.select("#iri-converter-form").on("submit")();
    };

    ontologyMenu.clearDetailInformation = function () {
        let bpContainer = d3.select("#bulletPoint_container");
        let htmlCollection = bpContainer.node().children;
        let numEntries = htmlCollection.length;

        for (let i = 0; i < numEntries; i++) {
            htmlCollection[0].remove();
        }
    };
    ontologyMenu.append_message = function (msg) {
        // forward call
        append_message(msg);
    };
    function append_message(msg) {
        let bpContainer = d3.select("#bulletPoint_container");
        let div = bpContainer.append("div");
        div.node().innerHTML = msg;
        loadingModule.scrollDownDetails();
    }

    ontologyMenu.append_message_toLastBulletPoint = function (msg) {
        // forward call
        append_message_toLastBulletPoint(msg);
    };

    ontologyMenu.append_bulletPoint = function (msg) {
        // forward call
        append_bulletPoint(msg);
    };
    function append_message_toLastBulletPoint(msg) {
        let bpContainer = d3.select("#bulletPoint_container");
        let htmlCollection = bpContainer.node().getElementsByTagName("LI");
        let lastItem = htmlCollection.length - 1;
        if (lastItem >= 0) {
            let oldText = htmlCollection[lastItem].innerHTML;
            htmlCollection[lastItem].innerHTML = oldText + msg;
        }
        loadingModule.scrollDownDetails();
    }

    function append_bulletPoint(msg) {
        let bp_container = d3.select("#bulletPoint_container");
        let bp = bp_container.append("li");
        bp.node().innerHTML = msg;
        d3.select("#currentLoadingStep").node().innerHTML = msg;
        loadingModule.scrollDownDetails();
    }


    function setupConverterButtons() {
        let iriConverterButton = d3.select("#iri-converter-button");
        let iriConverterInput = d3.select("#iri-converter-input");

        iriConverterInput.on("input", function (event) {
            keepOntologySelectionOpenShortly();

            let inputIsEmpty = iriConverterInput.property("value") === "";
            iriConverterButton.attr("disabled", inputIsEmpty || undefined);
        }).on("click", function (event) {
            keepOntologySelectionOpenShortly();
        });

        d3.select("#iri-converter-form").on("submit", function (event) {
            let inputName = iriConverterInput.property("value");

            // remove first spaces
            let clearedName = inputName.replace(/%20/g, " ");
            while (clearedName.beginsWith(" ")) {
                clearedName = clearedName.substr(1, clearedName.length);
            }
            // remove ending spaces
            while (clearedName.endsWith(" ")) {
                clearedName = clearedName.substr(0, clearedName.length - 1);
            }
            // check if iri is actually an url for a json file (ends with .json)
            // create lowercase filenames;
            inputName = clearedName;
            let lc_iri = inputName.toLowerCase();
            if (lc_iri.endsWith(".json")) {
                location.hash = "url=" + inputName;
                iriConverterInput.property("value", "");
                iriConverterInput.on("input")();
            } else {
                location.hash = "iri=" + inputName;
                iriConverterInput.property("value", "");
                iriConverterInput.on("input")();
            }
            event.preventDefault();
            return false;
        });
    }

    function setupUploadButton() {
        let input = d3.select("#file-converter-input"),
            inputLabel = d3.select("#file-converter-label"),
            uploadButton = d3.select("#file-converter-button");

        input.on("change", function (event) {
            let selectedFiles = input.property("files");
            if (selectedFiles.length <= 0) {
                inputLabel.text("Select ontology file");
                uploadButton.property("disabled", true);
            } else {
                inputLabel.text(selectedFiles[0].name);
                fileToLoad = selectedFiles[0].name;
                uploadButton.property("disabled", false);
                uploadButton.node().click();
                // close menu;
                graph.options().navigationMenu().hideAllMenus();
            }
        });

        uploadButton.on("click", function (event) {
            let selectedFile = input.property("files")[0];
            if (!selectedFile) {
                return false;
            }
            let newHashParameter = "file=" + selectedFile.name;
            // Trigger the reupload manually, because the iri is not changing
            if (location.hash === "#" + newHashParameter) {
                loadingModule.parseUrlAndLoadOntology();
            } else {
                location.hash = newHashParameter;
            }
        });
    }

    function setLoadingStatusInfo(message) {
        // check if there is a owl2vowl li item;
        let o2vConverterContainer = d3.select("#o2vConverterContainer");
        if (!o2vConverterContainer.node()) {
            let bp_container = d3.select("#bulletPoint_container");
            let div = bp_container.append("div");
            o2vConverterContainer = div.append("ul");
            o2vConverterContainer.attr("id", "o2vConverterContainer");
            o2vConverterContainer.style("margin-left", "-25px");
        }
        // clear o2vConverterContainer;
        let htmlCollection = o2vConverterContainer.node().children;
        let numEntries = htmlCollection.length;
        for (let i = 0; i < numEntries; i++) {
            htmlCollection[0].remove();
        }
        // split tokens provided by o2v messages
        let tokens = message.split("* ");
        let liForToken;
        for (let t = 0; t < tokens.length; t++) {
            let tokenMessage = tokens[t];
            // create li for tokens;
            if (tokenMessage.length > 0) {
                liForToken = o2vConverterContainer.append("li");
                liForToken.attr("type", "disc");
                liForToken.node().innerHTML = tokenMessage.replace(/\n/g, "<br>");
            }
        }
        if (liForToken)
            liForToken.node().innerHTML += "<br>";

        loadingModule.scrollDownDetails();
    }

    ontologyMenu.setLoadingStatusInfo = function (message) {
        // forward call
        setLoadingStatusInfo(message);
    };

    async function getLoadingStatusOnceCallBacked(callback, parameter) {
        const response = await fetch(URL_PREFIX + "loadingStatus?sessionId=" + conversion_sessionId, { headers: { "Content-Type": "application/text" } });
        if (!response.ok) {
            console.log(`ontologyMenu getLoadingStatusOnceCallBacked throws error. Response: ${response.status}`);
        } else {
            setLoadingStatusInfo(await response.text());
            callback(parameter);
        }
    }

    async function getLoadingStatusTimeLooped() {
        const response = await fetch(URL_PREFIX + "loadingStatus?sessionId=" + conversion_sessionId, { headers: { "Content-Type": "application/text" } });
        if (!response.ok) {
            console.log(`ontologyMenu getLoadingStatusTimeLooped throws error. Response: ${response.status}`);
        }
        if (stopTimer === false) {
            setLoadingStatusInfo(await response.text());
            timedLoadingStatusLogger();
        }
    }

    function timedLoadingStatusLogger() {
        clearTimeout(loadingStatusTimer);
        if (stopTimer === false) {
            loadingStatusTimer = setTimeout(function () {
                getLoadingStatusTimeLooped();
            }, 1000);
        }
    }

    async function callbackUpdateLoadingMessage(msg) {
        const response = await fetch(URL_PREFIX + "loadingStatus", { headers: { "Content-Type": "application/text" } });
        if (!response.ok) {
            console.log(`Error retrieving loading status. Response: ${response.status}`);
        } else {
            const text = await response.text();
            if (text !== undefined) {
                setLoadingStatusInfo(text + "<br>" + msg);
            } else {
                append_message(msg);
            }
        }
    }

    ontologyMenu.setConversionID = function (id) {
        conversion_sessionId = id;
    };

    ontologyMenu.callbackLoad_Ontology_FromIRI = async function (parameter) {
        let relativePath = parameter[0];
        let ontoName = parameter[1];
        let localThreadId = parameter[2];
        stopTimer = false;
        timedLoadingStatusLogger();

        const response = await fetch(URL_PREFIX + relativePath, { headers: { "Content-Type": "application/text" } });
        const text = await response.text();
        if (!response.ok) {
            clearTimeout(loadingStatusTimer);
            stopTimer = true;
            console.log(response);
            console.log(text);
            getLoadingStatusOnceCallBacked(callbackFromIRI_URL_ERROR, [response.status, text, localThreadId]);
        } else {
            clearTimeout(loadingStatusTimer);
            stopTimer = true;
            getLoadingStatusOnceCallBacked(callbackFromIRI_Success, [text, ontoName, localThreadId]);
        }
    };

    ontologyMenu.callbackLoad_Ontology_From_DirectInput = function (text, parameter) {
        let input = text;
        let sessionId = parameter[1];
        stopTimer = false;
        timedLoadingStatusLogger();

        let formData = new FormData();
        formData.append("input", input);
        formData.append("sessionId", sessionId);
        let xhr = new XMLHttpRequest();

        xhr.open("POST", URL_PREFIX + "directInput", true);
        xhr.onload = function () {
            clearTimeout(loadingStatusTimer);
            stopTimer = true;
            getLoadingStatusOnceCallBacked(callbackForConvert, [xhr, input, sessionId]);
        };
        timedLoadingStatusLogger();
        xhr.send(formData);

    };
    function callbackFromIRI_Success(parameter) {
        let local_conversionId = parameter[2];
        if (local_conversionId !== conversion_sessionId) {
            console.log("The conversion process for file:" + parameter[1] + " has been canceled!");
            ontologyMenu.conversionFinished(local_conversionId);
            return;
        }
        loadingModule.loadFromOWL2VOWL(parameter[0], parameter[1]);
        ontologyMenu.conversionFinished();

    }

    function callbackFromDirectInput_Success(parameter) {
        let local_conversionId = parameter[1];
        if (local_conversionId !== conversion_sessionId) {
            console.log("The conversion process for file:" + parameter[1] + " has been canceled!");
            ontologyMenu.conversionFinished(local_conversionId);
            return;
        }
        loadingModule.loadFromOWL2VOWL(parameter[0], "DirectInputConversionID" + local_conversionId);
        ontologyMenu.conversionFinished();

    }

    ontologyMenu.getConversionId = function () {
        return conversion_sessionId;
    };

    ontologyMenu.callbackLoad_JSON_FromURL = async function (parameter) {
        let relativePath = parameter[0];
        let ontoName = parameter[1];
        let local_conversionId = parameter[2];
        stopTimer = false;
        timedLoadingStatusLogger();

        const response = await fetch(URL_PREFIX + relativePath, { headers: { "Content-Type": "application/json" } });
        const jsonText = await response.json();
        if (!response.ok || jsonText.length === 0) {
            clearTimeout(loadingStatusTimer);
            stopTimer = true;
            loadingSuccessful = false;
            console.log(response);
            console.log(jsonText);
            getLoadingStatusOnceCallBacked(callbackFromJSON_URL_ERROR, [response.status, jsonText, local_conversionId]);
        } else {
            clearTimeout(loadingStatusTimer);
            stopTimer = true;
            getLoadingStatusOnceCallBacked(callbackFromJSON_Success, [jsonText, ontoName, local_conversionId]);
        }
    };

    function callbackFromJSON_Success(parameter) {
        let local_conversionId = parameter[2];
        if (local_conversionId !== conversion_sessionId) {
            console.log("The conversion process for file:" + parameter[1] + " has been canceled!");
            return;
        }
        loadingModule.loadFromOWL2VOWL(parameter[0], parameter[1]);
    }

    function callbackFromJSON_URL_ERROR(parameter) {
        const status = parameter[0];
        const jsonText = parameter[1];
        let local_conversionId = parameter[2];
        if (local_conversionId !== conversion_sessionId) {
            console.log("This thread has been canceled!!");
            ontologyMenu.conversionFinished(local_conversionId);
            return;
        }
        callbackUpdateLoadingMessage("<br><span style='color:red'> Failed to convert the file.</span> " +
            " Ontology could not be loaded.<br>Is it a valid OWL ontology? Please check with <a target=\"_blank\"" +
            "href=\"http://visualdataweb.de/validator/\">OWL Validator</a>");

        if (status === 500) {
            append_message("<span style='color:red'>Could not find ontology at the URL</span>");
        }
        if (jsonText.length === 0) {
            append_message("<span style='color:red'>Received empty graph</span>");
        }
        graph.handleOnLoadingError();
        ontologyMenu.conversionFinished();
    }

    function callbackFromIRI_URL_ERROR(parameter) {
        const status = parameter[0];
        const data = parameter[1];
        let local_conversionId = parameter[2];
        if (local_conversionId !== conversion_sessionId) {
            console.log("This thread has been canceled!!");
            ontologyMenu.conversionFinished(local_conversionId);
            return;
        }
        callbackUpdateLoadingMessage("<br><span style='color:red'> Failed to convert the file.</span> " +
            " Ontology could not be loaded.<br>Is it a valid OWL ontology? Please check with <a target=\"_blank\"" +
            "href=\"http://visualdataweb.de/validator/\">OWL Validator</a>");

        if (status === 500) {
            append_message("<span style='color:red'>Could not find ontology  at the URL</span>");
        }
        if (data.length === 0) {
            append_message("<span style='color:red'>Received empty graph</span>");
        }
        graph.handleOnLoadingError();
        ontologyMenu.conversionFinished();
    }

    // function callbackFromDirectInput_ERROR(parameter) {
    //     let error = parameter[0];
    //     let request = parameter[1];
    //     let local_conversionId = parameter[2];
    //     if (local_conversionId !== conversion_sessionId) {
    //         console.log("The loading process for direct input has been canceled!");
    //         return;
    //     }
    //     // callbackUpdateLoadingMessage("<br> <span style='color:red'> Failed to convert the file.</span> "+
    //     //     "Ontology could not be loaded.<br>Is it a valid OWL ontology? Please check with <a target=\"_blank\"" +
    //     //     "href=\"http://visualdataweb.de/validator/\">OWL Validator</a>");
    //     if (error !== null && error.status === 500) {
    //         append_message("<span style='color:red'>Could not convert direct input</span>");
    //     }
    //     if (request && request.responseText.length === 0) {
    //         append_message("<span style='color:red'>Received empty graph</span>");
    //     }

    //     graph.handleOnLoadingError();
    //     ontologyMenu.conversionFinished();
    // }

    ontologyMenu.callbackLoadFromOntology = function (selectedFile, filename, local_threadId) {
        callbackLoadFromOntology(selectedFile, filename, local_threadId);
    };

    function callbackLoadFromOntology(selectedFile, filename, local_threadId) {
        stopTimer = false;
        timedLoadingStatusLogger();

        let formData = new FormData();
        formData.append("ontology", selectedFile);
        formData.append("sessionId", local_threadId);
        let xhr = new XMLHttpRequest();

        xhr.open("POST", URL_PREFIX + "convert", true);
        xhr.onload = function () {
            clearTimeout(loadingStatusTimer);
            stopTimer = true;
            getLoadingStatusOnceCallBacked(callbackForConvert, [xhr, filename, local_threadId]);
        };
        timedLoadingStatusLogger();
        xhr.send(formData);
    }

    function callbackForConvert(parameter) {
        let xhr = parameter[0];
        let filename = parameter[1];
        let local_threadId = parameter[2];
        if (local_threadId !== conversion_sessionId) {
            console.log("The conversion process for file:" + filename + " has been canceled!");
            ontologyMenu.conversionFinished(local_threadId);
            return;
        }
        if (xhr.status === 200) {
            loadingModule.loadFromOWL2VOWL(xhr.responseText, filename);
            ontologyMenu.conversionFinished();
        } else {
            let uglyJson = xhr.responseText;
            let jsonResut = JSON.parse(uglyJson);
            let niceJSON = JSON.stringify(jsonResut, 'null', '  ');
            niceJSON = niceJSON.replace(new RegExp('\r?\n', 'g'), '<br />');
            callbackUpdateLoadingMessage("Failed to convert the file. " +
                "<br />Server answer: <br />" +
                "<hr>" + niceJSON + "<hr>" +
                "Ontology could not be loaded.<br />Is it a valid OWL ontology? Please check with <a target=\"_blank\"" +
                "href=\"http://visualdataweb.de/validator/\">OWL Validator</a>");

            graph.handleOnLoadingError();
            ontologyMenu.conversionFinished();
        }
    }

    ontologyMenu.conversionFinished = async function (id) {
        let local_id = conversion_sessionId;
        if (id) {
            local_id = id;
        }
        const response = await fetch(URL_PREFIX + "conversionDone?sessionId=" + local_id, { headers: { "Content-Type": "application/text" } });
        if (!response.ok) {
            console.log(`ontologyMenu conversionFinished throws error. Response: ${response.status}`);
        }
    };

    function keepOntologySelectionOpenShortly() {
        // Events in the menu should not be considered
        let ontologySelection = d3.select("#select .toolTipMenu");
        ontologySelection.on("click", function (event) {
            event.stopPropagation();
        }).on("keydown", function (event) {
            event.stopPropagation();
        });

        ontologySelection.style("display", "block");

        function disableKeepingOpen() {
            ontologySelection.style("display", undefined);
            clearTimeout(ontologyMenuTimeout);
            d3.select(window).on("click", undefined).on("keydown", undefined);
            ontologySelection.on("mouseover", undefined);
        }

        // Clear the timeout to handle fast calls of this function
        clearTimeout(ontologyMenuTimeout);
        ontologyMenuTimeout = setTimeout(function () {
            disableKeepingOpen();
        }, 3000);

        // Disable forced open selection on interaction
        d3.select(window).on("click", function (event) {
            disableKeepingOpen();
        }).on("keydown", function (event) {
            disableKeepingOpen();
        });

        ontologySelection.on("mouseover", function (event) {
            disableKeepingOpen();
        });
    }

    ontologyMenu.showLoadingStatus = function (visible) {
        if (visible === true) {
            displayLoadingIndicators();
        }
        else {
            hideLoadingInformations();
        }
    };

    function displayLoadingIndicators() {
        d3.select("#layoutLoadingProgressBarContainer").classed("hidden", false);
        loadingInfo.classed("hidden", false);
        loadingProgress.classed("hidden", false);
    }

    function hideLoadingInformations() {
        loadingInfo.classed("hidden", true);
    }

    return ontologyMenu;
};
