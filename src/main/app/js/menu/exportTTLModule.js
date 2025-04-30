import BaseElement from "../../../webvowl/js/elements/BaseElement"
import BaseNode from "../../../webvowl/js/elements/nodes/BaseNode"
import BaseProperty from "../../../webvowl/js/elements/properties/BaseProperty"
import Graph from "../../../webvowl/js/graph"
import PrefixTools from "../../../webvowl/js/util/prefixTools"
import WebVOWL from "../../../webvowl/js/webvowl"

export default class ExportTTLModule {
    /**
     * Contains the logic for the export button.
     * @param {Graph} graph
     */
    constructor(graph) {
        this.graph = graph
        this.resultingTTLContent = ""
        this.currentNodes = undefined
        this.currentProperties = undefined
        this.currentAxioms = undefined
        /**
         * @type {Map<string,BaseNode>}
         */
        this.Map_ID2Node = new Map()
        /**
         * @type {Map<string,BaseProperty>}
         */
        this.Map_ID2Prop = new Map()
    }

    requestExport() {
        this.resultingTTLContent = ""
        this.currentNodes = this.graph.getClassDataForTtlExport()
        for (let i = 0; i < this.currentNodes.length; i++) {
            this.Map_ID2Node.set(this.currentNodes[i].id, this.currentNodes[i])
        }
        this.currentProperties = this.graph.getPropertyDataForTtlExport()

        for (let i = 0; i < this.currentProperties.length; i++) {
            this.Map_ID2Prop.set(
                this.currentProperties[i].id,
                this.currentProperties[i],
            )
        }

        this.prepareHeader()
        this.preparePrefixList()
        this.prepareOntologyDef()
        this.resultingTTLContent +=
            "#################################################################\r\n\r\n"
        this.preparePrefixRepresentation()
        const property_success = this.exportProperties()
        const class_success = this.exportClasses()
        this.currentNodes = null
        this.currentProperties = null
        this.Map_ID2Node.clear()
        this.Map_ID2Prop.clear()
        return property_success || class_success
    }

    /**
     * @note This mutates `graph.unfilteredData`
     */
    preparePrefixRepresentation() {
        const allNodes = this.graph.unfilteredData.nodes
        for (let i = 0; i < allNodes.length; i++) {
            const node = allNodes[i]
            const nodeIRI = PrefixTools.getPrefixRepresentationForFullURI(
                node.iri,
                this.graph,
            )
            if (PrefixTools.validURL(nodeIRI)) {
                node.prefixRepresentation = "<" + nodeIRI + ">"
            } else {
                node.prefixRepresentation = nodeIRI
            }
        }
        const allProps = this.graph.unfilteredData.properties
        for (let i = 0; i < allProps.length; i++) {
            const property = allProps[i]
            const propIRI = PrefixTools.getPrefixRepresentationForFullURI(
                property.iri,
                this.graph,
            )
            if (PrefixTools.validURL(propIRI)) {
                property.prefixRepresentation = "<" + propIRI + ">"
            } else {
                property.prefixRepresentation = propIRI
            }
        }
    }

    exportProperties() {
        if (this.currentProperties.length === 0) {
            return undefined // we dont need to write that
        }
        this.resultingTTLContent +=
            "###  Property Definitions (Number of Property) " +
            this.currentProperties.length +
            " ###\r\n"
        for (let i = 0; i < this.currentProperties.length; i++) {
            this.resultingTTLContent +=
                "#  --------------------------- Property " +
                i +
                "------------------------- \r\n"
            const addedElement = this.extractPropertyDescription(
                this.currentProperties[i],
            )
            this.resultingTTLContent += addedElement
            //@ workaround for not supported elements
            if (addedElement.indexOf("WHYEMPTYNAME") !== -1) {
                return false
            }
        }
        return true
    }

    exportClasses() {
        if (this.currentNodes.length === 0) {
            return undefined // we dont need to write that
        }
        this.resultingTTLContent +=
            "###  Class Definitions (Number of Classes) " +
            this.currentNodes.length +
            " ###\r\n"
        for (let i = 0; i < this.currentNodes.length; i++) {
            // check for node type here and return false
            this.resultingTTLContent +=
                "#  --------------------------- Class  " +
                i +
                "------------------------- \r\n"
            const addedElement = this.extractClassDescription(
                this.currentNodes[i],
            )
            this.resultingTTLContent += addedElement

            if (addedElement.indexOf("WHYEMPTYNAME") !== -1) {
                return false
            }
        }
        return true
    }

