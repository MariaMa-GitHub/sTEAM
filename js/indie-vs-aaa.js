// Global variables for storing game data and current state
let gameData = []; // Raw game data from CSV
let currentYear = "All"; // Currently selected year filter
let indieData = {}; // Processed metrics for indie games
let aaaData = {}; // Processed metrics for AAA games
let currentHoveredMetric = null; // Currently hovered metric for health bar display

// Configuration for radar chart dimensions and appearance
const radarConfig = {
  width: 350,
  height: 350,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  levels: 5, // Number of concentric circles in radar chart
  maxValue: 100, // Maximum normalized value for scaling
};

// Define the six metrics displayed in the radar charts
// Each metric has a key for data access, label for display, name for tooltips, and icon
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

// Load and process CSV data from the games dataset
async function loadData() {
  try {
    console.log("Loading data...");
    const response = await fetch("data/games-2.csv");
    const csvText = await response.text();
    const rows = csvText.split("\n");
    const headers = rows[0].split(",");

    gameData = [];
    // Process each row of CSV data
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim()) {
        const values = parseCSVRow(rows[i]);
        if (values.length >= headers.length) {
          const game = {};
          // Map CSV headers to game object properties
          headers.forEach((header, index) => {
            game[header.trim()] = values[index]
              ? values[index].trim()
              : "";
          });

          // Convert string values to appropriate data types
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

          // Extract release year from date string using regex
          if (game.release_date && game.release_date !== "N/A") {
            const yearMatch = game.release_date.match(/(\d{4})/);
            game.release_year = yearMatch ? parseInt(yearMatch[1]) : null;
          } else {
            game.release_year = null;
          }

          // Classify games as indie or AAA based on genre field
          game.isIndie = game.genres && game.genres.includes("Indie");

          gameData.push(game);
        }
      }
    }

    console.log(`Loaded ${gameData.length} games`);
    initializeVisualization();
  } catch (error) {
    console.error("Error loading data:", error);
    // Fallback to dummy data if CSV loading fails
    createDummyData();
  }
}

