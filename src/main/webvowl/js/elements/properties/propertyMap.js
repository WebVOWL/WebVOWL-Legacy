let properties = [];
properties.push(require("./implementations/OwlAllValuesFromProperty"));
properties.push(require("./implementations/OwlDatatypeProperty"));
properties.push(require("./implementations/OwlDeprecatedProperty"));
properties.push(require("./implementations/OwlDisjointWith"));
properties.push(require("./implementations/OwlEquivalentProperty"));
properties.push(require("./implementations/OwlFunctionalProperty"));
properties.push(require("./implementations/OwlInverseFunctionalProperty"));
properties.push(require("./implementations/OwlObjectProperty"));
properties.push(require("./implementations/OwlSomeValuesFromProperty"));
properties.push(require("./implementations/OwlSymmetricProperty"));
properties.push(require("./implementations/OwlTransitiveProperty"));
properties.push(require("./implementations/RdfProperty"));
properties.push(require("./implementations/RdfsSubClassOf"));
properties.push(require("./implementations/SetOperatorProperty"));

let map = new Map(properties.map((Prototype) => {
  let proto = new Prototype();
  return [proto.type(), Prototype];
}));

module.exports = function () {
  return map;
};