    /**
     * @param {BaseElement} selectedElement
     * @param {string} element
     */
    getPresentAttribute(selectedElement, element) {
        return selectedElement.attributes
            ? selectedElement.attributes.indexOf(element) >= 0
            : false
    }

    /**
     * @param {BaseNode} node
     */
    extractClassDescription(node) {
        const subject = node.prefixRepresentation
        const predicate = "rdf:type"
        let object = node.type
        if (node.type === "owl:equivalentClass") {
            object = "owl:Class"
        }
        if (node.type === "owl:disjointUnionOf") {
            object = "owl:Class"
        }
        if (node.type === "owl:unionOf") {
            object = "owl:Class"
        }
        const arrayOfNodes = []
        const arrayOfUnionNodes = []

        if (node.union) {
            const union = node.union
            for (let u = 0; u < union.length; u++) {
                const u_node = this.Map_ID2Node.get(union[u])
                arrayOfUnionNodes.push(u_node)
            }
        }

        if (node.disjointUnion) {
            const distUnion = node.disjointUnion
            for (let du = 0; du < distUnion.length; du++) {
                const du_node = this.Map_ID2Node.get(distUnion[du])
                arrayOfNodes.push(du_node)
            }
        }

        let objectDef = subject + " " + predicate + " " + object
        if (this.getPresentAttribute(node, "deprecated")) {
            objectDef += ", owl:DeprecatedProperty"
        }
        // equivalent class handeled using type itself!

        // check for equivalent classes;
        const indent = this.getIndent(subject)
        objectDef += "; \r\n"
        if (node.equivalents) {
            for (let e = 0; e < node.equivalents.length; e++) {
                const eqIRI = PrefixTools.getPrefixRepresentationForFullURI(
                    node.equivalents[e].iri,
                    this.graph,
                )
                let eqNode_prefRepresentation = ""
                if (PrefixTools.validURL(eqIRI)) {
                    eqNode_prefRepresentation = "<" + eqIRI + ">"
                } else {
                    eqNode_prefRepresentation = eqIRI
                }
                objectDef +=
                    indent +
                    " owl:equivalentClass " +
                    eqNode_prefRepresentation +
                    " ;\r\n"
            }
        }

        // add Comments
        if (node.commentForCurrentLanguage()) {
            objectDef +=
                indent +
                ' rdfs:comment "' +
                node.commentForCurrentLanguage() +
                '" ;\r\n'
        }

        if (node.annotations) {
            const annotations = node.annotations
            for (const an in annotations) {
                if (annotations.hasOwnProperty(an)) {
                    const anArrayObj = annotations[an]
                    const anObj = anArrayObj[0]
                    const an_ident = anObj.identifier
                    const an_val = anObj.value

                    if (an_ident === "isDefinedBy") {
                        objectDef +=
                            indent + " rdfs:isDefinedBy <" + an_val + "> ;\r\n"
                    }
                    if (an_ident === "term_status") {
                        objectDef +=
                            indent + ' vs:term_status "' + an_val + '" ;\r\n'
                    }
                }
            }
        }

        if (arrayOfNodes.length > 0) {
            // add disjoint unionOf
            objectDef += indent + " owl:disjointUnionOf ("
            for (let duE = 0; duE < arrayOfNodes.length; duE++) {
                const duIri = PrefixTools.getPrefixRepresentationForFullURI(
                    arrayOfNodes[duE].iri,
                    this.graph,
                )
                let duNode_prefRepresentation = ""
                if (PrefixTools.validURL(duIri) === true)
                    duNode_prefRepresentation = "<" + duIri + ">"
                else duNode_prefRepresentation = duIri
                objectDef += indent + indent + duNode_prefRepresentation + " \n"
            }
            objectDef += ") ;\r\n"
        }

        if (arrayOfUnionNodes.length > 0) {
            // add disjoint unionOf
            objectDef += indent + " rdfs:subClassOf [ rdf:type owl:Class ; \r\n"
            objectDef += indent + indent + " owl:unionOf ( "
            for (let uE = 0; uE < arrayOfUnionNodes.length; uE++) {
                if (arrayOfUnionNodes[uE] && arrayOfUnionNodes[uE].iri) {
                    const uIri = PrefixTools.getPrefixRepresentationForFullURI(
                        arrayOfUnionNodes[uE].iri,
                        this.graph,
                    )
                    let uNode_prefRepresentation = ""
                    if (PrefixTools.validURL(uIri) === true)
                        uNode_prefRepresentation = "<" + uIri + ">"
                    else uNode_prefRepresentation = uIri
                    objectDef +=
                        indent +
                        indent +
                        indent +
                        uNode_prefRepresentation +
                        " \n"
                }
            }
            objectDef += ") ;\r\n"
        }

        const allProps = this.graph.unfilteredData.properties
        const myProperties = []
        for (let i = 0; i < allProps.length; i++) {
            const property = allProps[i]
            if (
                property.domain === node &&
                (property.type === "rdfs:subClassOf" ||
                    property.type === "owl:allValuesFrom" ||
                    property.type === "owl:someValuesFrom")
            ) {
                myProperties.push(property)
            }
            // special case disjoint with>> both domain and range get that property
            if (
                property.domain === node &&
                property.type === "owl:disjointWith"
            ) {
                myProperties.push(property)
            }
        }
        for (let i = 0; i < myProperties.length; i++) {
            const property = myProperties[i]
            // depending on the property we have to do some things;

            // special case
            if (property.type === "owl:someValuesFrom") {
                objectDef +=
                    indent +
                    " rdfs:subClassOf [ rdf:type owl:Restriction ; \r\n"
                objectDef +=
                    indent +
                    "                   owl:onProperty " +
                    property.prefixRepresentation +
                    ";\r\n"
                if (property.range.type !== "owl:Thing") {
                    objectDef +=
                        indent +
                        "                   owl:someValuesFrom " +
                        property.range.prefixRepresentation +
                        "\r\n"
                }
                objectDef += indent + "                 ];\r\n"
                continue
            }

            if (property.type === "owl:allValuesFrom") {
                objectDef +=
                    indent +
                    " rdfs:subClassOf [ rdf:type owl:Restriction ; \r\n"
                objectDef +=
                    indent +
                    "                   owl:onProperty " +
                    property.prefixRepresentation +
                    ";\r\n"
                if (property.range.type !== "owl:Thing") {
                    objectDef +=
                        indent +
                        "                   owl:allValuesFrom " +
                        property.range.prefixRepresentation +
                        "\r\n"
                }
                objectDef += indent + "                 ];\r\n"
                continue
            }

            if (property.range.type !== "owl:Thing") {
                objectDef +=
                    indent +
                    " " +
                    property.prefixRepresentation +
                    " " +
                    property.range.prefixRepresentation +
                    " ;\r\n"
            }
        }
        objectDef += this.generalLabelLanguageExtractor(
            indent,
            node.label,
            "rdfs:label",
            true,
        )
        return objectDef
    }

