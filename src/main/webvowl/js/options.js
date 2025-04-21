import DirectInputModule from "../../app/js/directInputModule"
import EditSidebar from "../../app/js/editSidebar"
import LeftSideBar from "../../app/js/leftSidebar"
import ConfigMenu from "../../app/js/menu/configMenu"
import DebugMenu from "../../app/js/menu/debugMenu"
import ExportMenu from "../../app/js/menu/exportMenu"
import FilterMenu from "../../app/js/menu/filterMenu"
import GravityMenu from "../../app/js/menu/gravityMenu"
import ModeMenu from "../../app/js/menu/modeMenu"
import NavigationMenu from "../../app/js/menu/navigationMenu"
import OntologyMenu from "../../app/js/menu/ontologyMenu"
import PauseMenu from "../../app/js/menu/pauseMenu"
import ResetMenu from "../../app/js/menu/resetMenu"
import SearchMenu from "../../app/js/menu/searchMenu"
import ZoomSlider from "../../app/js/menu/zoomSlider"
import OntologyLoading from "../../app/js/ontologyLoading"
import SideBar from "../../app/js/sidebar"
import WarningModule from "../../app/js/warningModule"
import Graph from "./graph"
import ColorExternalsSwitch from "./modules/filters/colorExternalsSwitch"
import CompactNotationSwitch from "./modules/filters/compactNotationSwitch"
import DataTypeFilter from "./modules/filters/datatypeFilter"
import DisjointFilter from "./modules/filters/disjointFilter"
import EmptyLiteralFilter from "./modules/filters/emptyLiteralFilter"
import NodeDegreeFilter from "./modules/filters/nodeDegreeFilter"
import NodeScalingSwitch from "./modules/filters/nodeScalingSwitch"
import ObjectPropertyFilter from "./modules/filters/objectPropertyFilter"
import SetOperatorFilter from "./modules/filters/setOperatorFilter"
import Statistics from "./modules/filters/statistics"
import SubclassFilter from "./modules/filters/subclassFilter"
import Focuser from "./modules/focuser"
import PickAndPin from "./modules/pickAndPin"
import SelectionDetailsDisplayer from "./modules/selectionDetailsDisplayer"
import PrefixTools from "./util/prefixTools"

export class UntouchedOptions {
    constructor() {
        this.classDistance = 200
        this.datatypeDistance = 120
        this.loopDistance = 150
        this.charge = -500
        this.gravity = 0.025
        this.linkStrength = 1
        this.height = 600
        this.width = 800
        this.maxLabelWidth = 120
        this.minMagnification = 0.01
        this.maxMagnification = 4
        this.compactNotation = false
        this.dynamicLabelWidth = true
        this.scaleNodesByIndividuals = true
        this.useAccuracyHelper = true
        this.showRenderingStatistic = true
        this.showInputModality = false
        this.hideDebugOptions = true
        this.rectangularRepresentation = false
        this.drawPropertyDraggerOnHover = true
        this.showDraggerObject = false
    }
}

class DefaultOptionsConfig {
    constructor() {
        this.sidebar = false
        this.doc = -1 // Degree of collapse
        this.cd = 200
        this.dd = 120
        this.editorMode = false
        this.filter_datatypes = false
        this.filter_objectProperties = false
        this.filter_sco = false
        this.filter_disjoint = true
        this.filter_setOperator = false
        this.mode_dynamic = true
        this.mode_scaling = true
        this.mode_compact = false
        this.mode_colorExt = true
        this.mode_multiColor = false
        this.mode_pnp = false
        this.debugFeatures = false
        this.rect = 0
    }
}

class InitialConfig extends DefaultOptionsConfig {
    constructor() {
        super()
    }
}

export default class Options {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        this.graph = graph
        /**
         * @type {Map<PropertyKey,string>}
         */
        this.metadataObject = new Map()
        /**
         * @type {Map<PropertyKey,string>}
         */
        this.generalOntologyMetaData = new Map()
        /**
         * @type {any}
         */
        this.data = undefined
        /**
         * @type {string | undefined}
         */
        this.graphContainerSelector = undefined

        const untouched = new UntouchedOptions()

