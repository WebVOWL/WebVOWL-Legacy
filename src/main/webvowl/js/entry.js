import '../css/vowl.css';

var webvowl = {};
webvowl.graph = require("./graph");
webvowl.options = require("./options");
webvowl.version = "@@WEBVOWL_VERSION";

webvowl.util = {};
webvowl.util.constants = require("./util/constants");
webvowl.util.languageTools = require("./util/languageTools");
webvowl.util.elementTools = require("./util/elementTools");
webvowl.util.prefixTools = require("./util/prefixTools");
webvowl.modules = {};
webvowl.modules.colorExternalsSwitch = require("./modules/filters/colorExternalsSwitch");
webvowl.modules.compactNotationSwitch = require("./modules/filters/compactNotationSwitch");
webvowl.modules.datatypeFilter = require("./modules/filters/datatypeFilter");
webvowl.modules.disjointFilter = require("./modules/filters/disjointFilter");
webvowl.modules.focuser = require("./modules/focuser");
webvowl.modules.emptyLiteralFilter = require("./modules/filters/emptyLiteralFilter");
webvowl.modules.nodeDegreeFilter = require("./modules/filters/nodeDegreeFilter");
webvowl.modules.nodeScalingSwitch = require("./modules/filters/nodeScalingSwitch");
webvowl.modules.objectPropertyFilter = require("./modules/filters/objectPropertyFilter");
webvowl.modules.pickAndPin = require("./modules/pickAndPin");
webvowl.modules.selectionDetailsDisplayer = require("./modules/selectionDetailsDisplayer");
webvowl.modules.setOperatorFilter = require("./modules/filters/setOperatorFilter");
webvowl.modules.statistics = require("./modules/filters/statistics");
webvowl.modules.subclassFilter = require("./modules/filters/subclassFilter");


export default webvowl;