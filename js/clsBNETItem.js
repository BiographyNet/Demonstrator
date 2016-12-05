if (!"BNET" in window)  var BNET; if (typeof BNET == 'undefined') BNET = {}; if (typeof BNET.proto  == 'undefined') BNET.proto = {};
//==================================================================================================================================

BNET.proto.clsBNETItem = function(itemID, caption, StartDate, EndDate, startDateAccuracy, endDateAccuracy) {

  this.itemID = itemID;
  this.caption = caption;
  this.StartDate = StartDate;
  this.EndDate = EndDate;
  this.startDateAccuracy = startDateAccuracy;
  this.endDateAccuracy = endDateAccuracy;
  this.events = [];  
  this.timeLineObjects = [];
  this.mouseDown = false;
  this.mouseDownStartX = 0;
  this.mouseDownStartY = 0;
  this.isDrawn = false;


  //------------------------------------------------------------------------------------------------------------------------------------

  this.addEvent = function(Event) {
    this.events.push(Event);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

};

