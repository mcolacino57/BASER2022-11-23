/* eslint-disable no-unused-vars */
/*global Utilities , databaseC, propListC */
const userEmail = "propgen@squarefoot.com"
//const userEmail = getEmailFromJSON();
const databaseNameG = "applesmysql_loc";
const todayS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd");
const nowS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd HH:MM:ss");

/* in classes.js */
const dbInstG = new databaseC(databaseNameG);
const propListInstG = new propListC(dbInstG);