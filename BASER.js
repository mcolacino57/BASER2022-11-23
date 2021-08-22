
/*exported onOpen,getItemResps,getAnswerWithMap */
/*global SpreadsheetApp */
// 210803 9:31
// 210803 9:49
// 210803 12:52
var nominalFreeRentG = "6";
var nominalRentG = "60";
var nominalTermG = "36";
var monthsDefaultG = "12";

// eslint-disable-next-line no-undef
const userEmail = Session.getActiveUser().getEmail();
const ssLogID = '1l3EYsH7UJFUfuFORFF7GNxPM2jwLZlSh_0xSgSDTOPo';
// eslint-disable-next-line no-undef
Logger = BetterLog.useSpreadsheet(ssLogID);

// eslint-disable-next-line no-unused-vars
function onOpen(e) {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    { name: 'Create Initial Row', functionName: 'crInitRow' },
    { name: 'Create Additional Row', functionName: 'crAddlRow' },
    { name: 'Export Base Rent', functionName: 'exportBR' }
  ];
  spreadsheet.addMenu('Base Rent', menuItems);
  var ret = handleJSON(); // set globals from username.json
  ret = populateSheet();
  return ret

}

/**
 * Purpose: create first base rent row
 * Create row with start date=InitialDate, formula for end date, RSF, and 
 * formula for annual rent
 * 
 * @return {Boolean} true/false
 */
