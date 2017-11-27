function main() {
	var synsets = {}
	var uri = new URI();
	var config = {};
 	
 	//   load config file
 	$.ajax({
        url: "config.json",
        async: false,
        dataType: 'json',
        success: function(data) {
           config = data;
        }
    });

 	// function to initially set things up
	function initialSetup() {
		listSources()

		// just for cosmetics of the code, i guess
		var queries	= uri.search(true)
		var fragment = uri.fragment();
	
		if ($(window).width() > 768) {
			setElDimensions($("#synsets"))
			setElDimensions($("#theContent"))
			$("#synsets, #theContent").perfectScrollbar();
		}
	
		$('[data-toggle="tooltip"]').tooltip(); 
	
		// preventing default submit (refresh of the page) on search form
		$("#search").on("submit", function(e) {
			e.preventDefault();
			onSearchButt();
		})
	
		// event listener for back/forth browser movement
		window.addEventListener('popstate', function(e) {
			popGuai(e.state)
		});
	
		// find out if resource in url is valid (found in config), if not, silently fall back to default (0th) resource
		urlSrcValid = 0
		i = 0
		while (config.sources[i]) {
			if (config.sources[i][1]==queries.source) {
				urlSrcValid = 1
			}
			i++
		}
		if (urlSrcValid != 1) {
			$("#data-source-selection").val(config.sources[0][1])
			uri.setSearch({source: config.sources[0][1]})
		}
		else {
			$("#data-source-selection").val(queries.source)
		}

		// set default vis if url doesn't contain valid (found in config) visualization mode
		if (! config.visualizations.includes(queries.vis)) {
			uri.setSearch({vis: config.visualizations[0]})
		}
	
		// initial decision whether we show empty start page or start searching (in case user wants to restore the page)
		if (! queries.input) {
			hideContent(true)
			$("#emptySearch").show()
		}
		else {
			$("#search-input").val(queries.input)
			search()
		}
	}

	function listSources() {
		var i = 0;
		while (i<config.sources.length) {
			$("#data-source-selection").append("<option value=" + config.sources[i][1] + ">" + config.sources[i][0] + "</option>")
			i++
		}
	}

	function getData(coalback) {
		$.ajax({
			url: config.server[0] + uri.search(true).source + config.server[1] + uri.search(true).input,
			beforeSend: function(xhr){
				// we should encode it first
				console.log(config.server[0] + uri.search(true).source + config.server[1] + uri.search(true).input)
				if (xhr.overrideMimeType)
				{
					xhr.overrideMimeType("application/json");
				}
			},
		dataType: 'json',
		success: coalback,
		error: function(e, xhr, settings) {
			console.log("Ajax error:", e)
			hideContent(true);
			$("#ajaxError").show()
		},
		complete: function(e, xhr, settings) {
			console.log("Ajax operation completed with status code " + e.status )
		},
		});
	}

	// converting ems to px: https://chrissilich.com/blog/convert-em-size-to-pixels-with-jquery/
	function setElDimensions(el) {
		var topOffset = 0, safetyConstant = 0;
		if ($(window).width() > 768) {
			topOffset = $(el).offset().top;
			safetyConstant = 1*(parseFloat($("body").css("font-size")))
		}
		// $(el).css({"width": "100%"})
		el.height($(window).height()-(topOffset+safetyConstant));
	}

	// run on search button press
	function onSearchButt() {
		uri.setSearch({input: $("#search-input").val(), source: $("#data-source-selection").val()});
		
		// if user is dumb and pressed search on empty input
		if (! uri.search(true).input) {
			hideContent(true)
			$("#emptySearch").show()
			return false;
		}
		
		search();
		// why is this return false here?
		return false;
	}

	function pushGuai(newParameters) { 
		// we should pass some string into the "title" newParameters, but as of 2017 everybody ignores it
		// change the title according to the new search
		var title = "RAW viewer - search " + uri.search(true).input + " in " + uri.search(true).source + " (" + uri.search(true).vis + ")"
		$(document).prop('title', title);
		newState = {queries: uri.search(true), fragment: uri.fragment()}
		console.log("pushing new state: ", newState.queries, newState.fragment)
		window.history.pushState({queries: uri.search(true), fragment: uri.fragment()}, null, uri)
	}

	// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
	// seems very dirty but there might not be a better way as what we need is this:
	// when returning to saved state, it is necessary to rerun the functions that got us into that state (search, showWord, etc.).
	// This wouldn't be a problem if we were willing to do an ajax request (search) on every move, but that's nonsense, since we have mostly all the data we need. (but not trivially accessible, probably)
	// One solution would be a global variable, but so far we got around without them, so storing the data in the browser history seems like a better idea. This is, however, subject to be discussed and changed for better, let's hope.
	// might be doable via switch and checking for string to know what function we want to run.. there's not that many of them
	// data = dict from browser historyAPI
	function popGuai(data) {
		if (! data) {
			hideContent(true)
			$("#emptySearch").show()
			return false;
		}
		console.log("poping old state:\n", data.queries)
		var historicQueries = data.queries;
		var historicFragment = data.fragment;

		if ((historicQueries.input !== uri.search(true).input) || (historicQueries.source !== uri.search(true).source)) {
			uri.setSearch(historicQueries);
			uri.fragment(historicFragment);
			search();
		}
		else if (historicQueries.vis !== uri.search(true).vis) {
			uri.setSearch(historicQueries);
			chooseView();
		}
		else if (historicFragment !== uri.fragment()) {
			uri.fragment(historicFragment);
			updateSynsetList();
			chooseView();
		}
	};

	// show/hide some content and proceed with the ajax call
	function search() {
		hideContent(true);
		$("#ajaxLoader").show();
		$("#search-input").val(uri.search(true).input);
		getData(populateHTML.bind(null));
	}

	// hide/show the main content when search, show loader...
	// way = bool (whether we're going from hiding main content or to it, not sure which is which anymore)
	function hideContent(way) {
		if (way == true) {
			$("#theContent-alt").children().hide()
			$(".kitty").hide()
			$(".schrodinger").show()
		}
		else {
			$(".schrodinger").hide()
			$(".kitty").show()
		}
	}

	function updateSynsetList() {
		$("#synsets > .active").removeClass("active");
		$("#synsets > #" + uri.fragment()).addClass("active");
	}

	// write down the list of found synsets
	function listSynsets() {

		// 1st empty the place to prevent cumulating the lines
		var list = $("#synsets");
		list.empty()
		
		// delete all existing and append a new event listener to the whole div and let the clicks from links propagate; 
		// also prevent default (click) and stop them from further propagation; 
		// on click remove the .active class from wherever it is and append it to the clicked link; 
		// then push new state
		$("#synsets, #settings").off();
		$("#synsets, #settings").on("click", function(e) {
			if (e.target !== e.currentTarget) {
				e.preventDefault();
				if (e.target.id == "text-rep") {
					if (uri.search(true).vis !== "text") {
						uri.setSearch({vis:"text"})
						pushGuai()
						chooseView()
					}
				}
				else if (e.target.id == "dendr-rep") {
					if (uri.search(true).vis !== "graph") {
						uri.setSearch({vis:"graph"})
						pushGuai()
						chooseView()
					}
				}
				else {
					uri.fragment(e.target.id)
					pushGuai()
					updateSynsetList()
					chooseView();
				}
			}
			e.stopPropagation();
		});

		// potential to break due to multiple places where wordID is assigned as elID (see elsewhere)
		$.each(synsets, function(id, synset) {
			list.append('<a href="#' + id + '" class="list-group-item" id="' + id + '">(' + synset.pos +") " + synString(synset.synset) + '</a>')
		})

		// add the active class on first load (when restoring state or initially after search)
		$("#" + uri.fragment()).addClass("active")
	}

	// callback from ajax;
	// converts returned array to dict, lists synsets in sidebar and then shows word in main
	// wordID = string (with ID, usually empty), wordsArr = arr from ajax
	// why the hell are the arguments other way round when called via bind?! (the one from ajax is evidently always last)
	function populateHTML(wordsArr) {
		synsets = {};
		// by default, let's display first word
		if (typeof wordsArr !== 'undefined' && wordsArr.length > 0) {
			hideContent(false);
			
			// convert the array with synsets to object/dick where we can reference the synsets by their ids

			$.each(wordsArr, function(i, obj) {
				synsets[obj.id] = obj;
			})

			// number of found synsets (in case we need it)
			// console.log(Object.keys(synsets).length);

			// this usually means that user hasn't clicked anything in sidebar yet
			// or the ID is invalid for some reason (we should report that)
			// it's kinda breaking the app anyway, because the id doesnt get pushed to the URL automatically. BUG I guess
			// var wordID = ""
			if (!uri.fragment() || !synsets[uri.fragment()]) {
				// wordID = wordsArr[0].id;
				uri.fragment(wordsArr[0].id)
			}

			pushGuai();

			// write synsets to sidebar
			listSynsets();

			// write word details into main
			// showWord(synsets[wordID])
			chooseView()
		}
		else {
			hideContent(true);
			$("#wordNotFound").show();
			// pushGuai()
		}
	}

	// convert array with words into a string delimited by ", "
	// synset = array
	function synString(synset, linking) {
		var synString = "";
		$.each(synset, function(i, synWord) {
			if (i < synset.length - 1) {
				comma = ", "
			}
			else {
				comma = ""
			}

			if (linking) {
				// beware of the c-acc class, it's just an ugly hack for main word for now
				synString += "<a href=\"?input=" + synWord.name + "\" id=\"" + synWord.name + "\" class=\"synset-links\">" + synWord.name + "</a><sup>" + synWord.meaning + "</sup>" + comma;
			}
			else {
				synString += synWord.name + "<sup>" + synWord.meaning + "</sup>" + comma;
			}
		});
		return synString;
	}

	function chooseView() {
		// fires even when returning from popstate
		if (uri.search(true).vis == "text" || uri.search(true).vis == undefined) {
			$("#WNTree").hide();
			$("#theContent").show();
			showWord(synsets[uri.fragment()]);
		}
		else if (uri.search(true).vis == "graph") {
			$("#theContent").hide();
			$("#WNTree").show();
			WNTree(synsets[uri.fragment()]);
		}
	}

	// let's show the details of selected word!
	// word = object/dict
	function showWord(word) {
		// WNTree(word);
		$("#wordPOS").html(word.pos);
		$("#wordID").html("<a href=\"?input=" + word.id + "\" id=\"" + word.id + "\" class=\"synset-links\">" + word.id + "</a>");
		// $("#wordID").html(word.id);
		$("#wordMain").html(synString(word.synset, true));
		$("#wordDef").html(word.def);

		// $("#WNTree").empty();
		$("#paths").empty();
		$("#semGroups > .row").empty();
		
		

		// write the path (breadcrumbs) to the word (this looks a bit to similiar with the synString fc)
		$.each(word.paths, function(i, path) {
			$("#paths").append('<div class="breadcrumbs properties" id="breadcrumb-' + i + '">')
			$.each(path.breadcrumbs, function(j, breadcrumb) {
				
				if (j < path.breadcrumbs.length-1) {
					var arrow = "➡ "
				}
				else {
					var arrow = ""
				}
				// this has potential to break because it's at least a second place where we use word ID as an element ID without additional string (because it's used as search query on click)
				// we might wanna fix this by prepending a uniq-ish string and stripping it later.. if it proves to break anyway
				$("#breadcrumb-" + i).append('<a href="?input=' + breadcrumb.id + '" id="' + breadcrumb.id + '" class="path-item">' + synString(breadcrumb.synset) + '</a> ' + arrow);
			});
		});

		// event listeners
		// using .one() is a shitty way of going around a problem when the event listeners where being exponentially stuck up on each other resulting in a very annoying amount of ajax requests
		// btw i have no idea why this kept happening, but God bless .one() and .off() (they might be slightly redundant, but .one() wasn't enough, somethings looping the shit )
		$("#theContent").off()
		$("#theContent").on("click", function(e) {
			if (   e.target.className == "path-item" 
				|| e.target.className == "synset-links" 
				|| e.target.className == "list-group-item") {
				e.preventDefault();
				var src = $("#data-source-selection").val();
				uri.setSearch({input: e.target.id, source: src})
				pushGuai()
				search();
				// pushGuai({input: e.target.id, source: src}, {"fn":"search", "arg":[e.target.id, src]}, false)
			}
			e.stopPropagation();
		});

		// write the columns with related synsets
		$.each(word.children, function(i, relation) {
			if (relation.name !== "hyperCat") {
				$("#semGroups > .row").append('<div class="sem-rels col-lg-4 col-md-6 col-sm-6 col-xs-12" id="semGroup-' + i + '">\n\
					<h4 class="yon c-acc b600" id="semGroups-head-' + i + '">' + relation.name + '</h4>\n\
					<ul class="list-group" id="list-col-' + i + '">\n'
					);

				$.each(relation.children, function(j, synset) {
					$('#list-col-' + i).append('<a href="?input=' + synset.id + '" id="' + synset.id + '" class="list-group-item">' + synString(synset.synset) + '</a>');
				});
			};
		});
	}

	// function to draw a tree of the synset
	function WNTree(data) {
		var iter = 0;
		var semgrIt = 1;
		var points = [];
		var cons = [];
		var nodeStack = [];

		

		function addToNodesAndEdges(name, currentID, parentID, nodeType, edgeType) {
			switch(nodeType) {
				case "synset": 
					points.push({"id": currentID, "label": "synset\n" + name, "group": "synsets"}); 
					cons.push({"from": parentID, "to": currentID, "length": 80});
					break;
				case "leaf": 
					points.push({"id": currentID, "label": name, "group": "leaves"});
					cons.push({"from": parentID, "to": currentID, "label": "member\nword", "dashes": true});
					break;
				case "semGroup": 
					points.push({"id": currentID, "label": name, "group": "semgroup"});
					cons.push({"from": parentID, "to": currentID, "label": "semantic\nrelationship", "arrows": "to", "width": 3});
					break;
				case "root": 
					points.push({"id": currentID, "label": name, "group": "root"});
					// cons.push({"from": parentID, "to": currentID, "label": "semantic\nrelationship", "arrows": "to", "width": 3});
					break
				case "rootLeaf": 
					points.push({"id": currentID, "label": name, "group": "rootLeaf"});
					cons.push({"from": parentID, "to": currentID, "label": "member\nword", "dashes": true});
					break;
				default: 
					points.push({"id": currentID, "label": name});
					cons.push({"from": parentID, "to": currentID});
					break
			}
		}

		function DFSThruSynsets(obj, parentI) {
			iter++;

			// this means it's a synset, not a group name (eg. meronyms) or a leaf word
			if (obj.id) {
				// that would be the root node
				if (iter == 1) {
					addToNodesAndEdges(obj.id, iter, parentI, "root", "")
				}
				else {
					addToNodesAndEdges(obj.id, iter, parentI, "synset", "")
				}
				
			}
			// leaves
			else if (obj.name && !obj.children) {
				if (parentI == 1) {
					addToNodesAndEdges(obj.name, iter, parentI, "rootLeaf", "")
				}
				else {
					addToNodesAndEdges(obj.name, iter, parentI, "leaf", "")
				}
			}
			else if (obj.children.length > 0) {
				addToNodesAndEdges(obj.name, iter, parentI, "semGroup", "")
			}

			// the function would throw an exception if we didn't test this, otherwise it's nothing
			if (obj.children) {
				$.each(obj.children, function(i, child) {
					if (child.name !== "hyperCat") {
						nodeStack.push({obj: child, parentI: iter})
					}
				});
			}
			if (obj.synset) {
				$.each(obj.synset, function(i, word) {
					nodeStack.push({obj: word, parentI: iter})
				});
			};

			// recursion, yay!
			if (nodeStack[0]) {
				out = nodeStack.pop();
				// console.log(nodeStack)
				DFSThruSynsets(out.obj, out.parentI)
			}
		};

		DFSThruSynsets(data, iter);

		// non-recursive implementation
		// nodeStack.push({obj: data, parentI: 0})
		// while (nodeStack[0]) {
		// 	console.log(nodeStack)
		// 	out = nodeStack.shift()
		// 	BFSThruSynsets(out.obj, out.parentI)
		// }

		var nodes = new vis.DataSet(points);
		var edges = new vis.DataSet(cons);

		// create a network
		var wntreecontainer = document.getElementById('stromcik');
		setElDimensions($("#stromcik"));
		var dataVis = {
		  nodes: nodes,
		  edges: edges
		};
		
		var options = {
		        layout: {
		            // hierarchical: {
		            //     direction: "LR",
		            //     sortMethod: "directed"
		            // },
		            randomSeed:2
		        },
		        interaction: {
		        	dragNodes :false,
		            navigationButtons: true,
		            keyboard: true
		        },
		        // "edges": {
		        //     "smooth": {
		        //       "forceDirection": "none"
		        //     }
		        //   },
	          	"physics": {
		            "barnesHut": {
		              "avoidOverlap": 0.99,
		              "gravitationalConstant": -2300,
		              // "springLength": 50,
		            },
		            // "hierarchicalRepulsion": {
		            // 	"damping": 0.09
		            // },
		            "minVelocity": 0.75,
		            "timestep": 0.9,

					stabilization: {
	                    enabled:true,
	                    iterations:1000,
	                    updateInterval:25
	                }	            
		        },
		        nodes: {
		            shape: 'box',
		            font: {
		                size: 14,
		                color: '#3f3f3f',
		                strokeWidth: 3, 
		                strokeColor: 'white',
		                face: 'akrobat'
		            },
		            borderWidth: 2,
		            color: {
		            	background: '#d7d7f3',
		            	border: '#3030a9',
		            },
		            // i totally dont get this
		            // scaling: {
		            //       min: 10,
		            //       max: 50,
		            //       label: {
		            //         enabled: false,
		            //         min: 14,
		            //         max: 20,
		            //         maxVisible: 20,
		            //         drawThreshold: 10
		            //       },
		            // },
		            
		        },
		        groups: {
		        	synsets: {
		        		shape: 'diamond',
		        		size: 5
		        	},
		        	semgroup: {
		        		shape: 'triangle',
		        		size: 5,
		        		font: {
		        			size: 18
		        		}
		        	},
		        	root: {
		        		shape: 'dot',
		        		size: '8',
		        		color: '#a93030',
		        		font: {
		        			size: 18
		        		}
		        	},
		        	rootLeaf: {
		        		// shape: 'dot',
		        		// size: '8',
		        		// color: 'red',
		        		font: {
		        			strokeWidth: 0,
		        			size: 18
		        		},
		        		color: {
		        			background: '#f3d7d7',
		        			border: '#a93030'
		        		}
		        	},
		        	leaves: {
		        		font: {
		        			// color: '#ff00ff',
		        			strokeWidth: 0,
		                	// strokeColor: 'black'
		        		}
		        	}
		        },
		        edges: {
		        	font: {
		        		align: 'middle',
		                face: 'akrobat'
		        	},
		        	"smooth": {
		        	  "forceDirection": "none"
		        	}
		        }
		    };
		
		var network = new vis.Network(wntreecontainer, dataVis, options);
		// network.fit({offset: {x: 1300, y: 300}}); // why doesn't this work
		document.getElementById('loadingBar').style.display = 'block';
		// console.log("loader shown")
		network.on("stabilizationProgress", function(params) {
	        var parentDim = {w: $("#WNTree").width(), h: $("#WNTree").height()}
	        var minWidth = 20;
	        var maxWidth = parentDim.w-(parentDim.w*0.1);
	        var widthFactor = params.iterations/params.total;
	        var width = Math.max(minWidth,maxWidth * widthFactor);

	        $("#loadingBarBar").css({top: parentDim.h/2, left: (parentDim.w/2)-maxWidth/2, width: maxWidth});
	        $("#loadingBarInner").width(width);
	        $("#loadingBarText").html(Math.round(widthFactor*100) + ' %');
	        // console.log("stabilization in progress", width, widthFactor, params.total)
	    });
	    network.once("stabilizationIterationsDone", function() {
	    	network.stopSimulation()
	        // console.log("stabilization in done")

	        $("#loadingBarInner").css({width: "100%"})
	        $("#loadingBarText").html("100 %")
	        $("#loadingBar").fadeOut(300)
	        // really clean the dom element
	        // setTimeout(function () {document.getElementById('loadingBar').style.display = 'none';}, 500);
	    });
	};

	initialSetup();
}