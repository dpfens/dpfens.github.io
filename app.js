(function() {
	"use strict";
	var app = angular.module("app",['ad_controllers']),
	
	// ad_controllers for "AidData Controllers"
	ad_controllers = angular.module('ad_controllers', []);
	
	// Modified File Reader Module
	(function (module) {
	    
	    var fileReader = function ($q) {
	    	
	        var onLoad = function(reader, deferred, scope) {
	            return function () {
	                scope.$apply(function () {
	                    deferred.resolve(reader.result);
	                });
	            };
	        };
	 
	        var onError = function (reader, deferred, scope) {
	            return function () {
	                scope.$apply(function () {
	                    deferred.reject(reader.result);
	                });
	            };
	        };
	 
	        var onProgress = function(reader, scope) {
	            return function (event) {
	                scope.$broadcast("fileProgress",
	                    {
	                        total: event.total,
	                        loaded: event.loaded
	                    });
	            };
	        };
	 
	        var getReader = function(deferred, scope) {
	            var reader = new FileReader();
	            reader.onload = onLoad(reader, deferred, scope);
	            reader.onerror = onError(reader, deferred, scope);
	            reader.onprogress = onProgress(reader, scope);
	            return reader;
	        };
	        
	        // read file content as binary data (images, etc)
	        var readAsDataURL = function (file, scope) {
	            var deferred = $q.defer();
	             
	            var reader = getReader(deferred, scope);         
	            reader.readAsDataURL(file);
	             
	            return deferred.promise;
	        };
	        
	        // read file content as text
	        var readAsText = function (file, scope) {
	            var deferred = $q.defer();
	             
	            var reader = getReader(deferred, scope);         
	            reader.readAsText(file);
	             
	            return deferred.promise;
	        };
	 
	        return {
	            readAsDataUrl: readAsDataURL,
	            readAsText: readAsText,
	        };
	    };
	 
	    module.factory("fileReader",
	                   ["$q", "$log", fileReader]);
	 
	}(angular.module("ad_controllers")));
	
	// when element changes, get uploaded file and set as $scope variable
	app.directive("fileSelect",function(){
		return {
			link: function($scope,el){
				el.bind("change", function(e){
					$scope.file = (e.srcElement || e.target).files[0];
					$scope.getFile();
				});
		      
		    }
		};
	});
	
	ad_controllers.controller('ADMainCtrl', ['$scope', '$http', 'fileReader', function($scope, $http, fileReader) {
		
		// Set initial header for page
		$scope.header = "AidData CSV Reader";
		// initially show input section
		$scope.addFile = true;
		
		// Create array of objects based of delimiter character from str
		function csvToList(delimiter, str) {
			var all_text_lines = str.split(/\r\n|\n/g),
		    headers = all_text_lines[0].split(delimiter),
		    lines = [],
		    data, obj;

		    for (var i=1; i<all_text_lines.length; i++) {
		        data = all_text_lines[i].split(delimiter);
		        obj = {};
		        if (data.length == headers.length) {
		            for (var j=0; j<headers.length; j++) {
		            	obj[headers[j]] = data[j];
		            }
		            lines.push(obj);
		        }
		    }
		    
		    return lines;
		}
		
		// show selected row when clicked on
		$scope.show = function(row) {
			$scope.item = row;
			$scope.selected = row;
		};
		
		// process chosen CSV file for reading
	    $scope.getFile = function () {
	        $scope.progress = 0;
	        
	        if($scope.file && $scope.file.type === 'text/csv') {
	        	$scope.header = document.title = $scope.file.name;
	        	
	        	fileReader.readAsText($scope.file, $scope).then(function(result) {
	        		// set new array as data list
                    $scope.list = csvToList(',',result);
                });
	        	$scope.addFile = false;
	        }
	     };
	     
	     // update progress indicator when uploading file
	     $scope.$on("fileProgress", function(e, progress) {
	         $scope.progress = progress.loaded / progress.total;
	     });
	  
	 }]);
	
	ad_controllers.controller('ADListCtrl', ['$scope', '$filter', function($scope, $filter) {
		
		var orderBy = $filter('orderBy');
		
		var items_per_page = 20;
		// total number of pages based on row_count and items per page
		$scope.pages = Math.ceil($scope.list.length / items_per_page);
		$scope.prev_page = 0;
		$scope.current_page = 1;
		$scope.next_page = 2;
		
		$scope.displayed_items = $scope.list.slice(0, items_per_page);
		
		// chane shown page of content
		$scope.showPage  = function(page_number) {
			var start = (page_number-1)*items_per_page,
			end = start + items_per_page;
			$scope.current_page = page_number;
			$scope.prev_page = page_number-1;
			$scope.next_page = page_number +1;
			$scope.displayed_items = $scope.list.slice(start, end);
		};
		
		// sort data array based on chosen field
		$scope.order = function(predicate, reverse) {
			$scope.list = orderBy($scope.list, predicate, reverse);
			$scope.showPage($scope.current_page);
		}
		
	}]);
	
	ad_controllers.controller('ADItemCtrl', ['$scope', function($scope) {
		  
	}]);
	
})();