    /**
     * @param {any} property
     */
    extractPropertyDescription(property) {
        const subject = property.prefixRepresentation
        if (subject.length === 0) {
            console.warn("THIS SHOULD NOT HAPPEN")
            const propIRI = PrefixTools.getPrefixRepresentationForFullURI(
                property.iri,
                this.graph,
            )
            console.log("FOUND " + propIRI)
        }
        const predicate = "rdf:type"
        const object = property.type

        let objectDef = subject + " " + predicate + " " + object
        if (this.getPresentAttribute(property, "deprecated")) {
            objectDef += ", owl:DeprecatedProperty"
        }
        if (this.getPresentAttribute(property, "functional")) {
            objectDef += ", owl:FunctionalProperty"
        }
        if (this.getPresentAttribute(property, "inverse functional")) {
            objectDef += ", owl:InverseFunctionalProperty"
        }
        if (this.getPresentAttribute(property, "symmetric")) {
            objectDef += ", owl:SymmetricProperty"
        }
        if (this.getPresentAttribute(property, "transitive")) {
            objectDef += ", owl:TransitiveProperty"
        }
        const indent = this.getIndent(subject)

        if (property.inverse) {
            objectDef += "; \r\n"
            objectDef +=
                indent +
                " owl:inverseOf " +
                property.inverse.prefixRepresentation
        }

        // check for domain and range;
        let closeStatement = false
        const domain = property.domain
        const range = property.range
        objectDef += " ;\r\n"

        if (property.commentForCurrentLanguage()) {
            objectDef +=
                indent +
                ' rdfs:comment "' +
                property.commentForCurrentLanguage() +
                '" ;\r\n'
        }

        if (property.superproperties) {
            const superProps = property.superproperties
            for (let sP = 0; sP < superProps.length; sP++) {
                const sPelement = superProps[sP]
                objectDef +=
                    indent +
                    "rdfs:subPropertyOf " +
                    sPelement.prefixRepresentation +
                    ";\r\n"
            }
        }
        if (property.annotations) {
            const annotations = property.annotations
            for (const an in annotations) {
                if (annotations.hasOwnProperty(an)) {
                    const anArrayObj = annotations[an]
                    const anObj = anArrayObj[0]
                    const an_ident = anObj.identifier
                    const an_val = anObj.value
                    if (an_ident === "isDefinedBy") {
                        objectDef +=
                            indent + " rdfs:isDefinedBy <" + an_val + "> ;\r\n"
                    }
                    if (an_ident === "term_status") {
                        objectDef +=
                            indent + ' vs:term_status "' + an_val + '" ;\r\n'
                    }
                }
            }
        }

        if (domain.type === "owl:Thing" && range.type === "owl:Thing") {
            // we do not write domain and range
            if (
                typeof property.label !== "object" &&
                property.label.length === 0
            ) {
                closeStatement = true
            }
        }

        if (closeStatement) {
            const uobjectDef = objectDef.substring(0, objectDef.length - 2)
            objectDef = uobjectDef + " . \r\n"
            return objectDef
        }

        // objectDef+="; \r\n";
        let labelDescription
        if (domain.type === "owl:Thing" && range.type === "owl:Thing") {
            labelDescription = this.generalLabelLanguageExtractor(
                indent,
                property.label,
                "rdfs:label",
                true,
            )
            objectDef += labelDescription
        } else {
            // do not close the statement;
            labelDescription = this.generalLabelLanguageExtractor(
                indent,
                property.label,
                "rdfs:label",
            )
            objectDef += labelDescription
            if (domain.type !== "owl:Thing") {
                objectDef +=
                    indent +
                    " rdfs:domain " +
                    domain.prefixRepresentation +
                    ";\r\n"
            }
            if (range.type !== "owl:Thing") {
                objectDef +=
                    indent +
                    " rdfs:range " +
                    range.prefixRepresentation +
                    ";\r\n"
            }
            // close statement now;
            const s_needUpdate = objectDef
            const s_lastPtr = s_needUpdate.lastIndexOf(";")
            objectDef = s_needUpdate.substring(0, s_lastPtr) + " . \r\n"
        }
        return objectDef
    }

