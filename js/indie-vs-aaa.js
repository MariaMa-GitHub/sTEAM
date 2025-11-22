let gameData = [];
let currentYear = "All";
let indieData = {};
let aaaData = {};
let currentHoveredMetric = null;
let hoveredElements = new Set();

const radarConfig = {
  width: 350,
  height: 350,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  levels: 5,
  maxValue: 100,
};

const metrics = [
  { key: "revenue", label: "$", name: "Revenue Generated", icon: "$" },
  { key: "rating", label: "♡", name: "Average Rating", icon: "♡" },
  { key: "games", label: "#", name: "Number of Games", icon: "#" },
  { key: "positive", label: "💕", name: "Positive Ratings", icon: "💕" },
  { key: "negative", label: "🖤", name: "Negative Ratings", icon: "🖤" },
  {
    key: "players",
    label: "👤",
    name: "Recent Player Count",
    icon: "👤",
  },
];
async function loadData() {
  try {
    const response = await fetch("data/games-2.csv");
    const csvText = await response.text();
    const rows = csvText.split("\n");
    const headers = rows[0].split(",");

    gameData = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim()) {
        const values = parseCSVRow(rows[i]);
        if (values.length >= headers.length) {
          const game = {};
          headers.forEach((header, index) => {
            game[header.trim()] = values[index]
              ? values[index].trim()
              : "";
          });

          game.total_reviews = parseInt(game.total_reviews) || 0;
          game.total_positive = parseInt(game.total_positive) || 0;
          game.total_negative = parseInt(game.total_negative) || 0;
          game.review_score = parseFloat(game.review_score) || 0;
          game.price_initial =
            parseFloat(game["price_initial (USD)"]) || 0;
          game.current_player_count =
            parseInt(game.current_player_count) || 0;
          game.is_free =
            game.is_free === "True" || game.is_free === "true";

          if (game.release_date && game.release_date !== "N/A") {
            const yearMatch = game.release_date.match(/(\d{4})/);
            game.release_year = yearMatch ? parseInt(yearMatch[1]) : null;
          } else {
            game.release_year = null;
          }

          game.isIndie = game.genres && game.genres.includes("Indie");

          gameData.push(game);
        }
      }
    }

    initializeVisualization();
  } catch (error) {
    console.error(error);
    createDummyData();
  }
}

function createDummyData() {
  gameData = [
    {
      isIndie: true,
      total_positive: 1000,
      total_negative: 100,
      review_score: 8.5,
      price_initial: 9.99,
      current_player_count: 500,
      release_year: 2020,
    },
    {
      isIndie: false,
      total_positive: 2000,
      total_negative: 200,
      review_score: 7.5,
      price_initial: 59.99,
      current_player_count: 1000,
      release_year: 2020,
    },
    {
      isIndie: true,
      total_positive: 500,
      total_negative: 50,
      review_score: 9.0,
      price_initial: 4.99,
      current_player_count: 200,
      release_year: 2021,
    },
    {
      isIndie: false,
      total_positive: 1500,
      total_negative: 150,
      review_score: 8.0,
      price_initial: 39.99,
      current_player_count: 800,
      release_year: 2021,
    },
  ];
  initializeVisualization();
}

function parseCSVRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function initializeVisualization() {
  createYearButtons();
  updateData();
  createRadarCharts();
  updateStatsBars();
}

function createYearButtons() {
  const years = new Set();
  gameData.forEach((game) => {
    if (
      game.release_year &&
      game.release_year >= 2016 &&
      game.release_year <= 2024
    ) {
      years.add(game.release_year);
    }
  });

  const sortedYears = Array.from(years).sort();
  const container = d3.select("#year-buttons");

  container.selectAll("*").remove();

  container
    .append("button")
    .attr("class", "year-button active")
    .text("All")
    .on("click", () => {
      currentYear = "All";
      updateYearButtons();
      updateData();
      updateRadarCharts();
      updateStatsBars();
    });

  sortedYears.forEach((year) => {
    container
      .append("button")
      .attr("class", "year-button")
      .text(year)
      .on("click", () => {
        currentYear = year;
        updateYearButtons();
        updateData();
        updateRadarCharts();
        updateStatsBars();
      });
  });
}

