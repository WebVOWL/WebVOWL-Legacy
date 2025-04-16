import { OwlAllValuesFromProperty } from "./implementations/OwlAllValuesFromProperty";
import { OwlDatatypeProperty } from "./implementations/OwlDatatypeProperty";
import { OwlDeprecatedProperty } from "./implementations/OwlDeprecatedProperty";
import { OwlDisjointWith } from "./implementations/OwlDisjointWith";
import { OwlEquivalentProperty } from "./implementations/OwlEquivalentProperty";
import { OwlFunctionalProperty } from "./implementations/OwlFunctionalProperty";
import { OwlInverseFunctionalProperty } from "./implementations/OwlInverseFunctionalProperty";
import { OwlObjectProperty } from "./implementations/OwlObjectProperty";
import { OwlSomeValuesFromProperty } from "./implementations/OwlSomeValuesFromProperty";
import { OwlSymmetricProperty } from "./implementations/OwlSymmetricProperty";
import { OwlTransitiveProperty } from "./implementations/OwlTransitiveProperty";
import { RdfProperty } from "./implementations/RdfProperty";
import { RdfsSubClassOf } from "./implementations/RdfsSubClassOf";
import { SetOperatorProperty } from "./implementations/SetOperatorProperty";

const properties = [
    OwlAllValuesFromProperty,
    OwlDatatypeProperty,
    OwlDeprecatedProperty,
    OwlDisjointWith,
    OwlEquivalentProperty,
    OwlFunctionalProperty,
    OwlInverseFunctionalProperty,
    OwlObjectProperty,
    OwlSomeValuesFromProperty,
    OwlSymmetricProperty,
    OwlTransitiveProperty,
    RdfProperty,
    RdfsSubClassOf,
    SetOperatorProperty
]

let propertyMap = new Map()
for (const propertyCls of properties) {
    let property = new propertyCls()
    propertyMap.set(property.type, propertyCls)
}

export default propertyMap