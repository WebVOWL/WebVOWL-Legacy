module.exports = function (graph) {
  /** letiable defs **/
  let prefixRepresentationModule = {};

  let currentPrefixModel;

  prefixRepresentationModule.updatePrefixModel = function () {
    currentPrefixModel = graph.options().prefixList();
  };


  prefixRepresentationModule.validURL = function (url) {
    return validURL(url);
  };
  function validURL(str) {
    let urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return urlregex.test(str);
  }

  function splitURLIntoBaseAndResource(fullURL) {
    let splitedURL = { base: "", resource: "" };
    if (fullURL === undefined) {
      splitedURL = { base: "ERROR", resource: "NOT FOUND" };
      return splitedURL;
    }

    let resource, base;
    // check if there is a last hashTag
    if (fullURL.indexOf("#") > -1) {
      resource = fullURL.substring(fullURL.lastIndexOf('#') + 1);
      base = fullURL.substring(0, fullURL.length - resource.length);
      // overwrite base if it is ontologyIri;
      if (base === graph.options().getGeneralMetaObjectProperty('iri')) {
        base = ":";
      }
      splitedURL.base = base;
      splitedURL.resource = resource;
    } else {
      resource = fullURL.substring(fullURL.lastIndexOf('/') + 1);
      base = fullURL.substring(0, fullURL.length - resource.length);
      // overwrite base if it is ontologyIri;
      if (base === graph.options().getGeneralMetaObjectProperty('iri')) {
        base = ":";
      }
      splitedURL.base = base;
      splitedURL.resource = resource;
    }
    return splitedURL;
  }

  prefixRepresentationModule.getPrefixRepresentationForFullURI = function (fullURL) {
    prefixRepresentationModule.updatePrefixModel();
    let splittedURL = splitURLIntoBaseAndResource(fullURL);

    // lazy approach , for
    // loop over prefix model
    for (let name in currentPrefixModel) {
      if (currentPrefixModel.hasOwnProperty(name)) {
        // THIS IS CASE SENSITIVE!
        if (currentPrefixModel[name] === splittedURL.base) {
          return name + ":" + splittedURL.resource;
        }
      }
    }

    if (splittedURL.base === ":") {
      return ":" + splittedURL.resource;
    }

    return fullURL;
  };


  return prefixRepresentationModule;
};


