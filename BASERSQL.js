// Updated 210706: refactored some console log stuff in readFromTable and readAllFromTable
// Updated 210710: improved the error handling logic
// Moved to github
// Dependencies: classes.gs for dbInst
// Removed some functions for creating database, dropping tables, etc. since this is better
// handled with SQL and MySQLWorkbench

/* Functions included
readFromTable(dbInst, tableNameS, colS, searchS, jsonyn=true)
readInListFromTable(dbInst, tableNameS, colS, inListS)
readAllFromTable(dbInst, tableNameS)
getSQLRecs(dbInst, tableNameS, searchS)
getProposalNamesAndIDs(dbInst,userS = "mcolacino@squarefoot.com")
getAddressSuiteFloorSF(userS = "mcolacino@squarefoot.com")
writeToTable(dbInst, tableNameS, recordA)
getSpaceDisplay(userS = "mcolacino@squarefoot.com")
getProposalData(userS = "mcolacino@squarefoot.com")
getNamedProposalData(proposalNameS, userS = "mcolacino@squarefoot.com")
writePropDetail(dbInst, record)
writeProposal(dbInst, record)
deleteFromTable(dbInst, tableNameS, selectS)
getProposalNames(userS = "mcolacino@squarefoot.com")
matchingBRProposalID(dbInst, propID)
splitRangesToObjects(headers, values)
camelString(header)
isCellEmpty_(cellData)
isAlnum_(char)
isDigit_(char)
objectToArray(headers, objValues)
rangeToObjects(range)
camelArray(headers)
testMatchingBRProposalID()
testReadFromClauses()
testReadFromProposals()
*/


/**
 * Purpose: read row(s) up to maxRows from database using dbInst for connection
 * 
 *
 * @param  {object} dbInst - instance of database class
 * @param {string} tableNameS - table to read
 * @param {string} colS - column to select on
 * @param {object[]} rowA - array of objects
 * @return {String} retS - return value
 */
// Modified 210714 to include json y/n
const logReadFromTable = false;
const maxRows = 1000;
function readFromTable(dbInst, tableNameS, colS, searchS, jsonyn=true) {
  var fS = "readFromTable";
  var logLoc = logReadFromTable;
  /*********connect to database ************************************ */
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    logLoc ? console.log(locConn.toString()) : true;
    var stmt = locConn.createStatement();
    stmt.setMaxRows(maxRows);
  } catch (err) {
    console.log(`In ${fS} issue getting connection or creating statement: ${err}`);
    return -1
  }
  /******************extract rows that meet select criteria ********* */
  var qryS = `SELECT * FROM ${tableNameS} where ${colS} = "${searchS}";`;
  try {
    var results = stmt.executeQuery(qryS);
    var numCols = results.getMetaData().getColumnCount();
  } catch (err) {
    console.log(`In ${fS} problem with executing ${colS} = ${searchS} query : ${err}`);
    return -1
  }
  var dataA = [];
  while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
    recA = [];
    for (var col = 0; col < numCols; col++) {
      recA.push(results.getString(col + 1));  // create inner array(s)
    }
    dataA.push(recA); // push inner array into outside array
  }
  // This finishes with an nxm matrix with #rows = length of dataA and #cols = numCols
  logLoc ? console.log(dataA) : true;

  /**************************now get the header names ************************** */
  var qryS = `SHOW COLUMNS FROM ${tableNameS};`
  try {
    var colA = dbInst.getcolumns(tableNameS);
    //stmt2 = locConn.createStatement();
    //var colA = [];
    //var cols = stmt2.executeQuery(qryS);
    //while (cols.next()) {
    //  colA.push(cols.getString(1));
    //}
  } catch (err) {
    var problemS = `In ${fS} problem with executing query : ${err}`
    console.log(problemS);
    return problemS
  }

  var rowA = splitRangesToObjects(colA, dataA); // utility function in objUtil.gs
  logLoc ? console.log(rowA) : true;

  results.close();
  stmt.close();
  // stmt2.close();
  // Create backward-compatible json structure to mimic REST calls to Airtable
  var retA = [];
  for (j in rowA) {
    var retObj = new Object();
    retObj["fields"] = rowA[j];
    retA.push(retObj);
  }
  // console.log(retA);
  if (jsonyn) {
    return (retA)
  } else {
    return rowA
  }

}

