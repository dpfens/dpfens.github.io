"use strict";

(function() {
	var app = angular.module("app",['ADControllers', 'filereader']),
	
	ADControllers = angular.module('ADControllers', []);
	
	(function (module) {
	    
	    var fileReader = function ($q, $log) {
	 
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
	 
	        var readAsDataURL = function (file, scope) {
	            var deferred = $q.defer();
	             
	            var reader = getReader(deferred, scope);         
	            reader.readAsDataURL(file);
	             
	            return deferred.promise;
	        };
	        
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
	 
	}(angular.module("ADControllers")));
	
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
	
	ADControllers.controller('ADMainCtrl', ['$scope', '$http', 'fileReader', function($scope, $http, fileReader) {
		
		$scope.header = "AidData CSV Reader";
		$scope.addFile = true;
		
		function CSVtoList(delimiter, str) {
			var allTextLines = str.split(/\r\n|\n/g);
		    var headers = allTextLines[0].split(delimiter);
		    var lines = [];

		    for (var i=1; i<allTextLines.length; i++) {
		        var data = allTextLines[i].split(delimiter),
		        item = {};
		        if (data.length == headers.length) {
		            for (var j=0; j<headers.length; j++) {
		            	item[headers[j]] = data[j];
		            }
		            lines.push(item);
		        }
		    }
		    return lines;
		}
		
		$scope.show = function(row) {
			$scope.item = row;
			$scope.selected = row;
		};
		
	    $scope.getFile = function () {
	    	console.log()
	        $scope.progress = 0;
	        if($scope.file && $scope.file.type === 'text/csv') {
	        	$scope.header = document.title = $scope.file.name;
	        	
	        	fileReader.readAsText($scope.file, $scope).then(function(result) {
                    $scope.list = CSVtoList(',',result);
                });
	        	$scope.addFile = false;
	        }
	     };
	  
	     $scope.$on("fileProgress", function(e, progress) {
	         $scope.progress = progress.loaded / progress.total;
	     });
	     
	     $http.get('https://raw.githubusercontent.com/dpfens/ITPIR-Application/master/aiddata2-1_thin.csv', function(result) {
	    	 console.log(result);
	     });
	  
	 }]);
	
	ADControllers.controller('ADListCtrl', ['$scope', '$filter', function($scope, $filter) {
		
		var orderBy = $filter('orderBy');
		
		var items_per_page = 20;
		
		$scope.pages = Math.ceil($scope.list.length / items_per_page);
		$scope.prev_page = 0;
		$scope.current_page = 1;
		$scope.next_page = 2;
		
		$scope.displayed_items = $scope.list.slice(0, items_per_page);
		
		$scope.showPage  = function(page_number) {
			var start = (page_number-1)*items_per_page,
			end = start +items_per_page;
			$scope.current_page = page_number;
			$scope.prev_page = page_number-1;
			$scope.next_page = page_number +1;
			$scope.displayed_items = $scope.list.slice(start, end);
		};
		
		$scope.order = function(predicate, reverse) {
			$scope.list = orderBy($scope.list, predicate, reverse);
			$scope.showPage($scope.current_page);
		}
		
	}]);
	
	ADControllers.controller('ADItemCtrl', ['$scope', function($scope) {
		  
	}]);
	
})();