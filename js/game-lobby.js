
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
tooltip = d3.select(".main-lobby").append('div')
    .attr('class', "tooltip")

Object.defineProperty(window, 'data', {
	get: function() { return _data; },
	set: function(value) {
		_data = value;
		updateVisualization();
	}
});

function loadData() {
	d3.csv("data/games.csv").then(csv=> {
		data = csv;
	});
}

loadData();

function changeSelection(cooperativeData, competitiveData) {
    d3.selectAll(".left-team-text")
        .transition()
        .duration(500)
        .text("Cooperative")

    d3.selectAll(".right-team-text")
        .transition()
        .duration(500)
        .text("Competitive")

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
            .duration(500)
            .text("Multiplayer (Choose me!)")
        
        d3.selectAll(".right-team-text")
            .transition()
            .duration(500)
            .text("Non-multiplayer")

        d3.selectAll(".back")
            .style("opacity", 0)

        updateVisualization()
    });
}

function updateVisualization() {
    let multiplayerData = data.filter(d => d.categories.includes('Multi-player'));
    let nonmultiplayerData = data.filter(d => (d.categories.includes('Multi-player')) == false);
    let cooperativeData = multiplayerData.filter(d => d.categories.includes('Co-op'));
    let competitiveData = multiplayerData.filter(d => d.categories.includes('PvP'));

    console.log(multiplayerData)

    let numIndieMultiplayer;
    let numNonindieMultiplayer;
    let numIndieNonmultiplayer;
    let numNonindieNonmultiplayer;
    let numIndieCooperative;
    let numNonindieCooperative;
    let numIndieCompetitive;
    let numNonindieCompetitive;

    for (let i = 0; i < multiplayerData; i++) {
        if (multiplayerData[i].genres.includes('Indie')) {
            numIndieMultiplayer++;
        }
        else {
            numNonindieMultiplayer++;
        }
    }

    for (let i = 0; i < nonmultiplayerData; i++) {
        if (nonmultiplayerData[i].genres.includes('Indie')) {
            numIndieNonmultiplayer++;
        }
        else {
            numNonindieNonmultiplayer++;
        }
    }

    for (let i = 0; i < cooperativeData; i++) {
        if (cooperativeData[i].genres.includes('Indie')) {
            numIndieCooperative++;
        }
        else {
            numNonindieCooperative++;
        }
    }

    for (let i = 0; i < competitiveData; i++) {
        if (competitiveData[i].genres.includes('Indie')) {
            numIndieCompetitive++;
        }
        else {
            numNonindieCompetitive++;
        }
    }

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

    leftTeam.append("rect")
        .attr("width", width / 2)
        .attr("height", height)
        .style("opacity", 0)
        .on("mousemove", function (event, d) {            
            d3.selectAll(".left-player")
                .transition()
                .duration(200)
                .attr("width", 20)
                .attr("height", 20);

            tooltip
                .style("opacity", 1)
                .style("left", event.pageX + 20 + "px")
                .style("top", event.pageY + "px")
                .html(`
                    <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                        <h4> Number of indie games: ${numIndieMultiplayer}</h4>      
                        <h4> Number of non-indie games: ${numNonindieMultiplayer}</h4>                      
                    </div>`);
        })
        .on("mouseleave", function () {
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
            changeSelection(cooperativeData, competitiveData)
        });

    rightTeam.append("rect")
        .attr("x", width / 2)
        .attr("width", width / 2)
        .attr("height", height)
        .style("opacity", 0)
        .on("mousemove", function (event, d) {            
            d3.selectAll(".right-player")
                .transition()
                .duration(200)
                .attr("width", 20)
                .attr("height", 20);

            tooltip
                .style("opacity", 1)
                .style("left", event.pageX + 20 + "px")
                .style("top", event.pageY + "px")
                .html(`
                    <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                        <h4> Number of indie games: ${numIndieNonmultiplayer}</h4>      
                        <h4> Number of non-indie games: ${numNonindieNonmultiplayer}</h4>                      
                    </div>`);
        })
        .on("mouseleave", function () {
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