const lastRow = 4; // hardwired
// eslint-disable-next-line no-unused-vars
function crInitRow() {
  var fS = "crInitRow";
  try {
    // eslint-disable-next-line no-undef
    var sheetBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base Rent Schedule");
    var lr = sheetBR.getLastRow();
    if (lr > lastRow) {
      throw new Error(`Last row is ${lr}; delete all rows past ${lastRow}`);
    }
    var brRow = crBaseRentRow("=InitialDate", nominalFreeRentG, 0);
    sheetBR.appendRow(brRow);

  } catch (err) {
    // eslint-disable-next-line no-undef
    Logger.log(`In ${fS}: ${err}`);
    // eslint-disable-next-line no-undef
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${err}`);
  }
  return true
}

/**
 * Purpose: additional base rent rows
 * Create row with start date=prior end date, formula for end date, RSF, and 
 * formula for annual rent.
 * 
 * NOTE: Column numbers are hardwired here an changes to the sheet might need changes
 * 
 * @return {Boolean} true/false
 */

const rentPSFC = 4;  // hardwired rent column
const rentAnnC = 5;  // hardwired annual expense column
// eslint-disable-next-line no-unused-vars
function crAddlRow() {
  var fS = "crAddlRow";
  try {
    // eslint-disable-next-line no-undef
    var sheetBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base Rent Schedule");
    var startFromEndS = '=INDIRECT("R[-1]C[2]",FALSE)+1';  // hardwired difference
    var brRow = crBaseRentRow(startFromEndS, monthsDefaultG, nominalRentG);
    sheetBR.appendRow(brRow);
    var lr = sheetBR.getLastRow();
    sheetBR.getRange(lr, rentPSFC).setNumberFormat("$#,##0.00;$(#,##0.00)");
    sheetBR.getRange(lr, rentAnnC).setNumberFormat("$#,##0;$(#,##0)");
  } catch (err) {
    // eslint-disable-next-line no-undef
    Logger.log(`In ${fS}: error: ${err}`);
    // eslint-disable-next-line no-undef
    SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .alert(`${err}`);
      return false
  }
  return true
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
    // eslint-disable-next-line no-undef
    const dbInst = new databaseC("applesmysql");
    // eslint-disable-next-line no-undef
    var [propID, propName] = getCurrentProposal(dbInst);
    // eslint-disable-next-line no-undef
    var rsf = getRSFfromPID(dbInst, propID);
    // eslint-disable-next-line no-undef
    var [commDate, leaseTerm] = getCommenceAndTermForCurrent(dbInst, propID);
    // eslint-disable-next-line no-undef
    var sheetBR = SpreadsheetApp.getActive().getSheetByName('Base Rent Schedule');
    if (!sheetBR) { throw new Error(`can't get sheet for Base Rent Schedule`) }
    // eslint-disable-next-line no-undef
    var ssAssum = SpreadsheetApp.getActive().getSheetByName('Assumptions');
    if (!ssAssum) { throw new Error(`can't get sheet for Assumptions`) }
    var pidRange = sheetBR.getRange('pid');
    var pnameRange = sheetBR.getRange('propName');
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
    // eslint-disable-next-line no-undef
    Logger.log(`In ${fS}: ${err}`);
    // eslint-disable-next-line no-undef
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

function exportBR() {
  var fS = "exportBR";
  try {
    // eslint-disable-next-line no-undef
    const dbInst = new databaseC("applesmysql");
    // eslint-disable-next-line no-undef
    var sheetBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Base Rent Schedule");
    var cellPID = sheetBR.getRange("pid").getValue(); // get proposal id from sheet
    // eslint-disable-next-line no-undef
    var alreadyBR = matchingBRProposalID(dbInst, cellPID); // already br for this proposal?
    if (alreadyBR) {
      var updateYN = duplicateBRAlert();
      if (updateYN) {
        // eslint-disable-next-line no-undef
        var ret = deleteFromTable(dbInst, "base_rent", cellPID);
        if(!ret) { throw new Error('cant delete from base_rent table')}
      }
      else { return true}
    }
    var lrS = sheetBR.getLastRow().toString(); // last row string
    var brRangeS = "A5:E" + lrS;  // set range from A to E column; fix if columns change
    // Get range with base rent
    var brRange = sheetBR.getRange(brRangeS).getValues();
    // Put that range into a set of lists with dates formatted properly for input to SQL
    var adjBR = brRange.map(br => {
      // eslint-disable-next-line no-undef
      var formattedStartDate = Utilities.formatDate(new Date(br[0]), "GMT-5", 'yyyy-MM-dd');
      // eslint-disable-next-line no-undef
      var formattedEndDate = Utilities.formatDate(new Date(br[2]), "GMT-5", 'yyyy-MM-dd');
      // Note this should be refactored to a structure or probably a class
      return [
        cellPID,  // Proposal id
        formattedStartDate,
        formattedEndDate,
        br[1],  // Months between dates
        userEmail, // Created by
        br[3],  // base rent pSF
        // eslint-disable-next-line no-undef
        Utilities.formatDate(new Date(), "GMT-5", "yyyy-MM-dd"), // created when (today)
        userEmail, // Modified by
        // eslint-disable-next-line no-undef
        Utilities.formatDate(new Date(), "GMT-5", "yyyy-MM-dd")] // modified when
    });
    // Iterate over variable writing rows to the dbInst
    adjBR.forEach(record => {
      // eslint-disable-next-line no-undef
      var ret = writeToTable(dbInst, "base_rent", record);
      if (!ret) {
        throw new Error("problem writing to table");
      }
    })
  } catch (err) {
    var probS = `In ${fS}: ${err}`;
    // eslint-disable-next-line no-undef
    Logger.log(probS)
    return false
  }
  return true
}



/*************************UI Utilities************************ */

function duplicateBRAlert() {
  try {
    // eslint-disable-next-line no-undef
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

// eslint-disable-next-line no-unused-vars
function updateForm() {
  // call your form and connect to the drop-down item
  // eslint-disable-next-line no-undef
  var form = FormApp.openById("1l2wzhq1-dIgS9LJZ2skO1L9t5T_-V3E3vYmLHT2IJDQ");

  var proposalList = form.getItemById("816438396").asListItem();

  // convert the array ignoring empty cells

  // populate the drop-down with the array data
  // eslint-disable-next-line no-undef
  proposalList.setChoiceValues(getProposalNames("Michael Colacino"));

}



/**********************Test Functions ******************* */


// eslint-disable-next-line no-unused-vars
function testExportBR() {
  // eslint-disable-next-line no-undef
  var dbInst = new databaseC("applesmysql");
  var ret = exportBR(dbInst);
  return ret

}

function testHandleJSON() {
  var ret = handleJSON();
  if(!ret) {return false}
  if (nominalFreeRentG == "6"
    && nominalRentG == "60.00"
    && nominalTermG == "36"
    && monthsDefaultG == "12") { return true }
  return false
}

// eslint-disable-next-line no-unused-vars
function runTests() {
  // eslint-disable-next-line no-undef
  var dbInst = new databaseC("applesmysql");

  // var userS = userEmail;
  var testPID = '50fcd535-edb2-11eb-93f1-42010a800005';  // rsf should be 965 as a string


  // eslint-disable-next-line no-undef
  const test = new UnitTestingApp();
  test.enable(); // tests will run below this line
  test.runInGas(true);
  if (test.isEnabled) {

    // eslint-disable-next-line no-undef
    test.assert(testgetRSFfromPID(testPID) === "965", `testgetRSFfromPID with ${testPID}`);
    test.assert(testHandleJSON(), `testHandleJSON`);
    test.assert(populateSheet(), `populateSheet`);
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
    // eslint-disable-next-line no-undef
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



/**
 * Purpose: Gets an answer from a list of responses by using the question as an index
 *
 * @param  {String} question - question from form 
 * @param  {itemReponse[]} itemResponses - an array of responses from a form
 * @return {String} answer - an answer corresponding to question or "Not Found"
 */
 function getAnswerWithMap(question, itemResponses) {
  var responses = itemResponses.map(function (response) {
    return response.getItem().getTitle();
  });
  var pos = responses.indexOf(question);
  if (pos == -1) { return "Not Found" }
  var answer = itemResponses[pos].getResponse();
  return answer
}