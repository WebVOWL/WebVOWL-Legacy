let BaseProperty = require("../elements/properties/BaseProperty");
let BaseNode = require("../elements/nodes/BaseNode");
let DatatypeNode = require("../elements/nodes/DatatypeNode");
let Thing = require("../elements/nodes/implementations/OwlThing");
let ObjectProperty = require("../elements/properties/implementations/OwlObjectProperty");
let DatatypeProperty = require("../elements/properties/implementations/OwlDatatypeProperty");
let RdfsSubClassOf = require("../elements/properties/implementations/RdfsSubClassOf");
let Label = require("../elements/links/Label");


let tools = {};
module.exports = function () {
  return tools;
};

tools.isLabel = function (element) {
  return element instanceof Label;
};

tools.isNode = function (element) {
  return element instanceof BaseNode;
};

tools.isDatatype = function (node) {
  return node instanceof DatatypeNode;
};

tools.isThing = function (node) {
  return node instanceof Thing;
};

tools.isProperty = function (element) {
  return element instanceof BaseProperty;
};

tools.isObjectProperty = function (element) {
  return element instanceof ObjectProperty;
};

tools.isDatatypeProperty = function (element) {
  return element instanceof DatatypeProperty;
};

tools.isRdfsSubClassOf = function (property) {
  return property instanceof RdfsSubClassOf;
};
