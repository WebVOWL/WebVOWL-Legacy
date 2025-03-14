# WebVOWL Legacy
> [!NOTE]
> We are developing two flavours of WebVOWL: [WebVOWL Rust](https://github.com/WebVOWL/WebVOWL-Rust) and [WebVOWL Legacy](https://github.com/WebVOWL/WebVOWL-Legacy)

The legacy branch mirrors the [original WebVOWL](https://github.com/VisualDataWeb/WebVOWL) closely with the exception of some changes highligted below.

## Changes from the original WebVOWL
### Significant performance improvements
> [!NOTE]
> Profiling was done using:
> - HP ENVY Laptop 13-aq1xxx (Windows 11 Home)
> - Intel(R) Core(TM) i5-10210U
> - 8 GB RAM
> -  The Firefox profiler running Firefox v136.0.1 (64-bit)
>
> The ontology profiled is [ENVO](https://github.com/EnvironmentOntology/envo) (7k nodes, 12k edges)


Improvement | Original Complexity | Improved Complexity | Load Time Improvement (original/new)
:---: | :---: | :---: | :---:
CountAndSetLayers | $O(n^2)$ | $O(n)$ | $803s/385s=2.09$
CountAndSetLoops | $O(n^2)$ | $O(n)$ | $803s/271s=2.96$
StoreLinksOnNodes | $O(n \cdot m)$ | $O(n)$ | $803s/474s=1.69$
getOtherEqualProperty | $O(n^2)$ $\Omega(n^2)$ | $O(n^2)$ $\Omega(n)$ | $803s/355s=2.26$
Combined fixes | | | $803s/6s=133.83$

where:  
$~~~~~~~~$ $n=\text{edges}$,  
$~~~~~~~~$ $m=\text{nodes}$ 

## Run Using Docker
Pull image: `docker pull ghcr.io/webvowl/webvowl-legacy:v1.2.8`  

Or use the [docker compose file](/docker-compose.yml) with command `docker-compose up -d`

<details>
<summary>Building the docker image</summary>
Make sure you are inside the `WebVOWL` directory and you have Docker installed.

Run the following command to build the docker image:

`docker build . -t webvowl:legacy_dev`
</details>

Visit [http://localhost:8080](http://localhost:8080) to use WebVOWL.

## Development setup
> [!NOTE]
> The [OWL2VOWL converter](https://github.com/VisualDataWeb/OWL2VOWL) is not supported on the local development server

1. Clone the project locally
2. Download and install Node.js from http://nodejs.org/download/
3. Open the terminal in the `WebVOWL` directory
4. Run `npm install` to install dependencies

Now you can execute these commands in the terminal:
* `npm run webserver` to start a local live-updating webserver with the current development version
* `grunt` or `grunt release` builds the release files into the deploy directory
* `grunt package` builds the development version
* `grunt test` starts the test runner
* `grunt zip` builds the project and puts it into a zip file

Visit [http://localhost:8000](http://localhost:8000) to use WebVOWL.

## Additional information
To export the VOWL visualization to an SVG image, all css styles have to be included into the SVG code.
This means that if you change the CSS code in the `vowl.css` file, you also have to update the code that
inlines the styles - otherwise the exported SVG will not look the same as the displayed graph.

The tool which creates the code that inlines the styles can be found in the util directory. Please
follow the instructions in its [README](util/VowlCssToD3RuleConverter/README.md) file.
