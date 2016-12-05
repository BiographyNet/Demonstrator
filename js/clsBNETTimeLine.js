if (!"BNET" in window)  var BNET; if (typeof BNET == 'undefined') BNET = {}; if (typeof BNET.proto  == 'undefined') BNET.proto = {};
//==================================================================================================================================

BNET.proto.clsBNETTimeLine = function(canvasName, width, height, Collection) {

  //Constants
  this.MIN_RASTER_LINE_SPACE = 20;
  this.MIN_RASTER_TEXT_SPACE = 40;
  this.CAPTION_SPACE_TIME = 20;
  this.CAPTION_SPACE_LINES = 50;
  this.GLIDE_FACTOR = 0.9;
  this.OVERLOAD_FACTOR = 3;
  this.UPDATE_THRESHOLD_FACTOR = 0.5;

  this.canvasName = canvasName;
  this.Canvas = document.getElementById(canvasName);
  this.width = width;
  this.height = height;
  this.Collection = Collection;
  this.markers = [];

  this.CenterDate = 0;
  this.LeftMostDate = 0;
  this.LeftMostDateOffset = 0;
  this.RightMostDate = 0;
  this.RightMostDateOffset = 0;
  this.visibleDaysPerCanvas = 0;

  this.nrOfVisibleLines = 0;
  this.lineHeight = 0;
  this.spaceBetweenLines = 10;
  this.centerLineTop = 0;
  this.lineItems = [];

  this.markerAccuracy = 0;
  this.markerLabelAccuracy = 0;

  this.mouseDown = false;
  this.mouseDownButton = 0;
  this.mouseDownStartX = 0;
  this.mouseDownStartY = 0;

  this.stage = new createjs.Stage(canvasName);
  this.stage.regX = -0.5;
  this.stage.regY = -0.5;

  // ==> FOR EVENT LISTNERS SEE BELOW (HANDLER FUNCTIONS NEED TO BE DEFINED BEFORE THEY ARE ATTACHED)

  //------------------------------------------------------------------------------------------------------------------------------------

  this.drawTimeLine = function(CenterDate) {

    //this.tempLineIndexCounter = 0; // REM: TEST VAR!!!!
    this.lineItems = [];

    this.updatePxThresholdRight = this.width * (((this.OVERLOAD_FACTOR - 1) / 2) - (1 - this.UPDATE_THRESHOLD_FACTOR));
    this.updatePxThresholdLeft = -this.updatePxThresholdRight;

    this.updatePxThresholdBottom = this.height * (((this.OVERLOAD_FACTOR - 1) / 2) - (1 - this.UPDATE_THRESHOLD_FACTOR));
    this.updatePxThresholdTop = -this.updatePxThresholdBottom;

    this.updatePxLimitBottom = this.updatePxThresholdBottom + this.width;
    this.updatePxLimitTop = this.updatePxThresholdTop;    



    if (this.visibleDaysPerCanvas == 0) {
      this.setVisibleDaysPerCanvas(3652); // 10 Years, including 2 leap years.
    }

    // Remove all old elements
    this.stage.removeAllChildren();



    this.CenterDate = new Date(CenterDate);

    // Build new cake layer
    this.MainContainer = new createjs.Container();
    this.MainContainer.x = 0;
    this.MainContainer.y = 0;

    this.RasterContainer = new createjs.Container();
    this.RasterContainer.x = 0;
    this.RasterContainer.y = 0;

    this.MainContainer.addChild(this.RasterContainer); 

    this.ItemContainer = new createjs.Container();
    this.ItemContainer.x = 0;
    this.ItemContainer.y = 0;

    this.MainContainer.addChild(this.ItemContainer); 

    this.RasterLabelContainer = new createjs.Container();
    this.RasterLabelContainer.x = 0;
    this.RasterLabelContainer.y = 0;

    this.stage.addChild(this.MainContainer);

    var marker = this.createHorizontalNonCentricLine(this.width, this.CAPTION_SPACE_TIME + 1, "white", 0);
    marker.y = (this.height - this.CAPTION_SPACE_TIME);
    this.stage.addChild(marker);

    this.stage.addChild(this.RasterLabelContainer); 

    var marker = this.createVerticalNonCentricLine(this.CAPTION_SPACE_LINES + 1, this.height, "white", 0);
    marker.x = -1;
    marker.y = -1;
    this.stage.addChild(marker);

    this.LineNrContainer = new createjs.Container();
    this.LineNrContainer.x = 0;
    this.LineNrContainer.y = 0;

    this.stage.addChild(this.LineNrContainer); 

    var marker = this.createHorizontalNonCentricLine(this.CAPTION_SPACE_LINES + 1, this.CAPTION_SPACE_TIME + 1, "white", 0);
    marker.y = (this.height - this.CAPTION_SPACE_TIME);
    this.stage.addChild(marker);

    var marker = this.createHorizontalNonCentricLine(this.width, 1, "grey", 0);
    marker.y = this.height - this.CAPTION_SPACE_TIME;
    this.stage.addChild(marker);

    var marker = this.createVerticalNonCentricLine(1, this.height, "grey", 0);
    marker.x = this.CAPTION_SPACE_LINES;
    this.stage.addChild(marker);

    // Draw time lines
    this.LeftMostDate = new Date(CenterDate);
    this.LeftMostDate.addDays(-Math.floor((this.visibleDaysPerCanvas * this.OVERLOAD_FACTOR) / 2));
    this.LeftMostDateOffset = -Math.floor(((this.width * this.OVERLOAD_FACTOR) - this.width) / 2);

    this.RightMostDate = new Date(this.LeftMostDate);
    this.RightMostDate.addDays(Math.floor(this.visibleDaysPerCanvas * this.OVERLOAD_FACTOR));
    this.RightMostDateOffset = Math.floor(this.width + (((this.width * this.OVERLOAD_FACTOR) - this.width) / 2));

    this.drawTimeLineSection(this.LeftMostDate, this.RightMostDate);
  };


  //------------------------------------------------------------------------------------------------------------------------------------

  this.drawTimeLineSection = function(StartDate, EndDate) {
    this.drawRaster(StartDate, EndDate);
    this.drawItems(StartDate, EndDate);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.drawRaster = function(StartDate, EndDate) {

    var nrOfDays = BNET.dateDiffInDays(StartDate, EndDate) + 1; 

    //TODO: REMOVE EXISTING MARKERS + LABELS FROM SECTION, OR CHECK (LATER ON) WHETER THEY ALREADY EXIST AND ONLY ADD IF NOT.

    var markerObj = {};

    var DrawDate = new Date(StartDate);
    var dayDrawPos = this.dateToCanvas(StartDate);
    var markerCreated = false;
    var labelCreated = false;
    var markerStyleOffset = 0;
    var marker;
    var label;
    //switch (this.markerAccuracy) {
    //  case BNET.DateAccuracy.toTheDay: markerStyleOffset = 0; break;
    //  case BNET.DateAccuracy.toTheMonth: markerStyleOffset = -1; break;
    //  case BNET.DateAccuracy.toTheYear: markerStyleOffset = -2; break;
    //  case BNET.DateAccuracy.toTheDecade: markerStyleOffset = -3; break;
    //  case BNET.DateAccuracy.toTheCentury: markerStyleOffset = -4; break;
    //  case BNET.DateAccuracy.toTheMillennium: markerStyleOffset = -5; break;
    //}

    for (var nn = 1; nn < nrOfDays; nn++) {
      markerCreated = false;
      labelCreated = false;
      DrawDate.addDays(1);
      dayDrawPos = dayDrawPos + this.pixelsPerDay;
      if (DrawDate.getDate() != 1) {
        // new day
        if (this.markerAccuracy == BNET.DateAccuracy.toTheDay) {var marker = this.createMarker(this.height - this.CAPTION_SPACE_TIME, 1 + markerStyleOffset); markerCreated = true;} 
        if (this.markerLabelAccuracy == BNET.DateAccuracy.toTheDay) {var label = this.createMarkerLabel(DrawDate.getDate(), 1 + markerStyleOffset); labelCreated = true;}
      } else if (DrawDate.getMonth() != 0) {
        // new month
        if (this.markerAccuracy <= BNET.DateAccuracy.toTheMonth) {var marker = this.createMarker(this.height - this.CAPTION_SPACE_TIME, 2 + markerStyleOffset); markerCreated = true;} 
        if (this.markerLabelAccuracy <= BNET.DateAccuracy.toTheMonth) {var label = this.createMarkerLabel(BNET.MONTH_ABR_NAMES[DrawDate.getMonth()], 2 + markerStyleOffset); labelCreated = true;}
      } else if (DrawDate.getFullYear() % 10 != 0) {
        // new year
        if (this.markerAccuracy <= BNET.DateAccuracy.toTheYear) {var marker = this.createMarker(this.height - this.CAPTION_SPACE_TIME, 3 + markerStyleOffset); markerCreated = true;} 
        if (this.markerLabelAccuracy <= BNET.DateAccuracy.toTheYear) {var label = this.createMarkerLabel(DrawDate.getFullYear(), 3 + markerStyleOffset); labelCreated = true;}
      } else if (DrawDate.getFullYear() % 100 != 0) {
        // new decade
        if (this.markerAccuracy <= BNET.DateAccuracy.toTheDecade) {var marker = this.createMarker(this.height - this.CAPTION_SPACE_TIME, 4 + markerStyleOffset); markerCreated = true;} 
        if (this.markerLabelAccuracy <= BNET.DateAccuracy.toTheDecade) {var label = this.createMarkerLabel(DrawDate.getFullYear(), 4 + markerStyleOffset); labelCreated = true;}
      } else if (DrawDate.getFullYear() % 1000 != 0) {
        // new century
        if (this.markerAccuracy <= BNET.DateAccuracy.toTheCentury) {var marker = this.createMarker(this.height - this.CAPTION_SPACE_TIME, 5 + markerStyleOffset); markerCreated = true;} 
        if (this.markerLabelAccuracy <= BNET.DateAccuracy.toTheCentury) {var label = this.createMarkerLabel(DrawDate.getFullYear(), 5 + markerStyleOffset); labelCreated = true;}
      } else {
        // new millennium
        var marker = this.createMarker(this.height - this.CAPTION_SPACE_TIME, 6 + markerStyleOffset); markerCreated = true;
        var label = this.createMarkerLabel(DrawDate.getFullYear(), 6 + markerStyleOffset); labelCreated = true;
      }
      if (markerCreated == true && labelCreated == true) {
        markerObj = {};
        markerObj.MarkerDate = new Date(DrawDate);
        if (markerCreated == true) {
          marker.x = dayDrawPos | 0;
          this.RasterContainer.addChild(marker);
          markerObj.marker = marker;
        } else {
          markerObj.marker = null;
        }
        if (labelCreated == true) {
          label.x = (dayDrawPos- (label.getMeasuredWidth() / 2)) | 0;
          this.RasterLabelContainer.addChild(label);
          markerObj.label = label;
        } else {
          markerObj.label = null;
        }
        this.markers.push(markerObj);
      }
    }



    //var circle = new createjs.Shape();
    //circle.graphics.beginFill("yellow").drawCircle(0, 0, 50);
    //circle.x = 100;
    //circle.y = 100;

    //this.RasterContainer.addChild(line); 


    this.stage.update();

  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.drawItems = function(StartDate, EndDate) {
    //TODO: this.Collection.ClearFiler(Type, Value or ID or ALL)
    //this.Collection.Filter. ;

    var subCollection = this.Collection.getItemsForRange(StartDate, EndDate);

    var labelStyle;
    if (this.lineHeight < 20) {
      labelStyle = 2;
    } else {
      labelStyle = 6;
    }

    for (var nn = 0; nn < subCollection.length; nn++) {
      if (!this.itemInTimeLine(subCollection[nn].itemID)) this.drawItem(subCollection[nn], labelStyle);
    }

    this.stage.update();

  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.itemInTimeLine = function(itemID) {
    for (var nn = 0; nn < this.lineItems.length; nn++) {
      for (var nn2 = 0; nn2 < this.lineItems[nn].length; nn2++) {
        if (this.lineItems[nn][nn2].itemID == itemID) return true;
      }
    }
    return false;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.drawItem = function(itemObj, style) {
    var myself = this; 

    var itemCont = new createjs.Container();
    var itemShape = new createjs.Shape();
    var x1 = this.dateToCanvas(itemObj.StartDate);
    var x2 = this.dateToCanvas(itemObj.EndDate);

    var lineIndex = this.getFirstFreeLineIndex(itemObj.StartDate, itemObj.EndDate);
    if (lineIndex == -1) return; // TEMP: NO FREE VISIBLE LINE FOR ITEM DATE RANGE

    var lineNr;
    //if (lineIndex % 2 == 0) { // lineIndex is even or zero
    //  lineNr = (lineIndex / 2);
    //} else { // lineIndex is odd
    //  lineNr = -((lineIndex + 1) / 2);
    //}
    lineNr = lineIndex;

    itemShape.graphics.beginStroke("#0000cc").setStrokeStyle(1).beginFill("#ddffff").drawRect(0, 0, ((x2 - x1) | 0), this.lineHeight);

    //itemShape.addEventListener("click", function(event) { alert("You clicked:" + itemObj.caption); }, false)
    itemShape.addEventListener("mousedown", function(event) {itemObj.mouseDown = true; itemObj.mouseDownStartX = event.stageX; itemObj.mouseDownStartY = event.stageY;}, false);
    itemShape.addEventListener("click", function(event) {if (myself.mouseDownButton == 0 && itemObj.mouseDown == true && Math.abs(event.stageX - itemObj.mouseDownStartX) < 10 && Math.abs(event.stageY - itemObj.mouseDownStartY) < 10) { alert("You clicked:" + itemObj.caption); } itemObj.mouseDown = false;}, false);





    //itemShape.addEventListener("mousedown", function(event) {alert(999);}, false);
    //itemShape.addEventListener("click", function(event) {alert(1000);}, false);



    itemCont.addChild(itemShape);

    
    var font; var color; var topAdjust;
    switch (style) {
      case 1:
      case 2:
        font = "10px Arial"; color = "#000000"; topAdjust = -12; break;
      case 3:
      case 4:
      case 5:
      case 6:
        font = "16px Arial"; color = "#888888"; topAdjust = -18; break;
    }
    var label = new createjs.Text(itemObj.caption, font, color); label.textBasemarker = "alphabetic";
    label.x = 3;
    label.y = this.lineHeight + topAdjust;
    label.mask = itemShape;
    itemCont.addChild(label);
    
    itemCont.x = x1 | 0;
    itemCont.y = this.getLineTop(lineNr) | 0;
    
    if (itemCont.y >= this.updatePxLimitTop && itemCont.y <= this.updatePxLimitBottom) {
      this.ItemContainer.addChild(itemCont);
      itemObj.isDrawn = true;
    } else {
      itemObj.isDrawn = false;
    }

    itemObj.timeLineObjects.push(itemCont);

    if (this.lineItems[lineIndex] == null) this.lineItems[lineIndex] = [];
    this.lineItems[lineIndex].push(itemObj); // NB: TODO: SHOULD BE SORTED FOR EFFICIENCY!!
  };

  //------------------------------------------------------------------------------------------------------------------------------------

//this.tempLineIndexCounter = 0; // REM: TEST VAR!!!!
  this.getFirstFreeLineIndex = function(StartDate, EndDate) {
    var overlapFound;
    for (var nn = 0; nn < this.lineItems.length; nn++) {        // nn < this.nrOfVisibleLines
      overlapFound = false;
      for (var nn2 = 0; nn2 < this.lineItems[nn].length; nn2++) {
        if (BNET.dateRangesOverlap(this.lineItems[nn][nn2].StartDate, this.lineItems[nn][nn2].EndDate, StartDate, EndDate)) {
          overlapFound = true;
          break;
        }
      }
      if (!overlapFound) return nn;    
    }
    this.lineItems.push([]);  // -----
    var newLineNr = this.lineItems.length - 1;
    var label = this.createLineLabel(newLineNr + 1, 2);
    label.y = ((this.getLineTop(newLineNr) + (this.lineHeight / 2)) - (label.getMeasuredHeight() / 2)) | 0;
    this.LineNrContainer.addChild(label);
    return newLineNr; //return -1; 



    //if (this.tempLineIndexCounter > 0) {
    //  this.tempLineIndexCounter = -this.tempLineIndexCounter;
    //  return this.tempLineIndexCounter;
    //} else {
    //  this.tempLineIndexCounter = -this.tempLineIndexCounter;
    //  return this.tempLineIndexCounter++;
    //}
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.getLineTop = function(lineIndex) {
    //return this.centerLineTop - ((this.lineHeight + this.spaceBetweenLines) * lineIndex);
    return this.spaceBetweenLines + ((this.lineHeight + this.spaceBetweenLines) * lineIndex);

  };


  //------------------------------------------------------------------------------------------------------------------------------------


  this.setVisibleDaysPerCanvas = function(days) {

    this.visibleDaysPerCanvas = days;

    this.pixelsPerDay = this.width / this.visibleDaysPerCanvas;

    var nrOfMonths = this.visibleDaysPerCanvas / 30.4166666;
    this.pixelsPerMonth = this.width / nrOfMonths;

    var nrOfYears = this.visibleDaysPerCanvas / 365.2421896;
    this.pixelsPerYear = this.width / nrOfYears;

    if (this.pixelsPerDay >= this.MIN_RASTER_LINE_SPACE) {
      this.markerAccuracy = BNET.DateAccuracy.toTheDay;
    } else if (this.pixelsPerMonth >= this.MIN_RASTER_LINE_SPACE) {
      this.markerAccuracy = BNET.DateAccuracy.toTheMonth;
    } else if (this.pixelsPerYear >= this.MIN_RASTER_LINE_SPACE) {
      this.markerAccuracy = BNET.DateAccuracy.toTheYear;
    } else if (this.pixelsPerYear * 10 >= this.MIN_RASTER_LINE_SPACE) {
      this.markerAccuracy = BNET.DateAccuracy.toTheDecade;
    } else if (this.pixelsPerYear * 100 >= this.MIN_RASTER_LINE_SPACE) {
      this.markerAccuracy = BNET.DateAccuracy.toTheCentury;
    } else {
      this.markerAccuracy = BNET.DateAccuracy.toTheMillennium;
    }

    if (this.pixelsPerDay >= this.MIN_RASTER_TEXT_SPACE) {
      this.markerLabelAccuracy = BNET.DateAccuracy.toTheDay;
    } else if (this.pixelsPerMonth >= this.MIN_RASTER_TEXT_SPACE) {
      this.markerLabelAccuracy = BNET.DateAccuracy.toTheMonth;
    } else if (this.pixelsPerYear >= this.MIN_RASTER_TEXT_SPACE) {
      this.markerLabelAccuracy = BNET.DateAccuracy.toTheYear;
    } else if (this.pixelsPerYear * 10 >= this.MIN_RASTER_TEXT_SPACE) {
      this.markerLabelAccuracy = BNET.DateAccuracy.toTheDecade;
    } else if (this.pixelsPerYear * 100 >= this.MIN_RASTER_TEXT_SPACE) {
      this.markerLabelAccuracy = BNET.DateAccuracy.toTheCentury;
    } else {
      this.markerLabelAccuracy = BNET.DateAccuracy.toTheMillennium;
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.setVisibleLinesPerCanvas = function(nrOfLines) {
    if (nrOfLines < 3) nrOfLines = 3;
    if (nrOfLines > 10000) nrOfLines = 10000;
    this.nrOfVisibleLines = nrOfLines;
    this.lineHeight = ((this.height - (this.spaceBetweenLines * (nrOfLines + 1) + this.CAPTION_SPACE_TIME)) / nrOfLines) | 0;
    this.centerLineTop = ((nrOfLines / 2 - 0.5) | 0) * (this.lineHeight + this.spaceBetweenLines) + this.spaceBetweenLines;
  }

  //------------------------------------------------------------------------------------------------------------------------------------

  this.dateToCanvas = function(DateObj) { 
    var nrOfDays = BNET.dateDiffInDays(this.LeftMostDate, DateObj); // calculate from start and end date
    return this.LeftMostDateOffset + (nrOfDays * this.pixelsPerDay);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.canvasToDate = function(xPos) { 
    var nrOfDays =  ((xPos - this.LeftMostDateOffset) / this.pixelsPerDay) | 0;
    var cDate = new Date(this.LeftMostDate);
    return cDate.addDays(nrOfDays);
  };

  //------------------------------------------------------------------------------------------------------------------------------------


  this.createLineLabel = function(lineNr, style) {
    var font; var color; var topAdjust;
    switch (style) {
      case 1:
      case 2:
        font = "12px Arial"; color = "#666666"; topAdjust = -16; break;
      case 3:
      case 4:
      case 5:
      case 6:
        font = "16px Arial"; color = "#888888"; topAdjust = -18; break;
    }
    var label = new createjs.Text(lineNr, font, color); label.textBasemarker = "alphabetic";
    label.x = (this.CAPTION_SPACE_LINES - (label.getMeasuredWidth() + 5)) | 0;
    return label;
  }


  //------------------------------------------------------------------------------------------------------------------------------------


  this.createMarkerLabel = function(caption, style) {
    var font; var color; var topAdjust;
    switch (style) {
      case 1:
      case 2:
        font = "12px Arial"; color = "#666666"; topAdjust = -16; break;
      case 3:
      case 4:
      case 5:
      case 6:
        font = "16px Arial"; color = "#888888"; topAdjust = -18; break;
    }
    var label = new createjs.Text(caption, font, color); label.textBasemarker = "alphabetic";
    label.y = (this.height + topAdjust) | 0;
    return label;
  }

  //------------------------------------------------------------------------------------------------------------------------------------

  this.createMarker = function(height, style) {
    var width; var color; var dash;
    switch (style) {
      case 1:
        width = 1; color = "#dddddd"; dash = 1; break;
      case 2: 
        width = 1; color = "grey"; dash = 5; break;
      case 3: 
        width = 1; color = "grey"; dash = 10; break;
      case 4: 
        width = 2; color = "grey"; dash = 2; break;
      case 5: 
        width = 2; color = "grey"; dash = 0; break;
      case 6: 
        width = 4; color = "grey"; dash = 1; break;
    }
 
    return this.createVerticalNonCentricLine(width, height, color, dash);
  }

  this.createVerticalNonCentricLine = function(width, height, color, dash) { 
    var left = (width / 2) | 0;
    var line = new createjs.Shape();
    line.graphics.setStrokeStyle(width);
    line.graphics.beginStroke(color);
    line.graphics.moveTo(left, 0);
    if (dash == 0) {
      line.graphics.lineTo(left, height);
    } else {
      var dashY;
      for (var nn = 0; nn < Math.floor(height / (dash * 2)); nn++) {
        dashY = nn * dash * 2 + dash;
        if (dashY > height) dashY = height;
        line.graphics.lineTo(left, dashY);
        dashY = dashY + dash;
        if (dashY <= height) line.graphics.moveTo(left, dashY);
      }  
    }
    line.graphics.endStroke();
    line.x = 0;
    line.y = 0;
    return line;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.createHorizontalNonCentricLine = function(width, height, color, dash) { 
    var top = (height / 2) | 0;
    var line = new createjs.Shape();
    line.graphics.setStrokeStyle(height);
    line.graphics.beginStroke(color);
    line.graphics.moveTo(0, top);
    if (dash == 0) {
      line.graphics.lineTo(width, top);
    } else {
      var dashX;
      for (var nn = 0; nn < Math.floor(height / (dash * 2)); nn++) {
        dashX = nn * dash * 2 + dash;
        if (dashX > width) dashX = height;
        line.graphics.lineTo(dashX, top);
        dashX = dashX + dash;
        if (dashX <= width) line.graphics.moveTo(dashY, top);
      }  
    }
    line.graphics.endStroke();
    line.x = 0;
    line.y = 0;
    return line;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.normalize = function(xVal) {
    // Reposition all items, markers and labels to let main container have a left (x) of 0.

    for (var i = 0; i < this.ItemContainer.children.length; i++) {
      this.ItemContainer.children[i].x += xVal;
    }
    for (var i = 0; i < this.RasterContainer.children.length; i++) {
      this.RasterContainer.children[i].x += xVal;
    }
    for (var i = 0; i < this.RasterLabelContainer.children.length; i++) {
      this.RasterLabelContainer.children[i].x += xVal;
    }
    this.LeftMostDateOffset += xVal;
    this.RightMostDateOffset += xVal;

    this.MainContainer.x -= xVal;
    this.RasterLabelContainer.x -= xVal;
    this.updatePxThresholdRight += xVal;
    this.updatePxThresholdLeft += xVal;

  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.remediate = function(StartDate, EndDate) {
    // Remove all items before or after the provided start- and enddate.

    for (var nn = 0; nn < this.lineItems.length; nn++) {
      for (var nn2 = this.lineItems[nn].length - 1; nn2 >= 0; nn2--) {
        if (this.lineItems[nn][nn2].EndDate < StartDate || this.lineItems[nn][nn2].StartDate > EndDate) {
          for (var nn3 = 0; nn3 < this.lineItems[nn][nn2].timeLineObjects.length; nn3++) {
            this.ItemContainer.removeChild(this.lineItems[nn][nn2].timeLineObjects[nn3]);
            this.lineItems[nn][nn2].timeLineObjects[nn3] = null;
          }
          this.lineItems[nn][nn2].timeLineObjects = [];
          this.lineItems[nn][nn2] = null;
          this.lineItems[nn].splice(nn2, 1);
        }
      }
    }

    for (var nn = this.markers.length - 1; nn >= 0; nn--) {
      if (this.markers[nn].MarkerDate < StartDate || this.markers[nn].MarkerDate > EndDate) {
        this.RasterContainer.removeChild(this.markers[nn].marker);
        this.RasterLabelContainer.removeChild(this.markers[nn].label);
        this.markers[nn].marker = null;
        this.markers[nn].label = null;
        this.markers.splice(nn, 1);
      }
    }

  };


  //------------------------------------------------------------------------------------------------------------------------------------

  this.verticalRedraw = function() {

    for (var nn = 0; nn < this.lineItems.length; nn++) {
      for (var nn2 = this.lineItems[nn].length - 1; nn2 >= 0; nn2--) {
        for (var nn3 = 0; nn3 < this.lineItems[nn][nn2].timeLineObjects.length; nn3++) {
          if (this.lineItems[nn][nn2].timeLineObjects[nn3].y >= this.updatePxLimitTop && this.lineItems[nn][nn2].timeLineObjects[nn3].y <= this.updatePxLimitBottom) {
            if (this.lineItems[nn][nn2].isDrawn == false) {
              this.ItemContainer.addChild(this.lineItems[nn][nn2].timeLineObjects[nn3]);
              this.lineItems[nn][nn2].isDrawn = true;
            }
          } else {
            if (this.lineItems[nn][nn2].isDrawn) {
              this.ItemContainer.removeChild(this.lineItems[nn][nn2].timeLineObjects[nn3]);
              this.lineItems[nn][nn2].isDrawn = false;
            }
          }
        }
      }
    }




  }

  //------------------------------------------------------------------------------------------------------------------------------------


  this.canvasMouseDown = function(event) {
    this.mouseDownButton = event.button;
    if (event.button == 0) {
      if (this.canvasGlideEventID) clearTimeout(this.canvasGlideEventID);
      this.mouseDown = true;
      this.mouseDownStartX = event.clientX;
      this.mouseDownStartY = event.clientY;
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.canvasMouseUp = function(event) {
    if (event.button == 0) {
      this.mouseDown = false;
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

this.doCanvasAlign = false;
  this.canvasMouseMove = function(event, glideX, glideY) {
    var myself = this;
    var oldItemContainerY;
    if (this.mouseDown) {
      glideX = (event.clientX - this.mouseDownStartX) | 0;
      glideY = (event.clientY - this.mouseDownStartY) | 0;
      oldItemContainerY = this.ItemContainer.y;
      this.MainContainer.x += glideX;
      this.RasterLabelContainer.x = this.MainContainer.x;
      this.ItemContainer.y += glideY;
      if (this.ItemContainer.y > 0) this.ItemContainer.y = 0;
      this.LineNrContainer.y = this.ItemContainer.y;
      this.mouseDownStartX = event.clientX;
      this.mouseDownStartY = event.clientY - (glideY - (this.ItemContainer.y - oldItemContainerY));
      this.checkCanvasMove();
      this.stage.update();
      if (this.canvasGlideEventID) clearTimeout(this.canvasGlideEventID);
      this.canvasGlideEventID = setTimeout(function(){myself.canvasMouseMove(event, glideX * myself.GLIDE_FACTOR, glideY * myself.GLIDE_FACTOR);}, 10);
      this.doCanvasAlign = true;
    } else if (glideX < -0.4 || glideX > 0.4 || glideY < -0.4 || glideY > 0.4) {
      glideX = glideX | 0;
      glideY = glideY | 0;
      if (glideX > this.width / 2) glideX = this.width / 2;
      if (glideX < -this.width / 2) glideX = -this.width / 2;
      if (glideY > this.width / 2) glideY = this.width / 2;
      if (glideY < -this.width / 2) glideY = -this.width / 2;
      oldItemContainerY = this.ItemContainer.y;
      this.MainContainer.x += glideX;
      this.RasterLabelContainer.x = this.MainContainer.x;
      this.ItemContainer.y += glideY;
      if (this.ItemContainer.y > 0) {this.ItemContainer.y = 0; glideY = 0;}
      this.LineNrContainer.y = this.ItemContainer.y;
      this.checkCanvasMove();
      this.stage.update();
      if (this.canvasGlideEventID) clearTimeout(this.canvasGlideEventID);
      this.canvasGlideEventID = setTimeout(function(){myself.canvasMouseMove(event, glideX * myself.GLIDE_FACTOR, glideY * myself.GLIDE_FACTOR);}, 10);
      this.doCanvasAlign = true;
    } else {
      if (this.doCanvasAlign) {
        this.MainContainer.x = this.MainContainer.x | 0;
        this.RasterLabelContainer.x = this.MainContainer.x;
        this.ItemContainer.y = this.ItemContainer.y | 0;
        this.LineNrContainer.y = this.ItemContainer.y;
        this.stage.update();
        this.canvasGlideEventID = 0;
        this.CenterDate = new Date(this.LeftMostDate);
        this.CenterDate.addDays(-Math.floor(this.visibleDaysPerCanvas * -(((-this.LeftMostDateOffset + (-this.MainContainer.x)) / this.width) + 0.5)));
        this.doCanvasAlign = false;
      } 
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.checkCanvasMove = function() {
    var myself = this;

    while (this.MainContainer.x >= this.updatePxThresholdRight) {
      var OldLeftMostDate = new Date(this.LeftMostDate);
      var NewLeftMostDate = new Date(this.LeftMostDate);
      NewLeftMostDate.addDays(-this.visibleDaysPerCanvas);
      var MaxRightMostDate = new Date(NewLeftMostDate);
      MaxRightMostDate.addDays(this.visibleDaysPerCanvas * (this.OVERLOAD_FACTOR + 1));
      this.remediate(NewLeftMostDate, MaxRightMostDate);
      //this.normalize(this.updatePxThresholdRight);
      //if (OldLeftMostDate > MaxRightMostDate) OldLeftMostDate = new Date(MaxRightMostDate);
      setTimeout(function() {myself.drawTimeLineSection(NewLeftMostDate, OldLeftMostDate);}, 10);
      this.updatePxThresholdRight += this.width;
      this.LeftMostDate = new Date(NewLeftMostDate);
      this.LeftMostDateOffset -= this.width;
      if (this.RightMostDate > MaxRightMostDate) {
        this.RightMostDate.addDays(-this.visibleDaysPerCanvas);
        this.RightMostDateOffset -= this.width;
        this.updatePxThresholdLeft += this.width;
      }
    }
    while (this.MainContainer.x <= this.updatePxThresholdLeft) {
      var OldRightMostDate = new Date(this.RightMostDate);
      var NewRightMostDate = new Date(this.RightMostDate);
      NewRightMostDate.addDays(this.visibleDaysPerCanvas);
      var MinLeftMostDate = new Date(NewRightMostDate);
      MinLeftMostDate.addDays(-this.visibleDaysPerCanvas * (this.OVERLOAD_FACTOR + 1));
      var MinLeftMostDateOffset = this.RightMostDateOffset + this.width
      this.remediate(MinLeftMostDate, NewRightMostDate);
      //this.normalize(this.updatePxThresholdLeft);
      //if (OldRightMostDate < MinLeftMostDateOffset) OldRightMostDate = new Date(MinLeftMostDateOffset);
      setTimeout(function() {myself.drawTimeLineSection(OldRightMostDate, NewRightMostDate);}, 10);
      this.updatePxThresholdLeft -= this.width;
      this.RightMostDate = new Date(NewRightMostDate);
      this.RightMostDateOffset += this.width;
      if (this.LeftMostDate < MinLeftMostDate) {
        this.LeftMostDate.addDays(this.visibleDaysPerCanvas);
        this.LeftMostDateOffset += this.width;
        this.updatePxThresholdRight -= this.width;
      }
    }

    while (this.ItemContainer.y >= this.updatePxThresholdBottom) {
      this.updatePxThresholdBottom += this.height;
      this.updatePxThresholdTop += this.height;

      this.updatePxLimitTop -= this.height;
      this.updatePxLimitBottom -= this.height;
      this.verticalRedraw();
    }
    while (this.ItemContainer.y <= this.updatePxThresholdTop) {
      this.updatePxThresholdTop -= this.height;
      this.updatePxThresholdBottom -= this.height;

      this.updatePxLimitBottom += this.height;
      this.updatePxLimitTop += this.height;
      this.verticalRedraw();
    }



  }

  //------------------------------------------------------------------------------------------------------------------------------------

  //attach event handlers
  var myself = this;
  this.Canvas.addEventListener("mousedown", function(event) {myself.canvasMouseDown.call(myself, event);}, false);
  this.Canvas.addEventListener("mouseup", function(event) {myself.canvasMouseUp.call(myself, event);}, false);
  this.Canvas.addEventListener("mousemove", function(event) {myself.canvasMouseMove.call(myself, event);}, false);
  this.Canvas.addEventListener("mousewheel", function(event) {myself.canvasMouseMove.call(myself, event, -event.wheelDeltaX / 2, -event.wheelDeltaY / 2); event.preventDefault(); return false;}, false);
};



