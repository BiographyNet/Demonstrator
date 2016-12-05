if (!"BNET" in window)  var BNET; if (typeof BNET == 'undefined') BNET = {}; if (typeof BNET.proto  == 'undefined') BNET.proto = {};
//==================================================================================================================================

BNET.proto.clsBNETEvent = function(eventID, caption, startDate, endDate, startDateAccuracy, endDateAccuracy, AssociatedItem) {

  this.eventID = eventID;
  this.caption = caption;
  this.startDate = startDate;
  this.endDate = endDate;
  this.startDateAccuracy = startDateAccuracy;
  this.endDateAccuracy = endDateAccuracy;
  this.associatedItems = [];
  if (BNET.isArray(AssociatedItem)) {
    for (var nn = 0; nn < AssociatedItem.length; nn++) {
      if (AssociatedItem[nn] !== null && typeof AssociatedItem[nn] === 'object') {
        this.associatedItems.push(AssociatedItem[nn]);
        AssociatedItem[nn].addEvent(this);
      }
    }
  } else {
    if (AssociatedItem !== null && typeof AssociatedItem === 'object') {
      this.associatedItems.push(AssociatedItem);
      AssociatedItem.addEvent(this);
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

};

