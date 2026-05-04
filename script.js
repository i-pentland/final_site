const NFL_TEAMS = [
  { id: "22", abbreviation: "ARI", displayName: "Arizona Cardinals" },
  { id: "1", abbreviation: "ATL", displayName: "Atlanta Falcons" },
  { id: "33", abbreviation: "BAL", displayName: "Baltimore Ravens" },
  { id: "2", abbreviation: "BUF", displayName: "Buffalo Bills" },
  { id: "29", abbreviation: "CAR", displayName: "Carolina Panthers" },
  { id: "3", abbreviation: "CHI", displayName: "Chicago Bears" },
  { id: "4", abbreviation: "CIN", displayName: "Cincinnati Bengals" },
  { id: "5", abbreviation: "CLE", displayName: "Cleveland Browns" },
  { id: "6", abbreviation: "DAL", displayName: "Dallas Cowboys" },
  { id: "7", abbreviation: "DEN", displayName: "Denver Broncos" },
  { id: "8", abbreviation: "DET", displayName: "Detroit Lions" },
  { id: "9", abbreviation: "GB", displayName: "Green Bay Packers" },
  { id: "34", abbreviation: "HOU", displayName: "Houston Texans" },
  { id: "11", abbreviation: "IND", displayName: "Indianapolis Colts" },
  { id: "30", abbreviation: "JAX", displayName: "Jacksonville Jaguars" },
  { id: "12", abbreviation: "KC", displayName: "Kansas City Chiefs" },
  { id: "13", abbreviation: "LV", displayName: "Las Vegas Raiders" },
  { id: "24", abbreviation: "LAC", displayName: "Los Angeles Chargers" },
  { id: "14", abbreviation: "LAR", displayName: "Los Angeles Rams" },
  { id: "15", abbreviation: "MIA", displayName: "Miami Dolphins" },
  { id: "16", abbreviation: "MIN", displayName: "Minnesota Vikings" },
  { id: "17", abbreviation: "NE", displayName: "New England Patriots" },
  { id: "18", abbreviation: "NO", displayName: "New Orleans Saints" },
  { id: "19", abbreviation: "NYG", displayName: "New York Giants" },
  { id: "20", abbreviation: "NYJ", displayName: "New York Jets" },
  { id: "21", abbreviation: "PHI", displayName: "Philadelphia Eagles" },
  { id: "23", abbreviation: "PIT", displayName: "Pittsburgh Steelers" },
  { id: "25", abbreviation: "SF", displayName: "San Francisco 49ers" },
  { id: "26", abbreviation: "SEA", displayName: "Seattle Seahawks" },
  { id: "27", abbreviation: "TB", displayName: "Tampa Bay Buccaneers" },
  { id: "10", abbreviation: "TEN", displayName: "Tennessee Titans" },
  { id: "28", abbreviation: "WSH", displayName: "Washington Commanders" },
];

const playerASearch = document.querySelector("#player-a-search");
const playerBSearch = document.querySelector("#player-b-search");
const playerOptions = document.querySelector("#player-options");
const statView = document.querySelector("#stat-view");
const swapButton = document.querySelector("#swap-button");
const randomButton = document.querySelector("#random-button");
const playerAPanel = document.querySelector("#player-a-panel");
const playerBPanel = document.querySelector("#player-b-panel");
const comparisonTable = document.querySelector("#comparison-table");
const loadStatus = document.querySelector("#load-status");
const boardTitle = document.querySelector("#board-title");
const boardMode = document.querySelector("#board-mode");
const teamSelect = document.querySelector("#team-select");
const teamStatus = document.querySelector("#team-status");
const teamSummary = document.querySelector("#team-summary");
const teamLeaders = document.querySelector("#team-leaders");

const state = {
  players: [],
  playerMap: new Map(),
  teamRosters: new Map(),
  teamInfo: new Map(),
  playerStats: new Map(),
  teamStats: new Map(),
  teamLeaders: new Map(),
  playerAId: "",
  playerBId: "",
  selectedTeamId: "12",
};

