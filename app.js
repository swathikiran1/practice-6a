const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertResultObjectToResponseObject = (eachObj) => {
  return {
    stateId: eachObj.state_id,
    stateName: eachObj.state_name,
    population: eachObj.population,
  };
};

// Get States API

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT 
           *
        FROM
           state;`;

  const states1 = await db.all(getStatesQuery);
  response.send(
    states1.map((eachObj) => convertResultObjectToResponseObject(eachObj))
  );
});

// Get One State API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT
           *
        FROM 
           state
        WHERE
           state_id = ${stateId};`;

  const state = await db.get(getStateQuery);

  response.send(convertResultObjectToResponseObject(state));
});

const convertDistrictObjectToResponseObject = (eachObj) => {
  return {
    districtId: eachObj.district_id,
    districtName: eachObj.district_name,
    stateId: eachObj.state_id,
    cases: eachObj.cases,
    cured: eachObj.cured,
    active: eachObj.active,
    deaths: eachObj.deaths,
  };
};

// Post District API

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictQuery = `
        INSERT INTO
          district (district_name, state_id, cases, cured, active, deaths)
        VALUES (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

// Get District API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
       SELECT 
          *
       FROM
          district
       WHERE 
          district_id = ${districtId};`;

  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictObjectToResponseObject(district));
});

// Delete District API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM
           district
        WHERE
           district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// Update District API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
        UPDATE district
        SET district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE
            district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// Get Statistics API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `
        SELECT
          SUM(cases) as totalCases,
          SUM(cured) as totalCured,
          SUM(active) as totalActive,
          SUM(deaths) as totalDeaths
        FROM
          district
        WHERE
          state_id = ${stateId};`;
  const statistics = await db.all(getStatisticsQuery);
  response.send(...statistics);
});

// Get StateName by DistrictId API

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
        SELECT 
           state_id 
        FROM
           district
        WHERE
           district_id = ${districtId};`;
  const getStateIdResponse = await db.get(getStateIdQuery);
  const getStateNameQuery = `
      SELECT
          state_name AS stateName
      FROM
          state
      WHERE
          state_id = ${getStateIdResponse.state_id};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});

module.exports = app;
