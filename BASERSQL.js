// BASER 210616
// var connectionName = 'fleet-breaker-311114:us-central1:applesmysql';
// var rootPwd = 'lew_FEEB@trit3auch';
// var user = 'applesU1';
// var userPwd = 'DIT6rest1paft!skux';
// var db = 'applesmysql';

// var root = 'root';
// var instanceUrl = 'jdbc:google:mysql://' + connectionName;
// var dbUrl = instanceUrl + '/' + db;

/* Contents:
function createDatabase(dbS)
function dropTable(dbInst, tableNameS)
function createUser(dbInst)
function createClauseTable(dbInst)
function readFromTable(dbInst, tableNameS, colS, searchS)
function getProposalNames(userS="mcolacino@squarefoot.com")
function getProposalNamesAndIDs(userS = "mcolacino@squarefoot.com")
function getSQLRecs(dbInst, tableNameS, searchS)
*/


/**
 * Purpose: read row(s) upt to maxRows from database using dbInst for connection
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
function readFromTable(dbInst, tableNameS, colS, searchS,jsonyn=true) {
  var fS = "readFromTable";
  var logLoc = logReadFromTable;
  /*********connect to database ************************************ */
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    if (logReadFromTable) {
      console.log(locConn.toString());
    }
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
  if (logReadFromTable) { console.log(dataA) };

  /**************************now get the header names ************************** */
  var qryS = `SHOW COLUMNS FROM ${tableNameS};`
  try {
    var colA = dbInst.getcolumns(tableNameS);
    // stmt2 = locConn.createStatement();
    // var colA = [];
    // var cols = stmt2.executeQuery(qryS);
    // while (cols.next()) {
    //   colA.push(cols.getString(1));

  } catch (err) {
    console.log(`In ${fS} problem with executing query : ${err}`);
  }
  var rowA = splitRangesToObjects(colA, dataA); // utility function in objUtil.gs
  if (logReadFromTable) { console.log(rowA) };

  results.close();
  stmt.close();
  // stmt2.close();

  if (logLoc) {
    var end = new Date();
    console.log('Time elapsed: %sms', end - start);
  }
  // Convert from json structure with "fields" to "flat" object array
  var retA = [];
  for (j in rowA) {
    var retObj = new Object();
    retObj["fields"] = rowA[j];
    retA.push(retObj);
  }
  // console.log(retA);
  if(jsonyn) {
    return(retA)
    } else {
      return rowA
    }

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
  } catch (e) {
    console.log(`In writeToTable: ${e}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`In writeToTable: ${e}`);
    return false
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
      colS = "ProposalID"
      break;
    default:
      throw new Error("Attempting to delete from undefined table");
      return false
      break;
  }
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.createStatement();
    var qryS = `DELETE FROM ${tableNameS} where ${colS} = ${selectS};`
    locConn.createStatement().execute(qryS);

  } catch (e) {
    console.log(`${fS}: ${e}`)
  }
  return true
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
  var ret = readFromTable(dbInst, tableNameS, colNameS, searchS,jsonyn);
  var proposalsA = ret.map(function (record) {
    return record.fields.proposalname
  })
  console.log(proposalsA)
  return proposalsA
}


/**
  * Purpose: get an array of ProposalNames and IDs from proposals table
  *         based upon the name of the user
  *
  * @param  {String} userS - optional user string (email)
  * @return {array} propNameIDA - 2D array: name, id
  */

function getProposalNamesAndIDs(userS = "mcolacino@squarefoot.com") {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = userS;
  var jsonyn = false;
  var retA = readFromTable(dbInst, tableNameS, colNameS, searchS,jsonyn);
  var propNameIDA = retA.map(function (record) {
    return [record.fields.proposalname, record.fields.proposalid]
  })
  console.log(propNameIDA)
  return propNameIDA
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
  } catch (e) {
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
  var json = readFromTable(dbInst, tableNameS, fieldS, searchS);
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
  var ret = readFromTable(dbInst, tableNameS, colNameS, searchS); // all rows in section Electric
  var records = ret.map(function (record) {
    return record.fields;
  });
  console.log(records);
  // console.log(records[0].clausekey);
  dbInst.getconn().close;
}

function testReadFromProposals() {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = "mcolacino@squarefoot.com";
  var ret = readFromTable(dbInst, tableNameS, colNameS, searchS); // all rows in section Electric
  var records = ret.map(function (record) {
    return record.fields;
  });

  // console.log(records[0].clausekey);
  dbInst.getconn().close;
}