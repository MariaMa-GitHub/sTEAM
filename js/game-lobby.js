
// SVG drawing area

let margin = {top: 40, right: 10, bottom: 60, left: 60};

let width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

let svg = d3.select("#game-lobby").append("svg")
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
    .attr("font-size", "12px");

indieLegend.append("circle")
    .attr("r", 5)
    .attr("fill", "red")
    .attr("cx", 75);

let nonIndieLegend = svg.append("g")
    .attr("transform", "translate(50, " + (height - 25) + ")");

nonIndieLegend.append("text")
    .text("Non-indie:")
    .attr("text-anchor", "middle")
    .attr("fill", "#c7d5e0")
    .attr("font-family", "ui-monospace, 'Courier New', monospace")
    .attr("font-size", "12px");

nonIndieLegend.append("circle")
    .attr("r", 5)
    .attr("fill", "blue")
    .attr("cx", 75);

// Create a 'data' property under the window object
// to store the data
Object.defineProperty(window, 'data', {
	// data getter
	get: function() { return _data; },
	// data setter
	set: function(value) {
		_data = value;
        // update the visualization each time the data property is set by using the equal sign (e.g. data = [])
		updateVisualization()
	}
});

// Load CSV file
function loadData() {
	d3.csv("data/games.csv").then(csv=> {

		// Store csv data in global variable
		data = csv;
	});
}

// Initialize data
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

    leftPlayer = leftTeam.selectAll("circle")
        .data(cooperativeData);

    // Enter
    leftPlayer.enter().append("circle")
        .attr("class", "left-player")

    // Enter and Update
        .merge(leftPlayer)
        .attr("cx", (d, index) => (index % 30) * width / 60 - 15)
        .attr("cy", (d, index) => Math.floor(index / 30) * height / 30 + margin.top)
        .attr("r", 5)
        .attr("fill", d => {
            if (d.genres.includes('Indie'))
                return "red"
            else
                return "blue"
        });

    // Exit
    leftPlayer.exit().remove();

    let rightPlayer = rightTeam.selectAll("circle")
        .data(competitiveData);

    // Enter
    rightPlayer.enter().append("circle")
        .attr("class", "right-player")

    // Enter and Update
        .merge(rightPlayer)
        .attr("cx", (d, index) => (index % 30) * width / 60 + width / 2 + 15)
        .attr("cy", (d, index) => Math.floor(index / 30) * height / 30 + margin.top)
        .attr("r", 5)
        .attr("fill", d => {
            if (d.genres.includes('Indie'))
                return "red"
            else
                return "blue"
        });

    // Exit
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

// Render visualization
function updateVisualization() {
    let multiplayerData = data.filter(d => d.categories.includes('Multi-player'));
    let nonmultiplayerData = data.filter(d => (d.categories.includes('Multi-player')) == false);
    let cooperativeData = multiplayerData.filter(d => d.categories.includes('Co-op'));
    let competitiveData = multiplayerData.filter(d => d.categories.includes('PvP'));

    let leftPlayer = leftTeam.selectAll("circle")
		.data(multiplayerData);

	// Enter
	leftPlayer.enter().append("circle")
		.attr("class", "left-player")

	// Enter and Update
		.merge(leftPlayer)
		.attr("cx", (d, index) => (index % 30) * width / 60 - 15)
		.attr("cy", (d, index) => Math.floor(index / 30) * height / 30 + margin.top)
		.attr("r", 5)
		.attr("fill", d => {
            if (d.genres.includes('Indie'))
                return "red"
            else
                return "blue"
        });

	// Exit
	leftPlayer.exit().remove();

    let rightPlayer = rightTeam.selectAll("circle")
		.data(nonmultiplayerData);

	// Enter
	rightPlayer.enter().append("circle")
		.attr("class", "right-player")

	// Enter and Update
		.merge(rightPlayer)
		.attr("cx", (d, index) => (index % 30) * width / 60 + width / 2 + 15)
		.attr("cy", (d, index) => Math.floor(index / 30) * height / 30 + margin.top)
		.attr("r", 5)
		.attr("fill", d => {
            if (d.genres.includes('Indie'))
                return "red"
            else
                return "blue"
        });

	// Exit
	rightPlayer.exit().remove();

    leftTeam.append("rect")
        .attr("width", width / 2)
        .attr("height", height)
        .style("opacity", 0)
        .on("mouseover", function (d) {            
            d3.selectAll(".left-player")
                .transition()
                .duration(200)
                .attr("r", 7);
        })
        .on("mouseleave", function () {
            d3.selectAll(".left-player")
                .transition()
                .duration(200)
                .attr("r", 5 );
        })
        .on("click", function (d) {
            changeSelection(cooperativeData, competitiveData)
        });

    rightTeam.append("rect")
        .attr("x", width / 2)
        .attr("width", width / 2)
        .attr("height", height)
        .style("opacity", 0)
        .on("mouseover", function (d) {            
            d3.selectAll(".right-player")
                .transition()
                .duration(200)
                .attr("r", 7);
        })
        .on("mouseleave", function () {
            d3.selectAll(".right-player")
                .transition()
                .duration(200)
                .attr("r", 5 );
        });
}