function updateYearButtons() {
  d3.selectAll(".year-button").classed("active", function () {
    return (
      d3.select(this).text() === currentYear.toString() ||
      (currentYear === "All" && d3.select(this).text() === "All")
    );
  });
}

function updateData() {
  let data = gameData;

  if (currentYear !== "All") {
    data = gameData.filter((game) => game.release_year === currentYear);
  }

  const indieGames = data.filter((game) => game.isIndie);
  const aaaGames = data.filter((game) => !game.isIndie);

  indieData = {
    revenue: calculateRevenue(indieGames),
    rating: calculateAverageRating(indieGames),
    games: indieGames.length,
    positive: indieGames.reduce(
      (sum, game) => sum + game.total_positive,
      0
    ),
    negative: indieGames.reduce(
      (sum, game) => sum + game.total_negative,
      0
    ),
    players: indieGames.reduce(
      (sum, game) => sum + game.current_player_count,
      0
    ),
  };

  aaaData = {
    revenue: calculateRevenue(aaaGames),
    rating: calculateAverageRating(aaaGames),
    games: aaaGames.length,
    positive: aaaGames.reduce(
      (sum, game) => sum + game.total_positive,
      0
    ),
    negative: aaaGames.reduce(
      (sum, game) => sum + game.total_negative,
      0
    ),
    players: aaaGames.reduce(
      (sum, game) => sum + game.current_player_count,
      0
    ),
  };
}

function calculateRevenue(games) {
  return games.reduce((sum, game) => {
    if (!game.is_free && game.price_initial > 0) {
      return sum + game.price_initial * game.total_positive;
    }
    return sum;
  }, 0);
}

function calculateAverageRating(games) {
  const withRatings = games.filter((game) => game.review_score > 0);
  if (withRatings.length === 0) return 0;

  const total = withRatings.reduce(
    (sum, game) => sum + game.review_score,
    0
  );
  return total / withRatings.length;
}

function createRadarCharts() {
  createRadarChart("indie-radar", indieData, "indie");
  createRadarChart("aaa-radar", aaaData, "aaa");
}

