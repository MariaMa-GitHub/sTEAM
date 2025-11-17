
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
    .text("Choose your team! (hover)")
    .attr("transform", "translate(" + (width / 2) + ", 0)")
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "14px");

let leftTeam = svg.append("g")
    .attr("class", "left-team")
    .attr("transform", "translate(0, 50)");

leftTeam.append("text")
    .attr("class", "left-team-text")
    .text("Multiplayer (Choose me!)")
    .attr("x", width / 4)
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "14px");

let rightTeam = svg.append("g")
    .attr("class", "right-team")
    .attr("transform", "translate(0, 50)");

rightTeam.append("text")
    .attr("class", "right-team-text")
    .text("Non-multiplayer")
    .attr("x", 3 * width / 4)
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "14px");

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
		updateVisualization(0);
	}
});

// Load data
function loadData() {
	d3.csv("data/games.csv").then(csv=> {
		data = csv;
	});
}

loadData();

function updateVisualization(selection) {
    let multiplayerData = data.filter(d => d.categories.includes('Multi-player'));
    let nonmultiplayerData = data.filter(d => (d.categories.includes('Multi-player')) == false);
    let cooperativeData = multiplayerData.filter(d => d.categories.includes('Co-op'));
    let competitiveData = multiplayerData.filter(d => d.categories.includes('PvP'));

    let numIndieMultiplayer = 0;
    let numNonindieMultiplayer = 0;
    let numIndieNonmultiplayer = 0;
    let numNonindieNonmultiplayer = 0;
    let numIndieCooperative = 0;
    let numNonindieCooperative = 0;
    let numIndieCompetitive = 0;
    let numNonindieCompetitive = 0;

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

    let selectionsIndieLeft = [numIndieMultiplayer, numIndieCooperative];
    let selectionsNonindieLeft = [numNonindieMultiplayer, numNonindieCooperative];
    let selectionsIndieRight = [numIndieNonmultiplayer, numIndieCompetitive];
    let selectionsNonindieRight = [numNonindieNonmultiplayer, numNonindieCompetitive];

    if (selection == 0) {
        let leftPlayer = leftTeam.selectAll("image")
            .data(multiplayerData);

        // Enter
        leftPlayer.enter().append("image")
            .attr("class", "left-player")
            .merge(leftPlayer)
            .attr("x", (d, index) => (index % 30) * width / 60 - 15)
            .attr("y", (d, index) => Math.floor(index / 30) * height / 30 + margin.top)
            .attr("width", 16)
            .attr("height", 16)
            .attr("xlink:href", d => {
                if (d.genres.includes('Indie'))
                    return icons[0]
                else
                    return icons[1]
            });

        leftPlayer.exit().remove();

        let rightPlayer = rightTeam.selectAll("image")
            .data(nonmultiplayerData);

        // Enter
        rightPlayer.enter().append("image")
            .attr("class", "right-player")
            .merge(rightPlayer)
            .attr("x", (d, index) => (index % 30) * width / 60 + width / 2 + 15)
            .attr("y", (d, index) => Math.floor(index / 30) * height / 30 + margin.top)
            .attr("width", 16)
            .attr("height", 16)
            .attr("xlink:href", d => {
                if (d.genres.includes('Indie'))
                    return icons[0]
                else
                    return icons[1]
            });

        rightPlayer.exit().remove();
    }
    else {
        leftPlayer = leftTeam.selectAll("image")
            .data(cooperativeData);

        // Enter
        leftPlayer.enter().append("image")
            .attr("class", "left-player")
            .merge(leftPlayer)
            .attr("x", (d, index) => (index % 30) * width / 60 - 15)
            .attr("y", (d, index) => Math.floor(index / 30) * height / 30 + margin.top)
            .attr("width", 16)
            .attr("height", 16)
            .attr("xlink:href", d => {
                if (d.genres.includes('Indie'))
                    return icons[0]
                else
                    return icons[1]
            });

        leftPlayer.exit().remove();

        let rightPlayer = rightTeam.selectAll("image")
            .data(competitiveData);

        // Enter
        rightPlayer.enter().append("image")
            .attr("class", "right-player")
            .merge(rightPlayer)
            .attr("x", (d, index) => (index % 30) * width / 60 + width / 2 + 15)
            .attr("y", (d, index) => Math.floor(index / 30) * height / 30 + margin.top)
            .attr("width", 16)
            .attr("height", 16)
            .attr("xlink:href", d => {
                if (d.genres.includes('Indie'))
                    return icons[0]
                else
                    return icons[1]
            });

        rightPlayer.exit().remove();
    }

    leftTeam.append("rect")
        .attr("width", width / 2)
        .attr("height", height / 2)
        .style("opacity", 0)
        .on("mousemove", function (event, d) {            
            d3.selectAll(".left-player")
                .transition()
                .duration(200)
                .attr("width", 20)
                .attr("height", 20);

            tooltip
                .style("opacity", 1)
                .style("left", event.pageX - 50 + "px")
                .style("top", event.pageY - 500 + "px")
                .html(`
                    <div style="border: black; border-radius: 1px; background: #2a2a3e; padding: 10px">
                        <h4> Number of indie games: ${selectionsIndieLeft[selection]}</h4>      
                        <h4> Number of non-indie games: ${selectionsNonindieLeft[selection]}</h4>                      
                    </div>`);
        })
        .on("mouseout", function () {
            d3.selectAll(".left-player")
                .transition()
                .duration(200)
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

            d3.selectAll(".left-team-text")
                .transition()
                .duration(1000)
                .text("Cooperative")

            d3.selectAll(".right-team-text")
                .transition()
                .duration(1000)
                .text("Competitive")

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
                .on("click", function () {
                    d3.selectAll(".left-team-text")
                        .transition()
                        .duration(1000)
                        .text("Multiplayer (Choose me!)")
                    
                    d3.selectAll(".right-team-text")
                        .transition()
                        .duration(1000)
                        .text("Non-multiplayer")

                    updateVisualization(0)

                    d3.selectAll(".back")
                        .style("opacity", 0)
                })
                    
            updateVisualization(1);
        });

    rightTeam.append("rect")
        .attr("x", width / 2)
        .attr("width", width / 2)
        .attr("height", height / 2)
        .style("opacity", 0)
        .on("mousemove", function (event, d) {            
            d3.selectAll(".right-player")
                .transition()
                .duration(200)
                .attr("width", 20)
                .attr("height", 20);

            tooltip
                .style("opacity", 1)
                .style("left", event.pageX - 50 + "px")
                .style("top", event.pageY - 500 + "px")
                .html(`
                    <div style="border: black; border-radius: 1px; background: #2a2a3e; padding: 10px">
                        <h4> Number of indie games: ${selectionsIndieRight[selection]}</h4>      
                        <h4> Number of non-indie games: ${selectionsNonindieRight[selection]}</h4>                      
                    </div>`);
        })
        .on("mouseout", function () {
            d3.selectAll(".right-player")
                .transition()
                .duration(200)
                .attr("width", 16)
                .attr("height", 16);
            
            tooltip
                .style("opacity", 0)
                .style("left", 0)
                .style("top", 0)
                .html(``);
        });
}