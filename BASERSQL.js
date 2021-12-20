/*global Logger,databaseC,SpreadsheetApp */
/*exported getProposalNames, writeToTable,getProposalNamesAndIDs,rangeToObjects,
testMatchingBRProposalID,testReadFromClauses,testReadFromProposals,testgetRSFfromPID,testgetCommenceAndTermForCurrent*/

// 210727 9:49
// 210802 8:35
// 210803 12:52
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
function readFromTable(dbInst, tableNameS, colS, searchS, jsonyn = true) {
  var fS = "readFromTable";
  var logLoc = logReadFromTable;
  /*********connect to database ************************************ */
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    logLoc ? Logger.log(locConn.toString()) : true;
    var stmt = locConn.createStatement();
    stmt.setMaxRows(maxRows);
  } catch (err) {
    Logger.log(`In ${fS} issue getting connection or creating statement: ${err}`);
    return -1
  }
  /******************extract rows that meet select criteria ********* */
  var qryS = `SELECT * FROM ${tableNameS} where ${colS} = "${searchS}";`;
  try {
    var results = stmt.executeQuery(qryS);
    var numCols = results.getMetaData().getColumnCount();
  } catch (err) {
    Logger.log(`In ${fS} problem with executing ${colS} = ${searchS} query : ${err}`);
    return -1
  }
  var dataA = [];
  while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
    var recA = [];
    for (var col = 0; col < numCols; col++) {
      recA.push(results.getString(col + 1));  // create inner array(s)
    }
    dataA.push(recA); // push inner array into outside array
  }
  // This finishes with an nxm matrix with #rows = length of dataA and #cols = numCols
  logLoc ? Logger.log(dataA) : true;

  /**************************now get the header names ************************** */
  qryS = `SHOW COLUMNS FROM ${tableNameS};`
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
    Logger.log(problemS);
    return problemS
  }

  var rowA = splitRangesToObjects(colA, dataA); // utility function in objUtil.gs
  logLoc ? Logger.log(rowA) : true;

  results.close();
  stmt.close();
  // stmt2.close();
  // Create backward-compatible json structure to mimic REST calls to Airtable
  var retA = [];
  var j;
  for (j in rowA) {
    var retObj = new Object();
    retObj["fields"] = rowA[j];
    retA.push(retObj);
  }
  // Logger.log(retA);
  if (jsonyn) {
    return (retA)
  } else {
    return rowA
  }

}


