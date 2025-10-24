let spacechart;
let minPlayers = 20;

// Data loading, doing this here to avoid a merge conflict
loadPlayerCountTable();

function loadPlayerCountTable() {
  Promise.all([
    d3.csv("data/steam_games.csv"),
    d3.csv("data/current_players.csv"),
  ]).then(([data1, data2]) => {
    // combine the two CSVs into one
    const currPlayers = new Map(
      data2.map((d) => [d.steam_appid, +d.current_player_count])
    );

    // create a new data table with id, name, genres, and player counts
    const mergedData = data1
      .filter((d1) => currPlayers.has(d1.steam_appid))
      .map((d1) => ({
        steam_appid: d1.steam_appid,
        gameName: d1.name,
        genres: parseGenres(d1.genres),
        playerCount: currPlayers.get(d1.steam_appid),
        positive_percentual: +d1.positive_percentual,
      }))
      .filter((d) => {
        return d.playerCount >= minPlayers;
      });

    console.log(mergedData);

    // init space chart
    spacechart = new SpaceChart(mergedData);
    spacechart.initVis();
  });
}

// using regex to parse the genres
function parseGenres(str) {
  if (!str) return [];
  return str
    .replace(/\[|\]|'/g, "") // remove brackets and quotes
    .split(",") // split by commas
    .map((g) => g.trim()) // trim spaces
    .filter(Boolean); // remove empty entries
}

//   ^                                                         ^
//   |                                                         |
//   |                                                         |
//    ------!!! everything above can be moved to main !!!------
// TODO: if someone uses this too, move to main

const spaceHeight = 700;
const spaceWidth = 800;
const spaceMargin = { top: 20, right: 40, bottom: 20, left: 40 };
const spacePadding = 80;
let topGenres = [
  "Action",
  "Adventure",
  "Simulation",
  "RPG",
  "Strategy",
  "Casual",
  "Racing",
]; // these are the top genres found from data exploration
const myColors = [
  "#e6194b",
  "#3cb44b",
  "#0082c8",
  "#f58231",
  "#46f0f0",
  "#f032e6",
  "#135021",
];
let spaceship = { x: spaceWidth / 2, y: spaceHeight / 2, w: 20, h: 20 };
const clusterCenters = {
  Action: { x: 400, y: 300 },
  Adventure: { x: 189, y: 350 },
  Simulation: { x: 530, y: 482 },
  RPG: { x: 180, y: 250 },
  Strategy: { x: 256, y: 427 },
  Casual: { x: 559, y: 150 },
  Racing: { x: 250, y: 90 },
};

const speed = 10;

class SpaceChart {
  constructor(data) {
    this._data = data;
  }

  initVis() {
    let vis = this;

    // nodes in graph
    vis.nodes = [];
    // links between nodes
    vis.links = [];

    vis.nodes = vis._data
      .filter(
        (d) =>
          d.genres && d.genres.length > 0 && topGenres.includes(d.genres[0])
      )
      .map((d) => ({
        id: d.gameName,
        genres: d.genres,
        playerCount: d.playerCount,
        positive_percentual: d.positive_percentual,
        cluster: d.genres[0], // just using first genre
      }));

    // size scale based on player count
    vis.sizeScale = d3
      .scaleSqrt()
      .domain([
        d3.min(vis.nodes, (d) => d.playerCount),
        d3.max(vis.nodes, (d) => d.playerCount),
      ])
      .range([1, 100]); //TODO: tweak if needed

    const backgroundSizeScale = d3
      .scaleSqrt()
      .domain([
        d3.min(vis.nodes, (d) => d.playerCount),
        d3.max(vis.nodes, (d) => d.playerCount),
      ])
      .range([10, 110]); //TODO: tweak if needed

    // brightness scale based on positive percentual
    const brightnessScale = d3
      .scaleLinear()
      .domain([
        d3.min(vis.nodes, (d) => d.positive_percentual),
        d3.max(vis.nodes, (d) => d.positive_percentual),
      ])
      .range([0, 0.8]);

    // scale for different genres
    const genreColorScale = d3.scaleOrdinal().domain(topGenres).range(myColors);

    vis.svg = d3
      .select("body")
      .append("svg")
      .attr("width", spaceWidth + spaceMargin.left + spaceMargin.right)
      .attr("height", spaceHeight)
      .style("background", "#222"); // maybe do an actual space image in the future

    // use force simulation to layout the nodes
    // pull to cluster centre x
    // pull to cluster centre y
    // repel from any other node
    // prevent overlap
    // prevent clusters from drifting off screen
    vis.simulation = d3
      .forceSimulation(vis.nodes)
      .force("x", d3.forceX((d) => clusterCenters[d.cluster].x).strength(0.5))
      .force("y", d3.forceY((d) => clusterCenters[d.cluster].y).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-10))
      .force(
        "collision",
        d3.forceCollide((d) => vis.sizeScale(d.playerCount) + 2)
      );

    const nodeRect = vis.svg
      .selectAll("rect.node-bg")
      .data(vis.nodes)
      .join("rect")
      .attr("class", "node-bg")
      .attr("width", (d) => backgroundSizeScale(d.playerCount) * 2)
      .attr("height", (d) => backgroundSizeScale(d.playerCount) * 2)
      .attr("x", (d) => d.x - vis.sizeScale(d.playerCount))
      .attr("y", (d) => d.y - vis.sizeScale(d.playerCount))
      .attr("fill", (d) => {
        const genre = d.genres.find((g) => topGenres.includes(g));
        return genreColorScale(genre);
      });
    // draw nodes then assign them to the simulation points
    const nodeCircle = vis.svg
      .selectAll("circle.node")
      .data(vis.nodes)
      .join("circle")
      .attr("r", (d) => vis.sizeScale(d.playerCount))
      .attr("fill", (d) => {
        const brightness = brightnessScale(d.positive_percentual) * 100;

        if (d.genres.includes("Indie")) {
          return `hsl(45, 100%, ${brightness}%)`;
        } else {
          return `hsl(275, 100%, ${brightness}%)`;
        }
      });

    const nodesByCluster = d3.group(vis.nodes, (d) => d.cluster);

    const clusterGroup = vis.svg
      .selectAll("g.cluster")
      .data(topGenres)
      .join("g")
      .attr("class", "cluster");

    vis.simulation.on("tick", () => {
      // update node positions
      nodeRect
        .attr("x", (d) => d.x - backgroundSizeScale(d.playerCount))
        .attr("y", (d) => d.y - backgroundSizeScale(d.playerCount));

      nodeCircle.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      // update cluster halos dynamically
      clusterGroup.selectAll("circle").attr("r", (d) => {
        const nodes = nodesByCluster.get(d) || [];
        if (!nodes.length) return 50; // fallback radius

        // compute max distance from center
        const maxDist = Math.max(
          ...nodes.map((n) => {
            const dx = n.x - clusterCenters[d].x;
            const dy = n.y - clusterCenters[d].y;
            return (
              Math.sqrt(dx * dx + dy * dy) + vis.sizeScale(n.playerCount) * 0.5
            ); // optional scaling
          })
        );

        // limit maximum radius if needed
        return Math.min(maxDist, 150); // set a hard max to prevent huge halos
      });
    });

    clusterGroup
      .append("text")
      .attr("x", (d) => clusterCenters[d].x)
      .attr("y", (d) => clusterCenters[d].y)
      .attr("fill", "#fff")
      .attr("text-anchor", "middle")
      .attr("font-size", "32px")
      .attr("font-weight", "bold")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("paint-order", "stroke")
      .text((d) => d);

    vis.tooltip = vis.svg
      .append("text")
      .attr("x", spaceWidth - 10)
      .attr("y", spaceHeight - 50)
      .attr("text-anchor", "end")
      .attr("fill", "#fff")
      .attr("font-family", "sans-serif")
      .attr("font-size", "20px")
      .text("Use arrow keys to control");

    // the tooltip
    vis.tooltip = vis.svg
      .append("text")
      .attr("x", spaceWidth - 10)
      .attr("y", spaceHeight - 10)
      .attr("text-anchor", "end")
      .attr("fill", "#fff")
      .attr("font-family", "sans-serif")
      .attr("font-size", "20px")
      .text("Hover a node...");

    // draw teh spaceship
    vis.spaceshipGraphic = vis.svg
      .append("rect")
      .attr("x", spaceship.x - spaceship.w / 2)
      .attr("y", spaceship.y - spaceship.h / 2)
      .attr("width", spaceship.w)
      .attr("height", spaceship.h)
      .attr("fill", "#fff");

    d3.select("body").on("keydown", (event) => {
      switch (event.key) {
        case "ArrowUp":
          spaceship.y -= speed;
          break;
        case "ArrowDown":
          spaceship.y += speed;
          break;
        case "ArrowLeft":
          spaceship.x -= speed;
          break;
        case "ArrowRight":
          spaceship.x += speed;
          break;
      }

      // Update spaceship position
      vis.spaceshipGraphic
        .attr("x", spaceship.x - spaceship.w / 2)
        .attr("y", spaceship.y - spaceship.h / 2);

      // Update tooltip
      vis.updateTooltip();
    });
  }

  updateTooltip() {
    let vis = this;

    const hovered = vis.nodes.find((d) => {
      const dx = d.x - spaceship.x;
      const dy = d.y - spaceship.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return (
        distance <
        Math.max(spaceship.w, spaceship.h) / 2 + vis.sizeScale(d.playerCount)
      );
    });

    if (hovered) {
      vis.tooltip.text(
        `${hovered.id} | Players: ${hovered.playerCount} | Indie: ${
          hovered.genres.includes("Indie") ? "Yes" : "No"
        }`
      );
    } else {
      vis.tooltip.text("Hover a node...");
    }
  }
  // i dont think i need an update vis?
}
