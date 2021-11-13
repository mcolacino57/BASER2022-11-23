
/*exported onOpen,getItemResps,getAnswerWithMap , databaseNameG */

/*global SpreadsheetApp , BetterLog , Logger*/

// should come from the json
var nominalFreeRentG = "6";
var nominalRentG = "60";
// eslint-disable-next-line no-unused-vars
var nominalTermG = "36";
var monthsDefaultG = "12";

// eslint-disable-next-line no-undef
// const userEmail = Session.getActiveUser().getEmail();
const userEmail = "mcolacino@squarefoot.com";

const ssLogID = '1l3EYsH7UJFUfuFORFF7GNxPM2jwLZlSh_0xSgSDTOPo';
// eslint-disable-next-line no-global-assign
Logger = BetterLog.useSpreadsheet(ssLogID);
const databaseNameG = "applesmysql";
// last row with header; don't delete this or anything above
const lastRow = 4; // hardwired; note that if the header on the sheet changes this must also
const baseRentSheetNameSG = "Base Rent Schedule";

// eslint-disable-next-line no-unused-vars
function onOpen(e) {
  var spreadsheet = SpreadsheetApp.getActive();
  var menuItems = [
    { name: 'Clear Sheet' , functionName: 'clrSheet' },
    { name: 'Create Initial Row', functionName: 'crInitRow' },  
    { name: 'Create Additional Row', functionName: 'crAddlRow' }, 
    { name: 'Export Base Rent', functionName: 'exportBR' },
    {name: 'Create Stepped Rent',functionName: 'crSteppedRentSchedule'} 
  ];
  spreadsheet.addMenu('Base Rent', menuItems);
  var ret = handleJSON(); // set globals from username.json (6.1)
  ret = populateSheet();  // (6.2)
  return ret
}

/**
 * Purpose
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {Boolean} t/f - return value
 */
// eslint-disable-next-line no-unused-vars
function clrSheet() {
  var fS = "clrSheet";
  try {
    const sheetBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseRentSheetNameSG);
    const lr = sheetBR.getLastRow();
    sheetBR.deleteRows(lastRow + 1, lr - lastRow);
    // also need to reset named ranges
    
  } catch (err) {
    const probS = `In ${fS}: ${err}`;
    Logger.log(probS);
    throw new Error(probS);
    
  }
  return true;
}

/**
 * Purpose: create first base rent row
 * Create row with start date=InitialDate, formula for end date, RSF, and 
 * formula for annual rent
 * 
 * @return {Boolean} true/false
 */