function createRadarChart(containerId, data, type) {

  const svg = d3.select(`#${containerId}`);
  svg.selectAll("*").remove();

  const width = radarConfig.width;
  const height = radarConfig.height;
  
  svg.attr("viewBox", `0 0 ${width} ${height}`)
     .attr("preserveAspectRatio", "xMidYMid meet");
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 50;

  const maxValues = {
    revenue: Math.max(indieData.revenue, aaaData.revenue),
    rating: Math.max(indieData.rating, aaaData.rating),
    games: Math.max(indieData.games, aaaData.games),
    positive: Math.max(indieData.positive, aaaData.positive),
    negative: Math.max(indieData.negative, aaaData.negative),
    players: Math.max(indieData.players, aaaData.players),
  };

  const normalizedData = metrics.map((metric) => {
    const val = data[metric.key];
    const max = maxValues[metric.key];
    return {
      ...metric,
      value: max > 0 ? (val / max) * 100 : 0,
      rawValue: val,
    };
  });

  const angleScale = d3
    .scaleLinear()
    .domain([0, metrics.length])
    .range([0, 2 * Math.PI]);

  const radiusScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, radius]);

  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${centerX}, ${centerY})`);

  for (let i = 1; i <= radarConfig.levels; i++) {
    chartGroup
      .append("circle")
      .attr("class", "radar-grid")
      .attr("r", (radius / radarConfig.levels) * i)
      .attr("fill", "none");
  }

  metrics.forEach((metric, i) => {
    const angle = angleScale(i);
    const x = Math.cos(angle - Math.PI / 2) * radius;
    const y = Math.sin(angle - Math.PI / 2) * radius;

    chartGroup
      .append("line")
      .attr("class", "radar-axis")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", x)
      .attr("y2", y);
  });

  const areaGenerator = d3
    .areaRadial()
    .angle((d, i) => angleScale(i))
    .innerRadius(0)
    .outerRadius((d) => radiusScale(d.value))
    .curve(d3.curveLinearClosed);

  chartGroup
    .append("path")
    .datum(normalizedData)
    .attr("class", `radar-area ${type}-area`)
    .attr("d", areaGenerator)
    .style("fill", type === "indie" ? "#ff6b9d" : "#4ecdc4")
    .style("fill-opacity", 0.3)
    .style("stroke", type === "indie" ? "#ff6b9d" : "#4ecdc4")
    .style("stroke-width", 2);

  chartGroup
    .selectAll(".radar-point")
    .data(normalizedData)
    .enter()
    .append("circle")
    .attr("class", `radar-point ${type}-point`)
    .attr("data-metric", (d) => d.key)
    .attr(
      "cx",
      (d, i) =>
        Math.cos(angleScale(i) - Math.PI / 2) * radiusScale(d.value)
    )
    .attr(
      "cy",
      (d, i) =>
        Math.sin(angleScale(i) - Math.PI / 2) * radiusScale(d.value)
    )
    .attr("r", 6)
    .style("fill", type === "indie" ? "#ff6b9d" : "#4ecdc4")
    .style("stroke", "#ffffff")
    .style("stroke-width", 3)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      hoveredElements.add(this);
      if (currentHoveredMetric !== d.key) {
        currentHoveredMetric = d.key;
        highlightMetric(d.key);
        updateStatsBars();
      }
      showTooltipsForMetric(d.key, event);
    })
    .on("mouseout", function() {
      hoveredElements.delete(this);
      setTimeout(() => {
        if (hoveredElements.size === 0 && currentHoveredMetric !== null) {
          currentHoveredMetric = null;
          unhighlightAll();
          updateStatsBars();
          hideTooltip();
        }
      }, 50);
    });

  chartGroup
    .selectAll(".radar-label")
    .data(normalizedData)
    .enter()
    .append("text")
    .attr("class", "radar-label")
    .attr("data-metric", (d) => d.key)
    .attr(
      "x",
      (d, i) => Math.cos(angleScale(i) - Math.PI / 2) * (radius + 20)
    )
    .attr(
      "y",
      (d, i) => Math.sin(angleScale(i) - Math.PI / 2) * (radius + 20)
    )
    .text((d) => d.icon)
    .style("font-size", "20px")
    .style("fill", type === "indie" ? "#ff6b9d" : "#4ecdc4")
    .on("mouseover", function (event, d) {
      hoveredElements.add(this);
      if (currentHoveredMetric !== d.key) {
        currentHoveredMetric = d.key;
        highlightMetric(d.key);
        updateStatsBars();
      }
      showTooltipsForMetric(d.key, event);
    })
    .on("mouseout", function () {
      hoveredElements.delete(this);
      setTimeout(() => {
        if (hoveredElements.size === 0 && currentHoveredMetric !== null) {
          currentHoveredMetric = null;
          unhighlightAll();
          updateStatsBars();
          hideTooltip();
        }
      }, 50);
    });
}

function highlightMetric(metricKey) {
  if (!metricKey) return;
  
  d3.selectAll(".radar-point")
    .filter(function() {
      return d3.select(this).attr("data-metric") === metricKey;
    })
    .each(function() {
      d3.select(this)
        .attr("r", 8)
        .style("filter", "drop-shadow(0 0 12px rgba(102, 192, 244, 1))")
        .style("stroke-width", 4)
        .classed("highlighted", true);
    });

  d3.selectAll(".radar-label")
    .filter(function() {
      return d3.select(this).attr("data-metric") === metricKey;
    })
    .each(function() {
      d3.select(this).style("font-size", "24px")
        .style("filter", "drop-shadow(0 0 12px rgba(255, 255, 255, 1))")
        .classed("highlighted", true);
    });
}

function unhighlightAll() {
  d3.selectAll(".radar-point")
    .attr("r", 6)
    .style("filter", null)
    .style("stroke-width", 3)
    .classed("highlighted", false);

  d3.selectAll(".radar-label")
    .style("font-size", "20px")
    .style("filter", null)
    .classed("highlighted", false);
}

function updateRadarCharts() {
  updateRadarChartData("indie-radar", indieData, "indie");
  updateRadarChartData("aaa-radar", aaaData, "aaa");
}

function updateRadarChartData(containerId, data, type) {
  const svg = d3.select(`#${containerId}`);
  const chartGroup = svg.select("g");

  const width = radarConfig.width;
  const height = radarConfig.height;
  
  svg.attr("viewBox", `0 0 ${width} ${height}`)
     .attr("preserveAspectRatio", "xMidYMid meet");
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 50;

  const maxValues = {
    revenue: Math.max(indieData.revenue, aaaData.revenue),
    rating: Math.max(indieData.rating, aaaData.rating),
    games: Math.max(indieData.games, aaaData.games),
    positive: Math.max(indieData.positive, aaaData.positive),
    negative: Math.max(indieData.negative, aaaData.negative),
    players: Math.max(indieData.players, aaaData.players),
  };

  const normalizedData = metrics.map((metric) => {
    const val = data[metric.key];
    const max = maxValues[metric.key];
    return {
      ...metric,
      value: max > 0 ? (val / max) * 100 : 0,
      rawValue: val,
    };
  });

  const angleScale = d3
    .scaleLinear()
    .domain([0, metrics.length])
    .range([0, 2 * Math.PI]);

  const radiusScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, radius]);

  const areaGenerator = d3
    .areaRadial()
    .angle((d, i) => angleScale(i))
    .innerRadius(0)
    .outerRadius((d) => radiusScale(d.value))
    .curve(d3.curveLinearClosed);

  chartGroup
    .select(`.radar-area.${type}-area`)
    .classed("smooth-transition", true);
  chartGroup
    .selectAll(`.radar-point.${type}-point`)
    .classed("smooth-transition", true);

  chartGroup
    .select(`.radar-area.${type}-area`)
    .datum(normalizedData)
    .attr("d", areaGenerator)
    .style("fill-opacity", 0.3);

  chartGroup
    .selectAll(`.radar-point.${type}-point`)
    .data(normalizedData)
    .attr("data-metric", (d) => d.key)
    .attr(
      "cx",
      (d, i) =>
        Math.cos(angleScale(i) - Math.PI / 2) * radiusScale(d.value)
    )
    .attr(
      "cy",
      (d, i) =>
        Math.sin(angleScale(i) - Math.PI / 2) * radiusScale(d.value)
    )
    .attr("r", 6);

  setTimeout(() => {
    chartGroup
      .select(`.radar-area.${type}-area`)
      .classed("smooth-transition", false);
    chartGroup
      .selectAll(`.radar-point.${type}-point`)
      .classed("smooth-transition", false);
  }, 500);
}

