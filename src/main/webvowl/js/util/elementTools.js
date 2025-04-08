import { Label } from '../elements/links/Label';
import { BaseNode } from '../elements/nodes/BaseNode';
import { DatatypeNode } from '../elements/nodes/DatatypeNode';
import { OwlThing } from '../elements/nodes/implementations/OwlThing';
import { BaseProperty } from '../elements/properties/BaseProperty';
import { OwlDatatypeProperty } from '../elements/properties/implementations/OwlDatatypeProperty';
import { OwlObjectProperty } from '../elements/properties/implementations/OwlObjectProperty';
import { RdfsSubClassOf } from '../elements/properties/implementations/RdfsSubClassOf';

export class ElementTools {
    static isLabel(element) {
        return element instanceof Label;
    }

    static isNode(element) {
        return element instanceof BaseNode;
    }

    static isDatatype(node) {
        return node instanceof DatatypeNode;
    }

    static isThing(node) {
        return node instanceof OwlThing;
    }

    static isProperty(element) {
        return element instanceof BaseProperty;
    }

    static isObjectProperty(element) {
        return element instanceof OwlObjectProperty;
    }

    static isDatatypeProperty(element) {
        return element instanceof OwlDatatypeProperty;
    }

    static isRdfsSubClassOf(property) {
        return property instanceof RdfsSubClassOf;
    }
}