/**
 * Purpose: 
 *
 * @param  {Object} dbInst - instance of database class
 * @param {String} tableNameS - table to read
 * @param {String} colS - column to select on
 * @param {String} inListS - string in IN SQL format
 * @return {String} retS - return value
 * 
 * return value is in the form: 
 */

const logReadInListFromTable = false;
function readInListFromTable(dbInst, tableNameS, colS, inListS) {
  var fS = "readInListFromTable";
  var logLoc = logReadInListFromTable;
  var problemS;
  /*********connect to database ************************************ */
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    logLoc ? console.log(locConn.toString()) : true;
    var stmt = locConn.createStatement();
    stmt.setMaxRows(maxRows);
  } catch (err) {
    problemS = `In ${fS} issue getting connection or creating statement: ${err}`;
    console.log(problemS);
    return problemS
  }
  /******************extract rows that meet select criteria ********* */
  var qryS = `SELECT * FROM ${tableNameS} where ${colS} IN ${inListS};`;
  logLoc ? console.log(qryS) : true;
  try {
    var results = stmt.executeQuery(qryS);
    var numCols = results.getMetaData().getColumnCount();
  } catch (err) {
    problemS = `In ${fS} problem with executing ${colS} = ${inListS} query : ${err}`;
    console.log(problemS);
    return problemS
  }
  var dataA = [];
  while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
    recA = [];
    for (var col = 0; col < numCols; col++) {
      recA.push(results.getString(col + 1));  // create inner array(s)
    }
    dataA.push(recA); // push inner array into outside array
  }
  // This finishes with an nxm matrix with #rows = length of dataA and #cols = numCols
  logLoc ? console.log(dataA) : true;

  /**************************now get the header names ************************** */
  var qryS = `SHOW COLUMNS FROM ${tableNameS};`
  try {
    stmt2 = locConn.createStatement();
    var colA = [];
    var cols = stmt2.executeQuery(qryS);
    while (cols.next()) {
      colA.push(cols.getString(1));
    }
  } catch (err) {
    var problemS = `In ${fS} problem with executing query : ${err}`
    console.log(problemS);
    return problemS
  }

  var rowA = splitRangesToObjects(colA, dataA); // utility function in objUtil.gs
  logLoc ? console.log(rowA) : true;

  results.close();
  stmt.close();
  stmt2.close();

  return rowA
}

/**
 * Purpose: read row(s) up to maxRows from database using dbInst for connection
 *
 * @param  {object} dbInst - instance of database class
 * @param {string} tableNameS - table to read
 
 * @return {String} retS - return value
 */

const logReadAllFromTable = false;
function readAllFromTable(dbInst, tableNameS) {
  var fS = "readAllFromTable";
  var logLoc = logReadAllFromTable;
  /*********connect to database ************************************ */
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    logReadAllFromTable ? console.log(locConn.toString()) : true;

    var stmt = locConn.createStatement();
    stmt.setMaxRows(maxRows);
  } catch (err) {
    console.log(`In ${fS} issue getting connection or creating statement: ${err}`);
    return -1
  }
  /******************extract rows that meet select criteria ********* */
  var qryS = `SELECT * FROM ${tableNameS};`;
  try {
    var results = stmt.executeQuery(qryS);
    var numCols = results.getMetaData().getColumnCount();
  } catch (err) {
    console.log(`In ${fS} problem with executing ${colS} = ${searchS} query : ${err}`);
    return -1
  }
  var dataA = [];
  while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
    recA = [];
    for (var col = 0; col < numCols; col++) {
      recA.push(results.getString(col + 1));  // create inner array(s)
    }
    dataA.push(recA); // push inner array into outside array
  }
  logReadAllFromTable ? console.log(dataA) : true;

  /**************************now get the header names ************************** */
  var qryS = `SHOW COLUMNS FROM ${tableNameS};`
  try {
    stmt2 = locConn.createStatement();
    var colA = [];
    var cols = stmt2.executeQuery(qryS);
    while (cols.next()) {
      colA.push(cols.getString(1));
    }
  } catch (err) {
    var problemS = `In ${fS} problem with executing query : ${err}`
    console.log(problemS);
    return problemS
  }
  var rowA = splitRangesToObjects(colA, dataA); // utility function in objUtil.gs
  logReadAllFromTable ? console.log(rowA) : true;
  results.close();
  stmt.close();
  stmt2.close();
  var retA = [];
  for (j in rowA) {
    var retObj = new Object();
    retObj["fields"] = rowA[j];
    retA.push(retObj);
  }
  return retA
}
/**
 * Purpose: get records from the database in as similar a way as possible to atUtil.gs
 *
 * @param  {string} tableNameS - name of the table
 * @param  {string} searchS - search for string
 * @return {string} retS - return value
 */