// eslint-disable-next-line no-unused-vars
function crInitRow() {
  var fS = "crInitRow";
  try {
    // eslint-disable-next-line no-undef
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetBR = ss.getSheetByName(baseRentSheetNameSG);
    var lr = sheetBR.getLastRow();
    if (lr > lastRow) {
      throw new Error(`Last row is ${lr}; delete all rows past ${lastRow}`);
    }
    // set dtlb named range for use in formulae
    var dtlbRange = ss.getRange(`${baseRentSheetNameSG}!A${lastRow+1}`);
    ss.setNamedRange("DTLB", dtlbRange);
    var dtlxRange = ss.getRange(`${baseRentSheetNameSG}!C${lastRow + 1}`);
    ss.setNamedRange("DTLX", dtlxRange);

    // add the row
    crBaseRentRow(sheetBR, "=InitialDate", nominalFreeRentG, 0);
    
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
 * NOTE: Column numbers are hardwired here and changes to the sheet might need changes
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
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseRentSheetNameSG);

    const startFromEndS = '=INDIRECT("R[-1]C[2]",FALSE)+1';  // hardwired difference
    crBaseRentRow(sheetBR,startFromEndS, monthsDefaultG, nominalRentG);
    const lr = sheetBR.getLastRow();
    sheetBR.getRange(lr, rentPSFC).setNumberFormat("$#,##0.00;$(#,##0.00)");
    sheetBR.getRange(lr, rentAnnC).setNumberFormat("$#,##0;$(#,##0)");
    // set dtlx
    const dtlxRange = ss.getRange(`${baseRentSheetNameSG}!C${lr}`);
    ss.setNamedRange("DTLX", dtlxRange);
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
 * Purpose: create a base rent row for appending, creates formula fo endS and annRS
 * Also applies formatting
 *
 * @param  {string} sheetBR - sheet in quo
 * @param  {string} startDateS - poke into start date
 * @param  {string} months - string but a number
 * @param {string} rentPSF - string but dollar value
 * @return {array}  - array of startDateS, months, endS, rentPSF, annRS
 */
function crBaseRentRow(sheetBR,startDateS, months, rentPSF) {
  var endS = '=EDATE(INDIRECT("R[0]C[-2]",FALSE),INDIRECT("R[0]C[-1]",FALSE))-1';
  var annRS = '=INDIRECT("R[0]C[-1]",FALSE)*RSF';
  sheetBR.appendRow([startDateS, months, endS, rentPSF, annRS]);
  const row = sheetBR.getLastRow();
  const cellStartDate = sheetBR.getRange(`A${row}`);
  const cellEndDate   = sheetBR.getRange(`C${row}`);
  const cellRent      = sheetBR.getRange(`D${row}`);
  const cellTotal     = sheetBR.getRange(`E${row}`);
  
  cellStartDate.setNumberFormat("M/d/yyyy");
  cellEndDate.setNumberFormat("M/d/yyyy");
  cellRent.setNumberFormat("$#,##0.00;$(#,##0.00)");
  cellTotal.setNumberFormat("$#,##0;$(#,##0)");
  return true
}

/**
 * Purpose: extract dtlb, initial rent, and rental growth rate,
 * build a schedule of rent steps, pro-rating as appropriate, and create
 * use that list of rents to create a schedule of rents by calling crBaseRentRow
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
// eslint-disable-next-line no-unused-vars
function crSteppedRentSchedule() {
  const fS = "crSteppedRentSchedule";
  try {
    var stepObj = getStepValues();
    Logger.log(stepObj);
    // const lr = SpreadsheetApp.getActiveSpreadsheet().getLastRow();
    // If we haven't created an initial row, create one
    // if (lr === lastRow+1) {
    //   crInitRow();
    // }
    crSteppedRent(stepObj);
    

  } catch(err) {
  var probS = `In ${fS}: ${err}`;
  Logger.log(probS);
  return false
  }
}

/**
 * Purpose: takes the stepObj and returns an array of rent steps and dates
 *
 * @param  {object} stepObj - step object
 * @return {object[]} retA - [{startDate: sd, endDate: ed, rent: r},...]
 */
function crSteppedRent(stepObj) {
  const fS="crSteppedRent";
  try {
    const sheetBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseRentSheetNameSG);
    const lr = sheetBR.getLastRow();
    if (lr === lastRow) {
      Logger.log(`Trying to create initial row`);
      crInitRow();
    }
    var sdLocDate = new Date(stepObj.dtlb);
    var sdLocS = sdLocDate.toDateString();
    
    // var edLoc = new Date(stepObj.dtlx);
    var rentLoc = stepObj.initialRent;
    const offsetStart = '=INDIRECT("R[-1]C[2]",FALSE)+1';  // hardwired difference
    // for loop 
    const steps = Math.floor((stepObj.leaseTermMons) / 12);
    const per = stepObj.stepPercent;
    Logger.log(`Percentage is: ${ per}`);
    
    Logger.log(`rentLoc: ${rentLoc}`);
    for (let i = 0; i < steps; i++){
      Logger.log(`step: ${((1.0 + per) ^ i)}`);
      //rentLoc = rentLoc * ((1.0 + per) ^ i);
      Logger.log(`rentLoc: ${rentLoc}`);

      crBaseRentRow(sheetBR,sdLocS, 12, rentLoc);
      rentLoc = rentLoc + (rentLoc * per);
      sdLocS = offsetStart;
      // sdLocS = offsetStart;
    }
  
  } catch (err) {
    var probS = `In ${fS} error ${err}`;
    console.log(probS);
    throw new Error(probS);
    }
  
}


