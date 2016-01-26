angular.module('easyFin4uApp')
.config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all charts
    ChartJsProvider.setOptions({
      colours: ['#FF5252', '#FF8A80'],
      responsive: false
    });
    // Configure all line charts
    ChartJsProvider.setOptions('Line', {
      datasetFill: false
    });
  }])
	.controller('portfolioController', ['$rootScope','$scope','$http','$location','$timeout',
		function($rootScope, $scope, $http,$location,$timeout) {

      var userEmail = $scope.user;
      console.log(userEmail);
      if(!userEmail)
        $location.url('/login');
			else{
				      angular.element(document).ready(function () {
				        console.log("Inside Document Ready");
				        $("#list2").jqGrid({
				           	url:'/api/portfolio',
				            mtype: "GET",
				        	  datatype: "json",
				           	colNames:['Symbol','Name', 'Last Price', 'Change %','Shares','Cost Per Share','Cost Basis','Mkt Value','Gain','Gain %', 'Overall Return'],
				           	colModel:[
				           		{name:'symbol', width:80, align:"left", editable: true,editrules:{
				                                    required: true
				                                }},
				           		{name:'name', width:250, align:"left", key:true, editable: true,editrules:{
				                                    required: true
				                                }},
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
				           		{name:'overall_return', width:100, align:"right"}
				           	],
				           	rowNum:20,
				           	rowList:[5,10,20,30],
				           	pager: '#pager2',
				           	sortname: 'number',
				            viewrecords: true,
				            sortorder: "desc",
				            caption:"Deposit List",
				            width:'100%',
										height: '100%',
				            editurl: "/api/portfolio",
				            rownumbers : true
				        });

				        $("#list2").navGrid("#pager2",
				                        { edit: true, add: true, del: true, search: false, refresh: true, view: false, align: "left" },
				                        { closeAfterEdit: true , closeAfterAdd: true }
				                    );
				     });

						 	$scope.linelabels = ["January", "February", "March", "April", "May", "June", "July"];
						 	$scope.lineseries = ['Series A', 'Series B'];
						 	$scope.linedata = [
						 		[65, 59, 80, 81, 56, 55, 40],
						 		[28, 48, 40, 19, 86, 27, 90]
						 	];
						 	$scope.onClick = function (points, evt) {
						 		console.log(points, evt);
						 	};

						 	// Simulate async data update
						 	$timeout(function () {
						 		$scope.data = [
						 			[28, 48, 40, 19, 86, 27, 90],
						 			[65, 59, 80, 81, 56, 55, 40]
						 		];
						 	}, 3000);

							$scope.pielabels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
  						$scope.piedata = [300, 500, 100];

					 }

					 $rootScope.logout = function(){
						 	$rootScope.user = undefined;
				      $rootScope.message = 'Logged out.';
				      $http.get('/logout');
				    };
	}]);