// Create dummy data for testing
function createDummyData() {
  console.log("Creating dummy data for testing...");
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

// Parse CSV row handling quoted fields
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

// Initialize the visualization
function initializeVisualization() {
  console.log("Initializing visualization...");
  createYearButtons();
  updateData();
  createRadarCharts();
  updateStatsBars();
}

// Create year filter buttons
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
  const yearButtonsContainer = d3.select("#year-buttons");

  // Clear existing buttons
  yearButtonsContainer.selectAll("*").remove();

  // Add "All" button
  yearButtonsContainer
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

  // Add year buttons
  sortedYears.forEach((year) => {
    yearButtonsContainer
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

// Update year button states
function updateYearButtons() {
  d3.selectAll(".year-button").classed("active", function () {
    return (
      d3.select(this).text() === currentYear.toString() ||
      (currentYear === "All" && d3.select(this).text() === "All")
    );
  });
}

// Update data based on current year filter
function updateData() {
  let filteredData = gameData;

  if (currentYear !== "All") {
    filteredData = gameData.filter(
      (game) => game.release_year === currentYear
    );
  }

  const indieGames = filteredData.filter((game) => game.isIndie);
  const aaaGames = filteredData.filter((game) => !game.isIndie);

  // Calculate metrics for indie games
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

  // Calculate metrics for AAA games
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

  console.log("Indie data:", indieData);
  console.log("AAA data:", aaaData);
}

// Calculate total revenue by multiplying price by positive reviews
// This is a rough approximation since we don't have actual sales data
function calculateRevenue(games) {
  return games.reduce((sum, game) => {
    if (!game.is_free && game.price_initial > 0) {
      // Estimate revenue as price * positive reviews (rough approximation)
      return sum + game.price_initial * game.total_positive;
    }
    return sum;
  }, 0);
}

// Calculate average rating
function calculateAverageRating(games) {
  const gamesWithRatings = games.filter((game) => game.review_score > 0);
  if (gamesWithRatings.length === 0) return 0;

  const totalRating = gamesWithRatings.reduce(
    (sum, game) => sum + game.review_score,
    0
  );
  return totalRating / gamesWithRatings.length;
}

// Create radar charts
function createRadarCharts() {
  console.log("Creating radar charts...");
  createRadarChart("indie-radar", indieData, "indie");
  createRadarChart("aaa-radar", aaaData, "aaa");
}

// Create individual radar chart
function createRadarChart(containerId, data, type) {
  console.log(`Creating ${type} radar chart with data:`, data);

  const svg = d3.select(`#${containerId}`);
  svg.selectAll("*").remove();

  const width = radarConfig.width;
  const height = radarConfig.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 50;

  // Create scales
  const maxValues = {
    revenue: Math.max(indieData.revenue, aaaData.revenue),
    rating: Math.max(indieData.rating, aaaData.rating),
    games: Math.max(indieData.games, aaaData.games),
    positive: Math.max(indieData.positive, aaaData.positive),
    negative: Math.max(indieData.negative, aaaData.negative),
    players: Math.max(indieData.players, aaaData.players),
  };

  // Normalize data to 0-100 scale
  const normalizedData = metrics.map((metric) => {
    const value = data[metric.key];
    const maxValue = maxValues[metric.key];
    return {
      ...metric,
      value: maxValue > 0 ? (value / maxValue) * 100 : 0,
      rawValue: value,
    };
  });

  console.log(`Normalized data for ${type}:`, normalizedData);

  // Create radial scale
  const angleScale = d3
    .scaleLinear()
    .domain([0, metrics.length])
    .range([0, 2 * Math.PI]);

  const radiusScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, radius]);

  // Create groups
  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${centerX}, ${centerY})`);

  // Draw grid circles
  for (let i = 1; i <= radarConfig.levels; i++) {
    chartGroup
      .append("circle")
      .attr("class", "radar-grid")
      .attr("r", (radius / radarConfig.levels) * i)
      .attr("fill", "none");
  }

  // Draw grid lines
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

  // Draw area
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
    .style("stroke", type === "indie" ? "#ff6b9d" : "#4ecdc4");

  // Draw points
  chartGroup
    .selectAll(".radar-point")
    .data(normalizedData)
    .enter()
    .append("circle")
    .attr("class", `radar-point ${type}-point`)
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
    .style("fill", type === "indie" ? "#ff6b9d" : "#4ecdc4")
    .style("stroke", "#ffffff")
    .on("mouseover", function (event, d) {
      showTooltip(event, d, type);
    })
    .on("mouseout", hideTooltip);

  // Draw labels
  chartGroup
    .selectAll(".radar-label")
    .data(normalizedData)
    .enter()
    .append("text")
    .attr("class", "radar-label")
    .attr(
      "x",
      (d, i) => Math.cos(angleScale(i) - Math.PI / 2) * (radius + 20)
    )
    .attr(
      "y",
      (d, i) => Math.sin(angleScale(i) - Math.PI / 2) * (radius + 20)
    )
    .text((d) => d.icon)
    .style("font-size", "16px")
    .style("fill", type === "indie" ? "#ff6b9d" : "#4ecdc4")
    .on("mouseover", function (event, d) {
      currentHoveredMetric = d.key;
      updateStatsBars();
      showTooltip(event, d, type);
    })
    .on("mouseout", function () {
      currentHoveredMetric = null;
      updateStatsBars();
      hideTooltip();
    });

  // Add center icon
  chartGroup
    .append("text")
    .attr("class", "center-icon")
    .attr("x", 0)
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(type === "indie" ? "👤" : "👤")
    .style("font-size", "24px")
    .style("fill", type === "indie" ? "#ff6b9d" : "#4ecdc4");
}

// Update radar charts with smooth animations
function updateRadarCharts() {
  console.log("Updating radar charts...");

  // Update indie chart
  updateRadarChartData("indie-radar", indieData, "indie");
  // Update AAA chart
  updateRadarChartData("aaa-radar", aaaData, "aaa");
}

// Update individual radar chart data points smoothly
function updateRadarChartData(containerId, data, type) {
  const svg = d3.select(`#${containerId}`);
  const chartGroup = svg.select("g");

  const width = radarConfig.width;
  const height = radarConfig.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 50;

  // Create scales
  const maxValues = {
    revenue: Math.max(indieData.revenue, aaaData.revenue),
    rating: Math.max(indieData.rating, aaaData.rating),
    games: Math.max(indieData.games, aaaData.games),
    positive: Math.max(indieData.positive, aaaData.positive),
    negative: Math.max(indieData.negative, aaaData.negative),
    players: Math.max(indieData.players, aaaData.players),
  };

  // Normalize data to 0-100 scale
  const normalizedData = metrics.map((metric) => {
    const value = data[metric.key];
    const maxValue = maxValues[metric.key];
    return {
      ...metric,
      value: maxValue > 0 ? (value / maxValue) * 100 : 0,
      rawValue: value,
    };
  });

  // Create radial scale
  const angleScale = d3
    .scaleLinear()
    .domain([0, metrics.length])
    .range([0, 2 * Math.PI]);

  const radiusScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, radius]);

  // Use CSS transitions for perfect synchronization
  const areaGenerator = d3
    .areaRadial()
    .angle((d, i) => angleScale(i))
    .innerRadius(0)
    .outerRadius((d) => radiusScale(d.value))
    .curve(d3.curveLinearClosed);

  // Add CSS transition class to both area and points
  chartGroup
    .select(`.radar-area.${type}-area`)
    .classed("smooth-transition", true);
  chartGroup
    .selectAll(`.radar-point.${type}-point`)
    .classed("smooth-transition", true);

  // Update area path immediately (CSS will handle the transition)
  chartGroup
    .select(`.radar-area.${type}-area`)
    .datum(normalizedData)
    .attr("d", areaGenerator);

  // Update points immediately (CSS will handle the transition)
  chartGroup
    .selectAll(`.radar-point.${type}-point`)
    .data(normalizedData)
    .attr(
      "cx",
      (d, i) =>
        Math.cos(angleScale(i) - Math.PI / 2) * radiusScale(d.value)
    )
    .attr(
      "cy",
      (d, i) =>
        Math.sin(angleScale(i) - Math.PI / 2) * radiusScale(d.value)
    );

  // Remove transition class after animation completes
  setTimeout(() => {
    chartGroup
      .select(`.radar-area.${type}-area`)
      .classed("smooth-transition", false);
    chartGroup
      .selectAll(`.radar-point.${type}-point`)
      .classed("smooth-transition", false);
  }, 500);
}

