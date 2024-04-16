const express = require('express')
const app = express()

const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

//Initializing Database And Server:

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error : ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertDbObjectToStatesObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

//Get States API:

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`
  const statesArray = await db.all(getStatesQuery)
  response.send(
    statesArray.map(eachState => convertDbObjectToStatesObject(eachState)),
  )
})

//Get state API :

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId};`
  const state = await db.get(getStateQuery)
  response.send(convertDbObjectToStatesObject(state))
})

//Post Districts API :

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictsQuery = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
    VALUES('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`
  await db.run(postDistrictsQuery)
  response.send('District Successfullty Added')
})

const convertDbObjectToDistrictsObject = dbObject => {
  return {
    districtId: dbObject.distict_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

//Get District API :

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT * FROM district
    WHERE district_id = ${districtId};`
  const district = await db.get(getDistrictQuery)
  response.send(convertDbObjectToDistrictsObject(district))
})

//Delete District API :

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//Update District API :

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictQuery = `
    UPDATE district
    SET district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};`
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//Get States Stats API :

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatesStatsQuery = `
    SELECT 
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};`
  const stats = await db.get(getStatesStatsQuery)
  //console.log(stats);
  response.send(stats)
})

//Get State From District API :

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    SELECT state_name FROM state JOIN district 
    ON state.state_id = district.state_id
    WHERE district.district_id = ${districtId};`
  const state = await db.get(getDistrictIdQuery)
  response.send({stateName: state.state_name})
})
module.exports = app
