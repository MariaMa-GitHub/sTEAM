
// SVG drawing area

let margin = {top: 20, right: 20, bottom: 20, left: 20};

let width = 1200 - margin.left - margin.right;
let height = 700 - margin.top - margin.bottom;

const icons = ['./red-person.png', './blue-person.png'];

let svg = d3.select("#game-lobby").append("svg")
    .attr("class", "main-lobby")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("text")
    .attr("class", "heading")
    .text("Pick your side! (click on the sides that say '(Choose me!)' to explore more)")
    .attr("transform", "translate(" + (width / 2) + ", 0)")
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "14px");

// Add sort option
svg.append("text")
    .attr("class", "sort")
    .attr("x", width - 50)
    .attr("y", 0)
    .text("Sort")
    .attr("fill", "#66c0f4")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "14px")
    .attr("cursor", "pointer");

let leftSide = svg.append("g")
    .attr("class", "left-side")
    .attr("transform", "translate(0, 50)");

leftSide.append("text")
    .attr("class", "left-side-text")
    .text("Multiplayer (Choose me!)")
    .attr("x", width / 4)
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "14px");

let rightSide = svg.append("g")
    .attr("class", "right-side")
    .attr("transform", "translate(0, 50)");

rightSide.append("text")
    .attr("class", "right-side-text")
    .text("Non-multiplayer")
    .attr("x", 3 * width / 4)
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "14px");

// Add back option to go back to previous selection
    svg.append("text")
        .attr("class", "back")
        .attr("x", width - 50)
        .attr("y", height - 50)
        .text("Back")
        .attr("fill", "#66c0f4")
        .attr("font-family", "ui-monospace, 'Courier New', monospace")
        .attr("font-size", "14px")
        .attr("cursor", "pointer")
        .style("opacity", 0);

// Legend
let indieLegend = svg.append("g")
    .attr("transform", "translate(50, " + (height - 50) + ")");

indieLegend.append("text")
    .text("Indie:")
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "12px")
    .attr("y", 10);

indieLegend.append("image")
    .attr("width", 16)
    .attr("height", 16)
    .attr('xlink:href', icons[0])
    .attr("x", 75);

let nonIndieLegend = svg.append("g")
    .attr("transform", "translate(50, " + (height - 25) + ")");

nonIndieLegend.append("text")
    .text("Non-indie:")
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "12px")
    .attr("y", 10);

nonIndieLegend.append("image")
    .attr("width", 16)
    .attr("height", 16)
    .attr('xlink:href', icons[1])
    .attr("x", 75);

// append tooltip
tooltip = d3.select("#game-lobby").append('div')
    .attr('class', "tooltip")
    .style("opacity", 0)
    .style("background-color", "#2a2a3e")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")

Object.defineProperty(window, 'data', {
	get: function() { return _data; },
	set: function(value) {
		_data = value;
		updateVisualization(0, 0, 0);
	}
});

// Load data
function loadData() {
	d3.csv("data/games.csv").then(csv=> {
		data = csv;
	});
}

loadData();

