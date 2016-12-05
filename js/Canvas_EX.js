//------------------------------------------------------------------------------------------------------------------------------------

if (!"LDF" in window                   )  var LDF;            
if (typeof LDF              == 'undefined')  LDF = {};           
if (typeof LDF.logic        == 'undefined')  LDF.logic = {};   
if (typeof LDF.logic.proto  == 'undefined')  LDF.logic.proto = {};   

LDF.logic.proto.pCanvas = function () {

  this.pluginObjs = {};
  this.pluginObjs.items = [];
  this.pluginObjs.count = 0;
  this.pluginObjs.index = -1;

  this.linkObjs = {};
  this.linkObjs.items = [];
  this.linkObjs.count = 0;
  this.linkObjs.index = -1;

  this.vars = {};
  this.vars.$canvas = null;
  this.vars.callBackFunction = null;
  this.vars.callBackScope = null;
  this.vars.canvasWidth = 0;
  this.vars.canvasHeight = 0;
  this.vars.connectionMode = false;
  this.vars.newConnectionOriginIndex = -1;
  this.vars.requestRecord = null;
  this.vars.selectedObjType = -1;
  this.vars.newRowIDCntr = 0;
  this.vars.importantChangesPending = false;

  this.cons = {};
  this.cons.objTypes = {};
  this.cons.objTypes.plugin = 0;
  this.cons.objTypes.link = 1;
  this.cons.dataChainObjTypes = {};
  this.cons.dataChainObjTypes.reqInput = 0;
  this.cons.dataChainObjTypes.reqOutput = 1;
  this.cons.dataChainObjTypes.query = 2;
  this.cons.dataChainObjTypes.plugin = 3;
  this.cons.linkObjTypes = {};
  this.cons.linkObjTypes.unmapped = 0;
  this.cons.linkObjTypes.mapped = 1;
  this.cons.requestInputLabel = "REQUEST INPUT";
  this.cons.requestOutputLabel = "REQUEST OUPUT";
  this.cons.mappingLabel = "MAPPING";

  //------------------------------------------------------------------------------------------------------------------------------------

  this.initialize = function(canvasElement, callBackFunction, callBackScope, requestRecord) {
  
    this.vars.$canvas = $(canvasElement);
    this.vars.callBackFunction = callBackFunction;
    this.vars.callBackScope = callBackScope;
    this.vars.requestRecord = requestRecord;

    thisCanvas = this;
    LDF.logic.fn.doAjaxRequest('int/GetChainElements.php', {"RequestID": requestRecord.get('RowID')}, 'POST', 'json', function(json, textStatus, jqXHR) {
        if (json.success) {
          thisCanvas.loadComponents.call(thisCanvas, json);
          thisCanvas.vars.importantChangesPending = false;
        } else {
          Ext.Msg.alert('ERROR', 'An error occurred while reading the data chain settings. Please close the form and try again.');
        }
    });
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.loadComponents = function(json) {
    if (json.data.length > 1) {
      var curRec;
      var componentLabel;
      for (var nn = 0; nn < json.data.length; nn++) {
        curRec = json.data[nn];
        switch (parseInt(curRec.Type)) {
          case this.cons.dataChainObjTypes.reqInput:
            componentLabel = this.cons.requestInputLabel;
            break;
          case this.cons.dataChainObjTypes.reqOutput:
            componentLabel = this.cons.requestOutputLabel;
            break;
          case this.cons.dataChainObjTypes.query:
            var store = Ext.getStore('Queries');
            componentLabel = store.getNodeById(curRec.ComponentID).get('text');
            break;
          case this.cons.dataChainObjTypes.plugin:
            var store = Ext.getStore('Plugins');
            componentLabel = store.getNodeById(curRec.ComponentID).get('text');
            break;
        }


        this.newPluginObj(parseInt(curRec.Type), parseInt(curRec.ComponentID), componentLabel, parseInt(curRec.DisplayTop), parseInt(curRec.DisplayLeft), parseInt(curRec.RowID), $.parseJSON(curRec.InputMappings), parseInt(curRec.InputSatisfied));
      }

      for (var nn = 0; nn < json.data.length; nn++) {
        curRec = json.data[nn];
        if (parseInt(curRec.NextChainElementID) > 0) {
          var objPluginA = this.getComponentByRowID(parseInt(curRec.RowID))
          var objPluginB = this.getComponentByRowID(parseInt(curRec.NextChainElementID))
          var linkType = (objPluginB.inputSatisfied) ? this.cons.linkObjTypes.mapped : this.cons.linkObjTypes.unmapped;
          this.newLinkObj(linkType, this.cons.mappingLabel, objPluginA, objPluginB, true, true);
        }
      }

    } else {
      this.newPluginObj(this.cons.dataChainObjTypes.reqInput, 0, this.cons.requestInputLabel, 100, 30, this.getNewNegRowID(), [], false);
      this.newPluginObj(this.cons.dataChainObjTypes.reqOutput, 0, this.cons.requestOutputLabel, 100, 200, this.getNewNegRowID(), [], false);
    }    
  }

  //------------------------------------------------------------------------------------------------------------------------------------

  this.newPluginObj = function(objType, DBID, label, top, left, RowID, inputMappings, inputSatisfied) {
    this.vars.importantChangesPending = true;

    switch (objType) {
      case this.cons.dataChainObjTypes.reqInput:
        className = 'LDFPluginChainStart';
        break;
      case this.cons.dataChainObjTypes.reqOutput:
        className = 'LDFPluginChainEnd';
        break;
      case this.cons.dataChainObjTypes.query:
        className = 'LDFPluginChainQuery';
        break;
      case this.cons.dataChainObjTypes.plugin:
        className = 'LDFPluginChainPlugin';
        break;
    }

    var thisCanvas = this;

    var newPlgn = {};
    newPlgn.RowID = RowID;
    newPlgn.DBID = DBID;
    newPlgn.label = label;
    newPlgn.$div = $('<div class="' + className + '">' + label + '</div>');
    $(this.vars.$canvas).append(newPlgn.$div);
    newPlgn.$div.bind('dblclick', function(event) {thisCanvas.onPluginObjDblClick.call(thisCanvas, event);});
    newPlgn.$div.bind('click', function(event) {thisCanvas.onPluginObjClick.call(thisCanvas, event);});
    newPlgn.type = objType;
    newPlgn.position = {};
    newPlgn.position.left = left;
    newPlgn.position.top = top;
    newPlgn.midX = 0;
    newPlgn.midY = 0;
    newPlgn.linkObjs = [];
    newPlgn.inputMappings = inputMappings;
    newPlgn.inputSatisfied = inputSatisfied;

    newPlgn.$div.draggable({
        start: function(event, ui) {thisCanvas.onPluginObjStartDrag.call(thisCanvas, event, ui);},
        drag: function(event, ui) {thisCanvas.onPluginObjDrag.call(thisCanvas, event, ui);},
        stop: function(event, ui) {thisCanvas.onPluginObjStopDrag.call(thisCanvas, event, ui);},
        opacity: 1
    });

    newPlgn.$div.attr('LDFPluginChainObjIndex', (this.pluginObjs.items.push(newPlgn) - 1));
    this.pluginObjs.count++

    //newPlgn.$div.resizable();

    newPlgn.$div.css({"left" : newPlgn.position.left + 'px', "top" : newPlgn.position.top + 'px'});

    newPlgn.outerHeight = newPlgn.$div.outerHeight();
    newPlgn.outerWidth = newPlgn.$div.outerWidth();
    newPlgn.halfOuterHeight = newPlgn.outerHeight / 2;
    newPlgn.halfOuterWidth = newPlgn.outerWidth / 2;

    this.calcPluginObjMove(newPlgn); 

    return newPlgn;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.newLinkObj = function(relType, label, objPluginA, objPluginB, noCallback, allowRandomBuilup) {
    this.vars.importantChangesPending = true;

    if (objPluginA.type == 0 && objPluginB.type == 1) {
      if (!noCallback) this.vars.callBackFunction.call(this.vars.callBackScope, 'linkInvalid', 'This link wil not produce any data.');
      return false;
    }

    if (objPluginB.type == 0) {
      if (!noCallback) this.vars.callBackFunction.call(this.vars.callBackScope, 'linkInvalid', '[REQUEST INPUT] has to be the starting point of the chain.');
      return false;
    }

    if (objPluginA.type == 1) {
      if (!noCallback) this.vars.callBackFunction.call(this.vars.callBackScope, 'linkInvalid', '[REQUEST OUTPUT] has to be the end point of the chain.');
      return false;
    }

    if (!allowRandomBuilup) {
      if (objPluginA.type != 0 && objPluginA.linkObjs.length == 0) {
        if (!noCallback) this.vars.callBackFunction.call(this.vars.callBackScope, 'linkInvalid', 'The source object for this link has no data input. Start building the chain from the [REQUEST INPUT] object.');
        return false;
      }
    }

    for (nn = 0; nn < this.linkObjs.items.length; nn++) {
      if (this.linkObjs.items[nn]) {
        if (this.linkObjs.items[nn].pluginObjA == objPluginA && this.linkObjs.items[nn].pluginObjB == objPluginB) {
          // Link already exists.
          if (!noCallback) this.vars.callBackFunction.call(this.vars.callBackScope, 'linkExists');
          return false;
        }
        if (this.linkObjs.items[nn].pluginObjA == objPluginB && this.linkObjs.items[nn].pluginObjB == objPluginA) {
          // Reversed link already exists
          if (!noCallback) this.vars.callBackFunction.call(this.vars.callBackScope, 'linkExists');
          return false;
        }

        if (this.linkObjs.items[nn].pluginObjA == objPluginA || this.linkObjs.items[nn].pluginObjB == objPluginB) {
          // Multiple input/output not supported yet
          if (!noCallback) this.vars.callBackFunction.call(this.vars.callBackScope, 'linkInvalid', 'Multiple input/output links are not supported.');
          return false;
        }
      }
    }

    switch (relType) {
      case this.cons.linkObjTypes.unmapped:
        className = 'LDFPluginChainLink0';
        classNameLbl = 'LDFPluginChainLinkLabel0';
        break;
      case this.cons.linkObjTypes.mapped:
        className = 'LDFPluginChainLink1';
        classNameLbl = 'LDFPluginChainLinkLabel1';
        break;
    }

    var thisCanvas = this;

    var newLink = {};
    newLink.$div = $('<div class="' + className + '"></div>');
    newLink.$divLbl = $('<div class="' + classNameLbl + '">' + label + '</div>');
    $(this.vars.$canvas).append(newLink.$div);
    $(this.vars.$canvas).append(newLink.$divLbl);
    newLink.$div.bind('dblclick', function(event) {thisCanvas.onLinkObjDblClick.call(thisCanvas, event);});
    newLink.$divLbl.bind('dblclick', function(event) {thisCanvas.onLinkObjDblClick.call(thisCanvas, event);});
    newLink.$div.bind('click', function(event) {thisCanvas.onLinkObjClick.call(thisCanvas, event);});
    newLink.$divLbl.bind('click', function(event) {thisCanvas.onLinkObjClick.call(thisCanvas, event);});
    newLink.type = relType;
    newLink.pluginObjA = objPluginA;
    newLink.pluginObjB = objPluginB;
    newLink.position = {};
    newLink.position.left = 0;
    newLink.position.top = 0;
    newLink.positionLbl = {};
    newLink.positionLbl.left = 0;
    newLink.positionLbl.top = 0;
    newLink.midX = 0;
    newLink.midY = 0;
    newLink.deltaLength = 0;
    newLink.deltaAngle = 0;

    var newIndex = (this.linkObjs.items.push(newLink) - 1);
    newLink.$div.attr('LDFPluginChainLinkIndex', newIndex);
    newLink.$divLbl.attr('LDFPluginChainLinkIndex', newIndex);
    objPluginA.linkObjs.push(newLink);
    objPluginB.linkObjs.push(newLink);
    this.linkObjs.count++;

    this.calcLinkObjMove(newLink); 
    this.positionLinkObj(newLink);

    newLink.$divLbl.draggable({ distance: 9999 }); // NB this is to prevent the object from being selected on double clicking (making it draggable somehow prevents that. The large minimal drag start distance is because it mst not really be a draggable.

    if (!noCallback) this.vars.callBackFunction.call(this.vars.callBackScope, 'linkAdded');

    return newLink;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.setActiveObject = function(objType, index, obj) { 
    if (this.pluginObjs.index > -1) {
      this.pluginObjs.items[this.pluginObjs.index].$div.removeClass('LDFPluginChainSelected');
      this.pluginObjs.index = -1;
    }
    if (this.linkObjs.index > -1) {
      this.linkObjs.items[this.linkObjs.index].$divLbl.removeClass('LDFPluginChainSelected');
      this.linkObjs.index = -1;
    }

    this.vars.selectedObjType = objType;
    switch(objType) {
      case this.cons.objTypes.plugin:
        if (typeof obj == 'undefined') {
          obj = this.pluginObjs.items[index];
        }
        this.pluginObjs.index = index;
        obj.$div.addClass('LDFPluginChainSelected');
        if (this.vars.newConnectionOriginIndex > -1 && this.vars.newConnectionOriginIndex != index) {
          if (this.vars.connectionMode) {
            this.newLinkObj(0, this.cons.mappingLabel, this.pluginObjs.items[this.vars.newConnectionOriginIndex], obj);
          }
        }
        this.vars.newConnectionOriginIndex = index;
        break;

      case this.cons.objTypes.link:
        if (typeof obj == 'undefined') {
          obj = this.linkObjs.items[index];
        }
        this.linkObjs.index = index;
        obj.$divLbl.addClass('LDFPluginChainSelected');
        break;
    }
    return obj; 
  };


  //------------------------------------------------------------------------------------------------------------------------------------

  this.setConnectionMode = function(newValue) {
    this.vars.connectionMode = newValue;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.onPluginObjStartDrag = function(event, ui) {
    this.setActiveObject(this.cons.objTypes.plugin, $(event.target).attr('LDFPluginChainObjIndex'));
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.onPluginObjDrag = function(event, ui) {
    var objPlugin = this.pluginObjs.items[$(event.target).attr('LDFPluginChainObjIndex')];
    this.doPluginObjDrag(objPlugin);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.onPluginObjStopDrag = function(event, ui) {
    var objPlugin = this.pluginObjs.items[$(event.target).attr('LDFPluginChainObjIndex')];

    if (objPlugin.position.left < 0) {
      objPlugin.position.left = 0;
      objPlugin.$div.css({"left": objPlugin.position.left + 'px'});
    }
    if (objPlugin.position.top < 0) {
      objPlugin.position.top = 0;
      objPlugin.$div.css({"top": objPlugin.position.top + 'px'});
    }

    this.doPluginObjDrag(objPlugin);


  /*
    var maxWidth = 0;
    var maxHeight = 0;
    $.each(this.pluginObjs.items, function(index, objPlugin) { 
      var tempVal;

      tempVal = objPlugin.position.top + objPlugin.outerHeight + 20;
      if (tempVal > maxHeight) maxHeight = tempVal;

      tempVal = objPlugin.position.left + objPlugin.outerWidth + 20;
      if (tempVal > maxWidth) maxWidth = tempVal;
    });

    var objCss = {};
    if (this.vars.canvasWidth != maxWidth) {
      this.vars.canvasWidth = maxWidth;
      objCss.width = maxWidth + 'px';
    }
    if (this.vars.canvasHeight != maxHeight) {
      this.vars.canvasHeight = maxHeight;
      objCss.height = maxHeight + 'px';
    }
  */
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.doPluginObjDrag = function(objPlugin) { 
    this.calcPluginObjMove(objPlugin); 
    var thisCanvas = this;
    $.each(objPlugin.linkObjs, function(index, value) { 
      thisCanvas.calcLinkObjMove(value); 
      thisCanvas.positionLinkObj(value);
    });
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.calcPluginObjMove = function(objPlugin) {
    //objPlugin.position = objPlugin.$div.position();
    objPlugin.position.top = parseInt(objPlugin.$div.css('top'));
    objPlugin.position.left = parseInt(objPlugin.$div.css('left'));
    objPlugin.midX = objPlugin.position.left + objPlugin.halfOuterWidth;
    objPlugin.midY = objPlugin.position.top + objPlugin.halfOuterHeight;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.calcLinkObjMove = function(objLink) {

    objLink.deltaLength = this.calculateLength(objLink.pluginObjA.midX, objLink.pluginObjA.midY, objLink.pluginObjB.midX, objLink.pluginObjB.midY);
    objLink.deltaAngle = this.calculateAngle(objLink.pluginObjA.midX, objLink.pluginObjA.midY, objLink.pluginObjB.midX, objLink.pluginObjB.midY);
  
    var newMid = this.calculateMid(objLink.pluginObjA.midX, objLink.pluginObjA.midY, objLink.pluginObjB.midX, objLink.pluginObjB.midY);
    objLink.position.left = newMid.x - (objLink.deltaLength * 0.5);
    objLink.position.top = newMid.y - (objLink.$div.outerHeight() * 0.5);
    objLink.position.left.toFixed(0);
    objLink.position.top.toFixed(0);
    objLink.positionLbl.left = newMid.x - (objLink.$divLbl.outerWidth() * 0.5);
    objLink.positionLbl.top = newMid.y - (objLink.$divLbl.outerHeight() * 0.5);
    objLink.positionLbl.left.toFixed(0);
    objLink.positionLbl.top.toFixed(0);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.positionLinkObj = function(objLink) {

    objLink.$div.css({
                           "width"               : objLink.deltaLength + 'px', 
                           "left"                : objLink.position.left + 'px', 
                           "top"                 : objLink.position.top + 'px',
                           "transform"           : 'rotate(' + objLink.deltaAngle + 'deg)',
                           "-ms-transform"       : 'rotate(' + objLink.deltaAngle + 'deg)',
                           "-moz-transform"      : 'rotate(' + objLink.deltaAngle + 'deg)',
                           "-webkit-transform"   : 'rotate(' + objLink.deltaAngle + 'deg)',
                           "-o-transform"        : 'rotate(' + objLink.deltaAngle + 'deg)'
                      });
    objLink.$divLbl.css({
                           "left"                : objLink.positionLbl.left + 'px', 
                           "top"                 : objLink.positionLbl.top + 'px'
                        });
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.calculateLength = function(x1, y1, x2, y2) {
    var deltaX =  x1 >= x2 ? x1 - x2 : x2 - x1;
    var deltaY =  y1 >= y2 ? y1 - y2 : y2 - y1;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY).toFixed(2);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.calculateAngle = function(x1, y1, x2, y2) {
    var angle;
    if (x2 == x1) {
        angle = (y2 > y1) ? 90.0 : 270.0;
    } else {
        angle = 180.0 + 180.0 * Math.atan((y2 - y1) / (x2 - x1)) / 3.14159265358979;
    }
    if (x2 > x1) {
        angle += 180.0;
    }
    return angle.toFixed(2);
  }

  //------------------------------------------------------------------------------------------------------------------------------------

  this.calculateMid = function(x1, y1, x2, y2) {
    var mid = {};
    mid.x = x1 >= x2 ? x2 + ((x1 - x2) / 2) : x1 + ((x2 - x1) / 2);
    mid.y = y1 >= y2 ? y2 + ((y1 - y2) / 2) : y1 + ((y2 - y1) / 2);
    return mid;
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.onPluginObjClick = function(event) {
    var $pluginDomObj = $(event.target);
    this.setActiveObject(this.cons.objTypes.plugin, $pluginDomObj.attr('LDFPluginChainObjIndex'));
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.onPluginObjDblClick = function(event) {
    var $pluginDomObj = $(event.target);
    var actPlugin = this.setActiveObject(this.cons.objTypes.plugin, $pluginDomObj.attr('LDFPluginChainObjIndex'));

    switch (actPlugin.type) {
      case this.cons.dataChainObjTypes.reqInput:
        // Nothing (yet).
        break;
      case this.cons.dataChainObjTypes.reqOutput:
        // Nothing (yet).
        break;
      case this.cons.dataChainObjTypes.query:
        var store = Ext.getStore('Queries');
        var record = store.getNodeById(actPlugin.DBID);
        var querySettings = Ext.widget('querysettings');
        querySettings.down('form[name=queryMainData]').loadRecord(record);
        querySettings.down('form[name=queryExpression]').loadRecord(record);

        var queryfield = querySettings.down('textareafield[name=Query]');
        queryfield.custom_LastParsedValue = queryfield.getValue();
        var treeIn = querySettings.down('#queryInputDoc');
        var treeOut = querySettings.down('#queryOutputDoc');
        treeIn.custom_Struct = $.parseJSON(record.get('InputStruct'));
        treeOut.custom_Struct = $.parseJSON(record.get('OutputStruct'));
        LDF.logic.fn.setTreeForSchema(treeIn.custom_Struct, treeIn);
        LDF.logic.fn.setTreeForSchema(treeOut.custom_Struct, treeOut);
        break;
      case this.cons.dataChainObjTypes.plugin:
        var store = Ext.getStore('Plugins');
        var record = store.getNodeById(actPlugin.DBID);
        var pluginSettings = Ext.widget('pluginsettings');
        pluginSettings.down('form[name=pluginMainData]').loadRecord(record);
        pluginSettings.down('form[name=pluginScript]').loadRecord(record);
        var scriptfield = pluginSettings.down('textareafield[name=Script]');
        scriptfield.custom_LastParsedValue = scriptfield.getValue();
        var treeIn = pluginSettings.down('#pluginInputDoc');
        var treeOut = pluginSettings.down('#pluginOutputDoc');
        treeIn.custom_Struct = $.parseJSON(record.get('InputStruct'));
        treeOut.custom_Struct = $.parseJSON(record.get('OutputStruct'));
        LDF.logic.fn.setTreeForSchema(treeIn.custom_Struct, treeIn);
        LDF.logic.fn.setTreeForSchema(treeOut.custom_Struct, treeOut);
        break;
    }

  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.onLinkObjClick = function(event) {
    var $linkDomObj = $(event.target);
    this.setActiveObject(this.cons.objTypes.link, $linkDomObj.attr('LDFPluginChainLinkIndex'));
  }

  //------------------------------------------------------------------------------------------------------------------------------------


  this.onLinkObjDblClick = function(event) {
    var $linkDomObj = $(event.target);
    var actLink = this.setActiveObject(this.cons.objTypes.link, $linkDomObj.attr('LDFPluginChainLinkIndex'));

    //console.log('Link click (index: ' + this.linkObjs.index + ')!');

    var dataMapper = Ext.widget('datamapper');
    var treeIn = dataMapper.down('#mapperInputDoc');
    var treeSrc = dataMapper.down('#mapperSourceDoc');
    var mapGrid = dataMapper.down('#mapperGrid');
    mapGrid.pCanvas = this;
    mapGrid.custom_linkObj = actLink;

    var mapStore = mapGrid.getStore();
    var mapType;
    var pathSrc;
    var pathSrcId;
    for (var nn = 0; nn < actLink.pluginObjB.inputMappings.length; nn++) {
      if (actLink.pluginObjB.inputMappings[nn][1].indexOf('@LITERAL:') == 0) {
        mapType = '=';
        pathSrc = actLink.pluginObjB.inputMappings[nn][1].substr(9);
        pathSrcId = '@LITERAL:';
        mapStore.add({'docIn': actLink.pluginObjB.inputMappings[nn][0], 'mapType': mapType, 'mapping': pathSrc, 'tidmapping': pathSrcId});
      } else {
        mapType = '>';
        pathSrcId = actLink.pluginObjB.inputMappings[nn][1].substr(0, actLink.pluginObjB.inputMappings[nn][1].indexOf('->'));
        srcObj = this.getComponentByTypeAndDBID(pathSrcId.substr(0, 1), pathSrcId.substr(1));
        if (srcObj) {
          pathSrc = this.filterLabelForMapping(srcObj.label) + actLink.pluginObjB.inputMappings[nn][1].substr(actLink.pluginObjB.inputMappings[nn][1].indexOf('->'));
          mapStore.add({'docIn': actLink.pluginObjB.inputMappings[nn][0], 'mapType': mapType, 'mapping': pathSrc, 'tidmapping': pathSrcId});
        }
      }
    }

    switch (actLink.pluginObjB.type) {
      case this.cons.dataChainObjTypes.reqInput:
        // Cannot create link TO request intput.
        return;
        break;
      case this.cons.dataChainObjTypes.reqOutput:
        var record = this.vars.requestRecord;
        treeIn.custom_Struct = $.parseJSON(record.get('OutputStruct'));
        break;
      case this.cons.dataChainObjTypes.query:
        var store = Ext.getStore('Queries');
        var record = store.getNodeById(actLink.pluginObjB.DBID);
        treeIn.custom_Struct = $.parseJSON(record.get('InputStruct'));
        break;
      case this.cons.dataChainObjTypes.plugin:
        var store = Ext.getStore('Plugins');
        var record = store.getNodeById(actLink.pluginObjB.DBID);
        treeIn.custom_Struct = $.parseJSON(record.get('InputStruct'));
        break;
    }
    
    treeSrc.custom_Struct = this.getCentralDataStruct(actLink);
    LDF.logic.fn.setTreeForSchema(treeIn.custom_Struct, treeIn);
    LDF.logic.fn.setTreeForSchema(treeSrc.custom_Struct, treeSrc);

  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.getCentralDataStruct = function(linkObj) {
    var returnObj = {};
    switch (linkObj.pluginObjA.type) {
      case this.cons.dataChainObjTypes.reqInput:
        returnObj['REQUEST INPUT'] = $.parseJSON(this.vars.requestRecord.get('InputStruct'));
        return returnObj;
      case this.cons.dataChainObjTypes.reqOutput:
        // Cannot create link FROM request output.
        return {};
      case this.cons.dataChainObjTypes.query:
        var store = Ext.getStore('Queries');
        break;
      case this.cons.dataChainObjTypes.plugin:
        var store = Ext.getStore('Plugins');
        break;
    }

    for (var nn = 0; nn < linkObj.pluginObjA.linkObjs.length; nn++) {
      if (linkObj.pluginObjA.linkObjs[nn] != linkObj) {
        returnObj = this.getCentralDataStruct(linkObj.pluginObjA.linkObjs[nn]);
        break;
      }
    }
    var record = store.getNodeById(linkObj.pluginObjA.DBID);
    returnObj[linkObj.pluginObjA.label] = $.parseJSON(record.get('OutputStruct'));
    return returnObj;
  };

  //------------------------------------------------------------------------------------------------------------------------------------


  this.addMapping = function(treeIn, treeSrc, mapGrid) {

    var pathIn = treeIn.getSelectionModel().getSelection()[0].getPath('text', '->');
    var pathSrc = treeSrc.getSelectionModel().getSelection()[0].getPath('text', '->');

    pathIn = pathIn.replace(/^\-\>root\-\>/i, '');
    pathSrc = pathSrc.replace(/^\-\>root\-\>/i, '');

    var nn = 'A'.charCodeAt(0);
    while (pathIn.indexOf('&nbsp;&nbsp;') > -1 && pathSrc.indexOf('&nbsp;&nbsp;') > -1) {
      pathIn = pathIn.replace(/\&nbsp;\&nbsp;/, String.fromCharCode(nn));
      pathSrc = pathSrc.replace(/\&nbsp;\&nbsp;/, String.fromCharCode(nn));
      nn++;
    }
    while (pathIn.indexOf('&nbsp;&nbsp;') > -1) {
      pathIn = pathIn.replace(/\&nbsp;\&nbsp;/, '0');
    }
    while (pathSrc.indexOf('&nbsp;&nbsp;') > -1) {
      pathSrc = pathSrc.replace(/\&nbsp;\&nbsp;/, '0');
    }

    pathIn = pathIn.replace(/ \&nbsp;/g, '');
    pathSrc = pathSrc.replace(/ \&nbsp;/g, '');

    var componentName = pathSrc.substr(0, pathSrc.indexOf('->'));
    var componentObj = this.getComponentByName(componentName);
    var prefix = ['i', 'o', 'q', 'p'];
    var pathSrcId = prefix[componentObj.type] + componentObj.DBID; // + pathSrc.substr(pathSrc.indexOf('->'));

    pathIn = this.filterLabelForMapping(pathIn);
    pathSrc = this.filterLabelForMapping(pathSrc);

    mapGrid.getStore().add({'docIn': pathIn, 'mapType': '>', 'mapping': pathSrc, 'tidmapping': pathSrcId});
  };

  //------------------------------------------------------------------------------------------------------------------------------------


  this.addMappingLiteral = function(treeIn, literal, mapGrid) {

    var pathIn = treeIn.getSelectionModel().getSelection()[0].getPath('text', '->');
    pathIn = pathIn.replace(/^\-\>root\-\>/i, '');
    while (pathIn.indexOf('&nbsp;&nbsp;') > -1) {
      pathIn = pathIn.replace(/\&nbsp;\&nbsp;/, '0');
    }
    pathIn = pathIn.replace(/ \&nbsp;/g, '');
    pathIn = this.filterLabelForMapping(pathIn);

    var pathSrc = literal;
    var pathSrcId = '@LITERAL:';

    mapGrid.getStore().add({'docIn': pathIn, 'mapType': '=', 'mapping': pathSrc, 'tidmapping': pathSrcId});
  };

  //------------------------------------------------------------------------------------------------------------------------------------


  this.deleteMapping = function(mapGrid) {
    mapGrid.getStore().remove(mapGrid.getSelectionModel().getSelection()[0]);
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.getComponentByName = function(componentName) {
    for (var nn = 0; nn < this.pluginObjs.items.length; nn++) {
      if (this.pluginObjs.items[nn]) {
        if (this.pluginObjs.items[nn].label == componentName) {
          return this.pluginObjs.items[nn];
        }
      }
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.getComponentByRowID = function(RowID) {
    for (var nn = 0; nn < this.pluginObjs.items.length; nn++) {
      if (this.pluginObjs.items[nn]) {
        if (this.pluginObjs.items[nn].RowID == RowID) {
          return this.pluginObjs.items[nn];
        }
      }
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.getComponentByTypeAndDBID = function(typeChar, DBID) {
    var type;
    switch(typeChar) {
      case 'i': type = 0; break; 
      case 'o': type = 1; break;
      case 'q': type = 2; break;
      case 'p': type = 3; break;
    }
    for (var nn = 0; nn < this.pluginObjs.items.length; nn++) {
      if (this.pluginObjs.items[nn]) {
        if (this.pluginObjs.items[nn].type == type && this.pluginObjs.items[nn].DBID == DBID) {
          return this.pluginObjs.items[nn];
        }
      }
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.saveMappings = function(mapGrid, treeIn) {
    this.vars.importantChangesPending = true;

    var mapRecords = mapGrid.getStore().getRange();

    var newMappings = [];
    var pathSrc;
    var pathSrcId;
    for (var nn = 0; nn < mapRecords.length; nn++) {
      if (mapRecords[nn].get('tidmapping') == '@LITERAL:') {
        newMappings.push([mapRecords[nn].get('docIn'), '@LITERAL:' + mapRecords[nn].get('mapping')]);
      } else {
        pathSrc = mapRecords[nn].get('mapping');
        pathSrcId = mapRecords[nn].get('tidmapping') + pathSrc.substr(pathSrc.indexOf('->'));
        newMappings.push([mapRecords[nn].get('docIn'), pathSrcId]);
      }
    }
    mapGrid.custom_linkObj.pluginObjB.inputMappings = newMappings;

    
    var mappingCheckObj = {allLeafsMapped: true, mappings: newMappings};
    var treeRoot = treeIn.getRootNode();
    this.checkIfNodeIsMapped(treeRoot, mappingCheckObj);
    if (mappingCheckObj.allLeafsMapped) {
      this.setLinkObjType(mapGrid.custom_linkObj, this.cons.linkObjTypes.mapped);
    } else {
      this.setLinkObjType(mapGrid.custom_linkObj, this.cons.linkObjTypes.unmapped);
    }

  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.checkIfNodeIsMapped = function(node, mappingCheckObj) {
    if (node.isLeaf()) {
      var leafMapped = false;
      var pathIn = node.getPath('text', '->');
      pathIn = pathIn.replace(/^\-\>root\-\>/i, '');
      while (pathIn.indexOf('&nbsp;&nbsp;') > -1) {
        pathIn = pathIn.replace(/\&nbsp;\&nbsp;/, '0');
      }
      pathIn = pathIn.replace(/ \&nbsp;/g, '');
      pathIn = this.filterLabelForMapping(pathIn);
      pathIn = pathIn.replace(/\[[^\]]+\]/g, '[]');
      var curMap;
      for (var nn = 0; nn < mappingCheckObj.mappings.length; nn++) {
        curMap = mappingCheckObj.mappings[nn][0].replace(/\[[^\]]+\]/g, '[]');
        if (curMap == pathIn) {
          leafMapped = true;
          break;
        }
      }
      if (!leafMapped) {
        mappingCheckObj.allLeafsMapped = false;
      }
      return mappingCheckObj.allLeafsMapped;
    } else {
      for (var nn = 0; nn < node.childNodes.length; nn++) {
        this.checkIfNodeIsMapped(node.childNodes[nn], mappingCheckObj);
        if (!mappingCheckObj.allLeafsMapped) break;
      }
      return mappingCheckObj.allLeafsMapped;
    }
  }


  //------------------------------------------------------------------------------------------------------------------------------------

  this.filterLabelForMapping = function(label) {
    return label.replace(/[ ]/g, '_');
  };

  //------------------------------------------------------------------------------------------------------------------------------------


  this.setLinkObjType = function(linkObj, relType) {
    switch (relType) {
      case this.cons.linkObjTypes.unmapped:
        linkObj.$div.removeClass('LDFPluginChainLink1');
        linkObj.$divLbl.removeClass('LDFPluginChainLinkLabel1');
        linkObj.$div.addClass('LDFPluginChainLink0');
        linkObj.$divLbl.addClass('LDFPluginChainLinkLabel0');
        linkObj.pluginObjB.inputSatisfied = false;
        break;
      case this.cons.linkObjTypes.mapped:
        linkObj.$div.removeClass('LDFPluginChainLink0');
        linkObj.$divLbl.removeClass('LDFPluginChainLinkLabel0');
        linkObj.$div.addClass('LDFPluginChainLink1');
        linkObj.$divLbl.addClass('LDFPluginChainLinkLabel1');
        linkObj.pluginObjB.inputSatisfied = true;
        break;
    }
  };

  //------------------------------------------------------------------------------------------------------------------------------------

  this.deleteSelectedObject = function() {
    switch(this.vars.selectedObjType) {
      case this.cons.objTypes.plugin:
        if (this.pluginObjs.index > -1) {
          var obj = this.pluginObjs.items[this.pluginObjs.index];
          if (obj.type == this.cons.dataChainObjTypes.reqInput) {
            Ext.Msg.alert('Remove component', 'You can not remove the Request Input component. Our sincere apologies.');
            return;
          }
          if (obj.type == this.cons.dataChainObjTypes.reqOutput) {
            Ext.Msg.alert('Remove component', 'You can not remove the Request Output component. Our sincere apologies.');
            return;
          }
          if (obj.linkObjs.length > 0) {
            Ext.Msg.alert('Remove component', 'As a safety feature, components can not be removed if they are sill connected to other components. Please remove the connections first.');
            return;
          }
          obj.$div.remove();
          this.pluginObjs.items[this.pluginObjs.index] = null;
          this.pluginObjs.index = -1;
        }
        break;

      case this.cons.objTypes.link:
        if (this.linkObjs.index > -1) {
          var obj = this.linkObjs.items[this.linkObjs.index];
          for (var nn = 0; nn < this.pluginObjs.items.length; nn++) {
            if (this.pluginObjs.items[nn]) {
              for (var nn2 = this.pluginObjs.items[nn].linkObjs.length - 1; nn2 >= 0; nn2--) {
                if (this.pluginObjs.items[nn].linkObjs[nn2] == obj) {
                  this.pluginObjs.items[nn].linkObjs.splice(nn2, 1);
                }
              }
            }
          }
          obj.$divLbl.remove();
          obj.$div.remove();
          this.linkObjs.items[this.linkObjs.index] = null;
          this.linkObjs.index = -1;
        }
        break;
    }
    this.vars.selectedObjType = -1;
  }


  //------------------------------------------------------------------------------------------------------------------------------------

  this.getNewNegRowID = function() {
    this.vars.newRowIDCntr--;
    return this.vars.newRowIDCntr;
  }

  //------------------------------------------------------------------------------------------------------------------------------------

  this.saveDataChainToDB = function(win, closeForm) {
    //DB Row: {RowID: 0, RequestID: 0, Type: 0, ComponentID: 1, NextChainElementID: 1, InputMappings: [], InputSatisfied: true, DisplayTop: 10, DisplayLeft: 10}
    var rowSet = [];
    var objComp;
    var nextChElID;
    var RequestID = this.vars.requestRecord.get('RowID');
    for (var nn = 0; nn < this.pluginObjs.items.length; nn++) {
      if (this.pluginObjs.items[nn]) {
        objComp = this.pluginObjs.items[nn];
        nextChElID = 0;
        for (var nn2 = 0; nn2 < objComp.linkObjs.length; nn2++) {
          if (objComp.linkObjs[nn2].pluginObjB != objComp) {
            nextChElID = objComp.linkObjs[nn2].pluginObjB.RowID;
            break;
          }
        }
        rowSet.push({
                      RowID              : objComp.RowID, 
                      RequestID          : RequestID, 
                      Type               : objComp.type, 
                      ComponentID        : objComp.DBID, 
                      NextChainElementID : nextChElID, 
                      InputMappings      : objComp.inputMappings, 
                      InputSatisfied     : objComp.inputSatisfied, 
                      DisplayTop         : objComp.position.top, 
                      DisplayLeft        : objComp.position.left
                    }
        );
      }
    }  

    thisCanvas = this;
    LDF.logic.fn.doAjaxRequest('int/SetChainElements.php', Ext.JSON.encode({RequestID: RequestID, data: rowSet}), 'POST', 'json', function(json, textStatus, jqXHR) {
        if (json.success) {
          thisCanvas.vars.importantChangesPending = false;
          if (closeForm) win.close();
        } else {
          Ext.Msg.alert('ERROR', 'An error occurred while saving the data chain settings. Please try again.');
        }
    }, 'application/json');
  
  }

  //------------------------------------------------------------------------------------------------------------------------------------

};