/**
 * Purpose: read row(s) up to maxRows from database using dbInst for connection
 *
 * @param  {object} dbInst - instance of database class
 * @param {string} tableNameS - table to read
 
 * @return {String} retS - return value
 */

 const logReadAllFromTable = false;
 // eslint-disable-next-line no-unused-vars
 function readAllFromTable(dbInst, tableNameS, jsonyn = true) {
   var fS = "readAllFromTable";
   var logLoc = logReadAllFromTable;
   /*********connect to database ************************************ */
   try {
     var locConn = dbInst.getconn(); // get connection from the instance
     logLoc ? console.log(`In ${fS} ${locConn.toString()}`) : true;
 
     var stmt = locConn.createStatement();
     stmt.setMaxRows(maxRows);
   } catch (err) {
     const probS = `In ${fS} issue getting connection or creating statement: ${err}`;
     Logger.log(probS);
     return false
   }
   /******************extract rows that meet select criteria ********* */
   var qryS = `SELECT * FROM ${tableNameS};`;
   try {
     var results = stmt.executeQuery(qryS);
     var numCols = results.getMetaData().getColumnCount();
   } catch (err) {
     const probS = `In ${fS} problem with executing query : ${err}`;
     Logger.log(probS);
     return false
   }
   var dataA = [];
   while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
     var recA = [];
     for (var col = 0; col < numCols; col++) {
       recA.push(results.getString(col + 1));  // create inner array(s)
     }
     dataA.push(recA); // push inner array into outside array
   }
   logLoc ? console.log(`In ${fS} ${dataA}`) : true;
 
   /**************************now get the header names ************************** */
   try {
     var colA = dbInst.getcolumns(tableNameS);
   } catch (err) {
     var probS = `In ${fS} problem with executing query : ${err}`
     Logger.log(probS);
     return probS
   }
   var rowA = splitRangesToObjects(colA, dataA); // utility fn in objUtil.gs
   logLoc ? console.log(`In ${fS} ${rowA}`) : true;
   results.close();
   stmt.close();
   var retA = [];
   for (var j in rowA) {
     var retObj = new Object();
     retObj["fields"] = rowA[j];
     retA.push(retObj);
   }
   if (jsonyn) {
     return retA
   }
   else {
     return rowA
   }
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
  Logger.log(proposalsA)
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
    var i;
    for (i = 0; i < colAtmp.length; i++) {
      colA.push(colAtmp[i]);
    }
    // filter out columns we don't want to insert, specifically autoincrements
    switch (tableNameS) {
      case "base_rent":
        colAtmp = colA.filter(col => col != "BaseRentID");
        colA = colAtmp;
        break;
      default:
        break;
    }
    if (colA.length != recordA.length) {
      throw new Error(`number of columns ${colA.length} diff from record param ${recordA.length}`)
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
    locConn = dbInst.getconn(); // get connection from the instance
    stmt = locConn.prepareStatement(qryS);
    stmt.execute();

    Logger.log(qryS);
  } catch (err) {
    Logger.log(`In writeToTable: ${err}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`In writeToTable: ${err}`);
    return false
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
// eslint-disable-next-line no-unused-vars
function matchingBRProposalID(dbInst, propID) {
  var fS = "matchingBRProposalID";
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.createStatement();
  } catch (err) {
    Logger.log(`In ${fS} problem with connecting: ${err}`);
    return false
  }
  try {
    var rs = stmt.executeQuery(`SELECT COUNT(*) FROM base_rent where ProposalID = '${propID}';`);
    rs.next()
    var rowCount = rs.getLong(1);
    if (rowCount == 0) { return false }
    else { return true }
  } catch (err) {
    var errS = `In ${fS} problem with executing ProposalID = ${propID} query : ${err}`
    Logger.log(errS);
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

function getProposalNamesAndIDs(dbInst, userS = "mcolacino@squarefoot.com") {
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = userS;
  var jsonyn = false;
  var retA = readFromTable(dbInst, tableNameS, colNameS, searchS, jsonyn);
  var propNameIDA = retA.map(function (record) {
    return [record.proposalname, record.proposalid, record.current]
  });
  Logger.log(propNameIDA)
  return propNameIDA
}



// eslint-disable-next-line no-unused-vars
function getRSFfromPID(dbInst, pid) {
  var fS = "getRSFfromPID";
  try {
    const tableNameS = "prop_rsf";
    const colNameS = "ProposalID";
    const searchS = pid;
    const jsonyn = false;
    var retA = readFromTable(dbInst, tableNameS, colNameS, searchS, jsonyn);
    if (retA.length === 0) {
      throw new Error(`proposal ${pid} not found`);
    }
    else {
      var rsf = retA[0].squarefeet;
    }
  }
  catch (err) {
    Logger.log(`In ${fS}; error: ${err}`)
    return false
  }
  return rsf

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


function isAlnum_(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit_(char);
}
function isDigit_(char) {
  return char >= '0' && char <= '9';
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


/**********************Test Functions********************** */



/**
 * Purpose: get current proposal from db
 *
 * @param  {object} dbInst - instance of databaseC
 * @param  {string} userS - name of current user
 * @return {boolean[]} [pid, pN] or [false,false]
 */

function getCurrentProposal(dbInst) {
  const fS = "getCurrentProposal";
  var pid = "";
  var pN = "";
  try {
    const locConn = dbInst.getconn(); // get connection from the instance

    const qryS = `SELECT ProposalID, ProposalName FROM proposals WHERE current=true;`;
    const stmt = locConn.prepareStatement(qryS);
    const results = stmt.executeQuery(qryS);
    var cntr = 0;
    while (results.next()) { // the resultSet cursor moves forward with next; ends with false when at end
      pid = results.getString("ProposalID");
      pN = results.getString("ProposalName");
      cntr++;
      // column can either be by number or by string 
    }
    if (cntr === 0 || pid === "") { throw new Error(`no current proposal`) }
    if (cntr > 1) { throw new Error(`more than one current proposal`) }
    return [pid, pN]

  } catch (err) {
    const probS = `In ${fS}: error ${err}`;
    Logger.log(probS);
    return [false, false]
  }
}

/**
 * Purpose: From the prop_detail table, extract 'commDate' and 'leaseTerm' and
 *
 * @param  {Object} dbInst 
 * @param  {String} propID - current proposal ID
 * @return {String[]} retA - return array of commDate and leaseTerm, or false
 */
function getCommenceAndTermForCurrent(dbInst, propID) {
  const fS = "getCommenceAndTermForCurrent";
  var commDateS='', leaseTermS='';
  try {
    const locConn = dbInst.getconn(); // get connection from the instance
    const qry = `SELECT ProposalAnswer,ProposalClauseKey FROM prop_detail \
WHERE (ProposalClauseKey='commDate' OR  ProposalClauseKey='leaseTerm') and ProposalID = '${propID}';`;
    const stmt = locConn.prepareStatement(qry);
    const results = stmt.executeQuery(qry);
    var cntr = 0;
    while (results.next()) { // the resultSet cursor moves forward with next; ends with false when at end
      var ck = results.getString("ProposalClauseKey");
      var pAns = results.getString("ProposalAnswer");
      if(ck==='commDate'){commDateS=pAns}
      if(ck==='leaseTerm'){leaseTermS=pAns}
      cntr++;
    }
    if (cntr === 0) { throw new Error(`no term or commencement in prop_detail`) }
    if (cntr > 2) { throw new Error(`more rows in prop_detail than expected`) }
    return [commDateS, leaseTermS]

  } catch (err) {
    const probS = `In ${fS}: error ${err}`;
    Logger.log(probS);
    return [false, false]
  }
}

function testgetCommenceAndTermForCurrent(){
  const dbInst = new databaseC("applesmysql");
  // eslint-disable-next-line no-undef
  var [propID,propName] = getCurrentProposal(dbInst);
  var [cd,lt]=getCommenceAndTermForCurrent(dbInst,propID);
  console.log(`${cd} and ${lt} for ${propName}`);
}