/**
 * Purpose: extracts all data needed for computing stepped rent from the s
 * spreadsheet
 *
 *
 * @return {String} retS - return value
 */


function getStepValues() {
  const fS = "getStepValues";
  try {
    var retObj = {};
    Logger.log("entered getStepValues")

    var dtlbRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('DTLB');
    var dtlb = dtlbRange.getValue();
    if (!dtlb) { throw new Error(`unable to find dtlb`) }
    retObj.dtlb = dtlb;

    var dtlxRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('DTLX');
    const dtlx = dtlxRange.getValue();
    if (!dtlx) { throw new Error(`unable to find dtlx`) }
    retObj.dtlx = dtlx;

    var initialRentRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('InitialRent');
    const initialRent = initialRentRange.getValue();
    if (!initialRent) { throw new Error(`unable to find initialRent`) }
    retObj.initialRent = initialRent;

    var srsdRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('SteppedRentStartDate');
    const srsd = srsdRange.getValue();
    if (!srsd) { throw new Error(`unable to find srsd`) }
    retObj.srsd = srsd;

    var stepLengthRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('StepLength');
    const stepLength = stepLengthRange.getValue();
    if (!stepLength) { throw new Error(`unable to find stepLength`) }
    retObj.stepLength = stepLength;

    var stepPercentRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('StepPercent');
    const stepPercent = stepPercentRange.getValue();
    if (!stepPercent) { throw new Error(`unable to find stepPercent`) }
    retObj.stepPercent = stepPercent;

    var leaseTermMonsRange = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('LeaseTermMons');
    const leaseTermMons = leaseTermMonsRange.getValue();
    if (!leaseTermMons) { throw new Error(`unable to find leaseTermMons`) }
    retObj.leaseTermMons = leaseTermMons;
    Logger.log(`retobj is: ${JSON.stringify(retObj)}`);
    return retObj
  }
  catch(err) {
    var probS = `in ${fS} error: ${err}`;
    console.log(probS);
    throw new Error(probS)
  }
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
    const dbInst = new databaseC(databaseNameG);
    // eslint-disable-next-line no-undef
    var [propID, propName] = getCurrentProposal(dbInst);
    // eslint-disable-next-line no-undef
    var rsf = getRSFfromPID(dbInst, propID);
    // eslint-disable-next-line no-undef
    var [commDate, leaseTerm] = getCommenceAndTermForCurrent(dbInst, propID);
    // eslint-disable-next-line no-undef
    var sheetBR = SpreadsheetApp.getActive().getSheetByName(baseRentSheetNameSG);
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

// eslint-disable-next-line no-unused-vars
function exportBR() {
  var fS = "exportBR";
  try {
    // eslint-disable-next-line no-undef
    const dbInst = new databaseC(databaseNameG);
    // eslint-disable-next-line no-undef
    var sheetBR = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(baseRentSheetNameSG);
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

 /**
 * return an object describing what was passed
 * @param {*} ob the thing to analyze
 * @return {object} object information
 */
function whatAmI (ob) {
  try {
    // test for an object
    if (ob !== Object(ob)) {
        return {
          type:typeof ob,
          value: ob,
          length:typeof ob === 'string' ? ob.length : null 
        } ;
    }
    else {
      try {
        var stringGuy = JSON.stringify(ob);
      }
      catch (err) {
        stringGuy = '{"result":"unable to stringify"}';
      }
      return {
        type:typeof ob ,
        value : stringGuy,
        name:ob.constructor ? ob.constructor.name : null,
        nargs:ob.constructor ? ob.constructor.arity : null,
        length:Array.isArray(ob) ? ob.length:null
      };       
    }
  }
  catch (err) {
    return {
      type:'unable to figure out what I am'
    } ;
  }
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