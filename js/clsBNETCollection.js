if (!"BNET" in window)  var BNET; if (typeof BNET == 'undefined') BNET = {}; if (typeof BNET.proto  == 'undefined') BNET.proto = {};
//==================================================================================================================================

BNET.proto.clsBNETCollection = function() {

  this.ohmy = 'Pffff';

  this.items = [];
  this.events = [];

  this.StartDate = new Date(1809, 12 - 1, 20);
  this.EndDate = new Date(1910, 1 - 1, 05);

  //------------------------------------------------------------------------------------------------------------------------------------

  this.addFilter = function(filter) {
    
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.addItem = function(Item) {
    this.items.push(Item);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.addEvent = function(Event) {
    this.events.push(Event);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.itemExists = function(itemID) {
    for (var nn = 0; nn < this.items.length; nn++) {
      if (this.items[nn].itemID == itemID) return true;
    }
    return false;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.getItemsForRange = function(StartDate, EndDate) {   // THIS IS A MOCKU-UP FUNCTION
    //var FirstAddIndex = this.items.length;

    //BNET.Collection.addItem(new BNET.proto.clsBNETItem(1, "Person Name", new Date("1909-05-30"), new Date("1921-12-31"), BNET.DateAccuracy.toTheDay, BNET.DateAccuracy.toTheDay));

    var subCollection = [];
    for (var nn = 0; nn < this.items.length; nn++) {
      if (BNET.dateRangesOverlap(this.items[nn].StartDate, this.items[nn].EndDate, StartDate, EndDate)) {
        subCollection.push(this.items[nn]);
      }
    }
    return subCollection;

  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.loadRawData = function(dataObj) {   // THIS IS A MOCKU-UP FUNCTION
    var curBinding;
    var name;
    for (var nn = 0; nn < dataObj.results.bindings.length; nn++) {
      curBinding = dataObj.results.bindings[nn];
      if (!this.itemExists(curBinding.persID.value)) {
        name = curBinding.firstname.value;
        if (name.charAt(0) != ' ' && name.charAt(0) != ',') name = ", " + name;
        name = curBinding.surname.value + name;
        this.addItem(new BNET.proto.clsBNETItem(curBinding.persID.value, name, new Date(curBinding.birthWhen.value), new Date(curBinding.deathWhen.value), BNET.DateAccuracy.toTheDay, BNET.DateAccuracy.toTheDay));
      }
    }

  }

  //------------------------------------------------------------------------------------------------------------------------------------


  this.defineProperty = function(name, path, alternative) {
    
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.defineFilter = function(name, path, value, type) {
    
  };
   
  //------------------------------------------------------------------------------------------------------------------------------------



};

