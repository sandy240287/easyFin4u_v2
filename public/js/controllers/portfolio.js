angular.module('easyFin4uApp')
.config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all charts
    ChartJsProvider.setOptions({
      //colours: ['Blue', 'Red', 'Green', 'Yellow','Grey', 'Dark Grey'],
      responsive: true
    });
    // Configure all line charts
    ChartJsProvider.setOptions('Line', {
      datasetFill: false,
        //Boolean - Whether to show a dot for each point
      pointDot : true,
      //Number - Radius of each point dot in pixels
      pointDotRadius : 3,
      //Number - Pixel width of point dot stroke
      pointDotStrokeWidth : 1,
      //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
      pointHitDetectionRadius : 3,
      scaleFontSize: 8,
      scaleStartValue: 0,
      scaleBeginAtZero: true
    });
  }])
	.controller('portfolioController', ['$rootScope','$scope','$http','$location','$timeout','$q',
		function($rootScope, $scope, $http,$location,$timeout,$q) {
      var userEmail = $scope.user;
      var pielabels1 ="";
      var piedata1 = "";
      //console.log(userEmail);

      if($rootScope.user){
        if(($rootScope.user.local.userVerifyToken !== "") && ($rootScope.user.local.userVerifyToken !== undefined)){
          $location.url('/login');
        }
      }

      if(!$rootScope.tncStatus){
					$location.url('/terms');
			}else{
				if($rootScope.tncStatus === false){
					$location.url('/terms');
				}
			}

      if(!userEmail)
        $location.url('/login');
			else{

             $(window).on("resize", function () {
              var $grid = $("#list2"),
                  newWidth = $grid.closest(".ui-jqgrid").parent().width();
              $grid.jqGrid("setGridWidth", newWidth, true);
              });

				      angular.element(document).ready(function () {

  			        $("#list2").jqGrid({
				           	url:'/api/userPortfolio',
				            mtype: "GET",
				        	  datatype: "json",
				           	colNames:['objectId','Symbol','Name', 'Last Price', 'Change %','Shares','Cost Per Share','Cost Basis','Mkt Value',
                              'Gain','Gain %','alert_active_status','lower_limit','upper_limit'],
				           	colModel:[
                    { name:'objectId', key: true, hidden: true },
                    { name:'symbol', width:80, align:"left",editable: true,editrules:{required: true},
                          editoptions: {
                                          "dataInit": function(el) {
                                            setTimeout(function() {
                                              if (jQuery.ui) {
                                                if (jQuery.ui.autocomplete) {
                                                  jQuery(el).autocomplete({
                                                    "appendTo": "body",
                                                    "disabled": false,
                                                    "delay": 300,
                                                    "minLength": 1,
                                                    "source": function(request, response) {
                                                      request.acelem = 'symbolSearch';
                                                      request.oper = 'autocmpl';
                                                      $.ajax({
                                                        url: "/api/symbolSearch",
                                                        dataType: "json",
                                                        data: request,
                                                        type: "GET",
                                                        error: function(res, status) {
                                                          alert(res.status + " : " + res.statusText + ". Status: " + status);
                                                        },
                                                        success: function(data) {
                                                          response(data);
                                                        }
                                                      });
                                                    },
                                                    select: function( event, ui ) {
                                                      $( "#symbol" ).val( ui.item.value );
                                                      $( "#name" ).val( ui.item.label );
                                                      return false;
                                                    }
                                                  });
                                                  jQuery(el).autocomplete('widget').css('font-size', '11px');
                                                  jQuery(el).autocomplete('widget').css('z-index', '1000');
                                                }
                                              }
                                            }, 200);
                                          }
                                        }
                      },
				           		{name:'name', width:350, align:"left", editable: true},
				           		{name:'lastprice', width:80, align:"right"},
				           		{name:'chg_percent', width:80, align:"right"},
				           		{name:'shares_qty', width:50, align:"right",editable: true,editrules:{
				                                    number: true,
				                                    required: true
				                                }},
											{name:'cost_per_share', width:80, align:"right",editable: true,editrules:{
				                                    number: true,
				                                    required: true
				                                }},
				           		{name:'cost_basis', width:100,align:"right"},
				           		{name:'mkt_value', width:100, align:"right"},
				           		{name:'gain', width:80, align:"right"},
				           		{name:'gain_percent', width:80, align:"right"},
                      {name:'alert_active_status', hidden: true },
                      {name:'lower_limit', hidden: true },
                      {name:'upper_limit', hidden: true }
				           	],
				           	rowNum:20,
				           	rowList:[5,10,20,30],
				           	pager: '#pager2',
				            viewrecords: true,
				            sortorder: "desc",
				            caption:"Portfolio List",
				            width:'100%',
										height: '100%',
				            editurl: "/api/userPortfolio",
				            rownumbers : true,
                    loadComplete: function() {
                          var rowIds = $("#list2").jqGrid('getDataIDs');
                          for(row in rowIds){
                            if($("#list2").jqGrid('getCell', rowIds[row], 'gain_percent') < 0){
                              $("#list2").jqGrid('setCell',rowIds[row],"gain_percent","",{color:'red'});
                              $("#list2").jqGrid('setCell',rowIds[row],"gain","",{color:'red'});
                            }else{
                              $("#list2").jqGrid('setCell',rowIds[row],"gain_percent","",{color:'green'});
                              $("#list2").jqGrid('setCell',rowIds[row],"gain","",{color:'green'});
                            }
                            if($("#list2").jqGrid('getCell', rowIds[row], 'chg_percent') < 0){
                              $("#list2").jqGrid('setCell',rowIds[row],"chg_percent","",{color:'red'});
                            }
                            else {
                              $("#list2").jqGrid('setCell',rowIds[row],"chg_percent","",{color:'green'});
                            }
                          }
                      }
				        });

				        $("#list2").navGrid("#pager2",
				                        { edit: true, add: true, del: true, search: false, refresh: true,
                                   view: false, align: "left"},
                                { // edit option
                                  closeAfterEdit: true ,
                                  reloadAfterSubmit:true,
                                  afterComplete: function (result) {
                                                    success: {
                                                      //alert(result.responseText);
                                                      renderDistributionGraph($piechart);
                                                      renderDistributionGraphCurrent($pieChartC);

                                                    }
                                                    fail: {
                                                      //console.log("EDIT"+result.responseText);
                                                  }
                                                },
                                    beforeShowForm: function(form) {
                                      $('#name', form).attr("disabled","true");  //To Disable Edit Box
                                      /* To Centralize Edit Modal */
                                      var dlgDiv = $("#editmod" + "list2");
                                      var parentDiv = dlgDiv.parent(); // div#gbox_list
                                      var dlgWidth = dlgDiv.width();
                                      var parentWidth = parentDiv.width();
                                      var dlgHeight = dlgDiv.height();
                                      var parentHeight = parentDiv.height();
                                      // TODO: change parentWidth and parentHeight in case of the grid
                                      //       is larger as the browser window
                                      //dlgDiv[0].style.top = Math.round((parentHeight-dlgHeight)/2) + "px";
                                      dlgDiv[0].style.left = Math.round((parentWidth-dlgWidth)/2) + "px";
                                      /* To Centralize Edit Modal */
                                    }
                                },
                                { // add option
                                  closeAfterAdd: true ,
                                  reloadAfterSubmit:true,
                                  afterComplete: function (result) {
                                                    success: {
                                                      //alert(result.responseText);
                                                      renderDistributionGraph($piechart);
                                                      renderPerformanceGraph($linechart);
                                                      renderDistributionGraphCurrent($pieChartC);
                                                    }
                                                    fail: {
                                                      //console.log("ADD"+result.responseText);
                                                    }
                                                },
                                  beforeShowForm: function(form) {
                                    $('#name', form).attr("disabled","true");  //To Disable Edit Box
                                    /* To Centralize Edit Modal */
                                    var dlgDiv = $("#editmod" + "list2");
                                    var parentDiv = dlgDiv.parent(); // div#gbox_list
                                    var dlgWidth = dlgDiv.width();
                                    var parentWidth = parentDiv.width();
                                    var dlgHeight = dlgDiv.height();
                                    var parentHeight = parentDiv.height();
                                    // TODO: change parentWidth and parentHeight in case of the grid
                                    //       is larger as the browser window
                                    //dlgDiv[0].style.top = Math.round((parentHeight-dlgHeight)/2) + "px";
                                    dlgDiv[0].style.left = Math.round((parentWidth-dlgWidth)/2) + "px";
                                    /* To Centralize Edit Modal */
                                  }
                                },{
                                  reloadAfterSubmit:true,
                                  afterComplete: function (result) {
                                                    success: {
                                                      //alert("DEL"+result.responseText);
                                                      renderDistributionGraph($piechart);
                                                      renderPerformanceGraph($linechart);
                                                      renderDistributionGraphCurrent($pieChartC);
                                                    }
                                                    fail: {
                                                      //console.log(result.responseText);
                                                    }
                                                }
                                }
                                );

                                $('#list2').navButtonAdd('#pager2',
                                {
                                    buttonicon: "ui-icon-mail-closed",
                                    title: "Manage Alerts",
                                    caption: "Manage Alerts",
                                    position: "last",
                                    onClickButton: openAlertsModal
                                });

                                function openAlertsModal(){

                                  var myGrid = $('#list2'),
                                      selRowId = myGrid.jqGrid ('getGridParam', 'selrow'),
                                      selectedSymbol = myGrid.jqGrid ('getCell', selRowId, 'symbol'),
                                      selectedCurrentPrice = myGrid.jqGrid ('getCell', selRowId, 'lastprice'),
                                      selectedObjectId = myGrid.jqGrid ('getCell', selRowId, 'objectId'),
                                      selectedLowerLimit = myGrid.jqGrid ('getCell', selRowId, 'lower_limit'),
                                      selectedUpperLimit = myGrid.jqGrid ('getCell', selRowId, 'upper_limit'),
                                      selectedAlertActiveStatus = myGrid.jqGrid ('getCell', selRowId, 'alert_active_status');

                                  if(selectedSymbol === undefined)
                                  {
                                    alert("Please select a row first");
                                  }else{
                                    $("#manage_alert_content").dialog({
                                        height:300,
                                        width :400,
                                        modal:true,
                                        buttons:{
                                            'Cancel': function(){
                                                $(this).dialog('close');
                                            },
                                            'Confirm': function(){
                                                //alert("Confirm");
                                                $.ajax({
                                                    type: "POST",
                                                    url:  "/api/userPortfolioManageAlert",
                                                    data: {
                                                        objectId : $('#alert_objectId').val(),
                                                        alert_active_status: $('input:radio[name=alert_active_status]:checked').val(),
                                                        lower_limit: $('#alert_lower_limit').val(),
                                                        upper_limit : $('#alert_upper_limit').val()
                                                    },
                                                    dataType: "json",
                                                    success: function(msg){
                                                        $("#manage_alert_content").dialog('close');
                                                        alert("Successfully Updated your preferences.");
                                                    },
                                                    error: function(res, status, exeption) {
                                                        $("#manage_alert_content").dialog('close');
                                                        alert("Error while updating your preferences. Please retry");
                                                    }
                                                });
                                            }
                                        }
                                    });
                                    $('#ui-id-1').text("Manage Alerts");
                                  }
                                  $('#alert_symbol').val(selectedSymbol);
                                  $('#alert_current_price').val(selectedCurrentPrice);
                                  $('#alert_objectId').val(selectedObjectId);
                                  $('#alert_lower_limit').val(selectedLowerLimit);
                                  $('#alert_upper_limit').val(selectedUpperLimit);
                                  if(selectedAlertActiveStatus === "true"){
                                    $('#alert_active_status_true').attr('checked', true);
                                  }
                                  else {
                                      $('#alert_active_status_false').attr('checked', true);
                                  }

                                }

                          var $grid = $("#list2"),
                          newWidth = $grid.closest(".ui-jqgrid").parent().width();
                          $grid.jqGrid("setGridWidth", newWidth, true);
				     });

             var $piechart,$linechart,$pieChartC;
             $scope.$on("create", function (event, chart) {
               if (typeof chart !== "undefined") {
                 chart.clear();
                 if(chart.chart.canvas.id === 'pie'){
                   //alert(chart.id);
                   $piechart = chart;
                 }else if(chart.chart.canvas.id === 'pieC'){
                   $piechartC = chart;
                 }
                 else{
                   $linechart = chart;
                 }
               }
             });

              $scope.spinnerLoaded = true;
              $scope.noDataToDisplay = false;
              $scope.noDataToDisplayPie = false;
              $scope.dataLoaded = true;

              renderPerformanceGraph($linechart);

              function renderPerformanceGraph($linechart){
                var performanceChartUrl = "/api/getDailyPerformanceData?period="+14;
                $scope.spinnerLoaded = true;
                $scope.noDataToDisplay = false;
                $http.get(performanceChartUrl).then(function(response) {
                    if(response.data.length === 0){
                      console.log("No Data to Display on Chart");
                      $scope.noDataToDisplay = true;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = undefined;
                      $rootScope.linedata = undefined;
                      $rootScope.lineseries = undefined;

                      if($linechart !== undefined){
                        $linechart.destroy();
                        document.getElementsByClassName("line-legend")[0].style.visibility='hidden';
                      }
                    }else{
                      //console.log("Render"+JSON.stringify(response));
                      $scope.noDataToDisplay = false;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = response.data.label;
                      $rootScope.linedata = response.data.data;
                      $rootScope.lineseries = response.data.series;

                      if($linechart !== undefined)
                        $linechart.update();

                  }

                });
              }

              //Currently being used for 2 weeks(14 days) and 1 month(30 days)
              $scope.daysData = function(period) {
                $scope.spinnerLoaded = true;
                $scope.noDataToDisplay = false;
                if(period === undefined)
                  period = 14; //Default is 14 days
                var performanceChartUrl = "/api/getDailyPerformanceData?period="+period;
                $http.get(performanceChartUrl).then(function(response) {
                    if(response.data.length === 0){
                      console.log("No Data to Display on Chart");
                      $scope.noDataToDisplay = true;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = undefined;
                      $rootScope.linedata = undefined;
                      $rootScope.lineseries = undefined;

                      if($linechart !== undefined){
                        $linechart.destroy();
                        document.getElementsByClassName("line-legend")[0].style.visibility='hidden';
                      }
                    }else{
                      //console.log("Render"+JSON.stringify(response));
                      $scope.noDataToDisplay = false;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = response.data.label;
                      $rootScope.linedata = response.data.data;
                      $rootScope.lineseries = response.data.series;

                      if($linechart !== undefined)
                        $linechart.update();

                  }
                });

              }


              //Currently being used for 2 months(8 weeks), 3 months(12 weeks) and 6 months(24 weeks)
              $scope.weeksData = function(period) {
                $scope.spinnerLoaded = true;
                $scope.noDataToDisplay = false;

                if(period === undefined)
                  period = 4;  // Default is 4 weeks
                var performanceChartUrl = "/api/getWeeklyPerformanceData?period="+period;
                $http.get(performanceChartUrl).then(function(response) {
                    if(response.data.length === 0){
                      console.log("No Data to Display on Chart");
                      $scope.noDataToDisplay = true;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = undefined;
                      $rootScope.linedata = undefined;
                      $rootScope.lineseries = undefined;

                      if($linechart !== undefined){
                        $linechart.destroy();
                        document.getElementsByClassName("line-legend")[0].style.visibility='hidden';
                      }
                    }else{
                      //console.log("Render"+JSON.stringify(response));
                      $scope.noDataToDisplay = false;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = response.data.label;
                      $rootScope.lineseries = response.data.series;
                      $rootScope.linedata = response.data.data;
                      if($linechart !== undefined)
                        $linechart.update();

                  }
                });
              }

              $scope.monthsData = function(period) {
                $scope.spinnerLoaded = true;
                $scope.noDataToDisplay = false;

                if(period === undefined)
                  period = 12;  //Default is 12 months
                var performanceChartUrl = "/api/getMonthlyPerformanceData?period="+period;
                $http.get(performanceChartUrl).then(function(response) {
                    if(response.data.length === 0){
                      console.log("No Data to Display on Chart");
                      $scope.noDataToDisplay = true;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = undefined;
                      $rootScope.linedata = undefined;
                      $rootScope.lineseries = undefined;

                      if($linechart !== undefined){
                        $linechart.destroy();
                        document.getElementsByClassName("line-legend")[0].style.visibility='hidden';
                      }
                    }else{
                      //console.log("Render"+JSON.stringify(response));
                      $scope.noDataToDisplay = false;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = response.data.label;
                      $rootScope.linedata = response.data.data;
                      $rootScope.lineseries = response.data.series;

                      if($linechart !== undefined)
                        $linechart.update();

                  }
                });
              }

              $scope.all = function() {
                $scope.spinnerLoaded = true;
                $scope.noDataToDisplay = false;

                var performanceChartUrl = "/api/getPerformanceData?period="+5;
                $http.get(performanceChartUrl).then(function(response) {
                    if(response.data.length === 0){
                      console.log("No Data to Display on Chart");
                      $scope.noDataToDisplay = true;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = undefined;
                      $rootScope.linedata = undefined;
                      $rootScope.lineseries = undefined;

                      if($linechart !== undefined){
                        $linechart.destroy();
                        document.getElementsByClassName("line-legend")[0].style.visibility='hidden';
                      }
                    }else{
                      //console.log("Render"+JSON.stringify(response));
                      $scope.noDataToDisplay = false;
                      $scope.spinnerLoaded = false;
                      $rootScope.linelabels = response.data.label;
                      $rootScope.linedata = response.data.data;
                      $rootScope.lineseries = response.data.series;

                      if($linechart !== undefined)
                        $linechart.update();

                  }
                });
              }

              renderDistributionGraph($piechart);

              $scope.pieOptions = {
                animationEasing : "easeOutBounce",
                tooltipTemplate: "<%if (label){%><%=label %> : <%}%><%= value + ' %' %>",
                responsive: true,
                tooltipFontSize: 10
              };

              function renderDistributionGraph($piechart){
                $http.get("/api/getOriginalDistributionData").then(function(response) {
                  if(response.data.label.length === 0){
                    $scope.noDataToDisplayPie = true;
                    $rootScope.pielabels = [];
                    $rootScope.piedata = [];
                    if($piechart !== undefined){
                      $piechart.destroy();
                      document.getElementsByClassName("pie-legend")[0].style.visibility='hidden';
                    }
                  }else{
                    $scope.noDataToDisplayPie = false;
                    $rootScope.pielabels = response.data.label;
                    $rootScope.piedata = response.data.data;
                  }

                });
              }

              renderDistributionGraphCurrent($pieChartC);

              function renderDistributionGraphCurrent($pieChartC){
                $http.get("/api/getCurrentDistributionData").then(function(response) {
                  if(response.data.label.length === 0){
                    $scope.noDataToDisplayPie = true;
                    $rootScope.pielabelsC = [];
                    $rootScope.piedataC = [];
                    if($piechartC !== undefined){
                      $piechartC.destroy();
                      document.getElementsByClassName("pie-legendC")[0].style.visibility='hidden';
                    }
                  }else{
                    $scope.noDataToDisplayPie = false;
                    $rootScope.pielabelsC = response.data.label;
                    $rootScope.piedataC = response.data.data;
                  }

                });
              }

          /* Added to Fix the Flicker Bug of Angular Charts */
              // var $chart;
              //   $scope.$on("create", function (event, chart) {
              //     if (typeof $chart !== "undefined") {
              //       $chart.destroy();
              //     }
              //
              //     $chart = chart;
              //   });
              /* Added to Fix the Flicker Bug of Angular Charts */
					 }

					 $rootScope.logout = function(){
              //$scope = undefined;
              //$rootScope = undefined;
						 	$rootScope.user = undefined;
				      $rootScope.message = 'Logged out.';
				      $http.get('/logout');
				    };

            window.onbeforeunload = function() {
              return "You will be logged out on refresh and would need to re-login."
            }
	}]);