const statGroups = {
  passing: [
    ["passingYards", "Passing Yards"],
    ["passingTouchdowns", "Passing TD"],
    ["completions", "Completions"],
    ["passingAttempts", "Attempts"],
    ["completionPct", "Completion %"],
    ["QBRating", "Passer Rating"],
  ],
  rushing: [
    ["rushingYards", "Rushing Yards"],
    ["rushingTouchdowns", "Rushing TD"],
    ["rushingAttempts", "Carries"],
    ["yardsPerRushAttempt", "Yards Per Carry"],
    ["longRushing", "Long Rush"],
  ],
  receiving: [
    ["receivingYards", "Receiving Yards"],
    ["receivingTouchdowns", "Receiving TD"],
    ["receptions", "Receptions"],
    ["receivingTargets", "Targets"],
    ["yardsPerReception", "Yards Per Catch"],
    ["receivingFirstDowns", "Receiving First Downs"],
  ],
  defense: [
    ["totalTackles", "Total Tackles"],
    ["soloTackles", "Solo Tackles"],
    ["assistTackles", "Assist Tackles"],
    ["sacks", "Sacks"],
    ["fumblesForced", "Forced Fumbles"],
    ["interceptions", "Interceptions"],
    ["passesDefended", "Passes Defended"],
  ],
  all: [
    ["passingYards", "Passing Yards"],
    ["rushingYards", "Rushing Yards"],
    ["receivingYards", "Receiving Yards"],
    ["totalTackles", "Total Tackles"],
    ["sacks", "Sacks"],
    ["passingTouchdowns", "Passing TD"],
    ["rushingTouchdowns", "Rushing TD"],
    ["receivingTouchdowns", "Receiving TD"],
  ],
};

const teamLeaderStats = [
  ["passingYards", "Passing Leader", "passing yards"],
  ["rushingYards", "Rushing Leader", "rushing yards"],
  ["receivingYards", "Receiving Leader", "receiving yards"],
  ["sacks", "Sack Leader", "sacks"],
  ["totalTackles", "Tackle Leader", "total tackles"],
];

const defensePositions = new Set([
  "CB",
  "DB",
  "DE",
  "DL",
  "DT",
  "FS",
  "ILB",
  "LB",
  "MLB",
  "NT",
  "OLB",
  "S",
  "SS",
]);

const ignoreLeaderPositions = new Set(["C", "G", "K", "LS", "OG", "OT", "P", "PK", "T"]);

function updateStatus(message, tone = "") {
  loadStatus.textContent = message;
  loadStatus.className = `status ${tone}`.trim();
}

