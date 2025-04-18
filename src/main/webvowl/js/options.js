import { PrefixTools } from "./util/prefixTools"


class InitialConfig {
    constructor() {
        this.sidebar = "1"
        this.doc = -1
        this.cd = 200
        this.dd = 120
        this.editorMode = "false"
        this.filter_datatypes = "false"
        this.filter_objectProperties = "false"
        this.filter_sco = "false"
        this.filter_disjoint = "true"
        this.filter_setOperator = "false"
        this.mode_dynamic = "true"
        this.mode_scaling = "true"
        this.mode_compact = "false"
        this.mode_colorExt = "true"
        this.mode_multiColor = "false"
        this.mode_pnp = "false"
        this.debugFeatures = "false"
        this.rect = 0
    }
}

class DefaultOptionsConfig {
    constructor() {
        this.sidebar = "1"
        this.doc = -1
        this.cd = 200
        this.dd = 120
        this.editorMode = "false"
        this.filter_datatypes = "false"
        this.filter_objectProperties = "false"
        this.filter_sco = "false"
        this.filter_disjoint = "true"
        this.filter_setOperator = "false"
        this.mode_dynamic = "true"
        this.mode_scaling = "true"
        this.mode_compact = "false"
        this.mode_colorExt = "true"
        this.mode_multiColor = "false"
        this.mode_pnp = "false"
        this.debugFeatures = "false"
        this.rect = 0
    }
}

export class Options {
    /**
     * @param {any} graph
     */
    constructor(graph) {
        this.graph = graph
        this.metadataObject = {}
        this.generalOntologyMetaData = {}
        this.data = undefined
        this.graphContainerSelector = undefined
        this.classDistance = 200
        this.datatypeDistance = 120
        this.loopDistance = 150
        this.charge = -500
        this.gravity = 0.025
        this.linkStrength = 1
        this.height = 600
        this.width = 800
        this.maxLabelWidth = 120
        this.selectionModules = []
        this.minMagnification = 0.01
        this.maxMagnification = 4
        this.compactNotation = false
        this.dynamicLabelWidth = true
        this.scaleNodesByIndividuals = true
        this.useAccuracyHelper = true
        this.showRenderingStatistic = true
        this.showInputModality = false
        this.hideDebugOptions = true
        this.rectangularRep = false
        this.drawPropertyDraggerOnHover = true
        this.showDraggerObject = false

        // Configs
        this.initialConfig = new InitialConfig()
        this._defaultConfig = new DefaultOptionsConfig()

        // Filters
        this.filterModules = []
        this.literalFilter = undefined
        this.datatypeFilter = undefined
        this.subclassFilter = undefined
        this.setOperatorFilter = undefined
        this.disjointPropertyFilter = undefined
        this.objectPropertyFilter = undefined
        this.nodeDegreeFilter = undefined
        this.colorExternalsModule = undefined
        this.compactNotationModule = undefined

        // Menus
        this.gravityMenu = undefined
        this.filterMenu = undefined
        this.loadingModule = undefined
        this.modeMenu = undefined
        this.pauseMenu = undefined
        this.resetMenu = undefined
        this.searchMenu = undefined
        this.ontologyMenu = undefined
        this.sidebar = undefined
        this.leftSidebar = undefined
        this.editSidebar = undefined
        this.navigationMenu = undefined
        this.exportMenu = undefined
        this.zoomSlider = undefined
        this.warningModule = undefined
        this.directInputModule = undefined
        this.debugMenu = undefined

        // Misc
        this.prefixModule = undefined
        this.focuserModule = undefined
        this.pickAndPinModule = undefined

        // Supported types
        this.supportedDatatypes = ["rdfs:Literal", "xsd:boolean", "xsd:double", "xsd:integer", "xsd:string", "undefined"]
        this.supportedClasses = ["owl:Thing", "owl:Class", "owl:DeprecatedClass"]
        this.supportedProperties = [
            "owl:objectProperty",
            "rdfs:subClassOf",
            "owl:disjointWith",
            "owl:allValuesFrom",
            "owl:someValuesFrom"
        ]
        this.prefixList = {
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
            owl: 'http://www.w3.org/2002/07/owl#',
            xsd: 'http://www.w3.org/2001/XMLSchema#',
            dc: 'http://purl.org/dc/elements/1.1/#',
            xml: 'http://www.w3.org/XML/1998/namespace'
        }
    }

