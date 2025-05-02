import BaseProperty from "../properties/BaseProperty"
import PlainLink from "./PlainLink"

export default class Label {
    /**
     * A label represents the element(s) which further describe a link.
     * It encapsulates the property and its inverse property.
     * @param {BaseProperty} property the property; the inverse is inferred
     * @param {PlainLink} link the link this label belongs to
     */
    constructor(property, link) {
        this._frozen = property.frozen
        this._locked = property.locked
        this._pinned = property.pinned
        this.link = link
        this.property = property
    }

    get frozen() {
        return this._frozen
    }

    get locked() {
        return this._locked
    }

    get pinned() {
        return this._locked
    }

    set frozen(v) {
        this._frozen = v;
        this.property.frozen = v;
    }

    set locked(v) {
        this._locked = v;
        this.property.locked = v;
    }

    set pinned(v) {
        this._pinned = v;
        this.property.pinned = v;
    }

    get fixed() {
        const inverseFixed = this.property.inverse
            ? this.property.inverse.fixed
            : false
        return this.property.fixed || inverseFixed
    }

    set fixed(v) {
        this.property.fixed = v
        if (this.property.inverse) {
            this.property.inverse.fixed = v
        }
    }

    get inverse() {
        return this.property.inverse
    }

    actualRadius() {
        return this.property.smallestRadius
    }

    /**
     * @param {any} container
     */
    draw(container) {
        return this.property.draw(container)
    }

    /**
     * @param {Label} other
     */
    equals(other) {
        if (
            !other ||
            !(other instanceof Label) ||
            !this.property.equals(other.property)
        ) {
            return false
        }
        let equalInverse = false
        if (this.property.inverse) {
            equalInverse = this.property.inverse.equals(other.property.inverse)
        } else if (!other.property.inverse) {
            equalInverse = true
        }
        return equalInverse
    }
}
