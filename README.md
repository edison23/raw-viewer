# RAW viewer

[*Responsivity Aware Wordnet viewer*](https://nlp.fi.muni.cz/~x399040/raw-viewer/rawviewer.html) is an interface for data of wordnets. It is built to help people use wordnets from various kinds of devices from computers to smartphones, thus it runs in a web browsers and doesn't require Java or Flash, only JavaScript. The interface allows users to search various wordnets by word or synset ID, to view found data in text mode or in graphical representation and even to search a particular synset across multiple wordnets.

## Interface files

The interface is composed of multiple files. Each has some purpose, some of which will be explained below.

`rawviewer.html`: the main page which is loaded by a browser and contains structure of the interface

`config.json`: configuration file

`scripts`: folder with JavaScript files that fill the HTML with dynamic data; folder contains a file `rawviewer.js` which is the main script of the interface

`css`: folder with cascade style sheets defining the looks of the interface

`img/network`: contains images used as navigation buttons in the graph representation

`akrobat-webfont`: a font for the interface

## API

The interface is built with support for an API which returns JSON data as an answer to a query from a user. The requests are sent and retrieved as an AJAX request and the answer must be structured in a compatible way as the following example of an answer (strings after doulble slashes are comments for a purpose of this Readme:

	[
	    { // first found synset
	        "id": "ENG20-02759263-n",
	        "pos": "n",
	        "def": "synset definition",
	        "synset": [ // synset details
	            {
	                "name": "kotouč",
	                "meaning": "2"
	            },
	            // ... other synset member words
	        ],
	        "paths": [ // paths to the synset
	            { // first (main) path
	                "name": "path-1",
	                "breadcrumbs": [
	                    { // first synset in the path
	                        "id": "ENG20-00020486-n",
	                        "def": "",
	                        "synset": [
	                            {
	                                "name": "abstrakce",
	                                "meaning": "1"
	                            }
	                        ]
	                    },
	                    // ... next synsets in the path
	                ],
	            },
	            // ... alternative paths
	        ],
	        "children": [ // synset's semantic relations
	            { // relace hyponymie
	                "name": "hyponym",
	                "children": [
	                    {
	                        "id": "ENG20-04050919-n",
	                        "def": "",
	                        "synset": [
	                            {
	                                "name": "člunek",
	                                "meaning": "1"
	                            },
	                        ]
	                    },
	                    // ... other synsets in this relation
	                ],
	            },
	            // ... other relations
	        ]
	    },
	    ... // other found synsets
	]

## Configuration

There is one configuration file named `config.json` where you can set multiple settings. When editing this file be careful to always provide valid JSON file (ie. e.g. no comments), otherwise the interface will fail silently and won't work.

### Server

Under the key ``server`` you can set the URL of the API where the requests for data must be sent. Currently the URL is split to two parts as there are two variables (a resource and a searched term) delimited by a non-variable string (*second part*). 

	"server":
		[
			"https://first-part-of-the-URL", "second part"
		]

### Visualizations

Under the key `visualizations` you can find and set available visualization modes of the interface. Currently the interface supports mentioned text and graph visuzalization. Any other would require additional implementation on the script side and the HTML side.

	"visualizations": ["text", "graph"]

### Resources

Under the key ``sources`` is a list of wordnets that are to be displayed in the interface for a user to search words in. Each item has two parts, first is a name which is to be displayed, second is a URL string which is understood by the API.

	"sources": 
		[
			["Czech wordnet", "wncz"],
			["English wordnet", "wneng"]
		]

