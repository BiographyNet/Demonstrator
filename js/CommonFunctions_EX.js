if (!"LDF" in window                     )  var LDF;            
if (typeof LDF             == 'undefined')  LDF = {};           
if (typeof LDF.logic       == 'undefined')  LDF.logic = {};     
if (typeof LDF.logic.fn    == 'undefined')  LDF.logic.fn = {};
if (typeof LDF.logic.vars  == 'undefined')  LDF.logic.vars = {};  

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.vars.reloadModulesAfterSync = false;


//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.executeTestQuery = function (reqObj) {
  var testquerytabs = Ext.ComponentManager.get('querytesttabs');

  /*
  var pagingBar = Ext.createWidget('pagingtoolbar', {
      //store      : 'Sources',
      displayInfo: true,
      displayMsg : 'Displaying rows {0} - {1} of {2}'
    });
  */

  var newGridPanel = Ext.createWidget({
      xtype: 'gridpanel',
      layout: 'fit',
      //deferRowRender: useDeferRender,
      border: false,
      style: {border: 0},  // Workaround for the fact that 'border: false' does not work correctly.
      columns: [
          {header: String.fromCharCode(160), flex: 1}
      ],
      loadMask: true,
      viewConfig: {
          stripeRows: true
      },
      //bbar: pagingBar,
  });

  var newTab = testquerytabs.add({title: reqObj.name, closable: true, items: [
      newGridPanel
  ]});

  testquerytabs.show();
  testquerytabs.setActiveTab(newTab);

  newGridPanel.setLoading({
      msg: 'Loading...',
      useTargetEl: false
  });


  reqObj.Params.queryuri = reqObj.URI;
  reqObj.Params.datatype = 'jsonp';
  reqObj.Params.resttype = reqObj.Type;
  LDF.logic.fn.doAjaxRequest('int/ExecuteQuery.php', reqObj.Params, 'GET', 'jsonp', function(jsonp, textStatus, jqXHR) {
  	var xml = $.parseXML(jsonp.xmlData);

    	var sparqlHeader = $(xml).find('head');
    	var columnHeaders = sparqlHeader.find('variable');
        var gridColumns = [];
        var fieldNames = [];
        columnHeaders.each(function(index) {
          var columnText = $(this).attr('name');
          gridColumns.push({header: columnText, flex: 1, sortable: true, dataIndex: columnText});
          fieldNames.push({name: columnText});
        });

    	var sparqlResults = $(xml).find('results').find('result');
        var dataArray = [];
        sparqlResults.each(function() {
          var bindings = $(this).find('binding');
          var newRow = {};
          bindings.each(function() {
            var binding = $(this);
            newRow[binding.attr('name')] = binding.children(':first').text();
          });  
          dataArray.push(newRow);
        });

        var newStore = Ext.create('Ext.data.Store', {
          fields: fieldNames,
          data : dataArray
        });

        newGridPanel.reconfigure(newStore, gridColumns);

        newGridPanel.setLoading(false);
  });
}

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.doAjaxRequest = function (urlStr, dataObj, httpVerb, dataType, successFn, contentType) {
  if (!contentType) contentType = 'application/x-www-form-urlencoded; charset=UTF-8';

  $.ajax({
           url : urlStr,
           data : dataObj,
           type : httpVerb,
           dataType : dataType,
           success : successFn,
           contentType : contentType,
           error  : function(xhr, status) {
               alert('Error in Ajax request: ' + status);
           }
         });
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.getSourcesArray = function() { 
  var ts = Ext.getStore('Sources');
  var root = ts.getRootNode();
  var sourcesArray = []; 
  var nn = 0;
  root.eachChild(function(childNode) { 
      nn++;
      sourcesArray.push(["" + childNode.get('id'), childNode.get('text')]);
  });

  return sourcesArray;
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.getQueriesArray = function() { 
  var ts = Ext.getStore('Queries');
  var root = ts.getRootNode();
  var sourcesArray = []; 
  var nn = 0;
  root.eachChild(function(childNode) { 
      nn++;
      sourcesArray.push(["" + childNode.get('id'), childNode.get('text')]);
  });

  return sourcesArray;
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.getPluginsArray = function() { 
  var ts = Ext.getStore('Plugins');
  var root = ts.getRootNode();
  var sourcesArray = []; 
  var nn = 0;
  root.eachChild(function(childNode) { 
      nn++;
      sourcesArray.push(["" + childNode.get('id'), childNode.get('text')]);
  });

  return sourcesArray;
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.filterQuery = function(queryString) {
  return queryString.replace(/[ ]+/g, ' '); // Filter for multiple spaces
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.getQueryInputDoc = function(queryString) {
  var qs = queryString.replace(/[ ]+/g, '');
  var argArr = qs.split('[=');
  var endPos;
  var varName;
  var doc = {};
  for (nn = 1; nn < argArr.length; nn++) {
    endPos = argArr[nn].search(/[\]\|]/);
    if (endPos > -1) {
      varName = argArr[nn].substring(0, endPos);
      if (typeof(doc[varName]) === 'undefined') {
        doc[varName] = null;
      }
    } else {
      // SYNTAX ERROR!
      Ext.Msg.alert('Test Query', 'The query contains a syntax error. Check the use of input variables.');
      return [];
    }
  }
  return doc;
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.getQueryOutputDoc = function(queryString) {
  var qs = queryString.substring(0, queryString.search(/where/i));
  qs = qs.replace(/[\s]+/g, ' ');
  qs = qs.replace(/ \?/g, '  ?');
  var argArr = qs.split(' ?');
  var endPos;
  var varName;
  var doc = {};
  for (nn = 1; nn < argArr.length; nn++) {
    endPos = argArr[nn].search(/[ ]/);
    if (endPos > -1) {
      varName = argArr[nn].substring(0, endPos);
      if (typeof(doc[varName]) === 'undefined') {
        doc[varName] = null;
      }
    } else {
      // SYNTAX ERROR!
      Ext.Msg.alert('Test Query', 'The query contains a syntax error. Check the return variable declarations.');
      return [];
    }
  }
  return {'resultrow': [doc], 'result_row_count': null};
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.parseQueryForTest = function(reqObj, queryString) {
  var qsObj = {};
  qsObj.argArr = queryString.split('[=');
  qsObj.resQuery = qsObj.argArr[0];
  qsObj.nn = 1;
  qsObj.varMap = [];
  LDF.logic.fn.replaceQueryVar(reqObj, qsObj);
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.replaceQueryVar = function(reqObj, qsObj) {
  var valPos;
  var endPos;
  var varName;

  if (qsObj.argArr.length > qsObj.nn) {
    valPos = qsObj.argArr[qsObj.nn].search(/[\|]/);
    endPos = qsObj.argArr[qsObj.nn].search(/[\]]/);
    if (endPos > -1) {
      if (valPos > -1 && valPos < endPos) {
        varName = qsObj.argArr[qsObj.nn].substring(0, valPos);
        qsObj.varMap[varName] = qsObj.argArr[qsObj.nn].substring(valPos + 1, endPos)
        qsObj.resQuery += qsObj.varMap[varName];
        qsObj.resQuery += qsObj.argArr[qsObj.nn].substring(endPos + 1);
        qsObj.nn++;
        LDF.logic.fn.replaceQueryVar(reqObj, qsObj);
      } else {
        varName = qsObj.argArr[qsObj.nn].substring(0, endPos);
        if (qsObj.varMap[varName]) {
          qsObj.resQuery += qsObj.varMap[varName];
          qsObj.resQuery += qsObj.argArr[qsObj.nn].substring(endPos + 1);
          qsObj.nn++;
          LDF.logic.fn.replaceQueryVar(reqObj, qsObj);
        } else {
          Ext.Msg.prompt('Test Query', "Please enter a value for the variable '" + varName + "':", function(btn, varValue) {
            if (btn == 'ok') {
              qsObj.varMap[varName] = varValue;
              qsObj.resQuery += varValue;
              qsObj.resQuery += qsObj.argArr[qsObj.nn].substring(endPos + 1);
              qsObj.nn++;
              LDF.logic.fn.replaceQueryVar(reqObj, qsObj);
            }
          });
        }
      }
    } else {
      // SYNTAX ERROR!
      Ext.Msg.alert('Test Query', 'The query contains a syntax error. Check the use of input variables.');
    }
  } else {
    //console.log(qsObj.resQuery);
    reqObj.Params[reqObj.QueryParam] = Ext.String.trim(qsObj.resQuery); 
    LDF.logic.fn.executeTestQuery(reqObj);
  }
};

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.parseSourceParameters = function($parStr, createObject) {  // NB: This functions has a PHP counterpart. To keep them the same as much as possible, variables in this function start with a $, which is an allowed character vor variable names in Javascript. But it has no special meaning. Lines that have been changed from the PHP version contain the comment CHANGED followed by the reason.
  createObject ? $result = {} : $result = []; // NB: CHANGED (array declaration and option to create object instead of array).
  $parStr = $parStr.replace("\t", ' '); // NB: CHANGED (string replace).
  $parStr = $parStr.replace("\n", ' '); // NB: CHANGED (string replace).
  $parStr = $parStr.replace("\r", ' '); // NB: CHANGED (string replace).
  $parStr = Ext.String.trim($parStr); // NB: CHANGED (string trim).

  $state = 0;
  for($nn = 0; $nn < $parStr.length; $nn++) { // NB: CHANGED (string length).
    $nChr = $parStr.substr($nn, 1); // NB: CHANGED (string substring).
    switch ($state) {
      case 0: // BEGIN READING KEY
        if ($nChr != ' ') {
          $newKey = '';
          if ($nChr == '"' || $nChr == "'") {
            $bareStr = false;
            $strDel = $nChr;
          } else {
            $bareStr = true;
            $strDel = "'";
            $newKey += $nChr; // NB: CHANGED (string concatenate).
          }
          $state = 1;
        }
        break;

      case 1: // READING KEY
        if ($nChr == $strDel) {
          $state = 2;
        } else if ($nChr == '=' && $bareStr == true) {
          if ($bareStr) $newKey = Ext.String.trim($newKey); // NB: CHANGED (string trim).
          $state = 3;
        } else {
          $newKey += $nChr; // NB: CHANGED (string concatenate).
        }
        break;

      case 2: // READ KEY-VALUE SEPERATOR
        if ($nChr == '=') {
          if ($bareStr) $newKey = Ext.String.trim($newKey); // NB: CHANGED (string trim).
          $state = 3;
        }
        break;

      case 3: // BEGIN READING VALUE
        if ($nChr != ' ') {
          $newVal = '';
          if ($nChr == '"' || $nChr == "'") {
            $bareStr = false;
            $strDel = $nChr;
          } else {
            $bareStr = true;
            $strDel = "'";
            $newVal += $nChr; // NB: CHANGED (string concatenate).
          }
          $state = 4;
        }
        break;

      case 4: // READING VALUE
        if ($nChr == $strDel) {
          $state = 5;
        } else if ($nChr == ',' && $bareStr == true) {
          if ($bareStr) $newVal = Ext.String.trim($newVal); // NB: CHANGED (string trim).
          $result[$newKey] = $newVal;
          $state = 0;
        } else {
          $newVal += $nChr; // NB: CHANGED (string concatenate).
        }
        break;

      case 5: // READ NEXT SEPERATOR
        if ($nChr == ',') {
          if ($bareStr) $newVal = Ext.String.trim($newVal); // NB: CHANGED (string trim).
          $result[$newKey] = $newVal;
          $state = 0;
        }
        break;     
    }
  }
  if ($state == 4 || $state == 5) {
    if ($bareStr) $newVal = Ext.String.trim($newVal); // NB: CHANGED (string trim).
    $result[$newKey] = $newVal;
    $state = 0;
  }
  return $result;
}

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.loadDataRequestSelector = function(dataRequestSelector) { 
  var oldRequest = dataRequestSelector.getValue();

  if (dataRequestSelector.wsdlStruct && dataRequestSelector.wsdlStruct.operations) {
    var operations = dataRequestSelector.wsdlStruct.operations;
  } else {
    var operations = [];
  }
  var win = dataRequestSelector.up('window');

  var treeIn = win.down('#requestInputDoc');   
  var treeOut = win.down('#requestOutputDoc');
  treeIn.setRootNode({text: '{empty}', leaf: true});
  treeOut.setRootNode({text: '{empty}', leaf: true}); 

  dataRequestSelector.setValue('');

  var requestsArray = []; 
  for (nn = 0; nn < operations.length; nn++) {
    requestsArray.push({'id': (nn + 1), 'text': operations[nn].name});
  }

  var newStore = Ext.create('Ext.data.Store', {
    fields: [{'name': 'id'}, {'name': 'text'}],
    data : requestsArray
  });

  dataRequestSelector.bindStore(newStore);

  if (oldRequest) {
    var newIndex = dataRequestSelector.getStore().find('text', oldRequest);
    if (newIndex > -1) {
      dataRequestSelector.select(dataRequestSelector.getStore().data.items[newIndex]);
      LDF.logic.fn.setDataRequestDocuments(dataRequestSelector, newIndex, treeIn, treeOut);
    }
  }
};


//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.setDataRequestDocuments = function(dataRequestSelector, operationIndex, treeIn, treeOut) { 
  var operation = dataRequestSelector.wsdlStruct.operations[operationIndex];
  switch (operation.pattern) {
    case 'http://www.w3.org/ns/wsdl/in-out':
      LDF.logic.fn.setTreeForSchema(dataRequestSelector.wsdlStruct.operations[operationIndex].input.struct, treeIn);
      LDF.logic.fn.setTreeForSchema(dataRequestSelector.wsdlStruct.operations[operationIndex].output.struct, treeOut);
      break;
  }
}

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.setTreeForSchema = function(struct, docView) {
      docView.setRootNode({
        text: 'Root',
        expanded: true,
        children: LDF.logic.fn.createSubTreeForSchema(struct)
      });
}

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.createSubTreeForSchema = function(struct) {
  var children = [];
  if ($.isArray(struct)) {
    //------------------------------------------------\     NB! THIS PART WOULD ONLY OCCURE IF A DOUBLE (TRIPLE, ETC.) NUMERIC ARRAY WOULD OCCURE IN THE STRUCT, BUT THIS IS NOT POSSIBLE IF THE STRUCT IS CREATED FROM AN XML SCHEMA DEFINITION. NEVERTHELESS I LEAVE IT IN HERE FOR USE IN CASE OTHER TYPES OF SCHEMAS WILL BE SUPPORTED.
    if (struct.length > 0) {
      for (nn = 0; nn < struct.length; nn++) {
        if (struct[nn] != null && typeof struct[nn] == 'object') {
          children.push({text: '[&nbsp;&nbsp;]', expanded: true, children: LDF.logic.fn.createSubTreeForSchema(struct[nn])});
        } else {
          children.push({text: '[&nbsp;&nbsp;]', leaf: true});
        }
      }
    } else {
      children.push({text: '[&nbsp;&nbsp;]', leaf: true});
    }
    //------------------------------------------------/
  } else {
    for (prop in struct) {
      if (struct.hasOwnProperty(prop)) {
        if (struct[prop] != null && typeof struct[prop] == 'object') {
          if ($.isArray(struct[prop])) {
            if (struct[prop].length > 0 && typeof struct[prop][0] == 'object') {
              children.push({text: prop + ' &nbsp;[&nbsp;&nbsp;]', expanded: true, children: LDF.logic.fn.createSubTreeForSchema(struct[prop][0])});
            } else {
              children.push({text: prop + ' &nbsp;[&nbsp;&nbsp;]', leaf: true});
            }
          } else {
            children.push({text: prop, expanded: true, children: LDF.logic.fn.createSubTreeForSchema(struct[prop])});
          }
        } else {
          children.push({text: prop, leaf: true});
        }
      }
    }
  }
  return children;
}

//------------------------------------------------------------------------------------------------------------------------------------

LDF.logic.fn.executeTestRequest = function (reqObj) {
  var testquerytabs = Ext.ComponentManager.get('querytesttabs');




  var newReqResultPanel = Ext.createWidget({
                                                xtype: 'textareafield',
                                                itemId: 'TestRequestResult',
                                                layout: 'fit',
                                                fieldStyle: 'font-family: courier !important;'       //  Setting fieldClass messes up other behaviour such as default height and disabled color.
  });



  var newTab = testquerytabs.add({title: reqObj.name, closable: true, items: [
    newReqResultPanel
  ]});

  testquerytabs.show();
  testquerytabs.setActiveTab(newTab);

  newTab.setLoading({
      msg: 'Loading...',
      useTargetEl: false
  });



  reqObj.testDoc = $.trim(reqObj.testDoc);
  switch (reqObj.testDoc.substr(0, 1)) {
    case '{':  // json object
      doctype = 2;
    default: // xml
      doctype = 1;
  }


  LDF.logic.fn.doAjaxRequest('int/ldf_processrequest.php?force_request_settings=true&force_endpoint=' + encodeURIComponent(reqObj.endpointName) + '&force_data_input_mode=5&force_document_input_type=' + doctype +'&force_human_print=true&callback=jsoncallbackid', reqObj.testDoc, 'POST', 'text', function(text, textStatus, jqXHR) {
       newReqResultPanel.setValue(text);
       newTab.setLoading(false);
  }, 'application/json');
  


}


//------------------------------------------------------------------------------------------------------------------------------------



