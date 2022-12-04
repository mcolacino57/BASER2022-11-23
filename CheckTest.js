

function testgetCommenceAndTermForCurrent(){
  const dbInst = new databaseC("applesmysql");
  // eslint-disable-next-line no-undef
  var [propID,propName] = getCurrentProposal(dbInst);
  var [cd,lt]=getCommenceAndTermForCurrent(dbInst,propID);
  console.log(`${cd} and ${lt} for ${propName}`);
}

function testExportBR() {
  // eslint-disable-next-line no-undef
  var dbInst = new databaseC();
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
  var dbInst = new databaseC(databaseNameG);

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


// eslint-disable-next-line no-unused-vars
function testMatchingBRProposalID() {
  var dbInst = new databaseC("applesmysql");
  var ret = matchingBRProposalID(dbInst, 1);
  return ret

}


// eslint-disable-next-line no-unused-vars
function testReadFromProposals() {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  // eslint-disable-next-line no-undef
  var searchS = userEmail;
  var jsonyn = false;
  var retA = readFromTable(dbInst, tableNameS, colNameS, searchS, jsonyn); // all rows in section Electric
  Logger.log(retA);
  dbInst.getconn().close;
}

function testgetRSFfromPID(pid) {
  const dbInst = new databaseC("applesmysql");
  var rsf = getRSFfromPID(dbInst, pid);
  Logger.log(rsf);
  return rsf
}