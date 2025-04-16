import { ExternalClass } from "./implementations/ExternalClass";
import { OwlClass } from "./implementations/OwlClass";
import { OwlComplementOf } from "./implementations/OwlComplementOf";
import { OwlDeprecatedClass } from "./implementations/OwlDeprecatedClass";
import { OwlDisjointUnionOf } from "./implementations/OwlDisjointUnionOf";
import { OwlEquivalentClass } from "./implementations/OwlEquivalentClass";
import { OwlIntersectionOf } from "./implementations/OwlIntersectionOf";
import { OwlNothing } from "./implementations/OwlNothing";
import { OwlThing } from "./implementations/OwlThing";
import { OwlUnionOf } from "./implementations/OwlUnionOf";
import { RdfsClass } from "./implementations/RdfsClass";
import { RdfsDataType } from "./implementations/RdfsDatatype";
import { RdfsLiteral } from "./implementations/RdfsLiteral";
import { RdfsResource } from "./implementations/RdfsResource";

const nodes = [
    ExternalClass,
    OwlClass,
    OwlComplementOf,
    OwlDeprecatedClass,
    OwlDisjointUnionOf,
    OwlEquivalentClass,
    OwlIntersectionOf,
    OwlNothing,
    OwlThing,
    OwlUnionOf,
    RdfsClass,
    RdfsDataType,
    RdfsLiteral,
    RdfsResource
]

let nodeMap = new Map()
for (const nodeCls of nodes) {
    let node = new nodeCls()
    nodeMap.set(node.type, nodeCls)
}
export default nodeMap