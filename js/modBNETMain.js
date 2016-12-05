if (!"BNET" in window)  var BNET; if (typeof BNET == 'undefined') BNET = {}; if (typeof BNET.proto  == 'undefined') BNET.proto = {};
//==================================================================================================================================

//Constants
BNET.MS_PER_DAY = 1000 * 60 * 60 * 24;
BNET.MONTH_ABR_NAMES = [ "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec" ];


//Enumarative types
BNET.DateAccuracy = {};
BNET.DateAccuracy.toTheDay = 1;
BNET.DateAccuracy.toTheMonth = 2;
BNET.DateAccuracy.toTheYear = 3;
BNET.DateAccuracy.toTheDecade = 4;
BNET.DateAccuracy.toTheCentury = 5;
BNET.DateAccuracy.toTheMillennium = 6;

//Prototype extentions
Date.prototype.addDays = function(days) {
  this.setDate(this.getDate() + parseInt(days));
  return this;
};


//------------------------------------------------------------------------------------------------------------------------------------

BNET.initialize = function(BNETTimeLineCanvas) {




  BNET.Collection = new BNET.proto.clsBNETCollection();

  //BNET.Collection.addItem(new BNET.proto.clsBNETItem(1, "Item 1", new Date("1979-05-30"), new Date("2082-12-31"), BNET.DateAccuracy.toTheDay, BNET.DateAccuracy.toTheDay));

  BNET.Collection.loadRawData(BNETRAWDATA);

  BNET.TimeLine = new BNET.proto.clsBNETTimeLine(BNETTimeLineCanvas, 1400, 600, BNET.Collection);


  BNET.TimeLine.setVisibleDaysPerCanvas(3652);

  BNET.TimeLine.setVisibleLinesPerCanvas(15);

  BNET.TimeLine.drawTimeLine(new Date(1940, 12 - 1, 20));


  //alert(BNET.collection.items[0].caption);
};

//------------------------------------------------------------------------------------------------------------------------------------

BNET.isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

//------------------------------------------------------------------------------------------------------------------------------------

BNET.isNonEmptyArrayLike = function(obj) {
  try { // don't bother with `typeof` - just access `length` and `catch`
    return obj.length > 0 && '0' in Object(obj);
  }
  catch(e) {
    return false;
  }
};

//------------------------------------------------------------------------------------------------------------------------------------

BNET.dateDiffInDays = function(DateA, DateB, Absolute) {
  // Discard the time and time-zone information.
  var UtcA = Date.UTC(DateA.getFullYear(), DateA.getMonth(), DateA.getDate());
  var UtcB = Date.UTC(DateB.getFullYear(), DateB.getMonth(), DateB.getDate());

  var nrOfDays = (UtcB - UtcA) / BNET.MS_PER_DAY;

  if (Absolute) {
    return Math.abs(nrOfDays);
  } else {
    return nrOfDays;
  }
};

//------------------------------------------------------------------------------------------------------------------------------------

BNET.dateRangesOverlap = function(range1StartDate, range1EndDate, range2StartDate, range2EndDate) {
  return (range2StartDate >= range1StartDate && range2StartDate <= range1EndDate) ||
       (range1StartDate >= range2StartDate && range1StartDate <= range2EndDate);
};

//------------------------------------------------------------------------------------------------------------------------------------


