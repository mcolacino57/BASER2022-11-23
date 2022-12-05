/**
 * Purpose: From the prop_detail table, extract 'commDate' and 'leaseTerm' and
 *
 * @param  {Object} dbInst
 * @param  {String} propID - current proposal ID
 * @return {String[]} retA - return array of commDate and leaseTerm, or false
 */
function getCommenceAndTermForCurrent(dbInst, propID) {
  const fS = "getCommenceAndTermForCurrent";
  var commDateS = '', leaseTermS = '';
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
      if (ck === 'commDate') { commDateS = pAns; }
      if (ck === 'leaseTerm') { leaseTermS = pAns; }
      cntr++;
    }
    if (cntr === 0) { throw new Error(`no term or commencement in prop_detail`); }
    if (cntr > 2) { throw new Error(`more rows in prop_detail than expected`); }
    return [commDateS, leaseTermS];

  } catch (err) {
    const probS = `In ${fS}: error ${err}`;
    Logger.log(probS);
    return [false, false];
  }
}
