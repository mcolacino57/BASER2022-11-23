// 210802 4:13
// 210802 11:10

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
    // { name: 'Get Proposals', functionName: 'crProposalSheet' },
    { name: 'Create Initial Row', functionName: 'crInitRowDispatch' },
    { name: 'Create Additional Row', functionName: 'crAddlRowDispatch' },
    { name: 'Export Base Rent', functionName: 'exportBRDBDispatch' }
  ];
  spreadsheet.addMenu('Base Rent', menuItems);
  var ret = populateSheet();
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
    var brRow = crBaseRentRow("=InitialDate", nominalFreeRentG, 0);
    ss.appendRow(brRow);

  } catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${err}`);
  }
  return "Inital row created"
}

function crInitRowDispatch() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
function crAddlRow(ss) {
  var fS = "crAddlRow";
  var errS = "Problem creating additional row!"
  try {
    var startFromEndS = '=INDIRECT("R[-1]C[2]",FALSE)+1';  // hardwired difference
    // var priorRent = `=INDIRECT("R[-1]C[2]",FALSE)`;
    // var rsf = ss.getRangeByName('RSF').getValue();
    var brRow = crBaseRentRow(startFromEndS, monthsDefaultG, nominalRentG);
    ss.getActiveSheet().appendRow(brRow);
    var lr = ss.getLastRow();
    var ss2 = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss2.getSheets()[0];
    // Passing only two arguments returns a "range" with a single cell.
    sheet.getRange(lr, rentPSFC).setNumberFormat("$#,##0.00;$(#,##0.00)");
    sheet.getRange(lr, rentAnnC).setNumberFormat("$#,##0;$(#,##0)");
  } catch (err) {
    Logger.log(`In ${fS}: error: ${err}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${err}`);
  }
  return "Inital row created"
}

function crAddlRowDispatch() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();;
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

/******************* CREATE PROPOSAL SHEET**************************** */
/**
 * Purpose: Create proposal sheet, put names and  ids   into sheet
 *
 * @return {String} retS - return value
 */

/**  Radical changes on 210802
 * 1. Eliminate concept of proposal sheet in favor of idea of a proposal cell set
 * based on the current proposal
 * 2. Therefor eliminate VLOOKUP based on what is happening in cell B2, and instead just
 * poke the current Proposal Name and PID in b2 and b3 or into range 'pid'
 * 4. Eliminate the dropdown function in the spreadsheet
 * 5. Get the RSF from the current proposal and poke that into 'RSF'
 * 6. Extra credit: acquire the initial date from the prop_gen table and poke that into the assumptions sheet
*/
// function crProposalSheet() {
//   var fS = "crProposalSheet"
//   var errS = "Can't find or create Proposals sheet";
//   var dbInst = new databaseC("applesmysql");
//   try {
//     var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Proposals");  // make proosals active or create
//     if (!ss) {
//       var ss = SpreadsheetApp.getActiveSpreadsheet().insertSheet().setName("Proposals");
//     }
//   }
//   catch (err) {
//     var probS = `${errS}: ${err}`;
//     Logger.log(probS);
//     SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
//       .alert(probS);
//     return false;
//   }
//   var propA = getProposalNamesAndIDs(dbInst,userEmail);
//   // Need to get the current proposal ID, and use that to get
//   // the rsf
//   // More generally should the base rent function just
//   // look at the current proposal--this would greatly simplify
//   // the functionality
//   var currPropID = getCurrentProposal(dbInst,userEmail);
//   var ret = populateSheet(ss,currPropID);  if this goes back in, add older version

//   dbInst.closeconn();
//   return ret;
// }
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
    // if(!ssBR) { throw new Error(`can't get sheet for Base Rent Schedule`)};s
    var ssAssum = SpreadsheetApp.getActive().getSheetByName('Assumptions');
    // if(!ssAssum) { throw new Error(`can't get sheet for Assumptions`)};
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

    // first clear out the sheet
    //   var maxRowsS = ss.getLastRow().toString();
    //   const rangeExistingS = [`A2:B${maxRowsS}`];  // Leave heading
    //   const initialR = ss.getRange(rangeExistingS);
    //   initialR.clearContent();
    //   const rangeS = ["A2:", "B", propA.length + 1].join("");
    //   const ssRange = ss.getRange(rangeS);
    //   ssRange.setValues(propA);
    //   const ssBR = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    //   const ssAssum = SpreadsheetApp.getActiveSpreadsheet().getSheets()[2];
    //   // Logger.log(ssBR.getName());
    //   const rsfRange = ssAssum.getRange("RSF");
    //   const cellPID = ssBR.getRange("pid");
    //   const pid = cellPID.getValue();
    //   cellPID.setFormula("=VLOOKUP(B2,Proposals!A2:B6,2,FALSE)");
    //  const dbInst = new databaseC("applesmysql");
    //  var propRSF = getRSFfromPID(dbInst,pid);
  }
  catch (err) {
    Logger.log(`In ${fS} ${errS} and ${err}`);
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${errS}: ${err}`);
    return false;
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

function runTests() {
  var dbInst = new databaseC("applesmysql");

  var userS = userEmail;
  var testPID = '50fcd535-edb2-11eb-93f1-42010a800005';  // rsf should be 965 as a string
  const test = new UnitTestingApp();
  test.enable(); // tests will run below this line
  test.runInGas(true);
  if (test.isEnabled) {

    test.assert(testgetRSFfromPID(testPID) === "965", `testgetRSFfromPID with ${testPID}`);

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
function handleJSON(dbInst, docInst) {
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