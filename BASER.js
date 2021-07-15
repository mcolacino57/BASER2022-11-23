var ss = SpreadsheetApp.getActiveSpreadsheet();
const nominalFreeRent = 6; // In months
const nominalRent = 50;  // in $/PSF
const nominalTerm = 36; // In months
const userEmail = Session.getActiveUser().getEmail();
const ssLogID = '1l3EYsH7UJFUfuFORFF7GNxPM2jwLZlSh_0xSgSDTOPo';
Logger = BetterLog.useSpreadsheet(ssLogID); 

function onOpen() {
    Logger.log("Getting into onOpen");
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert("Getting into onOpen");
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    { name: 'Get Proposals', functionName: 'crProposalSheet' },
    { name: 'Create Initial Row', functionName: 'crInitRowDispatch' },
    { name: 'Create Additional Row', functionName: 'crAddlRowDispatch' },
    { name: 'Export Base Rent', functionName: 'exportBRDBDispatch' }
  ];
  spreadsheet.addMenu('Base Rent', menuItems);
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
  var errS = "Problem creating initial row!"
  try {
    var lr = ss.getLastRow();
    if (lr > lastRow) {
      throw new Error(`Last row is ${lr}; delete all rows past ${lastRow}`);
      return errS
    }
    var brRow = crBaseRentRow("=InitialDate", nominalFreeRent, 0);
    ss.appendRow(brRow);

  } catch (e) {
    Logger.log(`In ${fS}: ${e}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${e}`);
  }
  return "Inital row created"
}

function crInitRowDispatch() {
  //var ss = SpreadsheetApp.openById("10L4V9cHede6Q7iX0NQg2XZWjZU23oMUExc2KlcmpzoY");
  var retS = crInitRow(ss);
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
const monthsDefault = 36;  // should move to class or .ini file
function crAddlRow(ss) {
  var fS = "crAddlRow";
  var errS = "Problem creating additional row!"
  try {
    var startFromEndS = '=INDIRECT("R[-1]C[2]",FALSE)+1';  // hardwired difference
    // var priorRent = `=INDIRECT("R[-1]C[2]",FALSE)`;
    // var rsf = ss.getRangeByName('RSF').getValue();
    var brRow = crBaseRentRow(startFromEndS, monthsDefault, nominalRent);
    ss.getActiveSheet().appendRow(brRow);
    var lr = ss.getLastRow();
    var ss2 = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss2.getSheets()[0];
    // Passing only two arguments returns a "range" with a single cell.
    sheet.getRange(lr, rentPSFC).setNumberFormat("$#,##0.00;$(#,##0.00)");
    sheet.getRange(lr, rentAnnC).setNumberFormat("$#,##0;$(#,##0)");
  } catch (e) {
    Logger.log(`In ${fS}: error: ${e}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${e}`);
  }
  return "Inital row created"
}

function crAddlRowDispatch() {
  //var ss = SpreadsheetApp.openById("10L4V9cHede6Q7iX0NQg2XZWjZU23oMUExc2KlcmpzoY");
  var retS = crAddlRow(ss);
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

/*******************PROPOSAL SHEET**************************** */
/**
 * Purpose: Create proposal sheet, put names and  ids   into sheet
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function crProposalSheet() {
  var fS = "crProposalSheet"
  var errS = "Can't find or create Proposals sheet";
  var dbInst = new databaseC("applesmysql");
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Proposals");  // make proosals active or create
    if (!ss) {
      var ss = SpreadsheetApp.getActiveSpreadsheet().insertSheet().setName("Proposals");
    }
  }
  catch (err) {
    var probS = `${errS}: ${err}`;
    Logger.log(probS);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(probS);
    return probS;
  }
  var propA = getProposalNamesAndIDs(dbInst,userEmail);
  var retS = populateSheet(ss, propA);
  return retS;
}

/**
 * Purpose: populate sheet with data from propA
 *
 * @param  {object} ss- spreadsheet sheet
 * @param  {array} propA - an array of properties to write 
 * @return {String} retS - return value
 */
function populateSheet(ss, propA) {
  var errS = "Can't populate sheet"
  try {
    const rangeS = ["A2:", "B", propA.length + 1].join("");
    var ssRange = ss.getRange(rangeS);
    ssRange.setValues(propA);
    var ssBR = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    // Logger.log(ssBR.getName());
    var cellPID = ssBR.getRange("pid");
    cellPID.setFormula("=VLOOKUP(B2,Proposals!A2:B6,2,FALSE)");
  }
  catch (e) {
    Logger.log(`${errS}: ${e}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${errS}: ${e}`);
    return -1;
  }
  return "Success"
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
      if (updateYN) { var ret = deleteFromTable(dbInst, "base_rent", cellPID); }
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
  } catch (e) {
    ui.alert(`Error in duplicateBRAlert: ${e}`);
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