    /**
     * @param {string | any[]} name
     */
    getIndent(name) {
        if (name === undefined) {
            return "WHYEMPTYNAME?"
        }
        return new Array(name.length + 1).join(" ")
    }

    prepareHeader() {
        this.resultingTTLContent +=
            "#################################################################\r\n"
        this.resultingTTLContent += `### Generated with the experimental alpha version of the TTL exporter of WebVOWL (version ${WebVOWL.version}), ${WebVOWL.link} ###\r\n`
        this.resultingTTLContent +=
            "#################################################################\r\n\r\n"
    }

    preparePrefixList() {
        const ontoIri = this.graph.options.getGeneralMetaObjectProperty("iri")
        const prefixList = this.graph.options.prefixList
        const prefixDef = []
        prefixDef.push("@prefix : \t\t<" + ontoIri + "> .")
        for (const entry of prefixList.entries()) {
            const [name, value] = entry
            prefixDef.push("@prefix " + name + ": \t\t<" + value + "> .")
        }
        prefixDef.push("@base \t\t\t<" + ontoIri + "> .\r\n")
        for (let i = 0; i < prefixDef.length; i++) {
            this.resultingTTLContent += prefixDef[i] + "\r\n"
        }
    }

    prepareOntologyDef() {
        const ontoIri = this.graph.options.getGeneralMetaObjectProperty("iri")
        const indent = this.getIndent("<" + ontoIri + ">")
        this.resultingTTLContent +=
            "<" +
            ontoIri +
            "> rdf:type owl:Ontology ;\r\n" +
            this.getOntologyTitle(indent) +
            this.getOntologyDescription(indent) +
            this.getOntologyVersion(indent) +
            this.getOntologyAuthor(indent)

        // close the statement;
        const s_needUpdate = this.resultingTTLContent
        const s_lastPtr = s_needUpdate.lastIndexOf(";")
        this.resultingTTLContent =
            s_needUpdate.substring(0, s_lastPtr) + " . \r\n"
    }

    /**
     * @param {string} indent
     */
    getOntologyTitle(indent) {
        return this.generalLanguageExtractor(indent, "title", "dc:title")
    }

    /**
     * @param {string} indent
     */
    getOntologyDescription(indent) {
        return this.generalLanguageExtractor(
            indent,
            "description",
            "dc:description",
        )
    }

