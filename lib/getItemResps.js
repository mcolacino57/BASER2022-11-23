/*global Logger */
/*exported getItemResps*/
// This is the current version, as of 210808
/**
 * Purpose: get a list of items from the form; allows >1 response and returns last
 *
 * @param  {object} form - form object
 * @return {object[]} retA - all items from the form response
 *
 **/
// eslint-disable-next-line no-unused-vars
function getItemResps(form) {
  var fS = "getItemResps";
  try {
    var formResponses = form.getResponses();
    var fRespLen = formResponse.length;
    if (fRespLen == 0) { throw new Error("getItemResps: formResponses has no responses"); }
    // return the last one
    var formResponse = formResponses[fRespLen - 1]; //  
    var retA = formResponse.getItemResponses(); // array of items; which are questions and answers
  }
  catch (err) {
    Logger.log(`In ${fS}:  ${err}`);
    return { result: "Not Found" };
  }
  return retA;
}
