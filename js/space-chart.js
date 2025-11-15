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
const spaceWidth = 1200;
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
  "#9c3cb4",
  "#0082c8",
  "#f58231",
  "#46f0f0",
  "#e6d53c",
  "#0d4211",
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

const pressed = {};
let isMouseOverVisualization = false;

const acceleration = 0.1;
const friction = 0.92;
const maxSpeed = 15;

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
      .range([2, 100]); //TODO: tweak if needed

    const backgroundSizeScale = d3
      .scaleSqrt()
      .domain([
        d3.min(vis.nodes, (d) => d.playerCount),
        d3.max(vis.nodes, (d) => d.playerCount),
      ])
      .range([10, 110]); //TODO: tweak if needed

    // brightness scale based on positive percentual
    const opacityScale = d3
      .scaleLinear()
      .domain([
        d3.min(vis.nodes, (d) => d.positive_percentual),
        d3.max(vis.nodes, (d) => d.positive_percentual),
      ])
      .range([0, 1]);

    // scale for different genres
    const genreColorScale = d3.scaleOrdinal().domain(topGenres).range(myColors);

    vis.svg = d3
      .select("body")
      .append("svg")
      .attr("width", spaceWidth + spaceMargin.left + spaceMargin.right)
      .attr("height", spaceHeight)
      .style("background", "#0e1321"); // maybe do an actual space image in the future

    vis.g = vis.svg.append("g");

    vis.cameraScale = 13; // always zoomed-in

    vis.updateCamera = function () {
      // We want the ship centered
      const cx = spaceWidth / 2;
      const cy = spaceHeight / 2;

      // Move galaxy so that ship is at the center
      const tx = cx - spaceship.x * vis.cameraScale;
      const ty = cy - spaceship.y * vis.cameraScale;

      vis.g.attr(
        "transform",
        `translate(${tx}, ${ty}) scale(${vis.cameraScale})`
      );

      vis.updateTooltip();
    };

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

    vis.g.append("g").attr("class", "nodeRects");
    vis.g.append("g").attr("class", "nodeCircles");

    const nodeRect = vis.g
      .select("g.nodeRects")
      .selectAll("rect")
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
    const nodeCircle = vis.g
      .select("g.nodeCircles")
      .selectAll("circle")
      .data(vis.nodes)
      .join("circle")
      .attr("r", (d) => vis.sizeScale(d.playerCount))
      .attr("fill", (d) => {
        if (d.genres.includes("Indie")) {
          return `hsl(163, 97%, 41%)`;
        } else {
          return `hsl(320, 94%, 57%)`;
        }
      })
      .attr("opacity", (d) => opacityScale(d.positive_percentual));

    const nodesByCluster = d3.group(vis.nodes, (d) => d.cluster);

    const clusterGroup = vis.g
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
      .attr("font-size", "1rem")
      .attr("font-weight", "bold")
      .attr("stroke", "#000")
      .attr("stroke-width", 2)
      .attr("paint-order", "stroke")
      .text((d) => d);

    vis.tooltipGroup = vis.svg
      .append("g")
      .attr("transform", `translate(${spaceWidth / 2}, ${spaceHeight - 40})`);

    vis.tooltipBg = vis.tooltipGroup
      .append("rect")
      .attr("x", -100)
      .attr("y", -20)
      .attr("width", 200)
      .attr("height", 40)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", "rgba(0,0,0,0.7)"); // semi-transparent dark background

    vis.tooltipText = vis.tooltipGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#fff")
      .attr("font-family", "sans-serif")
      .attr("font-size", "20px");

    // draw teh spaceship
    vis.spaceshipGraphic = vis.svg
      .append("polygon")
      .attr("points", "0,-20 12,10 0,5 -12,10") // game spaceship arrow
      .attr("fill", "#fff")
      .attr("transform", `translate(${spaceWidth / 2}, ${spaceHeight / 2})`);

    spaceship.vx = 0;
    spaceship.vy = 0;

    const handleMouseEnter = () => {
      isMouseOverVisualization = true;
      vis.svg.node().focus();
    };

    const handleMouseLeave = () => {
      isMouseOverVisualization = false;
      Object.keys(pressed).forEach(key => {
        pressed[key] = false;
      });
      spaceship.vx = 0;
      spaceship.vy = 0;
    };

    vis.svg.on("mouseenter", handleMouseEnter);
    vis.svg.on("mouseleave", handleMouseLeave);
    d3.select("body").on("mouseenter", handleMouseEnter);
    d3.select("body").on("mouseleave", handleMouseLeave);

    vis.svg.attr("tabindex", "0").style("outline", "none");

    d3.select("body").on("keydown", (event) => {
      if (isMouseOverVisualization && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        pressed[event.key] = true;
      }
    });

    d3.select("body").on("keyup", (event) => {
      if (isMouseOverVisualization && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        if (holdTime[event.key] !== undefined) {
          holdTime[event.key] = 0;
        }
        pressed[event.key] = false;
      }
    });

    // for ship trail
    vis.trailPoints = [];
    const trailLength = 20;

    vis.trail = vis.svg
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5);

    // for smooth acceleration
    const holdTime = {
      ArrowUp: 0,
      ArrowDown: 0,
      ArrowLeft: 0,
      ArrowRight: 0,
    };

    d3.interval(() => {
      vis.trailPoints.push({ x: spaceship.x, y: spaceship.y });
      if (vis.trailPoints.length > trailLength) vis.trailPoints.shift();

      // Convert to scaled coordinates for camera
      const pathData = d3
        .line()
        .x((d) => spaceWidth / 2 + (d.x - spaceship.x) * vis.cameraScale)
        .y((d) => spaceHeight / 2 + (d.y - spaceship.y) * vis.cameraScale)
        .curve(d3.curveBasis)(vis.trailPoints);

      vis.trail.attr("d", pathData);

      let dx = 0;
      let dy = 0;

      for (const key in holdTime) {
        if (pressed[key]) {
          holdTime[key] += 1; // 1 tick = 16ms
        } else {
          holdTime[key] = 0;
        }
      }

      if (isMouseOverVisualization) {
        if (pressed["ArrowUp"]) dy -= acceleration;
        if (pressed["ArrowDown"]) dy += acceleration;
        if (pressed["ArrowLeft"]) dx -= acceleration;
        if (pressed["ArrowRight"]) dx += acceleration;
      }

      // normalize diagonal movement (so speed is consistent)
      if (dx !== 0 && dy !== 0) {
        const s = Math.sqrt(0.5); // ~0.707
        dx *= s;
        dy *= s;
      }

      spaceship.vx += dx;
      spaceship.vy += dy;

      spaceship.vx *= friction;
      spaceship.vy *= friction;

      const speed = Math.sqrt(spaceship.vx ** 2 + spaceship.vy ** 2);
      if (speed > maxSpeed) {
        spaceship.vx = (spaceship.vx / speed) * maxSpeed;
        spaceship.vy = (spaceship.vy / speed) * maxSpeed;
      }

      // apply movement
      spaceship.x += spaceship.vx;
      spaceship.y += spaceship.vy;

      // get angle
      let angle = Math.atan2(spaceship.vy, spaceship.vx) * (180 / Math.PI) + 90;
      vis.spaceshipGraphic.attr(
        "transform",
        `translate(${spaceWidth / 2}, ${spaceHeight / 2}) rotate(${angle})`
      );

      // update camera
      vis.updateCamera();
    }, 16);
  }

  updateTooltip() {
    let vis = this;

    const hoverRadius =
      (Math.max(spaceship.w, spaceship.h) / 2 + 5) / vis.cameraScale;

    const hovered = vis.nodes.find((d) => {
      const dx = d.x - spaceship.x;
      const dy = d.y - spaceship.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < hoverRadius + vis.sizeScale(d.playerCount);
    });

    vis.tooltipText.selectAll("tspan").remove();

    if (hovered) {
      const lines = [
        `${hovered.id}`,
        `Current Players: ${hovered.playerCount}`,
        ` ${hovered.genres.includes("Indie") ? "Indie" : "Studio"}`,
      ];

      lines.forEach((line, i) => {
        vis.tooltipText
          .append("tspan")
          .text(line)
          .attr("x", 0) // center relative to parent <text>
          .attr("dy", i === 0 ? "0em" : "1.2em") // spacing between lines
          .attr("text-anchor", "middle");
      });

      vis.tooltipGroup.attr(
        "transform",
        `translate(${spaceWidth / 2}, ${spaceHeight - 80})`
      );

      vis.tooltipBg.attr("height", 80).attr("width", 500).attr("x", -250);
    } else {
      vis.tooltipText
        .append("tspan")
        .text("Hover a node...")
        .attr("x", 0)
        .attr("dy", "0em")
        .attr("text-anchor", "middle");

      vis.tooltipGroup.attr(
        "transform",
        `translate(${spaceWidth / 2}, ${spaceHeight - 40})`
      );

      vis.tooltipBg.attr("height", 40).attr("width", 200).attr("x", -100);
    }
  }
}
