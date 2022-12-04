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
      throw new Error(`number of columns ${colA.length} diff from record param ${recordA.length}`);
    }
    var recMod = recordA.map(rec => {
      if (typeof rec != 'number') {
        rec = "'" + rec + "'";
      }
      return rec;
    });
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
    return false;
  }
  return true;
}
