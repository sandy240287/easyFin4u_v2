angular.module('easyFin4uApp')
.config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all charts
    ChartJsProvider.setOptions({
      colours: ['#FF5252', '#FF8A80'],
      responsive: true
    });
    // Configure all line charts
    ChartJsProvider.setOptions('Line', {
      datasetFill: false
    });
  }])
	.controller('portfolioController', ['$rootScope','$scope','$http','$location','$timeout',
		function($rootScope, $scope, $http,$location,$timeout) {

      var userEmail = $scope.user;
      //console.log(userEmail);
      if(!userEmail)
        $location.url('/login');
			else{

				      angular.element(document).ready(function () {

  			        $("#list2").jqGrid({
				           	url:'/api/userPortfolio',
				            mtype: "GET",
				        	  datatype: "json",
				           	colNames:['Symbol','Name', 'Last Price', 'Change %','Shares','Cost Per Share','Cost Basis','Mkt Value','Gain','Gain %'],
				           	colModel:[
                    {name:'symbol', width:80, align:"left", key:true ,editable: true,editrules:{required: true},
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
				           		{name:'gain_percent', width:80, align:"right"}
				           	],
				           	rowNum:20,
				           	rowList:[5,10,20,30],
				           	pager: '#pager2',
				            viewrecords: true,
				            sortorder: "desc",
				            caption:"Deposit List",
				            width:'100%',
										height: '100%',
				            editurl: "/api/userPortfolio",
				            rownumbers : true
				        });

				        $("#list2").navGrid("#pager2",
				                        { edit: true, add: true, del: true, search: false, refresh: true, view: false, align: "left" },
                                { // edit option
                                    //afterSubmit : renderDistributionGraph,
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
                                  //afterSubmit : renderDistributionGraph,
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
                      				  { closeAfterEdit: true , closeAfterAdd: true }
                      				    );
				     });

						 	//$scope.onClick = function (points, evt) {
						 	//	console.log(points, evt);
						 	//};

						 	// Simulate async data update
						 	//$timeout(function () {
						 	//	$scope.data = [
						 	//		[28, 48, 40, 19, 86, 27, 90],
						 	//		[65, 59, 80, 81, 56, 55, 40]
						 	//	];
						 	//}, 3000);

              var performanceChartUrl = "/api/getDailyPerformanceData?period="+6;
              $http.get(performanceChartUrl).then(function(response) {
                //console.log(response);
                $scope.linelabels = response.data.label;
                $scope.linedata = response.data.data;
                $scope.lineseries = response.data.series;

              });
              //Currently being used for 2 weeks(14 days) and 1 month(30 days)
              $scope.daysData = function(period) {
                if(period === undefined)
                  period = 14; //Default is 14 days
                var performanceChartUrl = "/api/getDailyPerformanceData?period="+period;
                $http.get(performanceChartUrl).then(function(response) {
                  //console.log(response);
                  $scope.linelabels = response.data.label;
                  $scope.linedata = response.data.data;
                  $scope.lineseries = response.data.series;

                });
              }
              //Currently being used for 2 months(8 weeks), 3 months(12 weeks) and 6 months(24 weeks)
              $scope.weeksData = function(period) {
                if(period === undefined)
                  period = 4;  // Default is 4 weeks
                var performanceChartUrl = "/api/getWeeklyPerformanceData?period="+period;
                $http.get(performanceChartUrl).then(function(response) {
                  //console.log(response);
                  $scope.linelabels = response.data.label;
                  $scope.linedata = response.data.data;
                  $scope.lineseries = response.data.series;

                });
              }

              $scope.monthsData = function(period) {
                if(period === undefined)
                  period = 12;  //Default is 12 months
                var performanceChartUrl = "/api/getMonthlyPerformanceData?period="+period;
                $http.get(performanceChartUrl).then(function(response) {
                  //console.log(response);
                  $scope.linelabels = response.data.label;
                  $scope.linedata = response.data.data;
                  $scope.lineseries = response.data.series;

                });
              }



              $scope.all = function() {
                var performanceChartUrl = "/api/getPerformanceData?period="+5;
                $http.get(performanceChartUrl).then(function(response) {
                  //console.log(response);
                  $scope.linelabels = response.data.label;
                  $scope.linedata = response.data.data;
                  $scope.lineseries = response.data.series;

                });
              }

              $scope.pieOptions = {
                animationEasing : "easeOutBounce",
                tooltipTemplate: "<%if (label){%><%=label %> : <%}%><%= value + ' %' %>",
                responsive: true,
                tooltipFontSize: 10
              };

              function renderDistributionGraph(){
                $http.get("/api/getDistributionData").then(function(response) {
                  //console.log(response);
                  $scope.pielabels = response.data.label;
                  $scope.piedata = response.data.data;
                });
              }
              // TODO - Dynamic Refresh of Distriution of addition in JQGrid
              renderDistributionGraph();

					 }


					 $rootScope.logout = function(){
						 	$rootScope.user = undefined;
				      $rootScope.message = 'Logged out.';
				      $http.get('/logout');
				    };
	}]);
