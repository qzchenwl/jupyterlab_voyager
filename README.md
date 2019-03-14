# jupyterlab_voyager

A JupyterLab MIME renderer extension to view CSV and JSON data in [Voyager 2](https://github.com/vega/voyager#voyager-2).

## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install @qzchenwl/jupyterlab_voyager
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

