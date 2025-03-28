/**
 * Contains the logic for the export button.
 * @returns {{}}
 */
module.exports = function (graph) {
  let exportTTLModule = {};
  let resultingTTLContent = "";
  let currentNodes;
  let currentProperties;
  let currentAxioms;
  let Map_ID2Node = {};
  let Map_ID2Prop = {};
  let prefixModule = webvowl.util.prefixTools(graph);

  exportTTLModule.requestExport = function () {
    prefixModule.updatePrefixModel();
    resultingTTLContent = "";
    currentNodes = graph.getClassDataForTtlExport();
    let i;
    for (i = 0; i < currentNodes.length; i++) {
      Map_ID2Node[currentNodes[i].id()] = currentNodes[i];
    }
    currentProperties = graph.getPropertyDataForTtlExport();

    for (i = 0; i < currentProperties.length; i++) {
      Map_ID2Prop[currentProperties[i].id()] = currentProperties[i];
    }


    prepareHeader();
    preparePrefixList();
    prepareOntologyDef();
    resultingTTLContent += "#################################################################\r\n\r\n";
    preparePrefixRepresentation();
    let property_success = exportProperties();
    let class_success = exportClasses();
    currentNodes = null;
    currentProperties = null;
    Map_ID2Node = {};
    Map_ID2Prop = {};
    if (property_success === false || class_success === false)
      return false;
    return true;

  };

  function preparePrefixRepresentation() {
    let i;
    let allNodes = graph.getUnfilteredData().nodes;
    let allProps = graph.getUnfilteredData().properties;
    for (i = 0; i < allNodes.length; i++) {
      let nodeIRI = prefixModule.getPrefixRepresentationForFullURI(allNodes[i].iri());
      if (prefixModule.validURL(nodeIRI) === true)
        allNodes[i].prefixRepresentation = "<" + nodeIRI + ">";
      else
        allNodes[i].prefixRepresentation = nodeIRI;
    }
    for (i = 0; i < allProps.length; i++) {
      let propIRI = prefixModule.getPrefixRepresentationForFullURI(allProps[i].iri());
      if (prefixModule.validURL(propIRI) === true)
        allProps[i].prefixRepresentation = "<" + propIRI + ">";
      else
        allProps[i].prefixRepresentation = propIRI;
    }
  }

  function exportProperties() {
    if (currentProperties.length === 0) return; // we dont need to write that
    resultingTTLContent += "###  Property Definitions (Number of Property) " + currentProperties.length + " ###\r\n";
    for (let i = 0; i < currentProperties.length; i++) {

      resultingTTLContent += "#  --------------------------- Property " + i + "------------------------- \r\n";
      let addedElement = extractPropertyDescription(currentProperties[i]);
      resultingTTLContent += addedElement;
      //@ workaround for not supported elements
      if (addedElement.indexOf("WHYEMPTYNAME") !== -1) {
        return false;
      }
    }
    return true;
  }


  function exportClasses() {
    if (currentNodes.length === 0) return; // we dont need to write that
    resultingTTLContent += "###  Class Definitions (Number of Classes) " + currentNodes.length + " ###\r\n";
    for (let i = 0; i < currentNodes.length; i++) {
      // check for node type here and return false
      resultingTTLContent += "#  --------------------------- Class  " + i + "------------------------- \r\n";
      let addedElement = extractClassDescription(currentNodes[i]);
      resultingTTLContent += addedElement;

      if (addedElement.indexOf("WHYEMPTYNAME") !== -1) {
        return false;
      }
    }
    return true;
  }

  function getPresentAttribute(selectedElement, element) {
    let attr = selectedElement.attributes();
    return (attr.indexOf(element) >= 0);
  }

  function extractClassDescription(node) {
    let subject = node.prefixRepresentation;
    let predicate = "rdf:type";
    let object = node.type();
    if (node.type() === "owl:equivalentClass")
      object = "owl:Class";
    if (node.type() === "owl:disjointUnionOf")
      object = "owl:Class";
    if (node.type() === "owl:unionOf")
      object = "owl:Class";
    let arrayOfNodes = [];
    let arrayOfUnionNodes = [];

    if (node.union()) {
      let union = node.union();
      for (let u = 0; u < union.length; u++) {
        let u_node = Map_ID2Node[union[u]];
        arrayOfUnionNodes.push(u_node);
      }
    }

    if (node.disjointUnion()) {
      let distUnion = node.disjointUnion();
      for (let du = 0; du < distUnion.length; du++) {
        let du_node = Map_ID2Node[distUnion[du]];
        arrayOfNodes.push(du_node);
      }
    }

    let objectDef = subject + " " + predicate + " " + object;
    if (getPresentAttribute(node, "deprecated") === true) {
      objectDef += ", owl:DeprecatedProperty";
    }
    // equivalent class handeled using type itself!

    // check for equivalent classes;
    let indent = getIndent(subject);
    objectDef += "; \r\n";
    for (let e = 0; e < node.equivalents().length; e++) {
      let eqIRI = prefixModule.getPrefixRepresentationForFullURI(node.equivalents()[e].iri());
      let eqNode_prefRepresentation = "";
      if (prefixModule.validURL(eqIRI) === true)
        eqNode_prefRepresentation = "<" + eqIRI + ">";
      else
        eqNode_prefRepresentation = eqIRI;
      objectDef += indent + " owl:equivalentClass " + eqNode_prefRepresentation + " ;\r\n";
    }

    // if (getPresentAttribute(node,"equivalent")===true){
    //     objectDef+=", owl:EquivalentClass";
    // }

    // add Comments

    if (node.commentForCurrentLanguage()) {

      objectDef += indent + " rdfs:comment \"" + node.commentForCurrentLanguage() + "\" ;\r\n";
    }

    if (node.annotations()) {
      let annotations = node.annotations();
      for (let an in annotations) {
        if (annotations.hasOwnProperty(an)) {
          let anArrayObj = annotations[an];
          let anObj = anArrayObj[0];
          let an_ident = anObj.identifier;
          let an_val = anObj.value;

          if (an_ident === "isDefinedBy") {
            objectDef += indent + " rdfs:isDefinedBy <" + an_val + "> ;\r\n";
          }
          if (an_ident === "term_status") {
            objectDef += indent + " vs:term_status \"" + an_val + "\" ;\r\n";
          }
        }
      }
    }


    if (arrayOfNodes.length > 0) {
      // add disjoint unionOf
      objectDef += indent + " owl:disjointUnionOf (";
      for (let duE = 0; duE < arrayOfNodes.length; duE++) {
        let duIri = prefixModule.getPrefixRepresentationForFullURI(arrayOfNodes[duE].iri());
        let duNode_prefRepresentation = "";
        if (prefixModule.validURL(duIri) === true)
          duNode_prefRepresentation = "<" + duIri + ">";
        else
          duNode_prefRepresentation = duIri;
        objectDef += indent + indent + duNode_prefRepresentation + " \n";
      }
      objectDef += ") ;\r\n";
    }

    if (arrayOfUnionNodes.length > 0) {
      // add disjoint unionOf
      objectDef += indent + " rdfs:subClassOf [ rdf:type owl:Class ; \r\n";
      objectDef += indent + indent + " owl:unionOf ( ";

      for (let uE = 0; uE < arrayOfUnionNodes.length; uE++) {

        if (arrayOfUnionNodes[uE] && arrayOfUnionNodes[uE].iri()) {
          let uIri = prefixModule.getPrefixRepresentationForFullURI(arrayOfUnionNodes[uE].iri());
          let uNode_prefRepresentation = "";
          if (prefixModule.validURL(uIri) === true)
            uNode_prefRepresentation = "<" + uIri + ">";
          else
            uNode_prefRepresentation = uIri;
          objectDef += indent + indent + indent + uNode_prefRepresentation + " \n";
        }
      }
      objectDef += ") ;\r\n";


    }


    let allProps = graph.getUnfilteredData().properties;
    let myProperties = [];
    let i;
    for (i = 0; i < allProps.length; i++) {
      if (allProps[i].domain() === node &&
        (allProps[i].type() === "rdfs:subClassOf" ||
          allProps[i].type() === "owl:allValuesFrom" ||
          allProps[i].type() === "owl:someValuesFrom")
      ) {
        myProperties.push(allProps[i]);
      }
      // special case disjoint with>> both domain and range get that property
      if ((allProps[i].domain() === node) &&
        allProps[i].type() === "owl:disjointWith") {
        myProperties.push(allProps[i]);
      }

    }
    for (i = 0; i < myProperties.length; i++) {
      // depending on the property we have to do some things;

      // special case
      if (myProperties[i].type() === "owl:someValuesFrom") {
        objectDef += indent + " rdfs:subClassOf [ rdf:type owl:Restriction ; \r\n";
        objectDef += indent + "                   owl:onProperty " + myProperties[i].prefixRepresentation + ";\r\n";
        if (myProperties[i].range().type() !== "owl:Thing") {
          objectDef += indent + "                   owl:someValuesFrom " + myProperties[i].range().prefixRepresentation + "\r\n";
        }
        objectDef += indent + "                 ];\r\n";
        continue;
      }

      if (myProperties[i].type() === "owl:allValuesFrom") {
        objectDef += indent + " rdfs:subClassOf [ rdf:type owl:Restriction ; \r\n";
        objectDef += indent + "                   owl:onProperty " + myProperties[i].prefixRepresentation + ";\r\n";
        if (myProperties[i].range().type() !== "owl:Thing") {
          objectDef += indent + "                   owl:allValuesFrom " + myProperties[i].range().prefixRepresentation + "\r\n";
        }
        objectDef += indent + "                 ];\r\n";
        continue;
      }

      if (myProperties[i].range().type() !== "owl:Thing") {
        objectDef += indent + " " + myProperties[i].prefixRepresentation +
          " " + myProperties[i].range().prefixRepresentation + " ;\r\n";


      }
    }


    objectDef += general_Label_languageExtractor(indent, node.label(), "rdfs:label", true);
    return objectDef;

  }

  function extractPropertyDescription(property) {
    let subject = property.prefixRepresentation;
    if (subject.length === 0) {
      console.log("THIS SHOULD NOT HAPPEN");
      let propIRI = prefixModule.getPrefixRepresentationForFullURI(property.iri());
      console.log("FOUND " + propIRI);


    }
    let predicate = "rdf:type";
    let object = property.type();

    let objectDef = subject + " " + predicate + " " + object;
    if (getPresentAttribute(property, "deprecated") === true) {
      objectDef += ", owl:DeprecatedProperty";
    }
    if (getPresentAttribute(property, "functional") === true) {
      objectDef += ", owl:FunctionalProperty";
    }
    if (getPresentAttribute(property, "inverse functional") === true) {
      objectDef += ", owl:InverseFunctionalProperty";
    }
    if (getPresentAttribute(property, "symmetric") === true) {
      objectDef += ", owl:SymmetricProperty";
    }
    if (getPresentAttribute(property, "transitive") === true) {
      objectDef += ", owl:TransitiveProperty";
    }
    let indent = getIndent(subject);

    if (property.inverse()) {
      objectDef += "; \r\n";
      objectDef += indent + " owl:inverseOf " + property.inverse().prefixRepresentation;
    }

    // check for domain and range;


    let closeStatement = false;
    let domain = property.domain();
    let range = property.range();


    objectDef += " ;\r\n";


    if (property.commentForCurrentLanguage()) {

      objectDef += indent + " rdfs:comment \"" + property.commentForCurrentLanguage() + "\" ;\r\n";
    }

    if (property.superproperties()) {
      let superProps = property.superproperties();
      for (let sP = 0; sP < superProps.length; sP++) {
        let sPelement = superProps[sP];
        objectDef += indent + "rdfs:subPropertyOf " + sPelement.prefixRepresentation + ";\r\n";
      }
      // for (let an in annotations){
      //     if (annotations.hasOwnProperty(an)){
      //         let anArrayObj=annotations[an];
      //         let anObj=anArrayObj[0];
      //         let an_ident=anObj.identifier;
      //         let an_val=anObj.value;
      //         console.log(an_ident + " "+ an_val);
      //
      //         if (an_ident==="isDefinedBy"){
      //             objectDef+=indent+" rdfs:isDefinedBy <"+an_val+"> ;\r\n";
      //         }
      //         if (an_ident==="term_status"){
      //             objectDef+=indent+" vs:term_status \""+an_val+"\" ;\r\n";
      //         }
      //     }
      // }

    }

    if (property.annotations()) {
      let annotations = property.annotations();
      for (let an in annotations) {
        if (annotations.hasOwnProperty(an)) {
          let anArrayObj = annotations[an];
          let anObj = anArrayObj[0];
          let an_ident = anObj.identifier;
          let an_val = anObj.value;

          if (an_ident === "isDefinedBy") {
            objectDef += indent + " rdfs:isDefinedBy <" + an_val + "> ;\r\n";
          }
          if (an_ident === "term_status") {
            objectDef += indent + " vs:term_status \"" + an_val + "\" ;\r\n";
          }
        }
      }
    }


    if (domain.type() === "owl:Thing" && range.type() === "owl:Thing") {
      // we do not write domain and range
      if (typeof property.label() !== "object" && property.label().length === 0) {
        closeStatement = true;
      }
    }


    if (closeStatement === true) {
      let uobjectDef = objectDef.substring(0, objectDef.length - 2);
      objectDef = uobjectDef + " . \r\n";
      return objectDef;
    }
    // objectDef+="; \r\n";
    let labelDescription;


    if (domain.type() === "owl:Thing" && range.type() === "owl:Thing") {
      labelDescription = general_Label_languageExtractor(indent, property.label(), "rdfs:label", true);
      objectDef += labelDescription;
    }
    else {
      // do not close the statement;
      labelDescription = general_Label_languageExtractor(indent, property.label(), "rdfs:label");
      objectDef += labelDescription;
      if (domain.type() !== "owl:Thing") {
        objectDef += indent + " rdfs:domain " + domain.prefixRepresentation + ";\r\n";
      }
      if (range.type() !== "owl:Thing") {
        objectDef += indent + " rdfs:range " + range.prefixRepresentation + ";\r\n";
      }

      // close statement now;

      let s_needUpdate = objectDef;
      let s_lastPtr = s_needUpdate.lastIndexOf(";");
      objectDef = s_needUpdate.substring(0, s_lastPtr) + " . \r\n";
    }

    return objectDef;

  }


  exportTTLModule.resultingTTL_Content = function () {
    return resultingTTLContent;
  };

  function getIndent(name) {
    if (name === undefined) {
      return "WHYEMPTYNAME?";
    }
    return new Array(name.length + 1).join(" ");
  }

  function prepareHeader() {
    resultingTTLContent += "#################################################################\r\n";
    resultingTTLContent += "###  Generated with the experimental alpha version of the TTL exporter of WebVOWL (version 1.1.7) " +
      " http://visualdataweb.de/webvowl/   ###\r\n";
    resultingTTLContent += "#################################################################\r\n\r\n";

  }

  function preparePrefixList() {
    let ontoIri = graph.options().getGeneralMetaObjectProperty('iri');
    let prefixList = graph.options().prefixList();
    let prefixDef = [];
    prefixDef.push('@prefix : \t\t<' + ontoIri + '> .');
    for (let name in prefixList) {
      if (prefixList.hasOwnProperty(name)) {
        prefixDef.push('@prefix ' + name + ': \t\t<' + prefixList[name] + '> .');
      }
    }
    prefixDef.push('@base \t\t\t<' + ontoIri + '> .\r\n');

    for (let i = 0; i < prefixDef.length; i++) {
      resultingTTLContent += prefixDef[i] + '\r\n';
    }
  }

  function prepareOntologyDef() {
    let ontoIri = graph.options().getGeneralMetaObjectProperty('iri');
    let indent = getIndent('<' + ontoIri + '>');
    resultingTTLContent += '<' + ontoIri + '> rdf:type owl:Ontology ;\r\n' +
      getOntologyTitle(indent) +
      getOntologyDescription(indent) +
      getOntologyVersion(indent) +
      getOntologyAuthor(indent);

    // close the statement;
    let s_needUpdate = resultingTTLContent;
    let s_lastPtr = s_needUpdate.lastIndexOf(";");
    resultingTTLContent = s_needUpdate.substring(0, s_lastPtr) + " . \r\n";
  }

  function getOntologyTitle(indent) {
    return general_languageExtractor(indent, "title", "dc:title");
  }

  function getOntologyDescription(indent) {
    return general_languageExtractor(indent, "description", "dc:description");
  }

  function getOntologyAuthor(indent) {
    let languageElement = graph.options().getGeneralMetaObjectProperty('author');
    if (languageElement) {
      if (typeof languageElement !== "object") {
        if (languageElement.length === 0)
          return ""; // an empty string
        let aString = indent + " dc:creator " + '"' + languageElement + '";\r\n';
        return aString;
      }
      // we assume this thing is an array;
      let authorString = indent + " dc:creator " + '"';
      for (let i = 0; i < languageElement.length - 1; i++) {
        authorString += languageElement[i] + ", ";
      }
      authorString += languageElement[languageElement.length - 1] + '";\r\n';
      return authorString;
    } else {
      return ""; // an empty string
    }
  }

  function getOntologyVersion(indent) {
    let languageElement = graph.options().getGeneralMetaObjectProperty('version');
    if (languageElement) {
      if (typeof languageElement !== "object") {
        if (languageElement.length === 0)
          return ""; // an empty string
      }
      return general_languageExtractor(indent, "version", "owl:versionInfo");
    } else return ""; // an empty string
  }

  function general_languageExtractor(indent, metaObjectDescription, annotationDescription, endStatement) {
    let languageElement = graph.options().getGeneralMetaObjectProperty(metaObjectDescription);

    if (typeof languageElement === 'object') {

      let resultingLanguages = [];
      for (let name in languageElement) {
        if (languageElement.hasOwnProperty(name)) {
          let content = languageElement[name];
          if (name === "undefined") {
            resultingLanguages.push(indent + " " + annotationDescription + ' "' + content + '"@en; \r\n');
          }
          else {
            resultingLanguages.push(indent + " " + annotationDescription + ' "' + content + '"@' + name + '; \r\n');
          }
        }
      }
      // create resulting titles;

      let resultingString = "";
      for (let i = 0; i < resultingLanguages.length; i++) {
        resultingString += resultingLanguages[i];
      }
      if (endStatement && endStatement === true) {
        let needUpdate = resultingString;
        let lastPtr = needUpdate.lastIndexOf(";");
        return needUpdate.substring(0, lastPtr) + ". \r\n";
      } else {
        return resultingString;
      }

    } else {
      if (endStatement && endStatement === true) {
        let s_needUpdate = indent + " " + annotationDescription + ' "' + languageElement + '"@en; \r\n';
        let s_lastPtr = s_needUpdate.lastIndexOf(";");
        return s_needUpdate.substring(0, s_lastPtr) + " . \r\n";
      }
      return indent + " " + annotationDescription + ' "' + languageElement + '"@en;\r\n';
    }
  }

  function general_Label_languageExtractor(indent, label, annotationDescription, endStatement) {
    let languageElement = label;

    if (typeof languageElement === 'object') {
      let resultingLanguages = [];
      for (let name in languageElement) {
        if (languageElement.hasOwnProperty(name)) {
          let content = languageElement[name];
          if (name === "undefined") {
            resultingLanguages.push(indent + " " + annotationDescription + ' "' + content + '"@en; \r\n');
          }
          else {
            resultingLanguages.push(indent + " " + annotationDescription + ' "' + content + '"@' + name + '; \r\n');
          }
        }
      }
      // create resulting titles;
      let resultingString = "";
      for (let i = 0; i < resultingLanguages.length; i++) {
        resultingString += resultingLanguages[i];
      }
      if (endStatement && endStatement === true) {
        let needUpdate = resultingString;
        let lastPtr = needUpdate.lastIndexOf(";");
        return needUpdate.substring(0, lastPtr) + " . \r\n";
      } else {
        return resultingString;
      }

    } else {
      if (endStatement && endStatement === true) {
        let s_needUpdate = indent + " " + annotationDescription + ' "' + languageElement + '"@en; \r\n';
        let s_lastPtr = s_needUpdate.lastIndexOf(";");
        return s_needUpdate.substring(0, s_lastPtr) + " . \r\n";
      }
      return indent + " " + annotationDescription + ' "' + languageElement + '"@en; \r\n';
    }
  }

  return exportTTLModule;
};
