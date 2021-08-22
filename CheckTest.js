/*exported 
testExamineForm,
testPrintTitlesAndIDs, 
testGetClauseKeysThisForm,runTests
 */

/*global fieldS_G , FormApp , databaseC, getClauseKeysThisForm ,formID_G ,writeAllQuestionsKeys,testgetCurrPropID,
UnitTestingApp*/


// logs all of the titles of items in a form 
function examineForm(form) {
  var fitems = form.getItems();
  for (var j = 0; j < fitems.length; j++) {
    var title = fitems[j].getTitle()
    var id = fitems[j].getId();
    var itemTypeIs = fitems[j].getType();
    var typeS = itemTypeIs.toString();
    console.log(`Item title for: #${j} - ${title} ID: ${id} - type ${typeS}`);
  }
}

function testExamineForm() {
  var f = FormApp.openById(formID_G);
  var ret = examineForm(f);
  return ret
}

function printTitlesAndIDS_(formID) {
  var form = FormApp.openById(formID);
  var items = form.getItems();
  for (var i in items) {
    console.log(items[i].getTitle() + ': ' + items[i].getId() + " / " + items[i].getHelpText());  // HelpText == Description
  }
}

function testPrintTitlesAndIDs() {
  var retS = printTitlesAndIDS_(formID_G);
  console.log(retS)
}

/**
 * Purpose: Get all the clauseKeys in this form
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function testGetClauseKeysThisForm() {
  var dbInst = new databaseC("applesmysql");
  var retS ="";
  var ret = getClauseKeysThisForm(dbInst);
  var l = ret.length;
  for (var j = 0; j < l-1; j++){
    retS=retS+(ret[j]+", ")
}
  retS = retS+ret[l-1];
  fieldS_G==retS ? console.log("fieldS_G equals retS"): console.log("fieldS_G not equal to retS");
  console.log(retS)
}

function runTests() {
  var dbInst = new databaseC("applesmysql");
  var propID = "";
  const test = new UnitTestingApp();
  test.enable(); // tests will run below this line
  test.runInGas(true);
  console.log("Deleting all records in prop_detail to run tests")
  if (test.isEnabled) {
    // test.assert(setFieldString(),`setFieldString: ${fieldS_G}`);
    // test.assert(emptyCk_Question(), 'emptyCk_Question');
    test.assert(writeAllQuestionsKeys(), 'writeAllQuestionsKeys');
    test.assert(propID=testgetCurrPropID(), `testgetCurrPropID: ${propID}`);

  }
  dbInst.closeconn();
}