function updateVisualization(selection1, selection2, sortIndex) {
    let multiplayerData = data.filter(d => d.categories.includes('Multi-player'));
    let nonmultiplayerData = data.filter(d => (d.categories.includes('Multi-player')) == false);
    let cooperativeData = multiplayerData.filter(d => d.categories.includes('Co-op'));
    let competitiveData = multiplayerData.filter(d => d.categories.includes('PvP'));
    let onlinecoopData = cooperativeData.filter(d => d.categories.includes('Online Co-op'));
    let couchcoopData = cooperativeData.filter(d => d.categories.includes('Shared/Split Screen Co-op'));
    let onlinepvpData = competitiveData.filter(d => d.categories.includes('Online PvP'));
    let couchpvpData = competitiveData.filter(d => d.categories.includes('Shared/Split Screen PvP'));

    let sortFunctions = [compare1, compare2];

    if (sortIndex > 0) {
        multiplayerData.sort(sortFunctions[sortIndex - 1])
        nonmultiplayerData.sort(sortFunctions[sortIndex - 1])
        cooperativeData.sort(sortFunctions[sortIndex - 1])
        competitiveData.sort(sortFunctions[sortIndex - 1])
        onlinecoopData.sort(sortFunctions[sortIndex - 1])
        couchcoopData.sort(sortFunctions[sortIndex - 1])
        onlinepvpData.sort(sortFunctions[sortIndex - 1])
        couchpvpData.sort(sortFunctions[sortIndex - 1])
    }

    let numIndieMultiplayer = 0;
    let numNonindieMultiplayer = 0;
    let numIndieNonmultiplayer = 0;
    let numNonindieNonmultiplayer = 0;
    let numIndieCooperative = 0;
    let numNonindieCooperative = 0;
    let numIndieCompetitive = 0;
    let numNonindieCompetitive = 0;
    let numIndieOnlinecoop = 0;
    let numNonindieOnlinecoop = 0;
    let numIndieCouchcoop = 0;
    let numNonindieCouchcoop = 0;
    let numIndieOnlinepvp = 0;
    let numNonindieOnlinepvp = 0;
    let numIndieCouchpvp = 0;
    let numNonindieCouchpvp = 0;

    // Aggregation
    for (let i = 0; i < multiplayerData.length; i++) {
        if (multiplayerData[i].genres.includes('Indie')) {
            numIndieMultiplayer++;
        }
        else {
            numNonindieMultiplayer++;
        }
    }

    for (let i = 0; i < nonmultiplayerData.length; i++) {
        if (nonmultiplayerData[i].genres.includes('Indie')) {
            numIndieNonmultiplayer++;
        }
        else {
            numNonindieNonmultiplayer++;
        }
    }

    for (let i = 0; i < cooperativeData.length; i++) {
        if (cooperativeData[i].genres.includes('Indie')) {
            numIndieCooperative++;
        }
        else {
            numNonindieCooperative++;
        }
    }

    for (let i = 0; i < competitiveData.length; i++) {
        if (competitiveData[i].genres.includes('Indie')) {
            numIndieCompetitive++;
        }
        else {
            numNonindieCompetitive++;
        }
    }
    for (let i = 0; i < onlinecoopData.length; i++) {
        if (onlinecoopData[i].genres.includes('Indie')) {
            numIndieOnlinecoop++;
        }
        else {
            numNonindieOnlinecoop++;
        }
    }
    for (let i = 0; i < onlinepvpData.length; i++) {
        if (onlinepvpData[i].genres.includes('Indie')) {
            numIndieOnlinepvp++;
        }
        else {
            numNonindieOnlinepvp++;
        }
    }
    for (let i = 0; i < couchcoopData.length; i++) {
        if (couchcoopData[i].genres.includes('Indie')) {
            numIndieCouchcoop++;
        }
        else {
            numNonindieCouchcoop++;
        }
    }
    for (let i = 0; i < couchpvpData.length; i++) {
        if (couchpvpData[i].genres.includes('Indie')) {
            numIndieCouchpvp++;
        }
        else {
            numNonindieCouchpvp++;
        }
    }

    let selectionsLabelLeft = [["Multiplayer (Choose me!)"], ["Cooperative (Choose me!)"], ["Online Co-op", "Online PvP"]];
    let selectionsLabelRight = [["Non-multiplayer"], ["Competitive (Choose me!)"], ["Couch Co-op", "Couch PvP"]];
    let selectionsLeft = [[multiplayerData], [cooperativeData], [onlinecoopData, onlinepvpData]];
    let selectionsRight = [[nonmultiplayerData], [competitiveData], [couchcoopData, couchpvpData]];
    let selectionsIndieLeft = [[numIndieMultiplayer], [numIndieCooperative], [numIndieOnlinecoop, numIndieOnlinepvp]];
    let selectionsNonindieLeft = [[numNonindieMultiplayer], [numNonindieCooperative], [numNonindieOnlinecoop, numNonindieOnlinepvp]];
    let selectionsIndieRight = [[numIndieNonmultiplayer], [numIndieCompetitive], [numIndieCouchcoop, numIndieCouchpvp]];
    let selectionsNonindieRight = [[numNonindieNonmultiplayer], [numNonindieCompetitive], [numNonindieCouchcoop, numNonindieCouchpvp]];

    let leftPlayer = leftSide.selectAll("image")
        .data(selectionsLeft[selection1][selection2]);

    // Enter
    leftPlayer.enter().append("image")
        .attr("class", "left-player")
        .merge(leftPlayer)
        .attr("x", (d, index) => (index % 30) * width / 60 - 15)
        .attr("width", 16)
        .attr("height", 16)
        .attr("xlink:href", d => {
            if (d.genres.includes('Indie'))
                return icons[0]
            else
                return icons[1]
        })
        .attr("y", 0)
        .transition()
        .duration(1000)
        .attr("y", (d, index) => Math.floor(index / 30) * height / 30 + margin.top);

    leftPlayer.exit().remove();

    let rightPlayer = rightSide.selectAll("image")
        .data(selectionsRight[selection1][selection2]);

    // Enter
    rightPlayer.enter().append("image")
        .attr("class", "right-player")
        .merge(rightPlayer)
        .attr("x", (d, index) => (index % 30) * width / 60 + width / 2 + 15)
        .attr("width", 16)
        .attr("height", 16)
        .attr("xlink:href", d => {
            if (d.genres.includes('Indie'))
                return icons[0]
            else
                return icons[1]
        })
        .attr("y", 0)
        .transition()
        .duration(1000)
        .attr("y", (d, index) => Math.floor(index / 30) * height / 30 + margin.top);

    rightPlayer.exit().remove();

    let leftRect = leftSide.append("rect")
        .attr("width", width / 2)
        .attr("height", height / 2)
        .style("opacity", 0)
        .on("mousemove", function (event, d) {            
            d3.selectAll(".left-player")
                .attr("width", 20)
                .attr("height", 20);

            tooltip
                .style("opacity", 1)
                .style("left", event.pageX - 200 + "px")
                .style("top", event.pageY - 500 + "px")
                .html(`
                    <div style="border: black; border-radius: 1px; background: #2a2a3e; padding: 10px">
                        <h4> Number of indie games: ${selectionsIndieLeft[selection1][selection2]}</h4>      
                        <h4> Number of non-indie games: ${selectionsNonindieLeft[selection1][selection2]}</h4>                      
                    </div>`);
        })
        .on("mouseout", function () {
            d3.selectAll(".left-player")
                .attr("width", 16)
                .attr("height", 16);

            tooltip
                .style("opacity", 0)
                .style("left", 0)
                .style("top", 0)
                .html(``);
        })
        .on("click", function (d) {
            tooltip
                .style("opacity", 0)
                .style("left", 0)
                .style("top", 0)
                .html(``);
            
            if (selection1 < 2) {
                d3.selectAll(".left-side-text")
                    .text(selectionsLabelLeft[selection1 + 1][selection2])

                d3.selectAll(".right-side-text")
                    .text(selectionsLabelRight[selection1 + 1][selection2])
                        
                svg.selectAll(".heading")
                    .text("Pick your side! (click on the sides that say '(Choose me!)' to explore more)")

                updateVisualization(selection1 + 1, selection2, sortIndex);
            }
            else {
                svg.selectAll(".heading")
                    .text("Side chosen: " + selectionsLabelLeft[selection1][selection2])
            }
        });

    svg.selectAll(".back")
        .on("click", function () {
            if (selection1 > 0) {
                d3.selectAll(".left-side-text")
                    .text(selectionsLabelLeft[selection1 - 1][0])
                
                d3.selectAll(".right-side-text")
                    .text(selectionsLabelRight[selection1 - 1][0])

                svg.selectAll(".heading")
                    .text("Pick your side! (click on the sides that say '(Choose me!)' to explore more)")

                updateVisualization(selection1 - 1, 0, sortIndex)
            }
        });

    if (selection1 == 0) {
        svg.selectAll(".back").style("opacity", 0);

    }
    else {
        svg.selectAll(".back").style("opacity", 1);
    }
    
    let rightRect = rightSide.append("rect")
        .attr("x", width / 2)
        .attr("width", width / 2)
        .attr("height", height / 2)
        .style("opacity", 0)
        .on("mousemove", function (event, d) {            
            d3.selectAll(".right-player")
                .attr("width", 20)
                .attr("height", 20);

            tooltip
                .style("opacity", 1)
                .style("left", event.pageX - 200 + "px")
                .style("top", event.pageY - 500 + "px")
                .html(`
                    <div style="border: black; border-radius: 1px; background: #2a2a3e; padding: 10px">
                        <h4> Number of indie games: ${selectionsIndieRight[selection1][selection2]}</h4>      
                        <h4> Number of non-indie games: ${selectionsNonindieRight[selection1][selection2]}</h4>                      
                    </div>`);
        })
        .on("mouseout", function () {
            d3.selectAll(".right-player")
                .attr("width", 16)
                .attr("height", 16);
            
            tooltip
                .style("opacity", 0)
                .style("left", 0)
                .style("top", 0)
                .html(``);
        })
        .on("click", function (d) {
            tooltip
                .style("opacity", 0)
                .style("left", 0)
                .style("top", 0)
                .html(``);

            if (selection1 == 1) {
                d3.selectAll(".left-side-text")
                    .text(selectionsLabelLeft[selection1 + 1][1])

                d3.selectAll(".right-side-text")
                    .text(selectionsLabelRight[selection1 + 1][1])
                        
                svg.selectAll(".heading")
                    .text("Pick your side! (click on the sides that say '(Choose me!)' to explore more)")
                
                updateVisualization(selection1 + 1, 1, sortIndex);
            }
            else {
                svg.selectAll(".heading")
                    .text("Side chosen: " + selectionsLabelRight[selection1][selection2])
            }
        });

    svg.selectAll(".sort")
        .on("click", function (d) {
            if (sortIndex < 2) {
                updateVisualization(selection1, selection2, sortIndex + 1)
            }
            else {
                updateVisualization(selection1, selection2, 0)
            }
        });
}

function compare1(a, b) {
    if (a.genres.includes('Indie') && !b.genres.includes('Indie')) {
        return -1
    }
    if (!a.genres.includes('Indie') && b.genres.includes('Indie')) {
        return 1
    }
    else {
        return 0
    }
}

function compare2(a, b) {
    if (!a.genres.includes('Indie') && b.genres.includes('Indie')) {
        return -1
    }
    if (a.genres.includes('Indie') && !b.genres.includes('Indie')) {
        return 1
    }
    else {
        return 0
    }
}