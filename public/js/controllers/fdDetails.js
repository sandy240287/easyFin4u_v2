angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('fdController', ['$rootScope','$scope','$http','$location',
		function($rootScope, $scope, $http,$location) {

      var userEmail = $scope.user;
			var firstLogin = $scope.user.local.firstLogin;
      console.log(userEmail);
      if(!userEmail)
        $location.url('/login');
			else{
				      angular.element(document).ready(function () {

								$(window).on("resize", function () {
	               var $grid = $("#list2"),
	                   newWidth = $grid.closest(".ui-jqgrid").parent().width();
	               $grid.jqGrid("setGridWidth", newWidth, true);
	               });

				        //console.log("Inside Document Ready");
				        $("#list2").jqGrid({
				           	url:'/api/deposits',
				            mtype: "GET",
				        	  datatype: "json",
				           	colNames:['Bank','Deposit Number', 'Amount', 'Creation Date','Maturity Date','Deposit Type','Maturity Amount'],
				           	colModel:[
				           		{name:'bank', width:150, align:"left", editable: true,editrules:{
				                                    required: true
				                                }},
				           		{name:'number', width:150, align:"left", key:true, editable: true,editrules:{
				                                    required: true
				                                }},
				           		{name:'amount', width:150, align:"right", editable: true,editrules:{
				                                    number: true,
				                                    required: true
				                                }},
				           		{name:'createDate', width:150, align:"right", formatter: "date", formatoptions: { newformat: "d/m/Y" },
				                                    editable: true,editoptions:{
				                                    dataInit:function(el) {
				                                      setTimeout(function() { $(el).datepicker(); }, 200);
				                                    },
				                                    required: true
				                                }},
				           		{name:'maturityDate', width:150, align:"right", formatter: "date", formatoptions: { newformat: "d/m/Y" }
				                                    ,editable: true,editoptions:{
				                                    dataInit:function(el) {
				                                      setTimeout(function() { $(el).datepicker(); }, 200);
				                                    },
				                                    required: true
				                                }},
				           		{name:'type', width:80,align:"left", editable: true,editrules:{
				                                    required: true
				                                }},
				           		{name:'maturityAmount', width:150, align:"right",  sortable:false, editable: true,editrules:{
				                                    number: true,
				                                    required: true
				                                }}
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
				            editurl: "/api/deposits",
				            rownumbers : true
				        });

				        $("#list2").navGrid("#pager2",
				                        { edit: true, add: true, del: true, search: false, refresh: true, view: false, align: "left" },
																{ // edit option
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

														var intro = introJs();
														intro.setOptions({
														            steps: [
														              {
														                intro: "Welcome to Easy Finance Manager - Your tool to personalized portfolio" +
																										" and deposit management. You can see the real time market stats of your "+
																										"investment."
														              },
														              {
														                element: document.querySelector('#portfolioTab'),
														                intro: "Click here after login for Portfolio Management"
														              },
														              {
														                element: document.querySelector('#depositTab'),
														                intro: "Click here after login for Deposit Management"
														              },
														              {
														                element: document.querySelector('#depositTable'),
														                intro: "Enter the Deposit Details using the '+' button on the bottom left of the table. Edit the details by selecting the row and selecting the Pencil button on the bottom bar.",
														                position: 'center'
														              }
														            ],
																				showStepNumbers:false
														          });
														if(firstLogin === "true"){
															intro.start();
															$scope.user.local.firstLogin = "false";
														}
														intro.oncomplete(function() {
														  $('.introjs-overlay').hide();
														});

														var $grid = $("#list2"),
	                          newWidth = $grid.closest(".ui-jqgrid").parent().width();
	                          $grid.jqGrid("setGridWidth", newWidth, true);
				     });
					 }

					 $rootScope.logout = function(){
						 	$rootScope.user = undefined;
				      $rootScope.message = 'Logged out.';
				      $http.get('/logout');
				    };
	}]);