const logGetSQLRecs = false;
function getSQLRecs(dbInst, tableNameS, searchS) {
  var logLoc = logGetSQLRecs;  // change to log name
  var fS = "getSQLRecs";
  switch (tableNameS) {
    case "spacesbuildingcontacts":
      fieldS = "space_identity";
      break;
    case "tourbook":
      fieldS = "SpaceID";
      break;
    case "contacts":
      fieldS = "ContactID";
      break;
    case "spaces":
      fieldS = "SpaceID";
      break;
    case "proposedrent":
      fieldS = "TourBookIndex";
      break;
    case "clauses":
      fieldS = "Section"
      break;
    case "clauses2":
      fieldS = "Section";
      break;

    default:
      break;
  }
  var jsonyn = true;
  var json = readFromTable(dbInst, tableNameS, fieldS, searchS, jsonyn);
  try {
    var response = UrlFetchApp.fetch(endpoint, params);
    var data = response.getContentText();
    var json = JSON.parse(data);
  }
  catch (err) {
    throw new Error(`${fS}: got ${err}`)
  }
  if (logGetJRecs) { console.log(json.records) }
  return (json.records);
}

/**
 * Purpose: get a list of ProposalNames from proposals table
 *
 * @param  {String} userS - optional user string (email)
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function getProposalNames(userS = "mcolacino@squarefoot.com") {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = userS;
  var jsonyn = false;
  var ret = readFromTable(dbInst, tableNameS, colNameS, searchS, jsonyn);
  var proposalsA = ret.map(function (record) {
    return record.proposalname
  })
  console.log(proposalsA)
  return proposalsA
}

/**
 * Purpose: Write a row to the specified table
 *
 * @param  {datebaseC} dbInst - instance of databaseC
 * @param  {string} tableNameS - table name string
 * @param {string[]} recordA - array of strings to write to tableNameS
 * @return {String} retS - return value
 */