    get defaultConfig() {
        this.#updateConfigObject();
        return this._defaultConfig;
    }

    get rectangularRepresentation() {
        return this.rectangularRep
    }

    set rectangularRepresentation(val) {
        this.rectangularRep = Boolean(parseInt(val))
    }

    clearGeneralMetaObject() {
        this.generalOntologyMetaData = {};
    }

    executeHiddenDebugFeatuers() {
        this.hideDebugOptions = !this.hideDebugOptions;
        d3.selectAll(".debugOption").classed("hidden", this.hideDebugOptions);
        if (!this.hideDebugOptions) {
            this.graph.setForceTickFunctionWithFPS();
        }
        else {
            this.graph.setDefaultForceTickFunction();
        }
        if (this.debugMenu) {
            this.debugMenu.updateSettings();
        }
        this.setHideDebugFeaturesForDefaultObject(this.hideDebugOptions);
    }

    /**
     * @param {PropertyKey} property
     * @param {string} value
     */
    addOrUpdateGeneralObjectEntry(property, value) {
        if (this.generalOntologyMetaData.hasOwnProperty(property)) {
            //console.log("Updating Property:"+ property);
            if (property === "iri") {
                if (!PrefixTools.validURL(value)) {
                    this.warningModule.showWarning(
                        "Invalid Ontology IRI",
                        "Input IRI does not represent an URL",
                        "Restoring previous IRI for ontology",
                        1,
                        undefined
                    );
                    return false;
                }
            }
            this.generalOntologyMetaData[property] = value;
        } else {
            this.generalOntologyMetaData[property] = value;
        }
        return true;
    }

    /**
     * @param {PropertyKey} property
     */
    getGeneralMetaObjectProperty(property) {
        if (this.generalOntologyMetaData.hasOwnProperty(property)) {
            return this.generalOntologyMetaData[property];
        }
    }

    /**
     * @param {PropertyKey} property
     * @param {any} value
     */
    addOrUpdateMetaObjectEntry(property, value) {
        if (this.metadataObject.hasOwnProperty(property)) {
            this.metadataObject[property] = value;
        } else {
            this.metadataObject[property] = value;
        }
    }

    /**
     * @param {PropertyKey} property
     */
    getMetaObjectProperty(property) {
        if (this.metadataObject.hasOwnProperty(property)) {
            return this.metadataObject[property];
        }
    }

    /**
     * @param {string | number} prefix
     * @param {any} url
     */
    addPrefix(prefix, url) {
        this.prefixList[prefix] = url;
    }

    /**
     * @param {string | number} oldPrefix
     * @param {PropertyKey} newPrefix
     * @param {any} oldURL
     * @param {string} newURL
     */
    updatePrefix(oldPrefix, newPrefix, oldURL, newURL) {
        if (oldPrefix === newPrefix && oldURL === newURL) {
            return true;
        }
        if (oldPrefix === newPrefix && oldURL !== newURL && PrefixTools.validURL(newURL)) {
            this.prefixList[oldPrefix] = newURL;
        } else if (oldPrefix === newPrefix && oldURL !== newURL && !PrefixTools.validURL(newURL)) {
            if (!PrefixTools.validURL(newURL)) {
                this.warningModule.showWarning(
                    "Invalid Prefix IRI",
                    "Input IRI does not represent an IRI",
                    "You should enter a valid IRI in form of a URL",
                    1,
                    undefined
                );
                return false;
            }
            return false;
        }
        if (oldPrefix !== newPrefix && PrefixTools.validURL(newURL)) {
            // sanity check
            if (this.prefixList.hasOwnProperty(newPrefix)) {
                //  console.log("Already have this prefix!");
                this.warningModule.showWarning(
                    "Prefix Already Exist",
                    "Prefix: " + newPrefix + " is already defined",
                    "You should use an other one",
                    1,
                    undefined
                );
                return false;
            }
            this.removePrefix(oldPrefix);
            this.addPrefix(newPrefix, newURL);
            this.editSidebar.updateEditDeleteButtonIds(oldPrefix, newPrefix);
            return true;
        }
        if (!PrefixTools.validURL(newURL)) {
            this.warningModule.showWarning(
                "Invalid Prefix IRI",
                "Input IRI does not represent an URL",
                "You should enter a valid URL",
                1,
                undefined
            );
        }
        return false;
    }

