module.exports.path_func = new function () {
    // General stuff
    this.srcPath = "src/main";
    this.dataPath = "src/data";

    // Deploy
    this.deployPath = "target/deploy";
    this.webappDeployPath = "target/webapp";
    this.deployZipPath = `${this.deployPath}/compressed`;

    // JS/CSS/HTML
    this.frontendPath = `${this.srcPath}/app`;
    this.backendPath = `${this.srcPath}/webvowl`;
    this.testPath = `${this.srcPath}/test`;
    this.nodeModulePath = "node_modules";
};