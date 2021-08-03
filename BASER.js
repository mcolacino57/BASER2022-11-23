// 210802 4:13
// 210802 11:10
// 210803 9:31
var nominalFreeRentG = "6";
var nominalRentG = "60";
var nominalTermG = "36";
var monthsDefaultG = "12";


const userEmail = Session.getActiveUser().getEmail();
const ssLogID = '1l3EYsH7UJFUfuFORFF7GNxPM2jwLZlSh_0xSgSDTOPo';
Logger = BetterLog.useSpreadsheet(ssLogID);

function onOpen(e) {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    { name: 'Create Initial Row', functionName: 'crInitRowDispatch' },
    { name: 'Create Additional Row', functionName: 'crAddlRowDispatch' },
    { name: 'Export Base Rent', functionName: 'exportBRDBDispatch' }
  ];
  spreadsheet.addMenu('Base Rent', menuItems);
  var ret = handleJSON(); // set globals from username.json
  ret = populateSheet();

}

/**
 * Purpose: create first base rent row
 * Create row with start date=InitialDate, formula for end date, RSF, and 
 * formula for annual rent
 * 
 * @param  {object} ss - spreadsheet (global, later class)
 * @return {String} retS - return value
 */
const lastRow = 4; // hardwired
function crInitRow(ss) {
  var fS = "crInitRow";
  try {
    var lr = ss.getLastRow();
    if (lr > lastRow) {
      throw new Error(`Last row is ${lr}; delete all rows past ${lastRow}`);
      return false
    }
    var brRow = crBaseRentRow("=InitialDate", nominalFreeRentG, 0);
    ss.appendRow(brRow);

  } catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${err}`);
  }
  return true
}

function crInitRowDispatch() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ret = crInitRow(ss);
  return ret
}

/**
 * Purpose: additional base rent rows
 * Create row with start date=prior end date, formula for end date, RSF, and 
 * formula for annual rent.
 * 
 * NOTE: Column numbers are hardwired here an changes to the sheet might need changes
 * 
 * @param  {object} ss - spreadsheet (global, later class)
 * @return {String} retS - return value
 */

const rentPSFC = 4;  // hardwired rent column
const rentAnnC = 5;  // hardwired annual expense column
function crAddlRow() {
  var fS = "crAddlRow";
  var errS = "Problem creating additional row!"
  try {
    var ssBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base Rent Schedule");
    var startFromEndS = '=INDIRECT("R[-1]C[2]",FALSE)+1';  // hardwired difference
    var brRow = crBaseRentRow(startFromEndS, monthsDefaultG, nominalRentG);
    ssBR.appendRow(brRow);
    var lr = ssBR.getLastRow();
    ssBR.getRange(lr, rentPSFC).setNumberFormat("$#,##0.00;$(#,##0.00)");
    ssBR.getRange(lr, rentAnnC).setNumberFormat("$#,##0;$(#,##0)");
  } catch (err) {
    Logger.log(`In ${fS}: error: ${err}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${err}`);
      return false
  }
  return true
}

function crAddlRowDispatch() {
  var retS = crAddlRow();
}

/**
 * Purpose: create a base rent row for appending
 *
 * @param  {string} startDateS - poke into start date
 * @param  {string} months - string but a number
 * @param {string} rentPSF - string but dollar value
 * @return {array}  - returns array of four strings
 */

function crBaseRentRow(startDateS, months, rentPSF) {
  var endS = '=EDATE(INDIRECT("R[0]C[-2]",FALSE),INDIRECT("R[0]C[-1]",FALSE))-1';
  var annRS = '=INDIRECT("R[0]C[-1]",FALSE)*RSF';
  return [startDateS, months, endS, rentPSF, annRS]
}

function formatCurrency(range) {
  range.setNumberFormat("$#,##0.00;$(#,##0.00)");
}

// Major changes on 210802
/**
 * Purpose: populate sheet with data from current proposal
 *
 * @param  {object} ss- spreadsheet sheet--now the main (0) sheet
 * @return {String} retS - return value
 */
function populateSheet() {
  var fS = "populateSheet";
  var errS = "Can't populate sheet";
  try {
    const dbInst = new databaseC("applesmysql");
    var [propID, propName] = getCurrentProposal(dbInst, userEmail);
    var rsf = getRSFfromPID(dbInst, propID);
    var [commDate, leaseTerm] = getCommenceAndTermForCurrent(dbInst, propID);
    var ssBR = SpreadsheetApp.getActive().getSheetByName('Base Rent Schedule');
    if (!ssBR) { throw new Error(`can't get sheet for Base Rent Schedule`) };
    var ssAssum = SpreadsheetApp.getActive().getSheetByName('Assumptions');
    if (!ssAssum) { throw new Error(`can't get sheet for Assumptions`) };
    var pidRange = ssBR.getRange('pid');
    var pnameRange = ssBR.getRange('propName');
    var rsfRange = ssAssum.getRange('RSF');
    var commDateRange = ssAssum.getRange('InitialDate');
    var leaseTermRange = ssAssum.getRange('LeaseTermMons');

    commDateRange.setValues([[commDate]]);
    leaseTermRange.setValues([[leaseTerm]]);
    pidRange.setValues([[propID]]);
    rsfRange.setValues([[rsf]]);
    pnameRange.setValues([[propName]]);
  }
  catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${errS}: ${err}`);
    return false;
  }
  return true
}

/************************EXPORT BASE RENT************************* */
/**
 * Purpose: export base rent
 *
 * @param  {object} dbInst - instance of databaseC for applemysql
 * @return {String} retS - return value
 */

function exportBR(dbInst) {
  var fS = "exportBR";
  try {
    var ssBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base Rent Schedule");
    var cellPID = ssBR.getRange("pid").getValue(); // get proposal id from sheet
    var alreadyBR = matchingBRProposalID(dbInst, cellPID); // already br for this proposal?
    if (alreadyBR) {
      var updateYN = duplicateBRAlert();
      if (updateYN) {
        var ret = deleteFromTable(dbInst, "base_rent", cellPID);
      }
      else { return }
    }
    var lrS = ssBR.getLastRow().toString(); // last row string
    var brRangeS = "A5:E" + lrS;  // set range from A to E column; fix if columns change
    // Get range with base rent
    var brRange = ssBR.getRange(brRangeS).getValues();
    // Put that range into a set of lists with dates formatted properly for input to SQL
    var adjBR = brRange.map(br => {
      var formattedStartDate = Utilities.formatDate(new Date(br[0]), "GMT-5", 'yyyy-MM-dd');
      var formattedEndDate = Utilities.formatDate(new Date(br[2]), "GMT-5", 'yyyy-MM-dd');
      // Note this should be refactored to a structure or probably a class
      return [
        cellPID,  // Proposal id
        formattedStartDate,
        formattedEndDate,
        br[1],  // Months between dates
        userEmail, // Created by
        br[3],  // base rent pSF
        Utilities.formatDate(new Date(), "GMT-5", "yyyy-MM-dd"), // created when (today)
        userEmail, // Modified by
        Utilities.formatDate(new Date(), "GMT-5", "yyyy-MM-dd")] // modified when
    });
    // Iterate over variable writing rows to the dbInst
    adjBR.forEach(record => {
      var ret = writeToTable(dbInst, "base_rent", record);
      if (ret == -1) {
        throw new Error("Problem writing to table in exportBR.");
        return -1
      }
    })
  } catch (err) {
    var probS = `In ${fS}: ${err}`;
    Logger.log(probS)
    throw new Error(probS);
    return probS
  }
  return "Success"
}
/**
 * Purpose: dispatch to export the 
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */

function exportBRDBDispatch() {
  var dbInst = new databaseC("applesmysql");
  var ret = exportBR(dbInst);
  dbInst.closeconn();

}

/*************************UI Utilities************************ */

function duplicateBRAlert() {
  try {
    var ui = SpreadsheetApp.getUi(); // Same variations.
    var result = ui.alert(
      'This proposal already has base rent data.',
      'Would you like to replace with this data?',
      ui.ButtonSet.YES_NO);

    // Process the user's response.
    if (result == ui.Button.YES) {
      // User clicked "Yes".
      ui.alert('Overwriting');
      return true
    } else {
      // User clicked "No" or X in the title bar.
      ui.alert('Canceled');
      return false
    }
  } catch (err) {
    ui.alert(`Error in duplicateBRAlert: ${err}`);
    return false
  }

}

/**********************General Utility ********************* */

function updateForm() {
  // call your form and connect to the drop-down item
  var form = FormApp.openById("1l2wzhq1-dIgS9LJZ2skO1L9t5T_-V3E3vYmLHT2IJDQ");

  var proposalList = form.getItemById("816438396").asListItem();

  // convert the array ignoring empty cells

  // populate the drop-down with the array data
  proposalList.setChoiceValues(getProposalNames("Michael Colacino"));

}


//-------------------------------------------------------------------------------
// Display the passed object in the Logger
// @param {object} obj - object to be logged
// @param {string} log - (for internal use only) final output sent to the logger
// @param {number} count - (for internal user only) keeps track of the number of 
//                         iteration that the program is running in.
//-------------------------------------------------------------------------------
function logObj(obj, log, count) {
  var def = {};
  // Set default values to the passed arguments
  obj = obj == undefined ? def : obj;
  log = log == undefined ? '\n' : log;
  count = count == undefined ? 1 : count;

  // If it's date object convert it to string
  if (obj instanceof Date) {
    obj = obj.toString();
  }
  // If it's a function represent it as a string
  if (typeof obj == 'function') {
    obj = 'function() {}';
  }
  // If it's an Object
  if (typeof obj == 'object') {
    var isArray = obj.constructor.name == 'Array';
    var length = 0;
    for (var i in obj) {
      length++;
    }
    if (isArray) log += '[';
    else log += '{';
    if (length) {
      log += '\n';
      var num = 1;
      for (var i in obj) {
        // add tabs based on which iteration the program is running in
        var tab1 = '';
        var tab2 = ''; // this is one tab less than tab1 
        for (var k = 0; k < count; k++) {
          tab1 += '\t';
          if (k < (count - 1)) {
            tab2 += '\t';
          }
        }
        log += tab1;
        if (!isArray) log += i + ' : ';
        log += logObj(obj[i], '', count + 1);
        if (num < length) {
          log += ',\n';
        }
        num++;
      }
      log += '\n' + tab2;
    }
    if (isArray) log += ']';
    else log += '}';
    // if it's not the first iteration, return the log instead of printing it
    if (count > 1) {
      return log;
    }
  }
  else if (count > 1) {
    return obj;
  }
  else {
    log = obj;
  }
  if (count == 1) {
    Logger.log(log);
  }
}
/**********************Test Functions ******************* */

function testGetColumns() {
  var dbInst = new databaseC("applesmysql");
  var colA = dbInst.getcolumns('clauses');
  console.log(colA)
}

function testExportBR() {
  var dbInst = new databaseC("applesmysql");
  retS = exportBR(dbInst);

}

function testHandleJSON() {
  var ret = handleJSON();
  if (nominalFreeRentG == "6"
    && nominalRentG == "60.00"
    && nominalTermG == "36"
    && monthsDefaultG == "12") { return true }
  return false
}

function runTests() {
  var dbInst = new databaseC("applesmysql");

  var userS = userEmail;
  var testPID = '50fcd535-edb2-11eb-93f1-42010a800005';  // rsf should be 965 as a string


  const test = new UnitTestingApp();
  test.enable(); // tests will run below this line
  test.runInGas(true);
  if (test.isEnabled) {

    test.assert(testgetRSFfromPID(testPID) === "965", `testgetRSFfromPID with ${testPID}`);
    test.assert(testHandleJSON(), `testHandleJSON`);
    test.assert(populateSheet(), `populateSheet`);

    // test.assert(testProposalNamesAndIDs(userS), `gcloudSQL.getProposalNamesAndIDs with user ${userS}`);
    // test.assert(testgetCurrPropID(),`testgetCurrPropID shows a current proposal ID`);
    // test.assert(evalPOResponses(form), `evalPOResponses`);
    // test.assert(questionToClauseKey(dbInst, validQS), `questionToClauseKey with question '${validQS}'' in ck_question`);
    // test.assert(testGetProposalData(dbInst, userS), `testGetProposalData with user '${userS}' in proposal data`);
    // test.assert(emptyCk_Question(), 'emptyCk_Question');
    // test.assert(writeAllQuestionsKeys(), 'writeAllQuestionsKeys');
  }
  dbInst.closeconn();
}

/**
 * Purpose: get information stored in JSON file, use for default
 * rents, free rent, and term
 * 
 *
 * @param  {object} dbInst - instance of database class
 * @param  {object} docInst - instance of document class
 * @return {String} retS - return value
 */
function handleJSON() {
  var fS = "handleJSON", probS;
  var userPrefixS = userEmail.split('@')[0];
  var fileName = userPrefixS + ".json";
  try {
    // var fileName = "mcolacino.json";
    var files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      var json = JSON.parse(content);
    }

    if (json.nominalFreeRent) { nominalFreeRentG = json.nominalFreeRent }
    if (json.nominalRent) { nominalRentG = json.nominalRent }
    if (json.nominalTerm) { nominalTermG = json.nominalTerm }
    if (json.monthsDefault) { monthsDefaultG = json.monthsDefault }

  } catch (err) {
    probS = `In ${fS}: ${err}`
    console.log(probS);
    return false
  }
  return true
}