        this.classDistance = untouched.classDistance
        this.datatypeDistance = untouched.datatypeDistance
        this.loopDistance = untouched.loopDistance
        this.charge = untouched.charge
        this.gravity = untouched.gravity
        this.linkStrength = untouched.linkStrength
        this.height = untouched.height
        this.width = untouched.width
        this.maxLabelWidth = untouched.maxLabelWidth
        this.minMagnification = untouched.minMagnification
        this.maxMagnification = untouched.maxMagnification
        this.compactNotation = untouched.compactNotation
        this.dynamicLabelWidth = untouched.dynamicLabelWidth
        this.scaleNodesByIndividuals = untouched.scaleNodesByIndividuals
        this.useAccuracyHelper = untouched.useAccuracyHelper
        this.showRenderingStatistic = untouched.showRenderingStatistic
        this.showInputModality = untouched.showInputModality
        this.hideDebugOptions = untouched.hideDebugOptions
        this.rectangularRepresentation = untouched.rectangularRepresentation
        this.drawPropertyDraggerOnHover = untouched.drawPropertyDraggerOnHover
        this.showDraggerObject = untouched.showDraggerObject

        // Configs
        this.initialConfig = new InitialConfig()
        this._defaultConfig = new DefaultOptionsConfig()

        // Menus
        this.gravityMenu = new GravityMenu(this.graph)
        this.filterMenu = new FilterMenu(this.graph)
        this.loadingModule = new OntologyLoading(this.graph)
        this.modeMenu = new ModeMenu(this.graph)
        this.pauseMenu = new PauseMenu(this.graph)
        this.resetMenu = new ResetMenu(this.graph)
        this.searchMenu = new SearchMenu(this.graph)
        this.ontologyMenu = new OntologyMenu(this.graph)
        this.sidebar = new SideBar()
        this.leftSidebar = new LeftSideBar(this.graph)
        this.editSidebar = new EditSidebar(this.graph)
        this.navigationMenu = new NavigationMenu(this.graph)
        this.exportMenu = new ExportMenu(this.graph)
        this.zoomSlider = new ZoomSlider(this.graph)
        this.warningModule = new WarningModule()
        this.directInputModule = new DirectInputModule(this.graph)
        this.debugMenu = new DebugMenu(this.graph)
        this.configMenu = new ConfigMenu(this.graph)

        // Filters
        this.emptyLiteralFilter = new EmptyLiteralFilter()
        this.datatypeFilter = new DataTypeFilter()
        this.subclassFilter = new SubclassFilter()
        this.setOperatorFilter = new SetOperatorFilter()
        this.disjointPropertyFilter = new DisjointFilter()
        this.objectPropertyFilter = new ObjectPropertyFilter()
        this.nodeDegreeFilter = new NodeDegreeFilter(this.filterMenu)
        this.colorExternalsModule = new ColorExternalsSwitch()
        this.compactNotationModule = new CompactNotationSwitch(this.graph)
        this.nodeScalingModule = new NodeScalingSwitch(this.graph)
        this.statistics = new Statistics()
        this.filterModules = [
            this.emptyLiteralFilter,
            this.datatypeFilter,
            this.subclassFilter,
            this.setOperatorFilter,
            this.disjointPropertyFilter,
            this.objectPropertyFilter,
            this.nodeDegreeFilter,
            this.colorExternalsModule,
            this.compactNotation,
            this.nodeScalingModule,
            this.statistics,
        ]

        // Misc
        this.focuserModule = new Focuser(this.graph)
        this.pickAndPinModule = new PickAndPin()
        this.selectionDetailDisplayer = new SelectionDetailsDisplayer(
            this.sidebar.updateSelectionInformation,
        )
        this.selectionModules = [
            this.focuserModule,
            this.pickAndPinModule,
            this.selectionDetailDisplayer,
        ]