    /**
     * @param {string} indent
     */
    getOntologyAuthor(indent) {
        const languageElement =
            this.graph.options.getGeneralMetaObjectProperty("author")
        if (languageElement) {
            if (typeof languageElement !== "object") {
                if (languageElement.length === 0) {
                    return ""
                }
                return (
                    indent + " dc:creator " + '"' + languageElement + '";\r\n'
                )
            }
            // we assume this thing is an array;
            let authorString = indent + " dc:creator " + '"'
            for (let i = 0; i < languageElement.length - 1; i++) {
                authorString += languageElement[i] + ", "
            }
            authorString +=
                languageElement[languageElement.length - 1] + '";\r\n'
            return authorString
        } else {
            return ""
        }
    }

    /**
     * @param {string} indent
     */
    getOntologyVersion(indent) {
        const languageElement =
            this.graph.options.getGeneralMetaObjectProperty("version")
        if (languageElement) {
            if (typeof languageElement !== "object") {
                if (languageElement.length === 0) {
                    return ""
                }
            }
            return this.generalLanguageExtractor(
                indent,
                "version",
                "owl:versionInfo",
            )
        } else {
            return ""
        }
    }

    /**
     * @param {string} indent
     * @param {string} metaObjectDescription
     * @param {string} annotationDescription
     * @param {boolean} [endStatement]
     */
    generalLanguageExtractor(
        indent,
        metaObjectDescription,
        annotationDescription,
        endStatement = false,
    ) {
        const languageElement = this.graph.options.getGeneralMetaObjectProperty(
            metaObjectDescription,
        )
        if (typeof languageElement === "object") {
            const resultingLanguages = []
            for (const name in languageElement) {
                if (languageElement.hasOwnProperty(name)) {
                    const content = languageElement[name]
                    if (name === "undefined") {
                        resultingLanguages.push(
                            indent +
                                " " +
                                annotationDescription +
                                ' "' +
                                content +
                                '"@en; \r\n',
                        )
                    } else {
                        resultingLanguages.push(
                            indent +
                                " " +
                                annotationDescription +
                                ' "' +
                                content +
                                '"@' +
                                name +
                                "; \r\n",
                        )
                    }
                }
            }
            // create resulting titles;
            let resultingString = ""
            for (let i = 0; i < resultingLanguages.length; i++) {
                resultingString += resultingLanguages[i]
            }
            if (endStatement) {
                const needUpdate = resultingString
                const lastPtr = needUpdate.lastIndexOf(";")
                return needUpdate.substring(0, lastPtr) + ". \r\n"
            } else {
                return resultingString
            }
        } else {
            if (endStatement) {
                const s_needUpdate =
                    indent +
                    " " +
                    annotationDescription +
                    ' "' +
                    languageElement +
                    '"@en; \r\n'
                const s_lastPtr = s_needUpdate.lastIndexOf(";")
                return s_needUpdate.substring(0, s_lastPtr) + " . \r\n"
            }
            return (
                indent +
                " " +
                annotationDescription +
                ' "' +
                languageElement +
                '"@en;\r\n'
            )
        }
    }

    /**
     * @param {string} indent
     * @param {any} label
     * @param {string} annotationDescription
     * @param {boolean} endStatement
     */
    generalLabelLanguageExtractor(
        indent,
        label,
        annotationDescription,
        endStatement = false,
    ) {
        const languageElement = label
        if (typeof languageElement === "object") {
            const resultingLanguages = []
            for (const name in languageElement) {
                if (languageElement.hasOwnProperty(name)) {
                    const content = languageElement[name]
                    if (name === "undefined") {
                        resultingLanguages.push(
                            indent +
                                " " +
                                annotationDescription +
                                ' "' +
                                content +
                                '"@en; \r\n',
                        )
                    } else {
                        resultingLanguages.push(
                            indent +
                                " " +
                                annotationDescription +
                                ' "' +
                                content +
                                '"@' +
                                name +
                                "; \r\n",
                        )
                    }
                }
            }
            // create resulting titles;
            let resultingString = ""
            for (let i = 0; i < resultingLanguages.length; i++) {
                resultingString += resultingLanguages[i]
            }
            if (endStatement) {
                const needUpdate = resultingString
                const lastPtr = needUpdate.lastIndexOf(";")
                return needUpdate.substring(0, lastPtr) + " . \r\n"
            } else {
                return resultingString
            }
        } else {
            if (endStatement) {
                const s_needUpdate =
                    indent +
                    " " +
                    annotationDescription +
                    ' "' +
                    languageElement +
                    '"@en; \r\n'
                const s_lastPtr = s_needUpdate.lastIndexOf(";")
                return s_needUpdate.substring(0, s_lastPtr) + " . \r\n"
            }
            return (
                indent +
                " " +
                annotationDescription +
                ' "' +
                languageElement +
                '"@en; \r\n'
            )
        }
    }
}
