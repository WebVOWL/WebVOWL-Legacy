import { BaseElement } from "../../webvowl/js/elements/BaseElement";


export class Warnings {
    /**
     * @param {any} graph
     */
    constructor(graph) {
        this.graph = graph
        this.superContainer = d3.select("#WarningErrorMessages");
        /**
         * @type {d3.Selection<HTMLDivElement, any, HTMLElement, any>[]}
         */
        this._messageContainers = [];
        /**
         * @type {d3.Selection<HTMLDivElement, any, HTMLElement, any>[]}
         */
        this._messageContext = [];
        /**
         * @type {boolean[]}
         */
        this._visibleStatus = [];
        /**
         * @type {number | undefined}
         */
        this._filterHintId = undefined;
        /**
         * @type {number | undefined}
         */
        this._editorHintId = undefined;
        this._messageId = -1;
        this.cssStyleIndex = 0;
        this.styleSelectorIndex = 2;

        this.superContainer.style("display", "inline-block");
        try {
            // Catch any errors that may arise, as this method is using deprecated behavior
            this.#findCSS_Index();
        } catch (error) {
            console.error(error)
        }
    }

    // helper for standalone webvowl in chrome
    /**
     * @param {string} name
     * @param {string} rules
     */
    #createCSSSelector(name, rules) {
        const style = document.createElement('style');
        style.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(style);
        if (!(style.sheet || {}).insertRule)
            (style.styleSheet || style.sheet).addRule(name, rules);
        else
            style.sheet.insertRule(name + "{" + rules + "}", 0);
    }

    #findCSS_Index() {
        this.#createCSSSelector("@keyframes msg_CollapseAnimation", " 0% { top: 0; } 100% { top: -400px;}");
        // console.log(document.styleSheets);
    }

    addMessageBox() {
        // add a container;
        this._messageId++;
        const messageContainer = d3.select("#WarningErrorMessages").append("div");
        messageContainer.node().id = "messageContainerId_" + this._messageId;

        const messageContext = messageContainer.append("div");
        messageContext.node().id = "messageContextId_" + this._messageId;
        messageContext.style("top", "0");
        messageContainer.style("position", "relative");
        messageContainer.style("width", "100%");
        //save in array
        this._messageContainers.push(messageContainer);
        this._messageContext.push(messageContext);

        // add animation to the container
        const _this = this
        messageContainer.node().addEventListener("animationend", function () { _this.#_msgContainer_animationEnd(this) });

        // set visible flag that is used in end of animation
        this._visibleStatus[this._messageId] = true;
        return this._messageId;
    }

    /**
     * @param {{ id: any; }} element
     */
    #_msgContainer_animationEnd(element) {
        const containerId = element.id;
        const tokens = containerId.split("_")[1];
        const mContainer = d3.select("#" + containerId);
        const tokenStatus = !this._visibleStatus[tokens];
        // get number of children
        mContainer.classed("hidden", tokenStatus);
        // clean up DOM
        if (tokenStatus) {
            mContainer.remove();
            this._messageContext[tokens] = null;
            this._messageContainers[tokens] = null;
        }
        // remove event listener
        // const c = d3.select(this);
        // c.node().removeEventListener("animationend",_msgContainer_animationEnd);
    }

    /**
     * @param {number} id
     */
    createMessageContext(id) {
        const warningContainer = this._messageContext[id];
        const moduleContainer = this._messageContainers[id];
        const generalHint = warningContainer.append('div');
        generalHint.node().innerHTML = "";
        this._editorHintId = id;
        /** Editing mode activated. You can now modify an existing ontology or create a new one via the <em>ontology</em> menu. You can save any ontology using the <em>export</em> menu (and exporting it as TTL file).**/
        generalHint.node().innerHTML += "Editing mode activated.<br>" +
            "You can now modify an existing ontology or create a new one via the <em>ontology</em> menu.<br>" +
            "You can save any ontology using the <em>export</em> menu (and exporting it as TTL file).";
        generalHint.style("padding", "5px");
        generalHint.style("line-height", "1.2em");
        generalHint.style("font-size", "1.2em");

        const ul = warningContainer.append('ul');
        ul.append('li').node().innerHTML = "Create a class with <b>double click / tap</b> on empty canvas area.";
        ul.append('li').node().innerHTML = "Edit names with <b>double click / tap</b> on element.</li>";
        ul.append('li').node().innerHTML = "Selection of default constructors is provided in the left sidebar.";
        ul.append('li').node().innerHTML = "Additional editing functionality is provided in the right sidebar.";

        const _this = this
        const gotItButton = warningContainer.append("label");
        gotItButton.node().id = "killWarningErrorMessages_" + id;
        gotItButton.node().innerHTML = "Got It";
        // @ts-ignore
        gotItButton.on("click", function () { _this.#closeMessage(this.id) });

        moduleContainer.classed("hidden", false);
        moduleContainer.style("-webkit-animation-name", "warn_ExpandAnimation");
        moduleContainer.style("-webkit-animation-duration", "0.5s");
    }

    // NOTE: Disabled to save memory while this method is not used
    // /**
    //  * @param {string | number} id
    //  */
    // #showMessage (id) {
    //     const moduleContainer = this._messageContainers[id];
    //     moduleContainer.classed("hidden", false);
    //     moduleContainer.style("-webkit-animation-name", "warn_ExpandAnimation");
    //     moduleContainer.style("-webkit-animation-duration", "0.5s");
    // }

    /**
     * @param {string} id
     */
    #closeMessage(id) {
        const nId = id && id.indexOf("_") !== -1 ? id.split("_")[1] : id

        this._visibleStatus[nId] = false;
        // get module;
        const moduleContainer = this._messageContainers[nId];
        moduleContainer.style("-webkit-animation-name", "warn_CollapseAnimation");
        moduleContainer.style("-webkit-animation-duration", "0.5s");

        const m_height = moduleContainer.node().getBoundingClientRect().height;

        // find my id in the children
        const pNode = moduleContainer.node().parentNode;

        const followingChildren = [];
        const pChild = pNode.children;
        const pChild_len = pChild.length;
        const containerId = moduleContainer.node().id;
        let found_me = false;
        for (let i = 0; i < pChild_len; i++) {
            if (found_me === true) {
                followingChildren.push(pChild[i].id);
            }
            if (containerId === pChild[i].id) {
                found_me = true;
            }
        }

        const _this = this
        for (let fc = 0; fc < followingChildren.length; fc++) {
            const child = d3.select("#" + followingChildren[fc]);
            // get the document style and overwrite it;
            const superCss = document.styleSheets[this.styleSelectorIndex].cssRules[this.cssStyleIndex];
            try {
                // remove the existing 0% and 100% rules
                superCss.deleteRule("0%");
                superCss.deleteRule("100%");

                superCss.appendRule("0%   {top: 0;}");
                superCss.appendRule("100% {top: -" + m_height + "px;");
            } catch (error) {
                console.error(error)
            }

            child.style("-webkit-animation-name", "msg_CollapseAnimation");
            child.style("-webkit-animation-duration", "0.5s");
            // @ts-ignore
            child.node().addEventListener("animationend", function () { _this.#_child_animationEnd(this) });
        }
    }

    /**
     * @param {any} element
     */
    #_child_animationEnd(element) {
        const _this = this;
        const c = d3.select(element);
        c.style("-webkit-animation-name", "");
        c.style("-webkit-animation-duration", "");
        // @ts-ignore
        c.node().removeEventListener("animationend", function () { _this.#_child_animationEnd(this) });
    }

    closeFilterHint() {
        const filterHint = this._messageContainers[this._filterHintId]
        if (filterHint) {
            filterHint.classed("hidden", true);
            filterHint.remove();
            this._messageContainers[this._filterHintId] = null;
            this._messageContext[this._filterHintId] = null;
            this._visibleStatus[this._filterHintId] = false;
        }
    }

    showEditorHint() {
        const id = this.addMessageBox();
        this.createMessageContext(id);
    }

    showExporterWarning() {
        this.showWarning(
            "Can not export ontology",
            "Detected unsupported ontology axioms, (e.g. owl:Union)",
            "Ontology is not exported",
            1,
            undefined
        );
    }

    /**
     * @param {string} header
     * @param {string} reason
     * @param {string} action
     * @param {(arg0: any, arg1: any, arg2: any, arg3: any) => void} callback
     * @param {any[]} parameterArray
     */
    responseWarning(header, reason, action, callback, parameterArray) {
        const id = this.addMessageBox();
        const warningContainer = this._messageContext[id];
        const moduleContainer = this._messageContainers[id];
        this._visibleStatus[id] = true;
        d3.select("#blockGraphInteractions").classed("hidden", false);
        const graphWidth = 0.5 * this.graph.options().width();

        if (header.length > 0) {
            const head = warningContainer.append("div");
            head.style("padding", "5px");

            const titleHeader = head.append("div");
            // some classes
            titleHeader.style("display", "inline-flex");
            titleHeader.node().innerHTML = "<b>Warning:</b>";
            titleHeader.style("padding-right", "3px");

            const msgHeader = head.append("div");
            // some classes
            msgHeader.style("display", "inline-flex");
            msgHeader.style("max-width", graphWidth + "px");
            msgHeader.node().innerHTML = header;
        }
        if (reason.length > 0) {
            const reasonContainer = warningContainer.append("div");
            reasonContainer.style("padding", "5px");
            const reasonHeader = reasonContainer.append("div");
            // some classes
            reasonHeader.style("display", "inline-flex");
            reasonHeader.style("padding-right", "3px");
            reasonHeader.node().innerHTML = "<b>Reason:</b>";

            const msgReason = reasonContainer.append("div");
            // some classes
            msgReason.style("display", "inline-flex");
            msgReason.style("max-width", graphWidth + "px");
            msgReason.node().innerHTML = reason;
        }
        if (action.length > 0) {
            const actionContainer = warningContainer.append("div");
            actionContainer.style("padding", "5px");

            const actionHeader = actionContainer.append("div");
            // some classes
            actionHeader.style("display", "inline-flex");
            actionHeader.style("padding-right", "8px");
            actionHeader.node().innerHTML = "<b>Action:</b>";

            const msgAction = actionContainer.append("div");
            // some classes
            msgAction.style("display", "inline-flex");
            msgAction.style("max-width", graphWidth + "px");
            msgAction.node().innerHTML = action;
        }
        const _this = this
        const gotItButton = warningContainer.append("label");
        gotItButton.node().id = "killWarningErrorMessages_" + id;
        gotItButton.node().innerHTML = "Continue";
        gotItButton.on("click", function () {
            // @ts-ignore
            _this.#closeMessage(this.id);
            d3.select("#blockGraphInteractions").classed("hidden", true);
            callback(parameterArray[0], parameterArray[1], parameterArray[2], parameterArray[3]);
        });
        warningContainer.append("span").node().innerHTML = "|";
        const cancelButton = warningContainer.append("label");
        cancelButton.node().id = "cancelButton_" + id;
        cancelButton.node().innerHTML = "Cancel";
        cancelButton.on("click", function () {
            // @ts-ignore
            _this.#closeMessage(this.id);
            d3.select("#blockGraphInteractions").classed("hidden", true);
        });
        moduleContainer.classed("hidden", false);
        moduleContainer.style("-webkit-animation-name", "warn_ExpandAnimation");
        moduleContainer.style("-webkit-animation-duration", "0.5s");
    }

    showFilterHint() {
        const id = this.addMessageBox();
        const warningContainer = this._messageContext[id];
        const moduleContainer = this._messageContainers[id];
        this._visibleStatus[id] = true;
        this._filterHintId = id;

        const generalHint = warningContainer.append('div');
        /** Editing mode activated. You can now modify an existing ontology or create a new one via the <em>ontology</em> menu. You can save any ontology using the <em>export</em> menu (and exporting it as TTL file).**/
        generalHint.node().innerHTML = "Collapsing filter activated.<br>" +
            "The number of visualized elements has been automatically reduced.<br>" +
            "Use the degree of collapsing slider in the <em>filter</em> menu to adjust the visualization.<br><br>" +
            "<em>Note:</em> A performance decrease could be experienced with a growing amount of visual elements in the graph.";
        generalHint.style("padding", "5px");
        generalHint.style("line-height", "1.2em");
        generalHint.style("font-size", "1.2em");

        const _this = this
        const gotItButton = warningContainer.append("label");
        gotItButton.node().id = "killFilterMessages_" + id;
        gotItButton.node().innerHTML = "Got It";
        // @ts-ignore
        gotItButton.on("click", function () { _this.#closeMessage(this.id) });
        moduleContainer.classed("hidden", false);
        moduleContainer.style("-webkit-animation-name", "warn_ExpandAnimation");
        moduleContainer.style("-webkit-animation-duration", "0.5s");
    }

    showMultiFileUploadWarning() {
        const id = this.addMessageBox();
        const warningContainer = this._messageContext[id];
        const moduleContainer = this._messageContainers[id];
        this._visibleStatus[id] = true;
        this._filterHintId = id;

        const generalHint = warningContainer.append('div');
        generalHint.node().innerHTML = "Uploading multiple files is not supported.<br>";
        generalHint.style("padding", "5px");
        generalHint.style("line-height", "1.2em");
        generalHint.style("font-size", "1.2em");

        const _this = this
        const gotItButton = warningContainer.append("label");
        gotItButton.node().id = "killFilterMessages_" + id;
        gotItButton.node().innerHTML = "Got It";
        // @ts-ignore
        gotItButton.on("click", function () { _this.#closeMessage(this.id) });
        moduleContainer.classed("hidden", false);
        moduleContainer.style("-webkit-animation-name", "warn_ExpandAnimation");
        moduleContainer.style("-webkit-animation-duration", "0.5s");
    }

    /**
     * @param {string} header
     * @param {string} reason
     * @param {string} action
     * @param {number} type
     * @param {BaseElement | undefined} element
     */
    showWarning(header, reason, action, type, element) {
        const id = this.addMessageBox();
        const warningContainer = this._messageContext[id];
        const moduleContainer = this._messageContainers[id];
        this._visibleStatus[id] = true;

        // add new one;
        const graphWidth = 0.5 * this.graph.options().width();

        if (header.length > 0) {
            const head = warningContainer.append("div");
            head.style("padding", "5px");

            const titleHeader = head.append("div");
            // some classes
            titleHeader.style("display", "inline-flex");
            titleHeader.node().innerHTML = "<b>Warning:</b>";
            titleHeader.style("padding-right", "3px");

            const msgHeader = head.append("div");
            // some classes
            msgHeader.style("display", "inline-flex");
            msgHeader.style("max-width", graphWidth + "px");
            msgHeader.node().innerHTML = header;
        }
        if (reason.length > 0) {
            const reasonContainer = warningContainer.append("div");
            reasonContainer.style("padding", "5px");

            const reasonHeader = reasonContainer.append("div");
            // some classes
            reasonHeader.style("display", "inline-flex");
            reasonHeader.style("padding-right", "3px");
            reasonHeader.node().innerHTML = "<b>Reason:</b>";

            const msgReason = reasonContainer.append("div");
            // some classes
            msgReason.style("display", "inline-flex");
            msgReason.style("max-width", graphWidth + "px");
            msgReason.node().innerHTML = reason;
        }
        if (action.length > 0) {
            const actionContainer = warningContainer.append("div");
            actionContainer.style("padding", "5px");

            const actionHeader = actionContainer.append("div");
            // some classes
            actionHeader.style("display", "inline-flex");
            actionHeader.style("padding-right", "8px");
            actionHeader.node().innerHTML = "<b>Action:</b>";

            const msgAction = actionContainer.append("div");
            // some classes
            msgAction.style("display", "inline-flex");
            msgAction.style("max-width", graphWidth + "px");
            msgAction.node().innerHTML = action;
        }

        const _this = this
        let gotItButton;
        if (type === 1) {
            gotItButton = warningContainer.append("label");
            gotItButton.node().id = "killWarningErrorMessages_" + id;
            gotItButton.node().innerHTML = "Got It";
            // @ts-ignore
            gotItButton.on("click", function () { _this.#closeMessage(this.id) });
        }

        if (type === 2) {
            gotItButton = warningContainer.append("label");
            gotItButton.node().id = "killWarningErrorMessages_" + id;
            gotItButton.node().innerHTML = "Got It";
            // @ts-ignore
            gotItButton.on("click", function () { _this.#closeMessage(this.id) });
            warningContainer.append("span").node().innerHTML = "|";

            const zoomToElementButton = warningContainer.append("label");
            zoomToElementButton.node().id = "zoomElementThing_" + id;
            zoomToElementButton.node().innerHTML = "Zoom to element ";

            warningContainer.append("span").node().innerHTML = "|";

            const ShowElementButton = warningContainer.append("label");
            ShowElementButton.node().id = "showElementThing_" + id;
            ShowElementButton.node().innerHTML = "Indicate element";

            if (element !== undefined) {
                zoomToElementButton.on("click", () => {
                    // assume the additional Element is for halo;
                    this.graph.zoomToElementInGraph(element);
                });
                ShowElementButton.on("click", () => {
                    // assume the additional Element is for halo;
                    if (element.halo === false) {
                        element.drawHalo();
                        this.graph.updatePulseIds([element.id]);
                    } else {
                        element.removeHalo();
                        element.drawHalo();
                        this.graph.updatePulseIds([element.id]);
                    }
                });
            }
        }
        moduleContainer.classed("hidden", false);
        moduleContainer.style("-webkit-animation-name", "warn_ExpandAnimation");
        moduleContainer.style("-webkit-animation-duration", "0.5s");
        moduleContainer.classed("hidden", false);
    }
}