function fetchJson(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed for ${url}`);
    }

    return response.json();
  });
}

function rosterUrl(teamId) {
  return `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`;
}

function playerOverviewUrl(playerId) {
  return `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${playerId}/overview`;
}

function teamStatsUrl(teamId) {
  return `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/2/teams/${teamId}/statistics`;
}

function toNumber(value) {
  const normalized = String(value ?? "0").replace(/,/g, "");
  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatStatValue(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(1);
}

function buildPlayerLabel(player) {
  return `${player.displayName} | ${player.position} | ${player.teamAbbreviation}`;
}

function flattenRoster(payload, team) {
  const sections = payload.athletes || [];
  const players = [];

  sections.forEach((section) => {
    (section.items || []).forEach((item) => {
      players.push({
        id: item.id,
        displayName: item.displayName,
        teamId: team.id,
        teamAbbreviation: payload.team.abbreviation || team.abbreviation,
        teamDisplayName: payload.team.displayName || team.displayName,
        position: item.position?.abbreviation || "N/A",
        section: section.position,
        jersey: item.jersey || "",
        college: item.college?.name || "Unknown",
        experience: item.experience?.years ?? 0,
        status: item.status?.abbreviation || "N/A",
        headshot: item.headshot?.href || "",
      });
    });
  });

  return players;
}

function parsePlayerStats(payload) {
  const statsBlock = payload.statistics || {};
  const names = statsBlock.names || [];
  const splits = statsBlock.splits || [];
  const regularSeason =
    splits.find((split) => split.displayName === "Regular Season") || splits[0];

  if (!names.length || !regularSeason || !regularSeason.stats) {
    return {};
  }

  const parsedStats = {};

  names.forEach((name, index) => {
    parsedStats[name] = toNumber(regularSeason.stats[index]);
  });

  return parsedStats;
}

function flattenTeamStats(payload) {
  const stats = {};
  const categories = payload.splits?.categories || [];

  categories.forEach((category) => {
    (category.stats || []).forEach((stat) => {
      stats[stat.name] = toNumber(stat.displayValue || stat.value);
      stats[`${stat.name}Display`] = stat.displayValue || String(stat.value);
      stats[`${stat.name}Rank`] = stat.rankDisplayValue || "";
    });
  });

  return stats;
}

function chooseAutoGroup(playerA, playerB) {
  if (playerA.position === "QB" && playerB.position === "QB") {
    return "passing";
  }

  if (["RB", "FB"].includes(playerA.position) && ["RB", "FB"].includes(playerB.position)) {
    return "rushing";
  }

  if (["WR", "TE"].includes(playerA.position) && ["WR", "TE"].includes(playerB.position)) {
    return "receiving";
  }

  if (defensePositions.has(playerA.position) && defensePositions.has(playerB.position)) {
    return "defense";
  }

  return "all";
}

function renderPlayerCard(player, stats, target, label) {
  target.innerHTML = `
    <div class="player-card-top">
      <div>
        <div class="player-meta">${label}</div>
        <h3>${player.displayName}</h3>
        <p class="bio">
          ${player.position} for ${player.teamDisplayName}. Jersey ${player.jersey || "N/A"}.
          College: ${player.college}.
        </p>
      </div>
      ${
        player.headshot
          ? `<img class="headshot" src="${player.headshot}" alt="${player.displayName} headshot" loading="lazy" />`
          : ""
      }
    </div>

    <div class="mini-grid">
      <div class="mini-stat">
        <span class="stat-key">Team</span>
        <strong>${player.teamAbbreviation}</strong>
      </div>
      <div class="mini-stat">
        <span class="stat-key">Position</span>
        <strong>${player.position}</strong>
      </div>
      <div class="mini-stat">
        <span class="stat-key">Status</span>
        <strong>${player.status}</strong>
      </div>
      <div class="mini-stat">
        <span class="stat-key">Experience</span>
        <strong>${player.experience}</strong>
      </div>
    </div>

    <p class="bio">
      Loaded from ESPN public roster and athlete overview endpoints.
      ${Object.keys(stats).length ? "Regular season stats are shown in the comparison board." : "No regular season stat block was returned for this player."}
    </p>
  `;
}

function renderOptions() {
  playerOptions.innerHTML = state.players
    .map((player) => `<option value="${buildPlayerLabel(player)}"></option>`)
    .join("");
}

function renderTeamOptions() {
  teamSelect.innerHTML = NFL_TEAMS.map(
    (team) => `<option value="${team.id}">${team.displayName}</option>`
  ).join("");
}

function applySearchValue(input, playerId) {
  const player = state.playerMap.get(playerId);
  if (player) {
    input.value = buildPlayerLabel(player);
  }
}

function findPlayerIdFromInput(value) {
  const normalized = value.trim().toLowerCase();

  const directMatch = state.players.find(
    (player) => buildPlayerLabel(player).toLowerCase() === normalized
  );

  if (directMatch) {
    return directMatch.id;
  }

  const partialMatch = state.players.find((player) =>
    player.displayName.toLowerCase().includes(normalized)
  );

  return partialMatch ? partialMatch.id : "";
}

async function ensurePlayerStats(playerId) {
  if (state.playerStats.has(playerId)) {
    return state.playerStats.get(playerId);
  }

  const payload = await fetchJson(playerOverviewUrl(playerId));
  const stats = parsePlayerStats(payload);
  state.playerStats.set(playerId, stats);
  return stats;
}

async function ensureTeamStats(teamId) {
  if (state.teamStats.has(teamId)) {
    return state.teamStats.get(teamId);
  }

  const payload = await fetchJson(teamStatsUrl(teamId));
  const stats = flattenTeamStats(payload);
  state.teamStats.set(teamId, stats);
  return stats;
}

async function ensureTeamLeaders(teamId) {
  if (state.teamLeaders.has(teamId)) {
    return state.teamLeaders.get(teamId);
  }

  const roster = state.teamRosters.get(teamId) || [];
  const leaderCandidates = roster.filter((player) => !ignoreLeaderPositions.has(player.position));

  const playersWithStats = await Promise.all(
    leaderCandidates.map(async (player) => {
      const stats = await ensurePlayerStats(player.id);
      return { player, stats };
    })
  );

  state.teamLeaders.set(teamId, playersWithStats);
  return playersWithStats;
}

function getStatLeader(playersWithStats, statKey) {
  return playersWithStats.reduce((best, current) => {
    if (!best) {
      return current;
    }

    const currentValue = current.stats[statKey] ?? 0;
    const bestValue = best.stats[statKey] ?? 0;

    if (currentValue > bestValue) {
      return current;
    }

    return best;
  }, null);
}

async function refreshComparison() {
  const playerA = state.playerMap.get(state.playerAId);
  const playerB = state.playerMap.get(state.playerBId);

  if (!playerA || !playerB) {
    comparisonTable.innerHTML = `<p class="empty-state">Choose two players to compare.</p>`;
    return;
  }

  comparisonTable.innerHTML = `<p class="empty-state">Loading player stats from ESPN...</p>`;

  const [statsA, statsB] = await Promise.all([
    ensurePlayerStats(playerA.id),
    ensurePlayerStats(playerB.id),
  ]);

  renderPlayerCard(playerA, statsA, playerAPanel, "Player A");
  renderPlayerCard(playerB, statsB, playerBPanel, "Player B");

  const selectedView = statView.value;
  const activeGroup = selectedView === "auto" ? chooseAutoGroup(playerA, playerB) : selectedView;
  const metrics = statGroups[activeGroup];

  boardTitle.textContent = `${playerA.displayName} vs ${playerB.displayName}`;
  boardMode.textContent =
    selectedView === "auto" ? `Auto: ${activeGroup}` : `${activeGroup} view`;

  const rows = metrics
    .map(([key, label]) => {
      const valueA = statsA[key] ?? 0;
      const valueB = statsB[key] ?? 0;
      let classA = "value-box";
      let classB = "value-box";

      if (valueA > valueB) {
        classA += " win";
        classB += " loss";
      } else if (valueB > valueA) {
        classA += " loss";
        classB += " win";
      }

      return `
        <div class="comparison-row">
          <div class="${classA}">
            <strong>${formatStatValue(valueA)}</strong>
            <span>${playerA.displayName}</span>
          </div>
          <div class="label-box">
            <strong>${label}</strong>
            <span>Higher value turns green</span>
          </div>
          <div class="${classB}">
            <strong>${formatStatValue(valueB)}</strong>
            <span>${playerB.displayName}</span>
          </div>
        </div>
      `;
    })
    .join("");

  comparisonTable.innerHTML = `
    <div class="comparison-head">
      <div>${playerA.displayName}</div>
      <div style="text-align:center;">2025 Regular Season Stats</div>
      <div style="text-align:right;">${playerB.displayName}</div>
    </div>
    ${rows}
  `;
}

async function renderTeamDashboard() {
  const team = NFL_TEAMS.find((item) => item.id === state.selectedTeamId);
  const roster = state.teamRosters.get(state.selectedTeamId) || [];
  const teamInfo = state.teamInfo.get(state.selectedTeamId) || {};

  if (!team || !roster.length) {
    teamStatus.textContent = "No team data";
    teamSummary.innerHTML = `<p class="empty-state">Team data is still loading.</p>`;
    teamLeaders.innerHTML = "";
    return;
  }

  teamStatus.textContent = `Loading ${team.abbreviation}...`;
  teamSummary.innerHTML = `<p class="empty-state">Loading team stats from ESPN...</p>`;
  teamLeaders.innerHTML = `<p class="empty-state">Loading team leaders from ESPN...</p>`;

  const stats = await ensureTeamStats(team.id);
  const playersWithStats = await ensureTeamLeaders(team.id);

  teamStatus.textContent = `${team.abbreviation} scouting board`;
  teamSummary.innerHTML = `
    <div class="mini-stat">
      <span class="stat-key">Record</span>
      <strong>${teamInfo.recordSummary || "N/A"}</strong>
    </div>
    <div class="mini-stat">
      <span class="stat-key">Roster size</span>
      <strong>${roster.length}</strong>
    </div>
    <div class="mini-stat">
      <span class="stat-key">Team pass yards</span>
      <strong>${stats.passingYardsDisplay || formatStatValue(stats.passingYards || 0)}</strong>
    </div>
    <div class="mini-stat">
      <span class="stat-key">Team rush yards</span>
      <strong>${stats.rushingYardsDisplay || formatStatValue(stats.rushingYards || 0)}</strong>
    </div>
  `;

  teamLeaders.innerHTML = teamLeaderStats
    .map(([statKey, label, statText]) => {
      const leader = getStatLeader(playersWithStats, statKey);

      if (!leader || (leader.stats[statKey] ?? 0) === 0) {
        return `
          <article class="leader-card">
            <div class="leader-label">${label}</div>
            <p class="empty-state">No regular-season value returned for this category.</p>
          </article>
        `;
      }

      return `
        <article class="leader-card">
          <div class="leader-label">${label}</div>
          <h3>${leader.player.displayName}</h3>
          <p class="bio">${leader.player.position} • ${leader.player.teamAbbreviation}</p>
          <div class="leader-value">${formatStatValue(leader.stats[statKey])} ${statText}</div>
          <div class="leader-actions">
            <button type="button" data-team-player="${leader.player.id}" data-team-slot="A">Use as Player A</button>
            <button type="button" data-team-player="${leader.player.id}" data-team-slot="B">Use as Player B</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadAllPlayers() {
  const rosterResponses = await Promise.all(
    NFL_TEAMS.map(async (team) => {
      const payload = await fetchJson(rosterUrl(team.id));
      return { team, payload };
    })
  );

  const players = [];

  rosterResponses.forEach(({ team, payload }) => {
    const rosterPlayers = flattenRoster(payload, team);
    state.teamRosters.set(team.id, rosterPlayers);
    state.teamInfo.set(team.id, {
      displayName: payload.team.displayName || team.displayName,
      recordSummary: payload.team.recordSummary || "",
      logo: payload.team.logo || "",
    });
    players.push(...rosterPlayers);
  });

  const uniquePlayers = [...new Map(players.map((player) => [player.id, player])).values()].sort(
    (a, b) => a.displayName.localeCompare(b.displayName)
  );

  state.players = uniquePlayers;
  state.playerMap = new Map(uniquePlayers.map((player) => [player.id, player]));
}

function syncInputToState(input, side) {
  const playerId = findPlayerIdFromInput(input.value);

  if (!playerId) {
    return;
  }

  if (side === "A") {
    state.playerAId = playerId;
    applySearchValue(playerASearch, playerId);
  } else {
    state.playerBId = playerId;
    applySearchValue(playerBSearch, playerId);
  }

  refreshComparison();
}

function bindEvents() {
  playerASearch.addEventListener("change", () => syncInputToState(playerASearch, "A"));
  playerBSearch.addEventListener("change", () => syncInputToState(playerBSearch, "B"));
  playerASearch.addEventListener("blur", () => syncInputToState(playerASearch, "A"));
  playerBSearch.addEventListener("blur", () => syncInputToState(playerBSearch, "B"));
  statView.addEventListener("change", refreshComparison);

  swapButton.addEventListener("click", () => {
    const nextA = state.playerBId;
    const nextB = state.playerAId;
    state.playerAId = nextA;
    state.playerBId = nextB;
    applySearchValue(playerASearch, state.playerAId);
    applySearchValue(playerBSearch, state.playerBId);
    refreshComparison();
  });

  randomButton.addEventListener("click", () => {
    const randomA = state.players[Math.floor(Math.random() * state.players.length)];
    let randomB = state.players[Math.floor(Math.random() * state.players.length)];

    while (randomA.id === randomB.id) {
      randomB = state.players[Math.floor(Math.random() * state.players.length)];
    }

    state.playerAId = randomA.id;
    state.playerBId = randomB.id;
    applySearchValue(playerASearch, state.playerAId);
    applySearchValue(playerBSearch, state.playerBId);
    refreshComparison();
  });

  teamSelect.addEventListener("change", () => {
    state.selectedTeamId = teamSelect.value;
    renderTeamDashboard();
  });

  teamLeaders.addEventListener("click", (event) => {
    const button = event.target.closest("[data-team-player]");

    if (!button) {
      return;
    }

    const playerId = button.dataset.teamPlayer;
    const slot = button.dataset.teamSlot;

    if (slot === "A") {
      state.playerAId = playerId;
      applySearchValue(playerASearch, playerId);
    } else {
      state.playerBId = playerId;
      applySearchValue(playerBSearch, playerId);
    }

    refreshComparison();
  });
}

async function init() {
  bindEvents();
  renderTeamOptions();
  updateStatus("Loading ESPN rosters...");

  try {
    await loadAllPlayers();

    const mahomes =
      state.players.find((player) => player.displayName === "Patrick Mahomes") ||
      state.players[0];
    const dart =
      state.players.find((player) => player.displayName === "Jaxson Dart") ||
      state.players[1];

    state.playerAId = mahomes.id;
    state.playerBId = dart.id;
    state.selectedTeamId = mahomes.teamId;

    renderOptions();
    teamSelect.value = state.selectedTeamId;
    applySearchValue(playerASearch, state.playerAId);
    applySearchValue(playerBSearch, state.playerBId);
    updateStatus(`${state.players.length} players loaded from ESPN`, "ready");

    await Promise.all([refreshComparison(), renderTeamDashboard()]);
  } catch (error) {
    updateStatus("Could not load ESPN API data", "error");
    playerAPanel.innerHTML = `
      <p class="empty-state">
        The site could not load roster or player data from ESPN's public API.
      </p>
    `;
    playerBPanel.innerHTML = playerAPanel.innerHTML;
    comparisonTable.innerHTML = `
      <p class="empty-state">
        This version now depends on ESPN public JSON endpoints instead of downloaded CSV files.
      </p>
    `;
    teamStatus.textContent = "Could not load team data";
    teamSummary.innerHTML = playerAPanel.innerHTML;
    teamLeaders.innerHTML = "";
    console.error(error);
  }
}

init();
