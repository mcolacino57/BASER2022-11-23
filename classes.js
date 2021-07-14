/*****************clause class ************************************ */
class clauseC {
  constructor(canonName, geo) {
    this.name = canonName; //never changes
    this.geo = geo; // String, for example "New York" or "National";
    this.section = this.name; // override below
  }
  setGeo(geo) { this.geo = geo };
  setFormSelector(formSelector) { this.formSelector = formSelector }
  setAtSelector(atSelector) { this.atSelector = atSelector }
  setSection(section) { this.section = section }

  getName() { return this.name };
  getGeo() { return this.geo };
  getFormSelector() { return this.formSelector }
  getAtSelector() { return this.atSelector }
  getSection() { return this.section }
}

/***************** form class ************************************ */

/* This class is essentially a clause and the form selector used to define the clause. There will also be an atSelector class which will get used when the clause is defined in an DB database rather than in a (user-chosen) set of form responses.
*/
class formClauseC extends clauseC {
  constructor(canonName, geo, form, questionArr) {
    super(canonName, geo);
    this.form = form;
    this.questionArr = questionArr;
    this.qArrLen = this.questionArr.length;
  }
  getQarrLen() { return this.qArrLen }
  getQarr() { return this.questionArr }
  getForm() { return this.form }
  getName() { return this.name }
  getItemIDs() {
    var items = this.form.getItems();
    for (var i in items) {
      console.log(items[i].getTitle() + ': ' + items[i].getId());
    }
  }
}

/*****************people classes ************************************ */

class personC {
  constructor(firstname, lastname, title, company, contactemail, contactaddress) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.title = title;
    this.company = company;
    this.contactemail = contactemail;
    this.contactaddress = contactaddress;
    this.persontype = "PERSON";  // default for person
  }
  set perType(type) { this.persontype = type }
}
/* Class to wrap up a broker */
class brokerC extends personC {
  constructor(id, firstname, lastname, title, company, contactemail, contactaddress) {

    super(firstname, lastname, title, company, contactemail, contactaddress);
    //super(lastname);
    //super(title);
    //super(company);
    //super(contactemail);
    //super(contactaddress);
    this.id = id;
    this.persontype = "BROKER"  // default for broker
  }

  setReptList(reptA) {
    if (reptA.length == 3) {
      this.replacename = reptA[0];
      this.replacecompany = reptA[1];
      this.replaceaddress = reptA[2];
    }
    else {
      this.replacename = "<<ListingBrokerName>>"; // replacement defaults
      this.replacecompany = "<<ListingBrokerCompanyName>>";
      this.replaceaddress = "<<ListingBrokerAddress>>";
    }
  }

  getReptList() {
    return [this.replacename, this.replacecompany, this.replaceaddress]
  }

}

/***************** doc class ************************************ */

class docC {
  constructor() {
    this.file = DriveApp.getFileById("1udz_HSz9HWNGq-OsdgzTXmu7s1H6GRArPfC-APKcQCk");
    this.folder = DriveApp.getFolderById('1eJIDn5LT-nTbMU0GA4MR8e8fwxfe6Q4Q');
    this.docName = this.file.getName();
    this.ds = formatCurrentDate();
    this.copy = this.file.makeCopy(this.docName + " " + this.ds, this.folder);
    this.copyName = this.copy.getName()
    this.locDocument = DocumentApp.openById(this.copy.getId());
    this.locBody = this.locDocument.getBody();
  }

  getBodyText() { return this.locBody.getText() }

  saveAndCloseTemplate() {

    this.locDocument.saveAndClose();
  }

}

/************** form class**********************/

// class holding question arrays and section titles
class questionC {
  constructor(questionA, sectionS) {
    this.questionA = questionA;
    this.sectionS = sectionS;
  }
}

/************** responseC class ******************/

class responseC {
  constructor(form) {
    this.resps = getItemResps(form);  // get all responses to the form; loop array of questions
  }
  matchResponse(questionObj) {
    var keyA = Object.keys(questionObj);
    var valA = Object.values(questionObj);
    for (var j = 0; j < keyA.length; j++) {
      var answerS = getAnswerWithMap(valA[j], this.resps);  // Question match with a response? continue if not
      if (answerS != "Not Found") {
        return keyA[j];
      }
    }
    return "Not Found"
  }
  getResps() {
    return this.resps
  }
}

class databaseC {
  constructor(dbS) {
    this.db = dbS; // name of the database
    this.connectionName = 'fleet-breaker-311114:us-central1:applesmysql';
    this.root = 'root';
    this.rootPwd = 'lew_FEEB@trit3auch';
    this.user = 'applesU1';
    this.userPwd = 'DIT6rest1paft!skux';
    this.instanceUrl = 'jdbc:google:mysql://' + this.connectionName;
    this.dbUrl = this.instanceUrl + '/' + this.db;
    this.connectParam = `dbUrl: ${this.dbUrl} user: ${this.user} and ${this.userPwd}`;
    // console.log("Inside databaseC " + this.connectParam);
    this.conn = Jdbc.getCloudSqlConnection(this.dbUrl, this.user, this.userPwd);
    this.colA = [];
  }
  getdbUrl() {
    return this.dbUrl;
  }
  getdb() {
    return this.db;
  }
  getconn() {
    return this.conn
  }
  getcolumns(tableNameS) {
    var qryS = `SHOW COLUMNS FROM ${tableNameS};`
    try {
      var stmt = this.conn.createStatement();
      var cols = stmt.executeQuery(qryS);
      this.colA = [];
      while (cols.next()) {
        this.colA.push(cols.getString(1));
      }
    } catch (err) {
      console.log(`In method getcolumns problem with executing query : ${err}`);
    }
    return (this.colA)
  }
  closeconn() {
    if (this.conn != null) this.conn.close();

  }
}
