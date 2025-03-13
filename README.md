# A new WebVOWL
This repository is home to a new WebVOWL which comes in two flavours: [WebVOWL Rust](https://github.com/WebVOWL/WebVOWL/tree/rust) and [WebVOWL Legacy](https://github.com/WebVOWL/WebVOWL/tree/legacy)

# WebVOWL Legacy
The legacy branch mirrors the [original WebVOWL](https://github.com/VisualDataWeb/WebVOWL) closely with the exception of some changes highligted below.

## Changes from the original WebVOWL

### Significant performance improvements
Improvement | Original Complexity | Improved Complexity
:---: | :---: | :---:
CountAndSetLayers | $O(n^2)$ | $O(n)$
CountAndSetLoops | $O(n^2)$ | $O(n)$
StoreLinksOnNodes | $O(n \cdot m)$ | $O(n)$
getOtherEqualProperty | $O(n^2)$ $\Omega(n^2)$ | $O(n^2)$ $\Omega(n)$

## Run Using Docker
Pull image: `docker pull ghcr.io/webvowl/webvowl:legacy`  

Or use the [docker compose file](/docker-compose.yml) with command `docker-compose up -d`

<details>
<summary>Building the docker image</summary>
Make sure you are inside the `WebVOWL` directory and you have Docker installed.  
Run the following command to build the docker image:

`docker build . -t webvowl:legacy_dev`

Run the following command to run WebVOWL at port 8080.

`docker-compose up -d`
</details>

Visit [http://localhost:8080](http://localhost:8080) to use WebVOWL.

## Development setup

### Simple
1. Clone the project locally
2. Download and install Node.js from http://nodejs.org/download/
3. Open the terminal in the `WebVOWL` directory
4. Run `npm install` to install the dependencies and build the project
5. Run `npm run webserver` to start a local live-updating webserver with the current development version

Visit [http://localhost:3000](http://localhost:3000) to use WebVOWL.

### Advanced ###
1. Install Maven from https://maven.apache.org/download.cgi  
Now you can run `mvn package` to build the project war file into the deploy directory (recommended over the grunt builds)

3. Instead of the last step of the simple setup, install the npm package `grunt-cli` globally with `npm install grunt-cli -g`.  
Now you can execute a few more advanced commands in the terminal:

* `grunt` or `grunt release` builds the release files into the deploy directory
* `grunt package` builds the development version
* `grunt webserver` starts a local live-updating webserver with the current development version
* `grunt test` starts the test runner
* `grunt zip` builds the project and puts it into a zip file


Additional information
----------------------

To export the VOWL visualization to an SVG image, all css styles have to be included into the SVG code.
This means that if you change the CSS code in the `vowl.css` file, you also have to update the code that
inlines the styles - otherwise the exported SVG will not look the same as the displayed graph.

The tool which creates the code that inlines the styles can be found in the util directory. Please
follow the instructions in its [README](util/VowlCssToD3RuleConverter/README.md) file.