    /**
     * @param {string | number} prefix
     */
    removePrefix(prefix) {
        delete this.prefixList[prefix];
    }

    /**
     * @param {any} val
     */
    setEditorModeForDefaultObject(val) {
        this._defaultConfig.editorMode = String(val);
    }

    /**
     * @param {boolean} val
     */
    setHideDebugFeaturesForDefaultObject(val) {
        this._defaultConfig.debugFeatures = String(!val);
    }

    #updateConfigObject() {
        this._defaultConfig.sidebar = this.sidebar.getSidebarVisibility();
        this._defaultConfig.cd = this.classDistance;
        this._defaultConfig.dd = this.datatypeDistance;
        this._defaultConfig.filter_datatypes = String(this.filterMenu.getCheckBoxValue("datatypeFilterCheckbox"));
        this._defaultConfig.filter_sco = String(this.filterMenu.getCheckBoxValue("subclassFilterCheckbox"));
        this._defaultConfig.filter_disjoint = String(this.filterMenu.getCheckBoxValue("disjointFilterCheckbox"));
        this._defaultConfig.filter_setOperator = String(this.filterMenu.getCheckBoxValue("setoperatorFilterCheckbox"));
        this._defaultConfig.filter_objectProperties = String(this.filterMenu.getCheckBoxValue("objectPropertyFilterCheckbox"));
        this._defaultConfig.mode_dynamic = String(this.dynamicLabelWidth);
        this._defaultConfig.mode_scaling = String(this.modeMenu.getCheckBoxValue("nodescalingModuleCheckbox"));
        this._defaultConfig.mode_compact = String(this.modeMenu.getCheckBoxValue("compactnotationModuleCheckbox"));
        this._defaultConfig.mode_colorExt = String(this.modeMenu.getCheckBoxValue("colorexternalsModuleCheckbox"));
        this._defaultConfig.mode_multiColor = String(this.modeMenu.colorModeState());
        this._defaultConfig.mode_pnp = String(this.modeMenu.getCheckBoxValue("pickandpinModuleCheckbox"));
        this._defaultConfig.rect = 0;
    }

    /**
     * define url loadable options and update all set values in the default object
     * @param {DefaultOptionsConfig} opts
     * @param {boolean} changeEditFlag
     */
    setOptionsFromURL(opts, changeEditFlag) {
        if (opts.sidebar !== undefined) {
            this.sidebar.showSidebar(parseInt(opts.sidebar), true);
        }
        if (opts.doc) {
            var asInt = parseInt(opts.doc);
            this.filterMenu.setDegreeSliderValue(asInt);
            this.graph.setGlobalDOF(asInt);
            // reset the value to be -1;
            this.defaultConfig.doc = -1;
        }
        if (opts.editorMode) {
            const settingFlag = opts.editorMode === "true"
            d3.select("#editorModeModuleCheckbox").node().checked = settingFlag;
            if (changeEditFlag) {
                this.graph.editorMode(settingFlag);
            }
            // update config object
            this.defaultConfig.editorMode = opts.editorMode;
        }
        if (opts.cd) { // class distance
            this.classDistance = opts.cd; // class distance
            this.defaultConfig.cd = opts.cd;
        }
        if (opts.dd) { // data distance
            this.datatypeDistance = opts.dd;
            this.defaultConfig.cd = opts.cd;
        }
        if (opts.cd || opts.dd) {
            this.gravityMenu.reset(); // reset the values so the slider is updated;
        }
        if (opts.filter_datatypes) {
            const settingFlag = opts.filter_datatypes === "true"
            this.filterMenu.setCheckBoxValue("datatypeFilterCheckbox", settingFlag);
            this.defaultConfig.filter_datatypes = opts.filter_datatypes;
        }
        if (opts.debugFeatures) {
            this.hideDebugOptions = opts.debugFeatures === "true";
            if (!this.hideDebugOptions) {
                this.executeHiddenDebugFeatuers();
            }
            this.defaultConfig.debugFeatures = opts.debugFeatures;
        }
        if (opts.filter_objectProperties) {
            const settingFlag = opts.filter_objectProperties === "true"
            this.filterMenu.setCheckBoxValue("objectPropertyFilterCheckbox", settingFlag);
            this.defaultConfig.filter_objectProperties = opts.filter_objectProperties;
        }
        if (opts.filter_sco) {
            const settingFlag = opts.filter_sco === "true"
            this.filterMenu.setCheckBoxValue("subclassFilterCheckbox", settingFlag);
            this.defaultConfig.filter_sco = opts.filter_sco;
        }
        if (opts.filter_disjoint) {
            const settingFlag = opts.filter_disjoint === "true"
            this.filterMenu.setCheckBoxValue("disjointFilterCheckbox", settingFlag);
            this.defaultConfig.filter_disjoint = opts.filter_disjoint;
        }
        if (opts.filter_setOperator) {
            const settingFlag = opts.filter_setOperator === "true"
            this.filterMenu.setCheckBoxValue("setoperatorFilterCheckbox", settingFlag);
            this.defaultConfig.filter_setOperator = opts.filter_setOperator;
        }
        this.filterMenu.updateSettings();

        // modesMenu
        if (opts.mode_dynamic) {
            const settingFlag = opts.mode_dynamic === "true"
            this.modeMenu.setDynamicLabelWidth(settingFlag);
            this.dynamicLabelWidth = settingFlag;
            this.defaultConfig.mode_dynamic = opts.mode_dynamic;
        }
        if (opts.mode_pnp) {
            const settingFlag = opts.mode_pnp === "true"
            this.modeMenu.setCheckBoxValue("pickandpinModuleCheckbox", settingFlag);
            this.defaultConfig.mode_pnp = opts.mode_pnp;
        }
        if (opts.mode_scaling) {
            const settingFlag = opts.mode_scaling === "true"
            this.modeMenu.setCheckBoxValue("nodescalingModuleCheckbox", settingFlag);
            this.defaultConfig.mode_scaling = opts.mode_scaling;
        }
        if (opts.mode_compact) {
            const settingFlag = opts.mode_compact === "true"
            this.modeMenu.setCheckBoxValue("compactnotationModuleCheckbox", settingFlag);
            this.defaultConfig.mode_compact = opts.mode_compact;
        }
        if (opts.mode_colorExt) {
            const settingFlag = opts.mode_colorExt === "true"
            this.modeMenu.setCheckBoxValue("colorexternalsModuleCheckbox", settingFlag);
            this.defaultConfig.mode_colorExt = opts.mode_colorExt;
        }
        if (opts.mode_multiColor) {
            const settingFlag = opts.mode_multiColor === "true"
            this.modeMenu.setColorSwitchStateUsingURL(settingFlag);
            this.defaultConfig.mode_multiColor = opts.mode_multiColor;
        }
        this.modeMenu.updateSettingsUsingURL();
        this.rectangularRepresentation = opts.rect;
    }
}