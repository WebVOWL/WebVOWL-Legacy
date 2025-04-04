import { languageTools } from "../util/languageTools";

/**
 * The base element for all visual elements of webvowl.
 */
export class BaseElement {
    constructor(graph) {
        this.graph = graph // TODO: This must be a global reference to save memory.

        // Basic attributes
        this.equivalents = []
        this.id         // string
        this.label      // string
        this.type       // string
        this.iri        // string
        this.baseIri    // string

        // Additional attributes
        this.annotations        // Array
        this.attributes = []    // Array
        this.backgroundColor    // string | undefined | null
        this.comment            // string | undefined
        this.description        // string | undefined
        this.equivalentBase     // Node | Property
        this.visualAttributes = []

        // Style attributes
        this.focused = false
        this.indications = []   // Array
        this.mouseEntered = false
        this.styleClass         // string | undefined
        this.visible = true
        this.backupLabel        // string | undefined

        // Force layout attributes
        this._locked = false
        this._frozen = false
        this._halo = false
        this._pinned = false
    }

    _applyFixedLocationAttributes() {
        node.fixed = node.locked || node.frozen || node.pinned;
    }

    /**
     * OVERLOADED BY INDIVIDUAL ELEMENTS
     */
    redrawElement() { }

    get locked() {
        return this._locked;
    }

    set locked(p) {
        this._locked = p;
        this._applyFixedLocationAttributes();
    };

    get frozen() {
        return this._frozen;
    }

    set frozen(p) {
        this._frozen = p;
        this._applyFixedLocationAttributes();
    };

    get halo() {
        return this._halo;
    }

    set halo(p) {
        this._halo = p;
        this._applyFixedLocationAttributes();
    };

    get pinned() {
        return this._pinned;
    }

    set pinned(p) {
        this._pinned = p;
        this._applyFixedLocationAttributes();
    };

    commentForCurrentLanguage() {
        return languageTools.textInLanguage(this.comment, graph.language());
    }

    descriptionForCurrentLanguage() {
        return languageTools.textInLanguage(this.description, graph.language());
    }

    defaultLabel() {
        return languageTools.textInLanguage(this.label, "default");
    }

    indicationString() {
        return this.indications.join(", ");
    }

    labelForCurrentLanguage() {
        const preferredLanguage = graph && graph.language ? graph.language() : null;
        return languageTools.textInLanguage(this.label, preferredLanguage);
    }

    equals(other) {
        return other instanceof BaseElement && this.id === other.id;
    }

    toString() {
        return this.labelForCurrentLanguage() + " (" + this.type + ")";
    }
}