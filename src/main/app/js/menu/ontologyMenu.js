import Graph from "../../../webvowl/js/graph"
import WebVOWL from "../../../webvowl/js/webvowl"
import OntologyLoading from "../ontologyLoading"

export default class OntologyMenu {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        this.graph = graph
        this.loadingInfo = d3.select("#loading-info")
        this.loadingProgress = d3.select("#loading-progress")
        this.ontologyMenuTimeout = undefined
        this.fileToLoad = undefined
        this.stopTimer = false
        this.loadingError = false
        this.loadingStatusTimer = undefined
        /**
         * @type {number | undefined}
         */
        this.conversion_sessionId = undefined
        /**
         * @type {Map<string,string> | undefined}
         */
        this.cachedConversions = new Map()
        /**
         * @type {OntologyLoading | undefined}
         */
        this.loadingModule = undefined
        this.currentLoadedOntologyName = ""
    }

    clearCachedVersion() {
        this.cachedConversions.delete(this.currentLoadedOntologyName)
    }

    reloadCachedOntology() {
        this.clearCachedVersion()
        this.graph.clearGraphData()
        this.loadingModule.parseUrlAndLoadOntology(false)
    }

    /**
     * @param {string} ontoName
     */
    cachedOntology(ontoName) {
        this.currentLoadedOntologyName = ontoName
        const cached = this.cachedConversions.get(ontoName)
        if (cached !== undefined) {
            const locStr = String(location.hash)
            d3.select("#reloadSvgIcon").node().disabled = false
            this.graph.showReloadButtonAfterLayoutOptimization = true
            if (locStr.indexOf("#file") > -1) {
                d3.select("#reloadSvgIcon").node().disabled = true
                d3.select("#reloadCachedOntology").node().title =
                    "reloading original version not possible, please reload the file"
                d3.select("#reloadSvgIcon").classed(
                    "disabledReloadElement",
                    true,
                )
                d3.select("#svgStringText").style("fill", "gray")
                d3.select("#svgStringText").classed("noselect", true)
            } else {
                d3.select("#reloadCachedOntology").node().title =
                    "generate new visualization and overwrite cached ontology"
                d3.select("#reloadSvgIcon").classed(
                    "disabledReloadElement",
                    false,
                )
                d3.select("#svgStringText").style("fill", "black")
                d3.select("#svgStringText").classed("noselect", true)
            }
        } else {
            this.graph.showReloadButtonAfterLayoutOptimization = false
        }
        return cached
    }

    /**
     * @param {string} ontoName
     * @param {string} ontoContent
     */
    setCachedOntology(ontoName, ontoContent) {
        if (this.shouldCacheOntology(ontoContent)) {
            this.cachedConversions.set(ontoName, ontoContent)
            this.currentLoadedOntologyName = ontoName
        }
    }

    /**
     * Only cache ontology if it is less than 50 MB
     * @param {string} text
     */
    shouldCacheOntology(text) {
        return !(text.length > 50000000) // 50 MB
    }

    setup() {
        this.loadingModule = this.graph.options.loadingModule
        const menuEntry = d3.select("#m_select")
        menuEntry.on("mouseover", () => {
            const searchMenu = this.graph.options.searchMenu
            searchMenu.hideSearchEntries()
        })

        this.setupConverterButtons()
        this.setupUploadButton()

        const descriptionButton = d3
            .select("#error-description-button")
            .datum({ open: false })
        descriptionButton.on("click", function (data) {
            const errorContainer = d3.select("#error-description-container")
            const errorDetailsButton = d3.select(this)

            // toggle the state
            data.open = !data.open
            const descriptionVisible = data.open
            if (descriptionVisible) {
                errorDetailsButton.text("Hide error details")
            } else {
                errorDetailsButton.text("Show error details")
            }
            errorContainer.classed("hidden", !descriptionVisible)
        })
        this.setupUriListener()
        this.loadingModule.setOntologyMenu(this)
    }

    setupUriListener() {
        // reload ontology when hash parameter gets changed manually
        d3.select(window).on("hashchange", () => {
            // @ts-ignore
            const oldURL = d3.event.oldURL,
                newURL = d3.event.newURL
            if (oldURL !== newURL) {
                // don't reload when just the hash parameter gets appended
                if (newURL === oldURL + "#") {
                    return
                }
                this.updateNavigationHrefs()
                this.loadingModule.parseUrlAndLoadOntology()
            }
        })
        this.updateNavigationHrefs()
    }

    stopLoadingTimer() {
        this.stopTimer = true
        clearTimeout(this.loadingStatusTimer)
    }

    /**
     * Quick fix: update all anchor tags that are used as buttons because a click on them
     * changes the url and this will load an other ontology.
     */
    updateNavigationHrefs() {
        d3.selectAll("#menuElementContainer > li > a").attr(
            "href",
            location.hash || "#",
        )
    }

    /**
     * @param {string} text
     */
    setIriText(text) {
        d3.select("#iri-converter-input").node().value = text
        d3.select("#iri-converter-button").attr("disabled", false)
        d3.select("#iri-converter-form").on("submit")()
    }

    clearDetailInformation() {
        const bpContainer = d3.select("#bulletPoint_container")
        const htmlCollection = bpContainer.node().children
        const numEntries = htmlCollection.length
        for (let i = 0; i < numEntries; i++) {
            htmlCollection[0].remove()
        }
    }

    /**
     * @param {string} msg
     */
    append_message(msg) {
        const bpContainer = d3.select("#bulletPoint_container")
        const div = bpContainer.append("div")
        div.node().innerHTML = msg
        this.loadingModule.scrollDownDetails()
    }

    /**
     * @param {string} msg
     */
    append_message_toLastBulletPoint(msg) {
        const bpContainer = d3.select("#bulletPoint_container")
        const htmlCollection = bpContainer.node().getElementsByTagName("LI")
        const lastItem = htmlCollection.length - 1
        if (lastItem >= 0) {
            const oldText = htmlCollection[lastItem].innerHTML
            htmlCollection[lastItem].innerHTML = oldText + msg
        }
        this.loadingModule.scrollDownDetails()
    }

    /**
     * @param {string} msg
     */
    append_bulletPoint(msg) {
        const bp_container = d3.select("#bulletPoint_container")
        const bp = bp_container.append("li")
        bp.node().innerHTML = msg
        d3.select("#currentLoadingStep").node().innerHTML = msg
        this.loadingModule.scrollDownDetails()
    }

    setupConverterButtons() {
        const _this = this
        const iriConverterButton = d3.select("#iri-converter-button")
        const iriConverterInput = d3.select("#iri-converter-input")

        iriConverterInput
            .on("input", function () {
                _this.keepOntologySelectionOpenShortly()
                const inputIsEmpty = iriConverterInput.property("value") === ""
                iriConverterButton.attr("disabled", inputIsEmpty || undefined)
            })
            .on("click", function () {
                _this.keepOntologySelectionOpenShortly()
            })

        d3.select("#iri-converter-form").on("submit", function () {
            /**
             * @type {string}
             */
            let inputName = iriConverterInput.property("value")

            // remove first spaces
            let clearedName = inputName.replace(/%20/g, " ")
            while (clearedName.startsWith(" ")) {
                clearedName = clearedName.substr(1, clearedName.length)
            }
            // remove ending spaces
            while (clearedName.endsWith(" ")) {
                clearedName = clearedName.substr(0, clearedName.length - 1)
            }
            // check if iri is actually an url for a json file (ends with .json)
            // create lowercase filenames;
            inputName = clearedName
            const lc_iri = inputName.toLowerCase()
            if (lc_iri.endsWith(".json")) {
                location.hash = "url=" + inputName
                iriConverterInput.property("value", "")
                iriConverterInput.on("input")()
            } else {
                location.hash = "iri=" + inputName
                iriConverterInput.property("value", "")
                iriConverterInput.on("input")()
            }
            d3.event.preventDefault()
            return false
        })
    }

    setupUploadButton() {
        const input = d3.select("#file-converter-input")
        const inputLabel = d3.select("#file-converter-label")
        const uploadButton = d3.select("#file-converter-button")

        input.on("change", () => {
            const selectedFiles = input.property("files")
            if (selectedFiles.length <= 0) {
                inputLabel.text("Select ontology file")
                uploadButton.property("disabled", true)
            } else {
                inputLabel.text(selectedFiles[0].name)
                this.fileToLoad = selectedFiles[0].name
                uploadButton.property("disabled", false)
                uploadButton.node().click()
                // close menu;
                this.graph.options.navigationMenu.hideAllMenus()
            }
        })
        uploadButton.on("click", () => {
            const selectedFile = input.property("files")[0]
            if (!selectedFile) {
                return false
            }
            const newHashParameter = "file=" + selectedFile.name
            // Trigger the reupload manually, because the iri is not changing
            if (location.hash === "#" + newHashParameter) {
                this.loadingModule.parseUrlAndLoadOntology()
            } else {
                location.hash = newHashParameter
            }
        })
    }

    /**
     * @param {string} message
     */
    setLoadingStatusInfo(message) {
        // check if there is a owl2vowl li item;
        let o2vConverterContainer = d3.select("#o2vConverterContainer")
        if (!o2vConverterContainer.node()) {
            const bp_container = d3.select("#bulletPoint_container")
            const div = bp_container.append("div")
            o2vConverterContainer = div.append("ul")
            o2vConverterContainer.attr("id", "o2vConverterContainer")
            o2vConverterContainer.style("margin-left", "-25px")
        }
        // clear o2vConverterContainer;
        const htmlCollection = o2vConverterContainer.node().children
        const numEntries = htmlCollection.length
        for (let i = 0; i < numEntries; i++) {
            htmlCollection[0].remove()
        }
        // split tokens provided by o2v messages
        const tokens = message.split("* ")
        let liForToken
        for (let t = 0; t < tokens.length; t++) {
            const tokenMessage = tokens[t]
            // create li for tokens;
            if (tokenMessage.length > 0) {
                liForToken = o2vConverterContainer.append("li")
                liForToken.attr("type", "disc")
                liForToken.node().innerHTML = tokenMessage.replace(
                    /\n/g,
                    "<br>",
                )
            }
        }
        if (liForToken) liForToken.node().innerHTML += "<br>"
        this.loadingModule.scrollDownDetails()
    }

    /**
     * @param {(arg0: any) => any} callback
     * @param {any} parameter
     */
    getLoadingStatusOnceCallBacked(callback, parameter) {
        d3.xhr(
            WebVOWL.url_prefix +
                "loadingStatus?sessionId=" +
                this.conversion_sessionId,
            "application/text",
            (error, request) => {
                if (error) {
                    console.log(
                        "ontologyMenu getLoadingStatusOnceCallBacked throws error",
                    )
                    console.log("---------Error -----------")
                    console.log(error)
                    console.log("---------Request -----------")
                    console.log(request)
                }
                this.setLoadingStatusInfo(request.responseText)
                const parseResult = callback(parameter) // FIXME: Use the result
            },
        )
    }

    getLoadingStatusTimeLooped() {
        d3.xhr(
            WebVOWL.url_prefix +
                "loadingStatus?sessionId=" +
                this.conversion_sessionId,
            "application/text",
            (error, request) => {
                if (error) {
                    console.log(
                        "ontologyMenu getLoadingStatusTimeLooped throws error",
                    )
                    console.log("---------Error -----------")
                    console.log(error)
                    console.log("---------Request -----------")
                    console.log(request)
                }
                if (!this.stopTimer) {
                    this.setLoadingStatusInfo(request.responseText)
                    this.timedLoadingStatusLogger()
                }
            },
        )
    }

    timedLoadingStatusLogger() {
        clearTimeout(this.loadingStatusTimer)
        if (!this.stopTimer) {
            this.loadingStatusTimer = setTimeout(() => {
                this.getLoadingStatusTimeLooped()
            }, 1000)
        }
    }

    /**
     * @param {string} msg
     */
    callbackUpdateLoadingMessage(msg) {
        d3.xhr(
            WebVOWL.url_prefix + "loadingStatus",
            "application/text",
            (error, request) => {
                if (request !== undefined) {
                    this.setLoadingStatusInfo(
                        request.responseText + "<br>" + msg,
                    )
                } else {
                    this.append_message(msg)
                }
            },
        )
    }

    /**
     * @param {any[]} parameter
     */
    callbackLoad_Ontology_FromIRI(parameter) {
        const relativePath = parameter[0]
        const ontoName = parameter[1]
        const localThreadId = parameter[2]
        this.stopTimer = false
        this.timedLoadingStatusLogger()
        d3.xhr(
            WebVOWL.url_prefix + relativePath,
            "application/json",
            (error, request) => {
                const loadingSuccessful = !error
                // check if error occurred or responseText is empty
                if (
                    (error !== null && error.status === 500) ||
                    (request && request.responseText.length === 0)
                ) {
                    clearTimeout(this.loadingStatusTimer)
                    this.stopTimer = true
                    this.getLoadingStatusOnceCallBacked(
                        this.callbackFromIRI_URL_ERROR,
                        [error, request, localThreadId],
                    )
                }
                if (loadingSuccessful) {
                    clearTimeout(this.loadingStatusTimer)
                    this.stopTimer = true
                    this.getLoadingStatusOnceCallBacked(
                        this.callbackFromIRI_Success,
                        [ontoName, localThreadId],
                    )
                }
            },
        )
    }

    /**
     * @param {string} text
     * @param {any[]} parameter
     */
    callbackLoad_Ontology_From_DirectInput(text, parameter) {
        const input = text
        const sessionId = parameter[1]
        this.stopTimer = false
        this.timedLoadingStatusLogger()

        const formData = new FormData()
        formData.append("input", input)
        formData.append("sessionId", sessionId)
        const xhr = new XMLHttpRequest()

        xhr.open("POST", WebVOWL.url_prefix + "directInput", true)
        xhr.onload = () => {
            clearTimeout(this.loadingStatusTimer)
            this.stopTimer = true
            this.getLoadingStatusOnceCallBacked(this.callbackForConvert, [
                xhr,
                input,
                sessionId,
            ])
        }
        this.timedLoadingStatusLogger()
        xhr.send(formData)
    }

    /**
     * @param {any[]} parameter
     */
    callbackFromIRI_Success(parameter) {
        const local_conversionId = parameter[2]
        if (local_conversionId !== this.conversion_sessionId) {
            console.log(
                "The conversion process for file:" +
                    parameter[1] +
                    " has been canceled!",
            )
            this.conversionFinished(local_conversionId)
            return
        }
        this.loadingModule.loadOntologyContent(
            this.loadingModule.loadFromOWL2VOWL(parameter[1]),
        )
        this.conversionFinished()
    }

    /**
     * @param {any[]} parameter
     */
    callbackLoad_JSON_FromURL(parameter) {
        const relativePath = parameter[0]
        const ontoName = parameter[1]
        const local_conversionId = parameter[2]
        this.stopTimer = false
        this.timedLoadingStatusLogger()
        // @ts-ignore
        d3.xhr(
            WebVOWL.url_prefix + relativePath,
            "application/json",
            (error, request) => {
                let loadingSuccessful = !error
                // check if error occurred or responseText is empty
                if (
                    (error !== null && error.status === 500) ||
                    (request && request.responseText.length === 0)
                ) {
                    clearTimeout(this.loadingStatusTimer)
                    this.stopTimer = true
                    loadingSuccessful = false
                    console.log(request)
                    console.log(request.responseText.length)
                    this.getLoadingStatusOnceCallBacked(
                        this.callbackFromJSON_URL_ERROR,
                        [error, request, local_conversionId],
                    )
                }
                if (loadingSuccessful) {
                    clearTimeout(this.loadingStatusTimer)
                    this.stopTimer = true
                    this.getLoadingStatusOnceCallBacked(
                        this.callbackFromJSON_Success,
                        [ontoName, local_conversionId],
                    )
                }
            },
        )
    }

    /**
     * @param {any[]} parameter
     */
    callbackFromJSON_Success(parameter) {
        const local_conversionId = parameter[2]
        if (local_conversionId !== this.conversion_sessionId) {
            console.log(
                "The conversion process for file:" +
                    parameter[1] +
                    " has been canceled!",
            )
            return
        }
        this.loadingModule.loadOntologyContent(
            this.loadingModule.loadFromOWL2VOWL(parameter[1]),
        )
    }

    /**
     * @param {any[]} parameter
     */
    callbackFromJSON_URL_ERROR(parameter) {
        const error = parameter[0]
        const request = parameter[1]
        const local_conversionId = parameter[2]
        if (local_conversionId !== this.conversion_sessionId) {
            console.log("This thread has been canceled!!")
            this.conversionFinished(local_conversionId)
            return
        }
        this.callbackUpdateLoadingMessage(
            "<br><span style='color:red'> Failed to convert the file.</span> " +
                ' Ontology could not be loaded.<br>Is it a valid OWL ontology? Please check with <a target="_blank"' +
                'href="http://visualdataweb.de/validator/">OWL Validator</a>',
        )

        if (error !== null && error.status === 500) {
            this.append_message(
                "<span style='color:red'>Could not find ontology  at the URL</span>",
            )
        }
        if (request && request.responseText.length === 0) {
            this.append_message(
                "<span style='color:red'>Received empty graph</span>",
            )
        }
        this.graph.handleOnLoadingError()
        this.conversionFinished()
    }

    /**
     * @param {any[]} parameter
     */
    callbackFromIRI_URL_ERROR(parameter) {
        const error = parameter[0]
        const request = parameter[1]
        const local_conversionId = parameter[2]
        if (local_conversionId !== this.conversion_sessionId) {
            console.log("This thread has been canceled!!")
            this.conversionFinished(local_conversionId)
            return
        }
        this.callbackUpdateLoadingMessage(
            "<br><span style='color:red'> Failed to convert the file.</span> " +
                ' Ontology could not be loaded.<br>Is it a valid OWL ontology? Please check with <a target="_blank"' +
                'href="http://visualdataweb.de/validator/">OWL Validator</a>',
        )

        if (error !== null && error.status === 500) {
            this.append_message(
                "<span style='color:red'>Could not find ontology  at the URL</span>",
            )
        }
        if (request && request.responseText.length === 0) {
            this.append_message(
                "<span style='color:red'>Received empty graph</span>",
            )
        }
        this.graph.handleOnLoadingError()
        this.conversionFinished()
    }

    /**
     * @param {string | Blob} selectedFile
     * @param {any} filename
     * @param {string | Blob} local_threadId
     */
    callbackLoadFromOntology(selectedFile, filename, local_threadId) {
        this.stopTimer = false
        this.timedLoadingStatusLogger()

        const formData = new FormData()
        formData.append("ontology", selectedFile)
        formData.append("sessionId", local_threadId)
        const xhr = new XMLHttpRequest()

        xhr.open("POST", WebVOWL.url_prefix + "convert", true)
        xhr.onload = () => {
            clearTimeout(this.loadingStatusTimer)
            this.stopTimer = true
            this.getLoadingStatusOnceCallBacked(this.callbackForConvert, [
                xhr,
                filename,
                local_threadId,
            ])
        }
        this.timedLoadingStatusLogger()
        xhr.send(formData)
    }

    /**
     * @param {any[]} parameter
     */
    callbackForConvert(parameter) {
        const xhr = parameter[0]
        const filename = parameter[1]
        const local_threadId = parameter[2]
        if (local_threadId !== this.conversion_sessionId) {
            console.log(
                "The conversion process for file:" +
                    filename +
                    " has been canceled!",
            )
            this.conversionFinished(local_threadId)
            return
        }
        if (xhr.status === 200) {
            this.loadingModule.loadOntologyContent(
                this.loadingModule.loadFromOWL2VOWL(filename),
            )
            this.conversionFinished()
        } else {
            let niceJSON = JSON.stringify(
                JSON.parse(xhr.responseText),
                "null",
                "  ",
            )
            niceJSON = niceJSON.replace(new RegExp("\r?\n", "g"), "<br />")
            this.callbackUpdateLoadingMessage(
                "Failed to convert the file. " +
                    "<br />Server answer: <br />" +
                    "<hr>" +
                    niceJSON +
                    "<hr>" +
                    "Ontology could not be loaded.<br />Is it a valid OWL ontology?",
            )
            this.graph.handleOnLoadingError()
            this.conversionFinished()
        }
    }

    /**
     * @param {number | undefined} [id]
     */
    conversionFinished(id) {
        let local_id = this.conversion_sessionId
        if (id) {
            local_id = id
        }
        d3.xhr(
            WebVOWL.url_prefix + "conversionDone?sessionId=" + local_id,
            "application/text",
            function (error, request) {
                if (error) {
                    console.log("ontologyMenu conversionFinished throws error")
                    console.log("---------Error -----------")
                    console.log(error)
                    console.log("---------Request -----------")
                    console.log(request)
                }
            },
        )
    }

    keepOntologySelectionOpenShortly() {
        const _this = this
        // Events in the menu should not be considered
        const ontologySelection = d3.select("#select .toolTipMenu")
        ontologySelection
            .on("click", function () {
                // @ts-ignore
                d3.event.stopPropagation()
            })
            .on("keydown", function () {
                // @ts-ignore
                d3.event.stopPropagation()
            })

        ontologySelection.style("display", "block")

        function disableKeepingOpen() {
            ontologySelection.style("display", undefined)
            clearTimeout(_this.ontologyMenuTimeout)
            d3.select(window).on("click", undefined).on("keydown", undefined)
            ontologySelection.on("mouseover", undefined)
        }

        // Clear the timeout to handle fast calls of this function
        clearTimeout(this.ontologyMenuTimeout)
        this.ontologyMenuTimeout = setTimeout(function () {
            disableKeepingOpen()
        }, 3000)

        // Disable forced open selection on interaction
        d3.select(window)
            .on("click", function () {
                disableKeepingOpen()
            })
            .on("keydown", function () {
                disableKeepingOpen()
            })
        ontologySelection.on("mouseover", function () {
            disableKeepingOpen()
        })
    }

    /**
     * @param {boolean} visible
     */
    showLoadingStatus(visible) {
        if (visible === true) {
            this.displayLoadingIndicators()
        } else {
            this.hideLoadingInformations()
        }
    }

    displayLoadingIndicators() {
        d3.select("#layoutLoadingProgressBarContainer").classed("hidden", false)
        this.loadingInfo.classed("hidden", false)
        this.loadingProgress.classed("hidden", false)
    }

    hideLoadingInformations() {
        this.loadingInfo.classed("hidden", true)
    }
}