function updateStatsBars() {
  if (!currentHoveredMetric) {
    d3.select("#indie-stat").text("---");
    d3.select("#aaa-stat").text("---");

    d3.select(".indie-bar").classed("dominant", false);
    d3.select(".aaa-bar").classed("dominant", false);

    d3.select(".indie-bar .stat-bar-fill")
      .transition()
      .duration(300)
      .ease(d3.easeCubicInOut)
      .style("width", "0%");

    d3.select(".aaa-bar .stat-bar-fill")
      .transition()
      .duration(300)
      .ease(d3.easeCubicInOut)
      .style("width", "0%");
    return;
  }

  const indieValue = indieData[currentHoveredMetric] || 0;
  const aaaValue = aaaData[currentHoveredMetric] || 0;

  let indieFormatted, aaaFormatted;

  switch (currentHoveredMetric) {
    case "revenue":
      indieFormatted = `$${(indieValue / 1000000).toFixed(1)}M`;
      aaaFormatted = `$${(aaaValue / 1000000).toFixed(1)}M`;
      break;
    case "rating":
      indieFormatted = indieValue.toFixed(1);
      aaaFormatted = aaaValue.toFixed(1);
      break;
    case "games":
      indieFormatted = indieValue.toLocaleString();
      aaaFormatted = aaaValue.toLocaleString();
      break;
    case "positive":
    case "negative":
    case "players":
      indieFormatted = indieValue.toLocaleString();
      aaaFormatted = aaaValue.toLocaleString();
      break;
    default:
      indieFormatted = indieValue.toLocaleString();
      aaaFormatted = aaaValue.toLocaleString();
  }

  d3.select("#indie-stat").text(indieFormatted);
  d3.select("#aaa-stat").text(aaaFormatted);

  const maxValues = {
    revenue: Math.max(indieData.revenue, aaaData.revenue),
    rating: Math.max(indieData.rating, aaaData.rating),
    games: Math.max(indieData.games, aaaData.games),
    positive: Math.max(indieData.positive, aaaData.positive),
    negative: Math.max(indieData.negative, aaaData.negative),
    players: Math.max(indieData.players, aaaData.players),
  };

  const maxValue = maxValues[currentHoveredMetric];
  const indiePercentage =
    maxValue > 0 ? (indieValue / maxValue) * 100 : 0;
  const aaaPercentage = maxValue > 0 ? (aaaValue / maxValue) * 100 : 0;

  let indieIsDominant, aaaIsDominant;

  if (currentHoveredMetric === "negative") {
    indieIsDominant = indieValue < aaaValue;
    aaaIsDominant = aaaValue < indieValue;
  } else {
    indieIsDominant = indieValue > aaaValue;
    aaaIsDominant = aaaValue > indieValue;
  }

  d3.selectAll(".stat-bar-fill").interrupt();

  d3.select(".indie-bar").classed("dominant", false);
  d3.select(".aaa-bar").classed("dominant", false);

  d3.select(".indie-bar").style("opacity", null).style("transform", null).style("filter", null);
  d3.select(".aaa-bar").style("opacity", null).style("transform", null).style("filter", null);

  if (indieIsDominant) {
    d3.select(".indie-bar").classed("dominant", true);
    d3.select(".aaa-bar").style("opacity", "0.55").style("transform", "scale(0.93)").style("filter", "grayscale(25%)");
  } else if (aaaIsDominant) {
    d3.select(".aaa-bar").classed("dominant", true);
    d3.select(".indie-bar").style("opacity", "0.55").style("transform", "scale(0.93)").style("filter", "grayscale(25%)");
  }

  d3.select(".indie-bar .stat-bar-fill")
    .transition()
    .duration(300)
    .ease(d3.easeCubicInOut)
    .style("width", `${indiePercentage}%`);

  d3.select(".aaa-bar .stat-bar-fill")
    .transition()
    .duration(300)
    .ease(d3.easeCubicInOut)
    .style("width", `${aaaPercentage}%`);
}