        // Supported types
        this.supportedDatatypes = [
            "rdfs:Literal",
            "xsd:boolean",
            "xsd:double",
            "xsd:integer",
            "xsd:string",
            "undefined",
        ]
        this.supportedClasses = [
            "owl:Thing",
            "owl:Class",
            "owl:DeprecatedClass",
        ]
        this.supportedProperties = [
            "owl:objectProperty",
            "rdfs:subClassOf",
            "owl:disjointWith",
            "owl:allValuesFrom",
            "owl:someValuesFrom",
        ]
        const prefixes = {
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            owl: "http://www.w3.org/2002/07/owl#",
            xsd: "http://www.w3.org/2001/XMLSchema#",
            dc: "http://purl.org/dc/elements/1.1/#",
            xml: "http://www.w3.org/XML/1998/namespace",
        }
        this.prefixList = new Map(Object.entries(prefixes))
    }

    get defaultConfig() {
        this.#updateConfigObject()
        return this._defaultConfig
    }

    clearGeneralMetaObject() {
        this.generalOntologyMetaData.clear()
    }

    /**
     * @param {Function} loadingFunc
     */
    setup(loadingFunc) {
        this.exportMenu.setup()
        this.gravityMenu.setup()
        this.filterMenu.setup(
            this.datatypeFilter,
            this.objectPropertyFilter,
            this.subclassFilter,
            this.disjointPropertyFilter,
            this.setOperatorFilter,
            this.nodeDegreeFilter,
        )
        this.modeMenu.setup(
            this.pickAndPinModule,
            this.nodeScalingModule,
            this.compactNotationModule,
            this.colorExternalsModule,
        )
        this.pauseMenu.setup()
        this.sidebar.setup()
        this.loadingModule.setup([this.statistics, loadingFunc])
        this.leftSidebar.setup()
        this.editSidebar.setup()
        this.debugMenu.setup()
        this.resetMenu.setup([
            this.gravityMenu,
            this.filterMenu,
            this.modeMenu,
            this.focuserModule,
            this.selectionDetailDisplayer,
            this.pauseMenu,
        ])
        this.searchMenu.setup()
        this.navigationMenu.setup()
        this.zoomSlider.setup()
        this.ontologyMenu.setup()
        this.configMenu.setup()

        this.leftSidebar.showSidebar(false)
        this.leftSidebar.hideCollapseButton(true)
    }

    executeHiddenDebugFeatuers() {
        this.hideDebugOptions = !this.hideDebugOptions
        d3.selectAll(".debugOption").classed("hidden", this.hideDebugOptions)
        if (!this.hideDebugOptions) {
            this.graph.setForceTickFunctionWithFPS()
        } else {
            this.graph.setDefaultForceTickFunction()
        }
        if (this.debugMenu) {
            this.debugMenu.updateSettings()
        }
        this.setHideDebugFeaturesForDefaultObject(this.hideDebugOptions)
    }

    /**
     * @param {PropertyKey} property
     * @param {string} value
     */
    addOrUpdateGeneralObjectEntry(property, value) {
        if (this.generalOntologyMetaData.has(property)) {
            if (property === "iri") {
                if (!PrefixTools.validURL(value)) {
                    this.warningModule.showWarning(
                        "Invalid Ontology IRI",
                        "Input IRI does not represent an URL",
                        "Restoring previous IRI for ontology",
                        1,
                        undefined,
                    )
                    return false
                }
            }
        }
        this.generalOntologyMetaData.set(property, value)
        return true
    }

    /**
     * @param {PropertyKey} property
     */
    getGeneralMetaObjectProperty(property) {
        return this.generalOntologyMetaData.get(property)
    }

    /**
     * @param {PropertyKey} property
     * @param {string} value
     */
    addOrUpdateMetaObjectEntry(property, value) {
        this.metadataObject.set(property, value)
    }

    /**
     * @param {PropertyKey} property
     */
    getMetaObjectProperty(property) {
        return this.metadataObject.get(property)
    }

    /**
     * @param {string} prefix
     * @param {string} url
     */
    addPrefix(prefix, url) {
        this.prefixList.set(prefix, url)
    }

    /**
     * @param {string} oldPrefix
     * @param {string} newPrefix
     * @param {string} oldURL
     * @param {string} newURL
     */
    updatePrefix(oldPrefix, newPrefix, oldURL, newURL) {
        if (oldPrefix === newPrefix && oldURL === newURL) {
            return true
        }
        if (
            oldPrefix === newPrefix &&
            oldURL !== newURL &&
            PrefixTools.validURL(newURL)
        ) {
            this.prefixList.set(oldPrefix, newURL)
        } else if (
            oldPrefix === newPrefix &&
            oldURL !== newURL &&
            !PrefixTools.validURL(newURL)
        ) {
            if (!PrefixTools.validURL(newURL)) {
                this.warningModule.showWarning(
                    "Invalid Prefix IRI",
                    "Input IRI does not represent an IRI",
                    "You should enter a valid IRI in form of a URL",
                    1,
                    undefined,
                )
                return false
            }
            return false
        }
        if (oldPrefix !== newPrefix && PrefixTools.validURL(newURL)) {
            // sanity check
            if (this.prefixList.has(newPrefix)) {
                this.warningModule.showWarning(
                    "Prefix Already Exist",
                    "Prefix: " + newPrefix + " is already defined",
                    "You should use an other one",
                    1,
                    undefined,
                )
                return false
            }
            this.removePrefix(oldPrefix)
            this.addPrefix(newPrefix, newURL)
            this.editSidebar.updateEditDeleteButtonIds(oldPrefix, newPrefix)
            return true
        }
        if (!PrefixTools.validURL(newURL)) {
            this.warningModule.showWarning(
                "Invalid Prefix IRI",
                "Input IRI does not represent an URL",
                "You should enter a valid URL",
                1,
                undefined,
            )
        }
        return false
    }

    /**
     * @param {string} prefix
     */
    removePrefix(prefix) {
        this.prefixList.delete(prefix)
    }

    /**
     * @param {boolean} val
     */
    setEditorModeForDefaultObject(val) {
        this._defaultConfig.editorMode = val
    }

    /**
     * @param {boolean} val
     */
    setHideDebugFeaturesForDefaultObject(val) {
        this._defaultConfig.debugFeatures = !val
    }

    #updateConfigObject() {
        this._defaultConfig.sidebar = this.sidebar.getSidebarVisibility()
        this._defaultConfig.cd = this.classDistance
        this._defaultConfig.dd = this.datatypeDistance
        this._defaultConfig.filter_datatypes = this.filterMenu.getCheckBoxValue(
            "datatypeFilterCheckbox",
        )
        this._defaultConfig.filter_sco = this.filterMenu.getCheckBoxValue(
            "subclassFilterCheckbox",
        )
        this._defaultConfig.filter_disjoint = this.filterMenu.getCheckBoxValue(
            "disjointFilterCheckbox",
        )
        this._defaultConfig.filter_setOperator =
            this.filterMenu.getCheckBoxValue("setoperatorFilterCheckbox")
        this._defaultConfig.filter_objectProperties =
            this.filterMenu.getCheckBoxValue("objectPropertyFilterCheckbox")
        this._defaultConfig.mode_dynamic = this.dynamicLabelWidth
        this._defaultConfig.mode_scaling = this.modeMenu.getCheckBoxValue(
            "nodescalingModuleCheckbox",
        )
        this._defaultConfig.mode_compact = this.modeMenu.getCheckBoxValue(
            "compactnotationModuleCheckbox",
        )
        this._defaultConfig.mode_colorExt = this.modeMenu.getCheckBoxValue(
            "colorexternalsModuleCheckbox",
        )
        this._defaultConfig.mode_multiColor = this.modeMenu.colorModeState
        this._defaultConfig.mode_pnp = this.modeMenu.getCheckBoxValue(
            "pickandpinModuleCheckbox",
        )
        this._defaultConfig.rect = 0
    }

    /**
     * Define url loadable options and update all set values in the default object
     * @param {DefaultOptionsConfig} opts
     * @param {boolean} changeEditFlag
     */
    setOptionsFromURL(opts, changeEditFlag) {
        if (opts.sidebar !== undefined) {
            this.sidebar.showSidebar(opts.sidebar, true)
        }
        if (opts.doc) {
            this.filterMenu.setDegreeSliderValue(opts.doc)
            this.graph.global_dof = opts.doc
            // reset the value to be -1;
            this.defaultConfig.doc = -1
        }
        if (opts.editorMode) {
            const settingFlag = opts.editorMode
            d3.select("#editorModeModuleCheckbox").node().checked = settingFlag
            if (changeEditFlag) {
                this.graph.editorMode = settingFlag
            }
            // REVIEW: Check if we need to set values on this.defaultConfig
            // update config object
            // this.defaultConfig.editorMode = opts.editorMode;
        }
        if (opts.cd) {
            // class distance
            this.classDistance = opts.cd // class distance
            // this.defaultConfig.cd = opts.cd;
        }
        if (opts.dd) {
            // data distance
            this.datatypeDistance = opts.dd
            // this.defaultConfig.cd = opts.cd;
        }
        if (opts.cd || opts.dd) {
            this.gravityMenu.reset() // reset the values so the slider is updated;
        }
        if (opts.filter_datatypes) {
            const settingFlag = opts.filter_datatypes
            this.filterMenu.setCheckBoxValue(
                "datatypeFilterCheckbox",
                settingFlag,
            )
            // this.defaultConfig.filter_datatypes = opts.filter_datatypes;
        }
        if (opts.debugFeatures) {
            this.hideDebugOptions = opts.debugFeatures
            if (!this.hideDebugOptions) {
                this.executeHiddenDebugFeatuers()
            }
            // this.defaultConfig.debugFeatures = opts.debugFeatures;
        }
        if (opts.filter_objectProperties) {
            const settingFlag = opts.filter_objectProperties
            this.filterMenu.setCheckBoxValue(
                "objectPropertyFilterCheckbox",
                settingFlag,
            )
            // this.defaultConfig.filter_objectProperties = opts.filter_objectProperties;
        }
        if (opts.filter_sco) {
            const settingFlag = opts.filter_sco
            this.filterMenu.setCheckBoxValue(
                "subclassFilterCheckbox",
                settingFlag,
            )
            // this.defaultConfig.filter_sco = opts.filter_sco;
        }
        if (opts.filter_disjoint) {
            const settingFlag = opts.filter_disjoint
            this.filterMenu.setCheckBoxValue(
                "disjointFilterCheckbox",
                settingFlag,
            )
            // this.defaultConfig.filter_disjoint = opts.filter_disjoint;
        }
        if (opts.filter_setOperator) {
            const settingFlag = opts.filter_setOperator
            this.filterMenu.setCheckBoxValue(
                "setoperatorFilterCheckbox",
                settingFlag,
            )
            // this.defaultConfig.filter_setOperator = opts.filter_setOperator;
        }
        this.filterMenu.updateSettings()

        // modesMenu
        if (opts.mode_dynamic) {
            const settingFlag = opts.mode_dynamic
            this.modeMenu.setDynamicLabelWidth(settingFlag)
            this.dynamicLabelWidth = settingFlag
            // this.defaultConfig.mode_dynamic = opts.mode_dynamic;
        }
        if (opts.mode_pnp) {
            const settingFlag = opts.mode_pnp
            this.modeMenu.setCheckBoxValue(
                "pickandpinModuleCheckbox",
                settingFlag,
            )
            // this.defaultConfig.mode_pnp = opts.mode_pnp;
        }
        if (opts.mode_scaling) {
            const settingFlag = opts.mode_scaling
            this.modeMenu.setCheckBoxValue(
                "nodescalingModuleCheckbox",
                settingFlag,
            )
            // this.defaultConfig.mode_scaling = opts.mode_scaling;
        }
        if (opts.mode_compact) {
            const settingFlag = opts.mode_compact
            this.modeMenu.setCheckBoxValue(
                "compactnotationModuleCheckbox",
                settingFlag,
            )
            // this.defaultConfig.mode_compact = opts.mode_compact;
        }
        if (opts.mode_colorExt) {
            const settingFlag = opts.mode_colorExt
            this.modeMenu.setCheckBoxValue(
                "colorexternalsModuleCheckbox",
                settingFlag,
            )
            // this.defaultConfig.mode_colorExt = opts.mode_colorExt;
        }
        if (opts.mode_multiColor) {
            const settingFlag = opts.mode_multiColor
            this.modeMenu.setColorSwitchStateUsingURL(settingFlag)
            // this.defaultConfig.mode_multiColor = opts.mode_multiColor;
        }
        this.modeMenu.updateSettingsUsingURL()
        this.rectangularRepresentation = Boolean(opts.rect)
    }
}