// Update health bars based on currently hovered metric
// Shows empty bars when no metric is selected, fills them when hovering over radar icons
function updateStatsBars() {
  if (!currentHoveredMetric) {
    // Show empty bars when no metric is hovered
    d3.select("#indie-stat").text("");
    d3.select("#aaa-stat").text("");

    // Remove dominance classes
    d3.select(".indie-bar").classed("dominant", false);
    d3.select(".aaa-bar").classed("dominant", false);

    d3.select(".indie-bar")
      .transition()
      .duration(100)
      .ease(d3.easeCubicInOut)
      .style("width", "0%");

    d3.select(".aaa-bar")
      .transition()
      .duration(100)
      .ease(d3.easeCubicInOut)
      .style("width", "0%");
    return;
  }

  const indieValue = indieData[currentHoveredMetric] || 0;
  const aaaValue = aaaData[currentHoveredMetric] || 0;

  // Format the values based on the metric
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

  // Calculate normalized percentages (0-100 scale)
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

  // Determine which bar should be dominant (higher value, except for negative ratings)
  let indieIsDominant, aaaIsDominant;

  if (currentHoveredMetric === "negative") {
    // For negative ratings, lower is better
    indieIsDominant = indieValue < aaaValue;
    aaaIsDominant = aaaValue < indieValue;
  } else {
    // For all other metrics, higher is better
    indieIsDominant = indieValue > aaaValue;
    aaaIsDominant = aaaValue > indieValue;
  }

  // Remove dominance classes first
  d3.select(".indie-bar").classed("dominant", false);
  d3.select(".aaa-bar").classed("dominant", false);

  // Animate bars with smooth transitions
  d3.select(".indie-bar")
    .transition()
    .duration(100)
    .ease(d3.easeCubicInOut)
    .style("width", `${indiePercentage}%`)
    .on("end", function () {
      // Add dominance class after animation completes
      if (indieIsDominant) {
        d3.select(".indie-bar").classed("dominant", true);
      }
    });

  d3.select(".aaa-bar")
    .transition()
    .duration(100)
    .ease(d3.easeCubicInOut)
    .style("width", `${aaaPercentage}%`)
    .on("end", function () {
      // Add dominance class after animation completes
      if (aaaIsDominant) {
        d3.select(".aaa-bar").classed("dominant", true);
      }
    });
}

// Tooltip functions
function showTooltip(event, d, type) {
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style(
      "background",
      "linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.8))"
    )
    .style("color", "white")
    .style("padding", "15px")
    .style("border-radius", "10px")
    .style("border", "2px solid #ffd93d")
    .style("box-shadow", "0 8px 32px rgba(0, 0, 0, 0.5)")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("text-shadow", "1px 1px 2px rgba(0, 0, 0, 0.8)");

  let formattedValue;
  switch (d.key) {
    case "revenue":
      formattedValue = `$${(d.rawValue / 1000000).toFixed(1)}M`;
      break;
    case "rating":
      formattedValue = d.rawValue.toFixed(1);
      break;
    default:
      formattedValue = d.rawValue.toLocaleString();
  }

  tooltip.html(`
    <strong>${d.name}</strong><br/>
    ${type.toUpperCase()}: ${formattedValue}<br/>
    Normalized: ${d.value.toFixed(1)}%
  `);

  tooltip
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY - 10 + "px");
}

function hideTooltip() {
  d3.selectAll(".tooltip").remove();
}

// Initialize the application
document.addEventListener("DOMContentLoaded", loadData);