function showTooltipsForMetric(metricKey, event) {
  const m = metrics.find(m => m.key === metricKey);
  if (!m) return;

  const maxVals = {
    revenue: Math.max(indieData.revenue, aaaData.revenue),
    rating: Math.max(indieData.rating, aaaData.rating),
    games: Math.max(indieData.games, aaaData.games),
    positive: Math.max(indieData.positive, aaaData.positive),
    negative: Math.max(indieData.negative, aaaData.negative),
    players: Math.max(indieData.players, aaaData.players),
  };

  const indieVal = indieData[metricKey] || 0;
  const aaaVal = aaaData[metricKey] || 0;
  const maxVal = maxVals[metricKey];
  
  const indieNorm = maxVal > 0 ? (indieVal / maxVal) * 100 : 0;
  const aaaNorm = maxVal > 0 ? (aaaVal / maxVal) * 100 : 0;

  let indieFmt, aaaFmt;
  if (metricKey === "revenue") {
    indieFmt = `$${(indieVal / 1000000).toFixed(1)}M`;
    aaaFmt = `$${(aaaVal / 1000000).toFixed(1)}M`;
  } else if (metricKey === "rating") {
    indieFmt = indieVal.toFixed(1);
    aaaFmt = aaaVal.toFixed(1);
  } else {
    indieFmt = indieVal.toLocaleString();
    aaaFmt = aaaVal.toLocaleString();
  }

  const indieSvg = d3.select("#indie-radar");
  const aaaSvg = d3.select("#aaa-radar");
  
  const indiePt = indieSvg.select(`.radar-point[data-metric="${metricKey}"]`).node();
  const aaaPt = aaaSvg.select(`.radar-point[data-metric="${metricKey}"]`).node();
  
  if (!indiePt || !aaaPt) return;
  
  const indieRect = indiePt.getBoundingClientRect();
  const aaaRect = aaaPt.getBoundingClientRect();
  
  const indieX = indieRect.left + indieRect.width / 2 + window.scrollX;
  const indieY = indieRect.top + indieRect.height / 2 + window.scrollY;
  
  const aaaX = aaaRect.left + aaaRect.width / 2 + window.scrollX;
  const aaaY = aaaRect.top + aaaRect.height / 2 + window.scrollY;

  const indieTooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip tooltip-indie")
    .style("position", "absolute")
    .style("background", "rgba(14, 18, 32, 0.95)")
    .style("color", "#c7d5e0")
    .style("padding", "12px")
    .style("border-radius", "8px")
    .style("border", "2px solid #ff6b9d")
    .style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.5)")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("font-size", "12px")
    .style("font-family", "ui-monospace, 'Courier New', monospace")
    .style("font-weight", "normal");

  indieTooltip.html(`
    <strong>${m.name}</strong><br/>
    INDIE: ${indieFmt}<br/>
    Normalized: ${indieNorm.toFixed(1)}%
  `);

  const indieOffX = indieRect.left + indieRect.width / 2 > window.innerWidth / 2 ? -120 : 20;
  const indieOffY = indieRect.top + indieRect.height / 2 > window.innerHeight / 2 ? -80 : 20;
  
  indieTooltip
    .style("left", (indieX + indieOffX) + "px")
    .style("top", (indieY + indieOffY) + "px");

  const aaaTooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip tooltip-aaa")
    .style("position", "absolute")
    .style("background", "rgba(14, 18, 32, 0.95)")
    .style("color", "#c7d5e0")
    .style("padding", "12px")
    .style("border-radius", "8px")
    .style("border", "2px solid #4ecdc4")
    .style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.5)")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("font-size", "12px")
    .style("font-family", "ui-monospace, 'Courier New', monospace")
    .style("font-weight", "normal");

  aaaTooltip.html(`
    <strong>${m.name}</strong><br/>
    AAA: ${aaaFmt}<br/>
    Normalized: ${aaaNorm.toFixed(1)}%
  `);

  const aaaOffX = aaaRect.left + aaaRect.width / 2 > window.innerWidth / 2 ? -120 : 20;
  const aaaOffY = aaaRect.top + aaaRect.height / 2 > window.innerHeight / 2 ? -80 : 20;
  
  aaaTooltip
    .style("left", (aaaX + aaaOffX) + "px")
    .style("top", (aaaY + aaaOffY) + "px");
}

function hideTooltip() {
  d3.selectAll(".tooltip").remove();
}

document.addEventListener("DOMContentLoaded", loadData);
