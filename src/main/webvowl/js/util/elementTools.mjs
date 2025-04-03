import BaseProperty from '../elements/properties/BaseProperty';
import BaseNode from '../elements/nodes/BaseNode';
import DatatypeNode from '../elements/nodes/DatatypeNode';
import Thing from '../elements/nodes/implementations/OwlThing';
import ObjectProperty from '../elements/properties/implementations/OwlObjectProperty';
import DatatypeProperty from '../elements/properties/implementations/OwlDatatypeProperty';
import RdfsSubClassOf from '../elements/properties/implementations/RdfsSubClassOf';
import Label from '../elements/links/Label';


var tools = {};

export default function (){
  return tools;
};

tools.isLabel = function ( element ){
  return element instanceof Label;
};

tools.isNode = function ( element ){
  return element instanceof BaseNode;
};

tools.isDatatype = function ( node ){
  return node instanceof DatatypeNode;
};

tools.isThing = function ( node ){
  return node instanceof Thing;
};

tools.isProperty = function ( element ){
  return element instanceof BaseProperty;
};

tools.isObjectProperty = function ( element ){
  return element instanceof ObjectProperty;
};

tools.isDatatypeProperty = function ( element ){
  return element instanceof DatatypeProperty;
};

tools.isRdfsSubClassOf = function ( property ){
  return property instanceof RdfsSubClassOf;
};