function writeToTable(dbInst, tableNameS, recordA) {
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.createStatement();
    var colAtmp = dbInst.getcolumns(tableNameS);
    // creat an array of column names
    var colA = [];
    for (i = 0; i < colAtmp.length; i++) {
      colA.push(colAtmp[i]);
    }
    // filter out columns we don't want to insert, specifically autoincrements
    switch (tableNameS) {
      case "base_rent":
        const colAtmp = colA.filter(col => col != "BaseRentID");
        colA = colAtmp;
        break;
      default:
        break;
    }
    if (colA.length != recordA.length) {
      throw new Error(`number of columns ${colA.length} diff from record param ${recordA.length}`)
      return -1
    }
    var recMod = recordA.map(rec => {
      if (typeof rec != 'number') {
        rec = "'" + rec + "'";
      }
      return rec
    })
    var colS = colA.join();
    var recordS = recMod.join();
    var qryS = `INSERT INTO ${tableNameS}(${colS}) VALUES(${recordS});`;
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.prepareStatement(qryS);
    stmt.execute();

    console.log(qryS);
  } catch (err) {
    console.log(`In writeToTable: ${err}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`In writeToTable: ${err}`);
    return false
  }
  return "Success"
}

/**
 * Purpose: Join spaces and buildings (view?) to get SpaceID / Floor / Suite / Square Footage
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
const logGetSpaceDisplay = false;
function getSpaceDisplay(userS = "mcolacino@squarefoot.com") {
  var dbInst = new databaseC("applesmysql");
  var fS, sS, ssS;
  var tableNameS = "display_spaces"; // this is actually a view but should work the same

  var ret = readAllFromTable(dbInst, tableNameS);
  var spaceA = ret.map(record => {
    return {
      sdesc: record.fields.displayspace,
      sidentity: record.fields.spaceidentity  // note that somewhere along the way underscore gets stripped
    }
  })
  logGetSpaceDisplay ? console.log(spaceA) : true;
  return spaceA

}

/** 
  * Purpose: Get data from the proposal table
  *         based upon the name of the user
  *
  * @param  {String} userS - optional user string (email)
  * @return {array} propDataA - 2D array: name, id, loc, size
  */
const logGetProposalData = false;
function getProposalData(userS = "mcolacino@squarefoot.com") {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = userS;
  var ret = readFromTable(dbInst, tableNameS, colNameS, searchS);
  var propDataA = ret.map(function (record) {
    return [record.fields.proposalname, record.fields.proposalid, record.fields.proposallocation, record.fields.proposalsize]
  })
  logGetProposalData ? console.log(propDataA) : true;
  return propDataA
}

/** 
  * Purpose: Get data from the proposal table
  *         based upon a proposal name, and the name of the user
  * @param  {String} proposalNameS - a name of a proposal
  * @param  {String} userS - optional user string (email)
  * @return {object} pObj - object: name, id, loc, size
  */

function getNamedProposalData(proposalNameS, userS = "mcolacino@squarefoot.com") {
  var fS = "getNamedProposalData";
  try {
    var dbInst = new databaseC("applesmysql");
    var tableNameS = "proposals";
    var colNameS = "CreatedBy";
    var searchS = userS;
    var ret = readFromTable(dbInst, tableNameS, colNameS, searchS);
    var propDataA = ret.map(function (record) {
      return [record.fields.proposalname, record.fields.proposalid, record.fields.proposallocation, record.fields.proposalsize]
    }).filter(prop => prop[0] == proposalNameS)
    //console.log(propDataA)
  } catch (err) {
    var problemS = `In ${fS}: ${err}`;
    logWritePropDetail ? console.log(problemS) : true;
    return problemS
  }
  if (propDataA.length == 1) {
    var p = propDataA[0];
    var pObj = {
      "name": p[0],
      "id": p[1],
      "loc": p[2],
      "size": p[3]
    };
    return pObj
  } else {
    throw new Error(`${proposalNameS} has ${propDataA.length} records.`);
    return -1
  }
}

/**
 * Purpose: Write prop_detail record
 *
 * @param  {string[]} record - matching prop_detail schema
 * @return {String} retS - return value
 */

/*
CREATE TABLE `prop_detail` (
	`ProposalName` 		  VARCHAR(255) NOT NULL,
	`ProposalClauseKey`	VARCHAR(255) NOT NULL,
	`ProposalQuestion`	VARCHAR(255) NOT NULL,
  `ProposalAnswer`	  VARCHAR(255) NOT NULL,
	`CreatedBy` 		    VARCHAR(255) NOT NULL,
  `CreatedWhen` 		  DATE NOT NULL,
  `ModifiedBy` 		    VARCHAR(255) DEFAULT NULL,
  `ModifiedWhen` 		  DATETIME DEFAULT NULL, 
);
*/
const logWritePropDetail = true;
function writePropDetail(dbInst, record) {
  var fS = 'writePropDetail';
  var colS = 'ProposalID, ProposalName,ProposalClauseKey,ProposalQuestion,ProposalAnswer,CreatedBy,CreatedWhen,ModifiedWhen,ModifiedBy';
  var recordA = Object.values(record);
  var recordS = "";
  recordA.forEach((s) => { recordS = recordS + "'" + s + "'" + "," });
  // leaves extra comma at end of recordS
  var rx = /\,$/;
  recordS = recordS.replace(rx, ""); // get rid of comma
  try {
    var qryS = `INSERT INTO prop_detail (${colS}) VALUES(${recordS});`;
    // console.log(qryS);
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.prepareStatement(qryS);
    stmt.execute();
  } catch (err) {
    var problemS = `In ${fS}: ${err}`;
    logWritePropDetail ? console.log(problemS) : true;
    return problemS
  }
  return "Success"
}

const logWriteProposal = false;
function writeProposal(dbInst, record) {
  var fS = 'writeProposal';
  var colS = "ProposalID,ProposalName,space_identity,TenantName,ProposalSize,CreatedBy,CreatedWhen,ModifiedWhen,ModifiedBy";
  var valA = Object.values(record);
  var recordS = "";
  for (i = 0; i < valA.length; i++) {
    if (i < (valA.length - 1)) {
      recordS = recordS + "'" + valA[i] + "',";
    } else {
      recordS = recordS + "'" + valA[i] + "'";
    }
  }
  recordS = "UUID()," + recordS;
  try {
    var qryS = `INSERT INTO proposals (${colS}) VALUES(${recordS});`;
    logWriteProposal ? console.log(qryS) : true;
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.prepareStatement(qryS);
    stmt.execute();
  } catch (err) {
    var problemS = `In ${fS}: ${err}`;
    logWriteProposal ? console.log(problemS) : true;
    return problemS
  }
  return "Success"
}

/**
 * Purpose: delete rows from table based upon select field
 *
 * @param  {object} dbInst - instance of database class
 * @param  {string} tableNameS - table name 
 * @param {string} selectS - value to select
 * @return {boolean} ret - return value
 */

function deleteFromTable(dbInst, tableNameS, selectS) {
  var fS = "deleteFromTable";
  switch (tableNameS) {
    case "base_rent":
      var colS = "ProposalID"
      break;
    default:
      throw new Error("Attempting to delete from undefined table");
      return false
      break;
  }
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.createStatement();
    var qryS = `DELETE FROM ${tableNameS} where ${colS} = '${selectS}';`
    console.log(qryS);
    locConn.createStatement().execute(qryS);

  } catch (err) {
    console.log(`${fS}: ${err}`)
  }
  return true
}


/**
 * Purpose
 *
 * @param  {object} dbInst - instance of database class
 * @param  {number} propID - proposal identifier integer
 * @return {boolean} retS - return value
 */
function matchingBRProposalID(dbInst, propID) {
  var fS = "matchingBRProposalID";
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.createStatement();
  } catch (err) {
    console.log(`In ${fS} problem with connecting: ${err}`);
    return -1
  }
  try {
    var rs = stmt.executeQuery(`SELECT COUNT(*) FROM base_rent where ProposalID = '${propID}';`);
    rs.next()
    var rowCount = rs.getLong(1);
    if (rowCount == 0) { return false }
    else { return true }
  } catch (err) {
    var errS = `In ${fS} problem with executing ProposalID = ${propID} query : ${err}`
    console.log(errS);
    throw new Error(errS);  // pass up to calling function
  }

}

/**
  * Purpose: get an array of ProposalNames and IDs from proposals table
  *         based upon the name of the user
  *
  * @param  {String} userS - optional user string (email)
  * @return {array} propNameIDA - 2D array: name, id
  */

function getProposalNamesAndIDs(dbInst,userS = "mcolacino@squarefoot.com") {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = userS;
  var jsonyn = false;
  var retA = readFromTable(dbInst, tableNameS, colNameS, searchS, jsonyn);
  var propNameIDA = retA.map(function (record) {
    return [record.proposalname, record.proposalid]
  })
  console.log(propNameIDA)
  return propNameIDA
}

/**
 * Purpose: Join spaces and buildings (view?) to get SpaceID / Floor / Suite / Square Footage
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
const logGetAddressSuitFloorSF = false;
function getAddressSuiteFloorSF(userS = "mcolacino@squarefoot.com") {
  var dbInst = new databaseC("applesmysql");
  var fS, sS, ssS;
  var tableNameS = "sub_spaces"; // this is actually a view but should work the same

  var ret = readAllFromTable(dbInst, tableNameS);
  var spaceA = ret.map(record => {
    record.fields.suite ? sS = "/ S: " + record.fields.suite : sS = "";
    record.fields.floor ? fS = "/ F: " + record.fields.floor : fS = "";
    record.fields.squarefeet ? ssS = "/ SF: " + new Intl.NumberFormat().format(record.fields.squarefeet) : ssS = "";
    return {
      sdesc: `${record.fields.address} ${sS} ${fS} ${ssS}`,
      sidentity: record.fields.spaceidentity
    }
  })
  logGetAddressSuitFloorSF ? console.log(spaceA) : true;
  return spaceA
}


/*****************UTILITIES********************* */

/**
 * Changes a range array into an array of objects with key value pairs
 *
 * @params  {array}    headers  [key, key, ...]
 * @params  {array}    values    [[value, value, ...], ...]
 * @returns {array}    [{key:value, ...}, ...]  
 */
function splitRangesToObjects(headers, values) {
  var rowObjects = [];
  for (var i = 0; i < values.length; ++i) {
    var row = new Object();
    //row.rowNum = i;
    for (var j in headers) {
      row[camelString(headers[j])] = values[i][j];
    }
    rowObjects.push(row);
  }
  return rowObjects;
}

/**
 * Removes special characters from a string
 * Commonly know as a camelCase, 
 * Examples:
 *   "First Name" -> "firstName"
 *   "Market Cap (millions) -> "marketCapMillions
 *   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
 * @params  {string}  header   string
 * @returns {string}           camelCase 
 */
function camelString(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum_(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit_(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

function isCellEmpty_(cellData) {
  return typeof (cellData) == "string" && cellData == "";
}
function isAlnum_(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit_(char);
}
function isDigit_(char) {
  return char >= '0' && char <= '9';
}

/**
 * ObjService
 * @author James Ferriera
 * @documentation http://goo.gl/JdEHW
 *
 * Changes an object like e.parameter into a 2D array useful in 
 * writting to a spreadsheet with using the .setValues method
 *
 * @param   {Array}   headers    [header, header, ...] 
 * @param   {Array}   objValues  [{key:value, ...}, ...]
 * @returns {Array}              [[value, value, ...], ...]
 */
function objectToArray(headers, objValues) {
  var values = [];
  var headers = camelArray(headers);
  for (var j = 0; j < objValues.length; j++) {
    var rowValues = [];
    for (var i = 0; i < headers.length; i++) {
      rowValues.push(objValues[j][headers[i]]);
    }
    values.push(rowValues);
  }
  return values;
}


/**
 * Changes a range array often returned from .getValues() into an 
 * array of objects with key value pairs.
 * The first element in the array is used as the keys (headers)
 *
 * @param   {Array}   range   [[key, key, ...],[value, value, ...]] 
 * @returns {Array}           [{key:value, ...}, ...] 
 */
function rangeToObjects(range) {
  var headers = range[0];
  var values = range;
  var rowObjects = [];
  for (var i = 1; i < values.length; ++i) {
    var row = new Object();
    // row.rowNum = i;
    for (var j in headers) {
      row[headers[j]] = values[i][j];
    }
    rowObjects.push(row);
  }
  return rowObjects;
}

/**
 * Removes special characters from strings in an array
 * Commonly know as a camelCase, 
 * Examples:
 *   "First Name" -> "firstName"
 *   "Market Cap (millions) -> "marketCapMillions
 *   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
 * @params  {array} headers   [string, string, ...]
 * @returns {array}           camelCase 
 */
function camelArray(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    var key = camelString(headers[i]);
    if (key.length > 0) {
      keys.push(key);
    }
  }
  return keys;
}
/**********************Test Functions********************** */


function testMatchingBRProposalID() {
  var dbInst = new databaseC("applesmysql");
  var ret = matchingBRProposalID(dbInst, 1);

}

function testReadFromClauses() {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "clauses";
  var colNameS = "Section";
  var searchS = "Electric";
  var jsonyn = false;
  var retA = readFromTable(dbInst, tableNameS, colNameS, searchS, jsonyn); // all rows in section Electric
  // var records = retA.map(function (record) {
  //   return record;
  // });
  console.log(retA);
  // console.log(records[0].clausekey);
  dbInst.getconn().close;
}

function testReadFromProposals() {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = userEmail;
  var jsonyn = false;
  var retA = readFromTable(dbInst, tableNameS, colNameS, searchS, jsonyn); // all rows in section Electric
  console.log(retA);
  dbInst.getconn().close;
}
