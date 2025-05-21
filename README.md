# WebVOWL Legacy

The legacy branch mirrors the [original WebVOWL](https://github.com/VisualDataWeb/WebVOWL) in look and feel.  
Behind the scenes, however, a lot has been done to reduce loading time and memory consumption.

## Changes from the original WebVOWL

Performance is measured using a Windows 11 Home HP ENVY Laptop 13 with 8 GB of RAM and a Intel(R) Core(TM) i5-10210U CPU running Firefox v136.0.1 (64-bit) on the following inputs:

| Shorthand |        Full name         |      Type       |           Size            | Version  |                              URL                              |
| :-------: | :----------------------: | :-------------: | :-----------------------: | :------: | :-----------------------------------------------------------: |
|   FOAF    |    Friend of a Friend    |    Ontology     |     $n=70$,<br>$m=50$     | 20140114 |     [Download](http://xmlns.com/foaf/spec/20140114.html)      |
|   ENVO    | The Environment Ontology |    Ontology     |  $n=12387$,<br>$m=7038$   | 5/2/2025 | [Download](https://bioportal.bioontology.org/ontologies/ENVO) |
|   YAGO    |    YAGO, tiny version    | Knowledge Graph | $n=166425$,<br>$m=132882$ |   4.5    |     [Download](https://yago-knowledge.org/data/yago4.5/)      |

where:  
$~~~~~~~~$ $n=\text{edges}$,  
$~~~~~~~~$ $m=\text{nodes}$

Comparisons were completed using the Firefox Profiler to measure the same operation, with and without the described improvement, and each measurement has been repeated 3 times and averaged. The speedup is then given by the time difference, $\frac{\text{original time}}{\text{new time}}$ $=$ speedup.

### Significant performance improvements

| Improvement                       | Time complexity<br>(original $\rightarrow$ new)                            | Load Time Improvement<br>(input: original/new)                                          |
| :-------------------------------- | :------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| CountAndSetLayers                 | $O(n^2) \rightarrow O(n)$                                                  | FOAF: $1.5s/0.6s=2.5$<br>ENVO: $631.7s/594.9s=1.06$<br>YAGO: $\text{DNC}^*$             |
| CountAndSetLoops                  | $O(n^2) \rightarrow O(n)$                                                  | FOAF: $1.5s/1.6s=0.94$<br>ENVO: $631.7s/407.2s=1.55$<br>YAGO: DNC                       |
| GetOtherEqualProperty             | $O(n^2) \rightarrow O(n^2)$<br>$\Omega(n^2) \rightarrow \Omega(n)^\dagger$ | FOAF: $1.5s/2.0=0.75$<br>ENVO: $631.7s/564.0s=1.12$<br>YAGO: DNC                        |
| StoreLinksOnNodes                 | $O(n \cdot m) \rightarrow O(n+m)$                                          | FOAF: $1.5s/2.0s=0.75$<br>ENVO: $631.7s/494.5s=1.28$<br>YAGO: DNC                       |
| CombineClassesOrProperties        | $O(\beta^2) \rightarrow O(\beta)$                                          | FOAF: $1.5s/2.4s=0.63$<br>ENVO: $631.7s/546.4s=1.16$<br>YAGO: DNC                       |
| MergeRangesOfEquivalentProperties | $O(n^2 \cdot \epsilon) \rightarrow O(n \cdot \epsilon)$                    | FOAF: $1.5s/0.9s=1.67$<br>ENVO: $631.7s/282.7s=2.23$<br>YAGO: DNC                       |
| $\text{SubclassFilter}^\ddagger$  | $O(n \cdot (n+m)) \rightarrow O(n^2+m)$                                    | FOAF: $0.2s/0.2s=1$<br>ENVO: $63.8s/0.6s=106.33$<br>YAGO: $\text{DNC}/7.6s$             |
| $\text{Search}^\ddagger$          | $O(k \cdot t(f-t+1)) \rightarrow O(\tau)^\S$                               | FOAF: $7.33ms/5.66ms=1.3$<br>ENVO: $51.33ms/23.66ms=2.17$<br>YAGO: $\text{DNC}/88.67ms$ |
| All changes                       |                                                                            | FOAF: $1.5s/0.23s=6.52$<br>ENVO: $631.7s/1.23s=513.58$<br>YAGO: $\text{DNC}/18.7s$      |

where:  
$~~~~~~~~$ $^*$ DNC (Did Not Complete) used when the loading time exceeded 20 minutes.  
$~~~~~~~~$ $^\dagger$ Best-/average-case.  
$~~~~~~~~$ $^\ddagger$ Result is feature runtime, not overall loading time.  
$~~~~~~~~$ $^\S$ Average-case.  
$~~~~~~~~$ $n=\text{edges}$.  
$~~~~~~~~$ $m=\text{nodes}$.  
$~~~~~~~~$ $\beta=\text{the largest amount of either classes or properties}$.  
$~~~~~~~~$ $\epsilon=\text{the equivalents of each property including itself}$.  
$~~~~~~~~$ $k=\text{string array of node and edge names}$.  
$~~~~~~~~$ $f=\text{string of a node or edge name}$.  
$~~~~~~~~$ $t=\text{string of the search term}$.  
$~~~~~~~~$ $\tau=\lvert w_s\rvert+\sum_{i=1}^{\lvert W_g\rvert} \lvert w_i\rvert - \lvert w_s\rvert$.

### Reduced memory usage

| Input | Peak memory usage<br>(original/all changes) | Reduced by |
| :---: | :-----------------------------------------: | :--------: |
| FOAF  |                22.8MB/15.1MB                |  $34\\%$   |
| ENVO  |               524MB/227.33MB                |  $57\\%$   |
| YAGO  |                 DNC/3.95GB                  |            |

## Run Using Docker

Pull image: `docker pull ghcr.io/webvowl/webvowl-legacy:latest`

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
2. Install Node.js from http://nodejs.org/download/
3. Install Maven from https://maven.apache.org/download.cgi
4. Open the terminal in the `WebVOWL` directory

Now you can execute these commands:

- `npm run webserver` to start a local live-updating webserver in development mode
- `npm run release` builds the release files into the deploy directory

Visit [http://localhost:8080](http://localhost:8080) to use WebVOWL.

## Additional information

To export the VOWL visualization to an SVG image, all css styles have to be included into the SVG code.
This means that if you change the CSS code in the `vowl.css` file, you also have to update the code that
inlines the styles - otherwise the exported SVG will not look the same as the displayed graph.

The tool which creates the code that inlines the styles can be found in the `VowlCssToD3RuleConverter` directory. Please
follow the instructions in its [README](src/VowlCssToD3RuleConverter/README.md) file.
