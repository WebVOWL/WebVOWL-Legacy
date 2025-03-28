let nodes = [];
nodes.push(require("./implementations/ExternalClass"));
nodes.push(require("./implementations/OwlClass"));
nodes.push(require("./implementations/OwlComplementOf"));
nodes.push(require("./implementations/OwlDeprecatedClass"));
nodes.push(require("./implementations/OwlDisjointUnionOf"));
nodes.push(require("./implementations/OwlEquivalentClass"));
nodes.push(require("./implementations/OwlIntersectionOf"));
nodes.push(require("./implementations/OwlNothing"));
nodes.push(require("./implementations/OwlThing"));
nodes.push(require("./implementations/OwlUnionOf"));
nodes.push(require("./implementations/RdfsClass"));
nodes.push(require("./implementations/RdfsDatatype"));
nodes.push(require("./implementations/RdfsLiteral"));
nodes.push(require("./implementations/RdfsResource"));

let map = new Map(nodes.map((Prototype) => {
  let proto = new Prototype();
  return [proto.type(), Prototype];
}));

module.exports = function () {
  return map;
};
