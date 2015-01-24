angular.module('podcastApp', [
    'ps.search',
    'ps.podcast',
    'ps.item',
    'ps.download',
    'ps.partial',
    'ps.dataservice',
    'ps.player',
    'ps.common',
    'ngRoute',
    'ngTouch',
    'cfp.hotkeys',
    'restangular',
    'AngularStompDK',
    'ngAnimate',
    'truncate',
    'ui.bootstrap',
    'angular-loading-bar',
    'ngTagsInput',
    'notification'
])
    .config(function($routeProvider) {

        var commonKey = [
            ['h', 'Goto Home', function (event) {
                event.preventDefault();
                window.location.href = '#/items';
            }],
            ['s', 'Goto Search', function (event) {
                event.preventDefault();
                window.location.href = '#/item/search';
            }],
            ['p', 'Goto Podcast List', function (event) {
                event.preventDefault();
                window.location.href = '#/podcasts';
            }],
            ['d', 'Goto Download List', function (event) {
                event.preventDefault();
                window.location.href = '#/download';
            }]
        ];

            $routeProvider.
                when('/podcasts', {
                    templateUrl: 'html/podcasts-list.html',
                    controller: 'PodcastsListCtrl',
                    hotkeys: commonKey,
                    resolve : {
                        podcasts : function(podcastService) {
                            return podcastService.findAll();
                        }
                    }
                }).
                when('/podcast/add', {
                    templateUrl: 'html/podcast-add.html',
                    controller: 'PodcastAddCtrl',
                    hotkeys: commonKey
                }).
                when('/podcast/:podcastId', {
                    templateUrl: 'html/podcast-detail.html',
                    controller: 'PodcastDetailCtrl',
                    hotkeys: [
                        ['r', 'Refresh', 'refreshItems()'],
                        ['f', 'Force Refresh', 'refresh()'],
                        ['l', 'List of Items', 'tabs[0].active = true'],
                        ['m', 'Modification of Podcast', 'tabs[1].active = true']
                    ].concat(commonKey),
                    resolve : {
                        podcast : function (Restangular, $route) {
                            return Restangular.one('podcast', $route.current.params.podcastId).get();
                        }
                    }
                }).
                when('/items', {
                    templateUrl: 'html/items-search.html',
                    controller: 'ItemsSearchCtrl',
                    reloadOnSearch: false,
                    hotkeys: [
                        ['right', 'Next page', 'currentPage = currentPage+1; changePage();'],
                        ['left', 'Previous page', 'currentPage = currentPage-1; changePage();']
                    ].concat(commonKey)
                }).
                when('/podcast/:podcastId/item/:itemId', {
                    templateUrl: 'html/item-detail.html',
                    controller: 'ItemDetailCtrl',
                    hotkeys: commonKey,
                    resolve : {
                        item : function (itemService, $route) {
                            return itemService.findById($route.current.params.podcastId, $route.current.params.itemId);
                        },
                        podcast : function (podcastService, $route) {
                            return podcastService.findById($route.current.params.podcastId);
                        }
                    }
                }).
                when('/download', {
                    templateUrl: 'html/download.html',
                    controller: 'DownloadCtrl',
                    hotkeys: commonKey
                }).
                otherwise({
                    redirectTo: '/items'
                });
        })
    .config(function (cfpLoadingBarProvider) {
        cfpLoadingBarProvider.includeSpinner = false;
    })
    .config(function(RestangularProvider) {
        RestangularProvider.setBaseUrl('/api/');

        RestangularProvider.addElementTransformer('items', false, function(item) {
            item.addRestangularMethod('reset', 'get', 'reset');
            item.addRestangularMethod('download', 'get', 'addtoqueue');
            return item;
        });
    })
    .config(function($tooltipProvider) {
        //TODO : fix for problem in angular 1.3.0 : https://github.com/angular-ui/bootstrap/issues/2828
        $tooltipProvider.options({animation: false});
    })
    .config(function(ngstompProvider){
        ngstompProvider
            .url('/ws')
            .credential('login', 'password')
            .class(SockJS);
    });
angular.module('ps.common', [
    'ps.filters',
    'navbar',
    'authorize-notification'
]);
angular.module('authorize-notification', [
    'notification'
]).directive('authorizeNotification', function() {
    return {
        replace : true,
        restrict : 'E',
        templateUrl : 'html/authorize-notification.html',
        scope : true,
        controllerAs : 'an',
        controller : 'authorizeNotificationController'
    };
}).controller('authorizeNotificationController', function($window, Notification, $rootScope){
    var vm = this;

    //** https://code.google.com/p/chromium/issues/detail?id=274284 **/
    // Issue fixed in the M37 of Chrome :
    vm.state = hasToBeShown();
    vm.manuallyactivate = function() {
        Notification.requestPermission(function() {
            vm.state = hasToBeShown();
            $rootScope.$digest();
        });
    };

    function hasToBeShown() {
        return (('Notification' in $window) && $window.Notification.permission != 'granted');
    }
});

/**
 * Created by kevin on 01/11/14.
 */

angular.module('ps.podcast', [
    'ps.podcast.details',
    'ps.podcast.creation',
    'ps.podcast.list'
]);
angular.module('ps.filters', [])
    .filter('htmlToPlaintext', function () {
        return function(text) {
            return String(text || "").replace(/<[^>]+>/gm, '');
        };
    }
);
angular.module('ps.search', [
    'ps.search.item'
]);

/**
 * Created by kevin on 14/08/2014.
 */

_.mixin({
    // Update in place, does not preserve order
    updateinplace : function(localArray, remoteArray, comparisonFunction) {
        // Default function working on the === operator by the indexOf function:
        var comparFunc = comparisonFunction || function (inArray, elem) {
            return inArray.indexOf(elem);
        };

        // Remove from localArray what is not in the remote array :
        _.forEachRight(localArray.slice(), function (elem, key) {
            if (comparFunc(remoteArray, elem) === -1) {
                localArray.splice(key, 1);
            }
        });

        // Add to localArray what is new in the remote array :
        _.forEach(remoteArray, function (elem) {
            if (comparFunc(localArray, elem) === -1) {
                localArray.push(elem);
            }
        });

        return localArray;
    }
});
/**
 * Created by kevin on 02/11/14.
 */

angular.module('ps.dataservice', [
    'ps.dataService.donwloadManager',
    'ps.dataService.item',
    'ps.dataService.podcast',
    'ps.dataService.tag',
]);
angular.module('navbar', [
])
    .directive('navbar', function() {
        return {
            transclude : true,
            replace : true,
            restrict : 'E',
            templateUrl : 'html/navbar.html',
            scope : true,
            controllerAs : 'navbar',
            controller : 'navbarController'
        };
    }).controller('navbarController', function(){
        var vm = this;
        vm.navCollapsed = true;
    });


angular.module('ps.download', [
    /*'ps.websocket',*/
    'ps.dataService.donwloadManager',
    'notification',
    'AngularStompDK'
])
    .controller('DownloadCtrl', function ($scope, ngstomp, DonwloadManager, Notification) {
        $scope.items = DonwloadManager.getDownloading().$object;
        $scope.waitingitems = [];

        DonwloadManager.getNumberOfSimDl().then(function (data) {
            $scope.numberOfSimDl = parseInt(data);
        });

        $scope.getTypeFromStatus = function (item) {
            if (item.status === "Paused")
                return "warning";
            return "info";
        };

        $scope.updateNumberOfSimDl = DonwloadManager.updateNumberOfSimDl;

        /** Spécifique aux éléments de la liste : **/
        $scope.download = DonwloadManager.download;
        $scope.stopDownload = DonwloadManager.stopDownload;
        $scope.toggleDownload = DonwloadManager.toggleDownload;

        /** Global **/
        $scope.stopAllDownload = DonwloadManager.stopAllDownload;
        $scope.pauseAllDownload = DonwloadManager.pauseAllDownload;
        $scope.restartAllCurrentDownload = DonwloadManager.restartAllCurrentDownload;
        $scope.removeFromQueue = DonwloadManager.removeFromQueue;
        $scope.dontDonwload = DonwloadManager.dontDonwload;


        /** Websocket Connection */
        ngstomp
            .subscribe("/topic/download", function (message) {
                var item = JSON.parse(message.body);
                var elemToUpdate = _.find($scope.items, { 'id': item.id });
                switch (item.status) {
                    case 'Started' :
                    case 'Paused' :
                        if (elemToUpdate)
                            _.assign(elemToUpdate, item);
                        else
                            $scope.items.push(item);
                        break;
                    case 'Finish' :
                        new Notification('Téléchargement terminé', {
                            body: item.title,
                            icon: item.cover.url,
                            delay: 5000
                        });
                    case 'Stopped' :
                        if (elemToUpdate){
                            _.remove($scope.items, function (item) {
                                return item.id === elemToUpdate.id;
                            });
                        }
                        break;
                }
        }, $scope)
            .subscribe("/app/waitingList", function (message) {
                $scope.waitingitems = JSON.parse(message.body);
            }, $scope)
            .subscribe("/topic/waitingList", function (message) {
                var remoteWaitingItems = JSON.parse(message.body);
                _.updateinplace($scope.waitingitems, remoteWaitingItems, function(inArray, elem) {
                    return _.findIndex(inArray, { 'id': elem.id });
                });
            }, $scope);

    });
angular.module('ps.item.details', [
    'ps.dataService.donwloadManager',
    'ps.player',
    'AngularStompDK'
])
    .controller('ItemDetailCtrl', function ($scope, ngstomp, DonwloadManager, $location, playlistService, podcast, item) {

        $scope.item = item;
        $scope.item.podcast = podcast;
        $scope.download = DonwloadManager.download;
        $scope.stopDownload = DonwloadManager.stopDownload;
        $scope.toggleDownload = DonwloadManager.toggleDownload;


        $scope.remove = function(item) {
            return item.remove().then(function() {
                playlistService.remove(item);
                $location.path('/podcast/'.concat($scope.item.podcast.id));
            });
        };

        $scope.reset = function (item) {
            return item.reset().then(function (itemReseted) {
                _.assign($scope.item, itemReseted);
                playlistService.remove(item);
            });
        };
        
        $scope.toggleInPlaylist = function () {
            playlistService.addOrRemove(item);
        };
        
        $scope.isInPlaylist = function() {
            return playlistService.contains(item);
        };

        //** WebSocket Inscription **//
        var webSockedUrl = "/topic/podcast/".concat($scope.item.podcast.id);

        ngstomp
            .subscribe(webSockedUrl, function(message) {
                var itemFromWS = JSON.parse(message.body);

                if (itemFromWS.id == $scope.item.id) {
                    _.assign($scope.item, itemFromWS);
                }
            }, $scope);
    });
/**
 * Created by kevin on 01/11/14.
 */

angular.module('ps.item', [
    'ps.item.details',
    'ps.item.player'
]);
angular.module('ps.item.player', [
    'ngSanitize',
    'ngRoute',
    'com.2fdevs.videogular',
    'com.2fdevs.videogular.plugins.poster',
    'com.2fdevs.videogular.plugins.controls',
    'com.2fdevs.videogular.plugins.overlayplay',
    'com.2fdevs.videogular.plugins.buffering'
])
    .config(function($routeProvider) {
        $routeProvider.
            when('/podcast/:podcastId/item/:itemId/play', {
                templateUrl: 'html/item-player.html',
                controller: 'ItemPlayerController',
                controllerAs: 'ipc',
                resolve : {
                    item : function (itemService, $route) {
                        return itemService.findById($route.current.params.podcastId, $route.current.params.itemId);
                    },
                    podcast : function (podcastService, $route) {
                        return podcastService.findById($route.current.params.podcastId);
                    }
                }
            });
    })
    .controller('ItemPlayerController', function (podcast, item, $timeout) {
        var vm = this;
        
        vm.item = item;
        vm.item.podcast = podcast;
        
        vm.config = {
            preload: true,
            sources: [
                { src : item.localUrl, type : item.mimeType }
            ],
            theme: {
                url: "http://www.videogular.com/styles/themes/default/videogular.css"
            },
            plugins: {
                controls: {
                    autoHide: true,
                    autoHideTime: 2000
                },
                poster: item.cover.url
            }
        }

        vm.onPlayerReady = function(API) {
            if (vm.config.preload) {
                $timeout(function () {
                    API.play();
                })
            }
        };
    });
angular.module('ps.player', [
    'ngSanitize',
    'ngRoute',
    'ngStorage',
    'com.2fdevs.videogular',
    'com.2fdevs.videogular.plugins.poster',
    'com.2fdevs.videogular.plugins.controls',
    'com.2fdevs.videogular.plugins.overlayplay',
    'com.2fdevs.videogular.plugins.buffering'
])
    .config(function($routeProvider) {
        $routeProvider.
            when('/player', {
                templateUrl: 'html/player.html',
                controller: 'PlayerController',
                controllerAs: 'pc'
            });
    })
    .controller('PlayerController', function (playlistService, $timeout) {
        var vm = this; 
        
        vm.state = null;
        vm.API = null;
        vm.currentVideo = 0;

        vm.onPlayerReady = function(API) {
            vm.API = API;

            if (vm.API.currentState == 'play' || vm.isCompleted) 
                vm.API.play();

            vm.isCompleted = false;
            vm.setVideo(0)
        };

        vm.onCompleteVideo = function() {
            vm.isCompleted = true;
            vm.currentVideo++;

            if (vm.currentVideo >= vm.playlist.length) {
                vm.currentVideo = 0;
                return;
            }

            vm.setVideo(vm.currentVideo);
        };
        

        vm.config = {
            preload : true,
            sources: [],
            theme: {
                url: "http://www.videogular.com/styles/themes/default/videogular.css"
            },
            plugins: {
                controls: {
                    autoHide: true,
                    autoHideTime: 2000
                },
                poster: ''
            }
        };
        
        reloadPlaylist();
        
        vm.setVideo = function(index) {
            var item = vm.playlist[index];

            if (item !== null && item !== undefined) {
                vm.API.stop();
                vm.currentVideo = index;
                vm.config.sources = [{src : item.localUrl, type : item.mimeType }];
                vm.config.plugins.poster = item.cover.url;
                if (vm.config.preload) {
                    $timeout(function() { vm.API.play(); }, 500);
                }
            }
        };
        
        vm.remove = function(item) {
            playlistService.remove(item);
            reloadPlaylist();
            if (vm.config.sources.length > 0 && vm.config.sources[0].src === item.localUrl) {
                vm.setVideo(0);
            }
        };

        function reloadPlaylist() {
            vm.playlist = playlistService.playlist();
        }
    })
    .factory('playlistService', function($localStorage) {
        $localStorage.playlist = $localStorage.playlist || [];
        return {
            playlist : function() {
                return $localStorage.playlist
            },
            add : function(item) {
                $localStorage.playlist.push(item);
            },
            remove : function (item) {
                $localStorage.playlist = _.remove($localStorage.playlist, function(elem) { return elem.id !== item.id; });
            },
            contains : function(item) {
                return angular.isObject(_.find($localStorage.playlist, {id : item.id}));
            },
            addOrRemove : function (item) {
                (this.contains(item)) ? this.remove(item) : this.add(item);
            }
        };
    });
angular.module('ps.podcast.creation', [
    'restangular'
])
    .controller('PodcastAddCtrl', function ($scope, Restangular, $location) {
        var podcasts = Restangular.all("podcast"),
            tags = Restangular.all("tag");

        $scope.podcast = {
            hasToBeDeleted : true,
            cover : {
                height: 200,
                width: 200
            }
        };

        $scope.loadTags = function(query) {
            return tags.post(null, {name : query});
        };

        $scope.changeType = function() {
            if (/beinsports\.fr/i.test($scope.podcast.url)) {
                $scope.podcast.type = "BeInSports";
            } else if (/canalplus\.fr/i.test($scope.podcast.url)) {
                $scope.podcast.type = "CanalPlus";
            } else if (/jeuxvideo\.fr/i.test($scope.podcast.url)) {
                $scope.podcast.type = "JeuxVideoFR";
            } else if (/jeuxvideo\.com/i.test($scope.podcast.url)) {
                $scope.podcast.type = "JeuxVideoCom";
            } else if (/parleys\.com/i.test($scope.podcast.url)) {
                $scope.podcast.type = "Parleys";
            } else if (/pluzz\.francetv\.fr/i.test($scope.podcast.url)) {
                $scope.podcast.type = "Pluzz";
            } else if (/youtube\.com/i.test($scope.podcast.url)) {
                $scope.podcast.type = "Youtube";
            } else if ($scope.podcast.url.length > 0) {
                $scope.podcast.type = "RSS";
            } else {
                $scope.podcast.type = "Send";
            }
        };

        $scope.save = function() {
            podcasts.post($scope.podcast).then(function (podcast) {
                $location.path('/podcast/' + podcast.id);
            });
        };
    });
angular.module('ps.podcast.list', [
])
    .controller('PodcastsListCtrl', function ($scope, podcasts) {
        $scope.podcasts = podcasts;
    });
(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/authorize-notification.html',
    '<div ng-show="an.state" class="alert alert-info text-center" role="alert">\n' +
    '    <a ng-click="an.manuallyactivate()" class="btn btn-primary">Activer Notification</a>\n' +
    '</div>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/download.html',
    '<!--<div class="jumbotron">-->\n' +
    '    <!--<div class="container">-->\n' +
    '        <!--<h1>Téléchargement</h1>-->\n' +
    '    <!--</div>-->\n' +
    '<!--</div>-->\n' +
    '\n' +
    '<div class="container downloadList">\n' +
    '\n' +
    '    <div class="row form-horizontal" style="margin-top: 15px;">\n' +
    '        <div class="col-xs-offset-1 col-md-offset-1 col-sm-offset-1 col-lg-offset-1 form-group col-md-6 col-lg-6 col-xs-6 col-sm-6 ">\n' +
    '            <label class="pull-left control-label">Téléchargements simultanés</label>\n' +
    '            <div class="col-md-3 col-lg-3 col-xs-3 col-sm-3">\n' +
    '                <input ng-model="numberOfSimDl" ng-change="updateNumberOfSimDl(numberOfSimDl)" type="number" class="form-control" placeholder="Number of download">\n' +
    '            </div>\n' +
    '        </div>\n' +
    '        <div class="btn-group pull-right">\n' +
    '            <button ng-click="restartAllDownload()" type="button" class="btn btn-default">Démarrer</button>\n' +
    '            <button ng-click="pauseAllDownload()" type="button" class="btn btn-default">Pause</button>\n' +
    '            <button ng-click="stopAllDownload()" type="button" class="btn btn-default">Stop</button>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '    <div class="media"  ng-repeat="item in items | orderBy:\'-progression\' track by item.id" >\n' +
    '\n' +
    '        <div class="buttonList pull-right">\n' +
    '            <br/>\n' +
    '            <button ng-click="toggleDownload(item)" type="button" class="btn btn-primary btn-sm"><i class="glyphicon glyphicon-play"></i><i class="glyphicon glyphicon-pause"></i></button>\n' +
    '            <button ng-click="stopDownload(item)" type="button" class="btn btn-danger btn-sm"><span class="glyphicon glyphicon-stop"></span></button>\n' +
    '        </div>\n' +
    '\n' +
    '        <a class="pull-left" ng-href="#/podcast/{{item.podcastId}}/item/{{item.id}}">\n' +
    '            <img ng-src="{{item.cover.url}}" >\n' +
    '        </a>\n' +
    '\n' +
    '        <div class="media-body">\n' +
    '            <h5 class="media-heading">{{item.title | characters:100}}</h5>\n' +
    '            <br/>\n' +
    '            <progressbar class="progress-striped active" animate="false" value="item.progression" type="{{ getTypeFromStatus(item) }}">{{item.progression}}%</progressbar>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '\n' +
    '\n' +
    '    <br/>\n' +
    '\n' +
    '    <accordion close-others="true">\n' +
    '        <accordion-group is-open="waitingitems.length > 0">\n' +
    '            <accordion-heading>\n' +
    '                Liste d\'attente <span class="pull-right badge">{{ waitingitems.length }}</span></a>\n' +
    '            </accordion-heading>\n' +
    '            <div class="media clearfix"  ng-repeat="item in waitingitems"  >\n' +
    '\n' +
    '                <div class="pull-right">\n' +
    '                    <br/>\n' +
    '                    <button ng-click="removeFromQueue(item)" type="button" class="btn btn-primary btn-sm"><i class="glyphicon glyphicon-minus"></i></button>\n' +
    '                    <button ng-click="dontDonwload(item)" type="button" class="btn btn-danger btn-sm"><i class="glyphicon glyphicon-stop"></i></button>\n' +
    '                </div>\n' +
    '\n' +
    '                <a class="pull-left" ng-href="#/podcast/{{item.podcastId}}/item/{{item.id}}">\n' +
    '                    <img ng-src="{{item.cover.url}}">\n' +
    '                </a>\n' +
    '\n' +
    '                <div class="media-body">\n' +
    '                    <h5 class="media-heading">{{item.title | characters:100}}</h5>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '\n' +
    '        </accordion-group>\n' +
    '    </accordion>\n' +
    '\n' +
    '\n' +
    '</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/item-detail.html',
    '\n' +
    '<div class="container item-details">\n' +
    '\n' +
    '    <br/>\n' +
    '    <ol class="breadcrumb">\n' +
    '        <li><a href="/#/podcasts">Podcasts</a></li>\n' +
    '        <li><a ng-href="/#/podcast/{{ item.podcast.id }}"> {{ item.podcast.title }}</a></li>\n' +
    '        <li class="active">{{ item.title }}</li>\n' +
    '    </ol>\n' +
    '\n' +
    '    <div>\n' +
    '        <div class="col-xs-12 col-sm-12 col-md-3 col-lg-3">\n' +
    '            <div class="thumbnail">\n' +
    '                <a ng-href="{{ item.localUrl || item.url }}">\n' +
    '                    <img class="center-block" ng-src="{{item.cover.url}}" width="200" height="200">\n' +
    '                </a>\n' +
    '\n' +
    '                <div class="caption">\n' +
    '\n' +
    '                    <div class="buttonList text-center">\n' +
    '                        <!-- Téléchargement en cours -->\n' +
    '                        <span ng-show="item.status == \'Started\' || item.status == \'Paused\'" >\n' +
    '                            <button ng-click="toggleDownload(item)" type="button" class="btn btn-primary "><i class="glyphicon glyphicon-play"></i><i class="glyphicon glyphicon-pause"></i></button>\n' +
    '                            <button ng-click="stopDownload(item)" type="button" class="btn btn-danger"><span class="glyphicon glyphicon-stop"></span></button>\n' +
    '                        </span>\n' +
    '\n' +
    '                        <!-- Lancer le téléchargement -->\n' +
    '                        <button ng-click="item.download()" ng-show="(item.status != \'Started\' && item.status != \'Paused\' ) && item.localUrl == null " type="button" class="btn btn-primary"><span class="glyphicon glyphicon-save"></span></button>\n' +
    '\n' +
    '                        <!--<a ng-href="{{ item.localUrl }}" ng-show="item.localUrl != null" type="button" class="btn btn-success"><span class="glyphicon glyphicon-play"></span></a>-->\n' +
    '                        <a ng-href="/#/podcast/{{ item.podcast.id }}/item/{{ item.id }}/play" ng-show="item.localUrl != null" type="button" class="btn btn-success"><span class="ionicons ion-social-youtube"></span></a>\n' +
    '\n' +
    '                        <!-- Add to Playlist -->\n' +
    '                        <a ng-show="item.localUrl != null" ng-click="toggleInPlaylist()" type="button" class="btn btn-primary">\n' +
    '                            <span ng-hide="isInPlaylist()" class="glyphicon glyphicon-plus"></span>\n' +
    '                            <span ng-show="isInPlaylist()" class="glyphicon glyphicon-minus"></span>\n' +
    '                        </a>\n' +
    '\n' +
    '                        <div class="btn-group" dropdown is-open="isopen">\n' +
    '                            <button type="button" class="btn btn-default dropdown-toggle" dropdown-toggle><i class="ionicons ion-android-more"></i></button>\n' +
    '                            <ul class="dropdown-menu dropdown-menu-right" role="menu">\n' +
    '                                <li ng-show="item.localUrl != null"><a ng-href="{{ item.localUrl }}"><span class="glyphicon glyphicon-play"></span> Lire</a></li>\n' +
    '                                <li><a ng-click="remove(item)" ng-show="(item.status != \'Started\' && item.status != \'Paused\' )"><span class="glyphicon glyphicon-remove"></span> Retirer</a></li>\n' +
    '                                <li><a ng-click="reset(item)"><span class="glyphicon glyphicon-repeat"></span> Reset</a></li>\n' +
    '                                <li><a ng-href="{{ item.url }}"><span class="glyphicon glyphicon-globe"></span> Lire en ligne</a></li>\n' +
    '                            </ul>\n' +
    '                        </div>\n' +
    '                        \n' +
    '                    </div>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-xs-12 col-sm-12 col-md-9 col-lg-9">\n' +
    '            <br/>\n' +
    '            <div class="panel panel-default">\n' +
    '                <div class="panel-heading">\n' +
    '                    <h3 class="panel-title">{{ item.title }}</h3>\n' +
    '                </div>\n' +
    '                <div class="panel-body">\n' +
    '                    {{ item.description | htmlToPlaintext }}\n' +
    '                </div>\n' +
    '                <div class="panel-footer">Date de publication : <strong>{{item.pubdate | date : \'dd/MM/yyyy à HH:mm\' }}</strong></div>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '\n' +
    '    </div>\n' +
    '</div>\n' +
    '\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/item-player.html',
    '<div class="container item-player">\n' +
    '    <br/>\n' +
    '    <ol class="breadcrumb">\n' +
    '        <li><a href="/#/podcasts">Podcasts</a></li>\n' +
    '        <li><a ng-href="/#/podcast/{{ ipc.item.podcast.id }}"> {{ ipc.item.podcast.title }}</a></li>\n' +
    '        <li class="active"><a ng-href="/#/podcast/{{ ipc.item.podcast.id }}/item/{{ ipc.item.id }}">{{ ipc.item.title }}</a></li>\n' +
    '    </ol>\n' +
    '\n' +
    '    <div ng-show="ipc.item.localUrl !== null" class="videogular-container">\n' +
    '        <videogular vg-theme="ipc.config.theme.url" vg-player-ready="ipc.onPlayerReady">\n' +
    '            <vg-video vg-src="ipc.config.sources" vg-native-controls="false" vg-preload="ipc.config.preload"></vg-video>\n' +
    '\n' +
    '            <vg-controls vg-autohide="ipc.config.plugins.controls.autoHide" vg-autohide-time="ipc.config.plugins.controls.autoHideTime">\n' +
    '                <vg-play-pause-button></vg-play-pause-button>\n' +
    '                <vg-timedisplay>{{ currentTime | date:\'mm:ss\' }}</vg-timedisplay>\n' +
    '                <vg-scrubBar>\n' +
    '                    <vg-scrubbarcurrenttime></vg-scrubbarcurrenttime>\n' +
    '                </vg-scrubBar>\n' +
    '                <vg-timedisplay>{{ timeLeft | date:\'mm:ss\' }}</vg-timedisplay>\n' +
    '                <vg-volume>\n' +
    '                    <vg-mutebutton></vg-mutebutton>\n' +
    '                    <vg-volumebar></vg-volumebar>\n' +
    '                </vg-volume>\n' +
    '                <vg-fullscreenButton></vg-fullscreenButton>\n' +
    '                <div class=\'btn-video-share\'><a ng-href="{{ ipc.item.localUrl }}" class="ionicons ion-android-share"></a></div>\n' +
    '            </vg-controls>\n' +
    '\n' +
    '            <vg-overlay-play></vg-overlay-play>\n' +
    '            \n' +
    '            <vg-poster-image vg-url=\'ipc.config.plugins.poster\'></vg-poster-image>\n' +
    '        </videogular>\n' +
    '    </div>\n' +
    '</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/items-search.html',
    '<div class="container item-listing" ng-swipe-right="swipePage(-1)" ng-swipe-left="swipePage(1)">\n' +
    '    <!--<div class="col-xs-11 col-sm-11 col-lg-11 col-md-11">-->\n' +
    '\n' +
    '    <div class="form-inline search-bar row" ng-show="search">\n' +
    '        <div class="form-group col-sm-3">\n' +
    '            <input type="text" class="form-control" ng-model="searchParameters.term" placeholder="Recherche globale" ng-change="currentSearchPage=1; changePage()" ng-model-options="{ debounce: 500 }">\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group col-sm-5">\n' +
    '            <tags-input placeholder="Search by Tags" add-from-autocomplete-only="true" ng-model="searchParameters.tags" display-property="name" class="bootstrap" on-tag-added="currentPage=1; changePage()" on-tag-removed="currentPage=1; changePage()">\n' +
    '                <auto-complete source="loadTags($query)" min-length="2"></auto-complete>\n' +
    '            </tags-input>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group col-sm-2">\n' +
    '            <select class="form-control" ng-model="searchParameters.properties" ng-change="changePage()">\n' +
    '                <option value>Tri</option>\n' +
    '                <option value="pertinence">Pertinence</option>\n' +
    '                <option value="pubdate">Date publication</option>\n' +
    '                <option value="downloaddate">Date de download</option>\n' +
    '            </select>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group col-sm-2">\n' +
    '            <select class="form-control" ng-model="searchParameters.direction" ng-change="changePage()" ng-disabled="searchParameters.properties === \'pertinence\'">\n' +
    '                <option value>Ordre</option>\n' +
    '                <option value="DESC">Descendant</option>\n' +
    '                <option value="ASC">Ascendant</option>\n' +
    '            </select>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="text-center row" >\n' +
    '        <pagination ng-show="totalPages > 1" items-per-page="12" max-size="10" boundary-links="true" total-items="totalItems" ng-model="currentPage" ng-change="changePage()" class="pagination pagination-centered" previous-text="&lsaquo;" next-text="&rsaquo;" first-text="&laquo;" last-text="&raquo;"></pagination>\n' +
    '        <a ng-click="search = !search;" ng-class="{\'btn-primary\' : search, \'btn-default\' : !search}" class="btn pull-right search-button"><i class="glyphicon glyphicon-search"></i></a>\n' +
    '    </div>\n' +
    '        <div class="row">\n' +
    '            <div ng-repeat="item in items track by item.id" class="col-lg-3  col-md-3 col-sm-4 col-xs-6 itemInList">\n' +
    '                <div class="box">\n' +
    '                    <div class="">\n' +
    '                        <img ng-class="{\'img-grayscale\' : (item.localUrl == null) }" ng-src="{{ item.cover.url }}" alt="" class="img-responsive" />\n' +
    '                        <div class="overlay-button">\n' +
    '                            <div class="btn-group" dropdown>\n' +
    '                                <button type="button" class="btn dropdown dropdown-toggle" dropdown-toggle><i class="ionicons ion-android-more"></i></button>\n' +
    '                                <ul class="dropdown-menu dropdown-menu-right" role="menu">\n' +
    '                                    <li ng-show="item.status == \'Started\' || item.status == \'Paused\'">\n' +
    '                                        <a ng-show="item.status == \'Started\'" ng-click="toggleDownload(item)"><i class="glyphicon glyphicon-play text-primary"></i><i class="glyphicon glyphicon-pause text-primary"></i> Mettre en pause</a>\n' +
    '                                        <a ng-show="item.status == \'Paused\'" ng-click="toggleDownload(item)"><i class="glyphicon glyphicon-play text-primary"></i><i class="glyphicon glyphicon-pause text-primary"></i> Reprendre</a>\n' +
    '                                    </li>\n' +
    '                                    <li ng-show="item.status == \'Started\' || item.status == \'Paused\'">\n' +
    '                                        <a ng-click="stopDownload(item)"><span class="glyphicon glyphicon-stop text-danger"></span> Stopper</a>\n' +
    '                                    </li>\n' +
    '                                    <li ng-show="(item.status != \'Started\' && item.status != \'Paused\' ) && item.localUrl == null">\n' +
    '                                        <a ng-click="item.download()"><span class="glyphicon glyphicon-save text-primary"></span> Télécharger</a>\n' +
    '                                    </li>\n' +
    '                                    <li>\n' +
    '                                        <a ng-href="/#/podcast/{{ item.podcastId }}/item/{{ item.id }}/play" ng-show="item.localUrl != null">\n' +
    '                                            <span class="ionicons ion-social-youtube text-success"></span> Lire dans le player</a>\n' +
    '                                    </li>\n' +
    '                                    <li ng-show="item.localUrl != null">\n' +
    '                                        <a ng-click="addOrRemove(item)">\n' +
    '                                            <span ng-hide="isInPlaylist(item)"><span class="glyphicon glyphicon-plus text-primary"></span> Ajouter à la Playlist</span>\n' +
    '                                            <span ng-show="isInPlaylist(item)"><span class="glyphicon glyphicon-minus text-primary"></span> Retirer de la Playlist</span>\n' +
    '                                        </a>\n' +
    '                                    </li>\n' +
    '                                    <!--<li ng-show="item.localUrl == null" >\n' +
    '                                        <a ng-href="{{ item.proxyURL }}"><span class="glyphicon glyphicon-globe text-info"></span> Lire en ligne</a>\n' +
    '                                    </li>-->\n' +
    '                                    <li>\n' +
    '                                        <a ng-click="remove(item)"><span class="glyphicon glyphicon-remove text-danger"></span> Supprimer</a>\n' +
    '                                    </li>\n' +
    '                                    <li>\n' +
    '                                        <a ng-click="reset(item)"><span class="glyphicon glyphicon-repeat"></span> Reset</a>\n' +
    '                                    </li>\n' +
    '                                </ul>\n' +
    '                            </div>\n' +
    '                        </div>\n' +
    '                        <a class="overlay-main-button" ng-href="{{ item.proxyURL  }}" >\n' +
    '                            <span ng-class="{\'glyphicon-globe\' : (item.localUrl == null), \'glyphicon-play\' : (item.localUrl != null)}" class="glyphicon "></span>\n' +
    '                        </a>\n' +
    '                    </div>\n' +
    '                    <div class="text-center clearfix itemTitle center" >\n' +
    '                        <a ng-href="#/podcast/{{item.podcastId}}/item/{{item.id}}" tooltip-trigger tooltip="{{ item.title }}" tooltip-placement="bottom" >\n' +
    '                            {{ item.title | characters:30 }}\n' +
    '                        </a>\n' +
    '                    </div>\n' +
    '                    <div class="text-center row-button">\n' +
    '                        <span ng-show="item.status == \'Started\' || item.status == \'Paused\'" >\n' +
    '                            <button ng-click="toggleDownload(item)" type="button" class="btn btn-primary "><i class="glyphicon glyphicon-play"></i><i class="glyphicon glyphicon-pause"></i></button>\n' +
    '                            <button ng-click="stopDownload(item)" type="button" class="btn btn-danger"><span class="glyphicon glyphicon-stop"></span></button>\n' +
    '                        </span>\n' +
    '\n' +
    '                        <button ng-click="item.download()" ng-show="(item.status != \'Started\' && item.status != \'Paused\' ) && item.localUrl == null " type="button" class="btn btn-primary"><span class="glyphicon glyphicon-save"></span></button>\n' +
    '                        <a href="{{ item.proxyURL }}" ng-show="item.localUrl == null" type="button" class="btn btn-info"><span class="glyphicon glyphicon-globe"></span></a>\n' +
    '\n' +
    '                        <a href="{{ item.proxyURL }}" ng-show="item.localUrl != null" type="button" class="btn btn-success"><span class="glyphicon glyphicon-play"></span></a>\n' +
    '                        <button ng-click="remove(item)" ng-show="item.localUrl != null" type="button" class="btn btn-danger"><span class="glyphicon glyphicon-remove"></span></button>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    <!--</div>-->\n' +
    '    <div class="text-center row" ng-show="totalPages > 1">\n' +
    '        <pagination items-per-page="12" max-size="10" boundary-links="true" total-items="totalItems" ng-model="currentPage" ng-change="changePage()" class="pagination pagination-centered" previous-text="&lsaquo;" next-text="&rsaquo;" first-text="&laquo;" last-text="&raquo;"></pagination>\n' +
    '    </div>\n' +
    '</div>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/navbar.html',
    '<nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">\n' +
    '    <div class="container-fluid">\n' +
    '        <div class="navbar-header">\n' +
    '            <a class="navbar-brand" href="#/items">Podcast Server</a>\n' +
    '            <ul class="nav navbar-nav pull-right" ng-transclude></ul>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</nav>');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/player.html',
    '<div class="container video-player">\n' +
    '    <br/>\n' +
    '    <div class="col-lg-8 player">\n' +
    '        <videogular vg-theme="controller.config.theme.url" vg-player-ready="pc.onPlayerReady" vg-complete="pc.onCompleteVideo">\n' +
    '            <vg-video vg-src="pc.config.sources" vg-native-controls="false" vg-preload="pc.config.preload"></vg-video>\n' +
    '\n' +
    '            <vg-controls vg-autohide="pc.config.plugins.controls.autoHide" vg-autohide-time="pc.config.plugins.controls.autoHideTime">\n' +
    '                <vg-play-pause-button></vg-play-pause-button>\n' +
    '                <vg-timedisplay>{{ currentTime | date:\'mm:ss\' }}</vg-timedisplay>\n' +
    '                <vg-scrubBar>\n' +
    '                    <vg-scrubbarcurrenttime></vg-scrubbarcurrenttime>\n' +
    '                </vg-scrubBar>\n' +
    '                <vg-timedisplay>{{ timeLeft | date:\'mm:ss\' }}</vg-timedisplay>\n' +
    '                <vg-volume>\n' +
    '                    <vg-mutebutton></vg-mutebutton>\n' +
    '                    <vg-volumebar></vg-volumebar>\n' +
    '                </vg-volume>\n' +
    '                <vg-fullscreenButton></vg-fullscreenButton>\n' +
    '                <div class=\'btn-video-share\'><a ng-href="{{ pc.config.sources[0].src }}" class="ionicons ion-android-share"></a></div>\n' +
    '            </vg-controls>\n' +
    '\n' +
    '            <vg-overlay-play></vg-overlay-play>\n' +
    '\n' +
    '            <vg-poster-image vg-url=\'pc.config.plugins.poster\'></vg-poster-image>\n' +
    '        </videogular>\n' +
    '    </div>\n' +
    '    <div class="playlist col-lg-4">\n' +
    '        <div class="media clearfix"  ng-repeat="item in pc.playlist track by item.id" ng-class="{\'isReading\' : pc.currentVideo === $index}">\n' +
    '\n' +
    '            <button ng-click="pc.remove(item)" type="button" class="pull-right close"><span aria-hidden="true">&times;</span></button>\n' +
    '\n' +
    '            <a class="pull-left cover" ng-click="pc.setVideo($index)">\n' +
    '                <img ng-src="{{item.cover.url}}" width="100" height="100" style="">\n' +
    '            </a>\n' +
    '\n' +
    '            <div class="media-body">\n' +
    '                <p ng-click="pc.setVideo($index)" class="">{{ item.title }}</p>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '        \n' +
    '    </div>\n' +
    '\n' +
    '</div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/podcast-add.html',
    '<div class="jumbotron">\n' +
    '    <div class="container">\n' +
    '        <h1>Ajouter un Podcast</h1>\n' +
    '    </div>\n' +
    '</div>\n' +
    '\n' +
    '<div class="container">\n' +
    '    <form class="form-horizontal" role="form" novalidate>\n' +
    '        <div class="form-group">\n' +
    '            <label for="title" class="col-sm-1 control-label">Titre</label>\n' +
    '\n' +
    '            <div class="col-sm-10">\n' +
    '                <input type="text" class="form-control" id="title" ng-model="podcast.title" required placeholder="Titre">\n' +
    '            </div>\n' +
    '        </div>\n' +
    '        <div class="form-group">\n' +
    '            <label for="url" class="col-sm-1 control-label">URL</label>\n' +
    '\n' +
    '            <div class="col-sm-10">\n' +
    '                <input type="url" class="form-control" id="url" ng-model="podcast.url" required placeholder="url" ng-change="changeType()">\n' +
    '            </div>\n' +
    '        </div>\n' +
    '        <div class="form-group">\n' +
    '            <div class="checkbox col-sm-offset-2">\n' +
    '                <label>\n' +
    '                    <input type="checkbox" ng-model="podcast.hasToBeDeleted"> Suppression Automatique\n' +
    '                </label>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '            <label for="url" class="col-sm-1 control-label">Tags</label>\n' +
    '            <div class="col-sm-10">\n' +
    '                <tags-input ng-model="podcast.tags" display-property="name" min-length="1" class="bootstrap">\n' +
    '                    <auto-complete source="loadTags($query)" min-length="2"></auto-complete>\n' +
    '                </tags-input>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '            <label for="height" class="col-sm-1 control-label">Type</label>\n' +
    '\n' +
    '            <div class="col-sm-10">\n' +
    '                <select class="form-control" ng-model="podcast.type">\n' +
    '                    <option value="BeInSports">Be In Sports</option>\n' +
    '                    <option value="CanalPlus">Canal+</option>\n' +
    '                    <option value="JeuxVideoCom">Jeux Video Com</option>\n' +
    '                    <option value="JeuxVideoFR">Jeux Video Fr</option>\n' +
    '                    <option value="Parleys">Parleys</option>\n' +
    '                    <option value="Pluzz">Pluzz</option>\n' +
    '                    <option value="RSS">RSS</option>\n' +
    '                    <option value="send">Send</option>\n' +
    '                    <option value="Youtube">Youtube</option>\n' +
    '                </select>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '        <div class="col-md-2 col-md-offset-1">\n' +
    '            <img ng-src="{{ podcast.cover.url || \'http://placehold.it/200x200\' }}" class="img-thumbnail">\n' +
    '        </div>\n' +
    '        <div class="col-md-9">\n' +
    '            <div class="form-group">\n' +
    '                <label for="url" class="col-sm-2 control-label">URL</label>\n' +
    '\n' +
    '                <div class="col-sm-9">\n' +
    '                    <input class="form-control" id="url" ng-model="podcast.cover.url" required placeholder="url">\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '                <label for="width" class="col-sm-2 control-label">Lageur</label>\n' +
    '\n' +
    '                <div class="col-sm-3">\n' +
    '                    <input type="number" class="form-control" id="width" ng-model="podcast.cover.width" required\n' +
    '                           placeholder="url">\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '                <label for="height" class="col-sm-2 control-label">Hauteur</label>\n' +
    '\n' +
    '                <div class="col-sm-3">\n' +
    '                    <input type="number" class="form-control" id="height" ng-model="podcast.cover.height" required\n' +
    '                           placeholder="url">\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '            <div class="col-sm-offset-2 col-sm-10">\n' +
    '                <button ng-click="save()" class="btn btn-default">Sauvegarder</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </form>\n' +
    '</div>\n' +
    '\n' +
    '\n' +
    '\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/podcast-detail.html',
    '\n' +
    '\n' +
    '<div class="container">\n' +
    '    <br/>\n' +
    '    <ol class="breadcrumb">\n' +
    '        <li><a href="/#/podcasts">Podcasts</a></li>\n' +
    '        <li><a class="active"> {{ podcast.title }}</a></li>\n' +
    '    </ol>\n' +
    '\n' +
    '    <div>\n' +
    '        <div class="jumbotron podcast-details-header" ng-style="{ \'background-image\' : \'url(\'+ podcast.cover.url + \')\'}">\n' +
    '            <div class="information-area">\n' +
    '                <div class="information-text">\n' +
    '                    <h3><strong>{{ podcast.title }}</strong></h3>\n' +
    '                    <p>{{ podcast.totalItems }} Episodes</p>\n' +
    '                </div>\n' +
    '                <div class="action-button pull-right">\n' +
    '                    <button ng-click="refresh()" type="button" class="btn btn-default"><span class="glyphicon glyphicon-refresh"></span></button>\n' +
    '                    <a type="button" class="btn btn-default" href="/api/podcast/{{ podcast.id }}/rss" target="_blank"><span class="ionicons ion-social-rss"></a>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '<br/>\n' +
    '\n' +
    '\n' +
    '<!--<div class="col-xs-12 col-sm-12 col-md-3 col-lg-3">\n' +
    '    <div class="thumbnail">\n' +
    '        <img ng-src="{{podcast.cover.url}}" width="{{podcast.cover.width}}" height="{{podcast.cover.height}}" alt="">\n' +
    '        <div class="caption">\n' +
    '            <h5 class="text-center "><strong>{{ podcast.title }}</strong></h5>\n' +
    '            <p class="text-center">Nombre d\'épisode : {{ podcast.totalItems }}</p>\n' +
    '            <div class="col-lg-12 col-sm-12 col-md-12 col-xs-12 text-center">\n' +
    '                <button ng-click="refresh()" type="button" class="btn btn-default"><span class="glyphicon glyphicon-refresh"></span></button>\n' +
    '                <a type="button" class="btn btn-default" href="/api/podcast/{{ podcast.id }}/rss" target="_blank">RSS</a>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>-->\n' +
    '<div class="col-md-12 col-xs-12 col-sm-12 col-lg-12">\n' +
    '\n' +
    '    <tabset>\n' +
    '        <!--\n' +
    '        <tab ng-repeat="tab in tabs" heading="{{tab.title}}" active="tab.active" disabled="tab.disabled">\n' +
    '            <ng-include src="tab.templateUrl" ></ng-include>\n' +
    '        </tab>\n' +
    '        -->\n' +
    '        <tab heading="Episodes" active="tab.active" disabled="tab.disabled">\n' +
    '            <podcast-items-list podcast="podcast"></podcast-items-list>\n' +
    '        </tab>\n' +
    '        <tab heading="Edition">\n' +
    '            <podcast-edition podcast="podcast"></podcast-edition>\n' +
    '        </tab>\n' +
    '        <tab heading="Upload" ng-show="podcast.type == \'send\'">\n' +
    '            <podcast-upload podcast="podcast"></podcast-upload>\n' +
    '        </tab>\n' +
    '    </tabset>\n' +
    '\n' +
    '\n' +
    '</div>\n' +
    '    </div>\n' +
    '\n' +
    '\n' +
    '\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/podcast-details-edition.html',
    '<br/>\n' +
    '<accordion close-others="true">\n' +
    '    <accordion-group heading="Podcast" is-open="true">\n' +
    '        <form class="form-horizontal" role="form">\n' +
    '            <div class="form-group">\n' +
    '                <label for="title" class="col-sm-2 control-label">Titre</label>\n' +
    '                <div class="col-sm-10">\n' +
    '                    <input type="text" class="form-control" id="title" ng-model="podcast.title" required placeholder="Titre">\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '                <label for="url" class="col-sm-2 control-label">URL</label>\n' +
    '                <div class="col-sm-10">\n' +
    '                    <input type="url" class="form-control" id="url" ng-model="podcast.url" required placeholder="url">\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '                <div class="checkbox col-sm-offset-3">\n' +
    '                    <label>\n' +
    '                        <input type="checkbox" ng-model="podcast.hasToBeDeleted"> Suppression Auto\n' +
    '                    </label>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '                <label for="url" class="col-sm-2 control-label">Tags</label>\n' +
    '                <div class="col-sm-10">\n' +
    '                    <tags-input ng-model="podcast.tags" display-property="name" min-length="1" class="bootstrap">\n' +
    '                        <auto-complete source="loadTags($query)" min-length="2"></auto-complete>\n' +
    '                    </tags-input>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '                <label for="height" class="col-sm-2 control-label" >Type</label>\n' +
    '                <div class="col-sm-10" >\n' +
    '                    <select class="form-control" ng-model="podcast.type">\n' +
    '                        <option value="BeInSports">Be In Sports</option>\n' +
    '                        <option value="CanalPlus">Canal+</option>\n' +
    '                        <option value="JeuxVideoCom">Jeux Video Com</option>\n' +
    '                        <option value="JeuxVideoFR">Jeux Video Fr</option>\n' +
    '                        <option value="Parleys">Parleys</option>\n' +
    '                        <option value="Pluzz">Pluzz</option>\n' +
    '                        <option value="RSS">RSS</option>\n' +
    '                        <option value="send">Send</option>\n' +
    '                        <option value="Youtube">Youtube</option>\n' +
    '                    </select>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="form-group">\n' +
    '                <div class="col-sm-offset-2 col-sm-10">\n' +
    '                    <button ng-click="save()" class="btn btn-default">Sauvegarder</button>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </form>\n' +
    '    </accordion-group>\n' +
    '    <accordion-group heading="Cover">\n' +
    '        <form class="form-horizontal" role="form">\n' +
    '            <div class="form-group">\n' +
    '                <label for="url" class="col-sm-2 control-label">URL</label>\n' +
    '                <div class="col-sm-10">\n' +
    '                    <input type="url" class="form-control" id="url" ng-model="podcast.cover.url" required placeholder="url">\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '                <label for="width" class="col-sm-2 control-label">Lageur</label>\n' +
    '                <div class="col-sm-10">\n' +
    '                    <input type="number" class="form-control" id="width" ng-model="podcast.cover.width" required placeholder="url">\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="form-group">\n' +
    '                <label for="height" class="col-sm-2 control-label">Hauteur</label>\n' +
    '                <div class="col-sm-10">\n' +
    '                    <input type="number" class="form-control" id="height" ng-model="podcast.cover.height" required placeholder="url">\n' +
    '                </div>\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="form-group">\n' +
    '                <div class="col-sm-offset-2 col-sm-10">\n' +
    '                    <button ng-click="save()" class="btn btn-default">Sauvegarder</button>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </form>\n' +
    '    </accordion-group>\n' +
    '    <accordion-group heading="Actions">\n' +
    '        <button type="button" class="btn btn-warning" ng-click="deletePodcast()">\n' +
    '            <span class="glyphicon glyphicon-trash"></span> Delete\n' +
    '        </button>\n' +
    '    </accordion-group>\n' +
    '</accordion>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/podcast-details-episodes.html',
    '<br/>\n' +
    '<div ng-swipe-right="swipePage(-1)" ng-swipe-left="swipePage(1)">\n' +
    '    <div class="media clearfix"  ng-repeat="item in podcast.items | orderBy:\'-pubdate\' track by item.id">\n' +
    '        <div class="buttonList pull-right">\n' +
    '            <!-- Téléchargement en cours -->\n' +
    '        <span ng-show="item.status == \'Started\' || item.status == \'Paused\'" >\n' +
    '            <button ng-click="toggleDownload(item)" type="button" class="btn btn-primary "><i class="glyphicon glyphicon-play"></i><i class="glyphicon glyphicon-pause"></i></button>\n' +
    '            <button ng-click="stopDownload(item)" type="button" class="btn btn-danger"><span class="glyphicon glyphicon-stop"></span></button>\n' +
    '        </span>\n' +
    '\n' +
    '            <!-- Lancer le téléchargement -->\n' +
    '            <button ng-click="item.download()" ng-show="(item.status != \'Started\' && item.status != \'Paused\' ) && item.localUrl == null " type="button" class="btn btn-primary"><span class="glyphicon glyphicon-save"></span></button>\n' +
    '\n' +
    '            <!-- Lire dans le player -->\n' +
    '            <a ng-href="/#/podcast/{{ item.podcastId }}/item/{{ item.id }}/play" ng-show="item.localUrl != null" type="button" class="btn btn-success"><span class="ionicons ion-social-youtube"></span></a>\n' +
    '            \n' +
    '            <!-- Supprimer l\'item -->\n' +
    '            <button ng-click="remove(item)" ng-show="(item.status != \'Started\' && item.status != \'Paused\' )" type="button" class="btn btn-danger"><span class="glyphicon glyphicon-remove"></span></button>\n' +
    '\n' +
    '            <!-- Menu complémentaire -->\n' +
    '            <div class="btn-group" dropdown is-open="isopen">\n' +
    '                <button type="button" class="btn btn-default dropdown-toggle" dropdown-toggle><i class="ionicons ion-android-more"></i></button>\n' +
    '                <ul class="dropdown-menu dropdown-menu-right" role="menu">\n' +
    '                    <li ng-show="item.localUrl != null"><a ng-href="{{ item.localUrl }}"><span class="glyphicon glyphicon-play text-success"></span> Lire</a></li>\n' +
    '                    <li ng-show="item.localUrl != null">\n' +
    '                        <a ng-hide="isInPlaylist(item)" ng-click="addOrRemoveInPlaylist(item)">\n' +
    '                            <span class="glyphicon glyphicon-plus text-primary"></span> Ajouter à la Playlist\n' +
    '                        </a>\n' +
    '                        <a ng-show="isInPlaylist(item)" ng-click="addOrRemoveInPlaylist(item)">\n' +
    '                            <span class="glyphicon glyphicon-minus text-primary"></span> Retirer de la Playlist\n' +
    '                        </a>\n' +
    '                    </li>\n' +
    '                    <li><a ng-href="{{ item.url }}"><span class="glyphicon glyphicon-globe text-info"></span> Lire en ligne</a></li>\n' +
    '                    <li><a ng-click="reset(item)"><span class="glyphicon glyphicon-repeat"></span> Reset</a></li>\n' +
    '                </ul>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <a class="pull-left" ng-href="#/podcast/{{podcast.id}}/item/{{item.id}}">\n' +
    '            <img ng-src="{{item.cover.url}}" width="100" height="100" style="">\n' +
    '\n' +
    '        </a>\n' +
    '        <div class="media-body">\n' +
    '            <h4 class="media-heading">{{ item.title }}</h4>\n' +
    '            <p class="description hidden-xs hidden-sm branch-name">{{item.description | htmlToPlaintext | characters : 130 }}</p>\n' +
    '            <p><strong>{{item.pubdate | date : \'dd/MM/yyyy à HH:mm\' }}</strong></p>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <div ng-show="podcast.totalItems > itemPerPage" class="text-center">\n' +
    '        <pagination items-per-page="itemPerPage" max-size="10" boundary-links="true" total-items="podcast.totalItems" ng-model="currentPage" ng-change="loadPage()" class="pagination pagination-centered" previous-text="&lsaquo;" next-text="&rsaquo;" first-text="&laquo;" last-text="&raquo;"></pagination>\n' +
    '    </div>\n' +
    '</div>\n' +
    '\n' +
    '        ');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/podcast-details-upload.html',
    '<br/>\n' +
    '<div class="upload-item">\n' +
    '    <div class="drop-box"\n' +
    '         ng-file-drop="onFileSelect($files)"\n' +
    '         ng-file-drag-over-class="dropping"\n' +
    '         ng-file-drag-over-delay="100">\n' +
    '        <div class="text-center clearfix upload-text">\n' +
    '            Déposer un ou des fichiers ici\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('ps.partial');
} catch (e) {
  module = angular.module('ps.partial', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('html/podcasts-list.html',
    '<div class="container podcastlist" style="margin-top: 15px;">\n' +
    '    <div class="row">\n' +
    '        <div class="col-lg-2 col-md-3 col-sm-4 col-xs-6 thumb" ng-repeat="podcast in podcasts">\n' +
    '            <a ng-href="#/podcast/{{ podcast.id }}" >\n' +
    '                <img class="img-responsive img-rounded" ng-src="{{podcast.cover.url}}" width="{{podcast.cover.width}}" height="{{podcast.cover.height}}" />\n' +
    '            </a>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
    '\n' +
    '');
}]);
})();

angular.module('ps.dataService.donwloadManager', [
    'restangular'
])
    .factory('DonwloadManager', function(Restangular) {
    'use strict';
    return {
        download: function (item) {
            return Restangular.one("item").customGET(item.id + "/addtoqueue");
        },
        stopDownload: function (item) {
            return Restangular.one("task").customPOST(item.id, "downloadManager/stopDownload");
        },
        toggleDownload: function (item) {
            return Restangular.one("task").customPOST(item.id, "downloadManager/toogleDownload");
        },
        stopAllDownload: function () {
            return Restangular.one("task").customGET("downloadManager/stopAllDownload");
        },
        pauseAllDownload: function () {
            return Restangular.one("task").customGET("downloadManager/pauseAllDownload");
        },
        restartAllCurrentDownload: function () {
            return Restangular.one("task").customGET("downloadManager/restartAllCurrentDownload");
        },
        removeFromQueue: function (item) {
            return Restangular.one("task").customDELETE("downloadManager/queue/" + item.id);
        },
        updateNumberOfSimDl: function (number) {
            return Restangular.one("task").customPOST(number, "downloadManager/limit");
        },
        dontDonwload: function (item) {
            return Restangular.one("task").customDELETE("downloadManager/queue/" + item.id + "/andstop");
        },
        getDownloading : function() {
            return Restangular.one('task').all("downloadManager/downloading").getList();
        },
        getNumberOfSimDl : function() {
            return Restangular.one("task/downloadManager/limit").get();
        }
    };
});
/**
 * Created by kevin on 01/11/14.
 */
angular.module('ps.dataService.item', [
    'restangular'
])
    .factory('itemService', function (Restangular) {
        'use strict';
        return {
            search: search,
            findById : findById,
            getItemForPodcastWithPagination : getItemForPodcastWithPagination,
            restangularizePodcastItem : restangularizePodcastItem
        };

        function search(searchParameters) {
            //{term : 'term', tags : $scope.searchTags, size: numberByPage, page : $scope.currentPage - 1, direction : $scope.direction, properties : $scope.properties}
            return Restangular.one("item/search")
                .post(null, searchParameters)
                .then(function (responseFromServer) {
                    responseFromServer.content = restangularizedItems(responseFromServer.content);
                    return responseFromServer;
                });
        }

        function findById(podcastId, itemId) {
            return Restangular.one("podcast", podcastId).one("items", itemId).get();
        }

        function getItemForPodcastWithPagination(podcast, pageParemeters) {
            return podcast.one("items").post(null, pageParemeters);
        }

        function restangularizePodcastItem (podcast, items) {
            return Restangular.restangularizeCollection(podcast, items, 'items');
        }

        // Private Function :

        // transformation
        function restangularizedItems(itemList) {
            var restangularList = [];
            angular.forEach(itemList, function (value) {
                restangularList.push(Restangular.restangularizeElement(Restangular.one('podcast', value.podcastId), value, 'items'));
            });
            return restangularList;
        }
    });

/**
 * Created by kevin on 02/11/14.
 */

angular.module('ps.dataService.podcast', [
    'restangular'
]).factory('podcastService', function (Restangular) {
    'use strict';

    return {
        findById    :   findById,
        findAll     :   findAll
    };

    function findById(podcastId) {
        return Restangular.one('podcast', podcastId).get();
    }

    function findAll() {
        return Restangular.all('podcast').getList();
    }
});
/**
 * Created by kevin on 01/11/14.
 */

angular.module('ps.dataService.tag', [
    'restangular'
]).factory('tagService', function (Restangular) {
    'use strict';
    var baseAll = Restangular.all('tag');

    return {
        getAll : getAll,
        search : search
    };



    function getAll() {
        return baseAll.get();
    }

    function search(query) {
        return baseAll.post(null, {name : query});
    }
});
'use strict';

angular.module('ps.podcast.details.edition', [])
    .directive('podcastEdition', function () {
        return {
            restrcit : 'E',
            templateUrl : 'html/podcast-details-edition.html',
            scope : {
                podcast : '='
            },
            controller : 'podcastEditionCtrl'
        };
    })
    .controller('podcastEditionCtrl', function ($scope, Restangular, $location) {
        var tags = Restangular.all("tag");

        $scope.loadTags = function (query) {
            return tags.post(null, {name : query});
        };

        $scope.save = function () {
            var podcastToUpdate = _.cloneDeep($scope.podcast);
            podcastToUpdate.items = null;
            $scope.podcast.patch(podcastToUpdate)
                .then(function (patchedPodcast){
                    _.assign($scope.podcast, patchedPodcast);
                })
                .then(function () {
                    $scope.$emit('podcastEdition:save');
                });
        };
        $scope.deletePodcast = function () {
            $scope.podcast.remove().then(function () {
                $location.path('/podcasts');
            });
        };
    });

'use strict';

angular.module('ps.podcast.details.episodes', [
    'ps.player',
    'AngularStompDK'
])
    .directive('podcastItemsList', function(){
        return {
            restrcit : 'E',
            templateUrl : 'html/podcast-details-episodes.html',
            scope : {
                podcast : '='
            },
            controller : 'podcastItemsListCtrl'
        };
    })
    .constant('PodcastItemPerPage', 10)
    .controller('podcastItemsListCtrl', function ($scope, DonwloadManager, PodcastItemPerPage, ngstomp, itemService, playlistService ) {
        $scope.currentPage = 1;
        $scope.itemPerPage = PodcastItemPerPage;

        var webSocketUrl = "/topic/podcast/".concat($scope.podcast.id);

        ngstomp
            .subscribe(webSocketUrl, function (message) {
                var item = JSON.parse(message.body);
                var elemToUpdate = _.find($scope.podcast.items, { 'id': item.id });
                _.assign(elemToUpdate, item);
            }, $scope);

        $scope.loadPage = function() {
            $scope.currentPage = ($scope.currentPage < 1) ? 1 : ($scope.currentPage > Math.ceil($scope.totalItems / PodcastItemPerPage)) ? Math.ceil($scope.totalItems / PodcastItemPerPage) : $scope.currentPage;
            return itemService.getItemForPodcastWithPagination($scope.podcast, {size: PodcastItemPerPage, page : $scope.currentPage - 1, direction : 'DESC', properties : 'pubdate'})
                .then(function(itemsResponse) {
                    $scope.podcast.items = itemService.restangularizePodcastItem($scope.podcast, itemsResponse.content);
                    $scope.podcast.totalItems = itemsResponse.totalElements;
                });
        };

        $scope.loadPage();
        $scope.$on("podcastItems:refresh", function () {
            $scope.currentPage = 1;
            $scope.loadPage();
        });

        $scope.remove = function (item) {
            item.remove().then(function() {
                $scope.podcast.items = _.reject($scope.podcast.items, function(elem) {
                    return (elem.id === item.id);
                });
            }).then(function() {
                playlistService.remove(item);
            }).then($scope.loadPage);
        };


        $scope.reset = function (item) {
            return item.reset().then(function (itemReseted) {
                var itemInList = _.find($scope.podcast.items, { 'id': itemReseted.id });
                _.assign(itemInList, itemReseted);
                playlistService.remove(itemInList);
            });
        };

        $scope.addOrRemoveInPlaylist = function (item) {
            playlistService.addOrRemove(item);
        };

        $scope.isInPlaylist = function(item) {
            return playlistService.contains(item);
        };

        $scope.swipePage = function(val) {
            $scope.currentPage += val;
            $scope.loadPage();
        };

        $scope.stopDownload = DonwloadManager.stopDownload;
        $scope.toggleDownload = DonwloadManager.toggleDownload;
    });

angular.module('ps.podcast.details', [
    'ps.podcast.details',
    'ps.podcast.details.episodes',
    'ps.podcast.details.edition',
    'ps.podcast.details.upload',
    'restangular'
]).controller('PodcastDetailCtrl', function ($scope, podcast, $routeParams, Restangular) {

        $scope.podcast = podcast;

        function refreshItems () {
            $scope.$broadcast('podcastItems:refresh');
        }

        $scope.refresh = function () {
            Restangular.one("task").customPOST($scope.podcast.id, "updateManager/updatePodcast/force")
                .then(refreshItems);
        };
        $scope.$on("podcastEdition:save", refreshItems);

    });
'use strict';

angular.module('ps.podcast.details.upload', [
    'angularFileUpload'
])
    .directive('podcastUpload', function ($log) {
        return {
            restrcit : 'E',
            templateUrl : 'html/podcast-details-upload.html',
            scope : {
                podcast : '='
            },
            controller : 'podcastUploadCtrl'
        };
    })
    .controller('podcastUploadCtrl', function ($scope, $log) {
        $scope.onFileSelect = function($files) {
            var formData;
            angular.forEach($files, function (file) {
                formData = new FormData();
                formData.append('file', file);
                $scope.podcast.all('items')
                    .withHttpConfig({transformRequest: angular.identity})
                    .customPOST(formData, 'upload', undefined, {'Content-Type': undefined}).then(function (item) {
                        $log.info("Upload de l'item suivant");
                        $log.info(item);
                    });
            });
        };
    });

angular.module('ps.search.item', [
    'ps.dataService.item',
    'ps.dataService.tag',
    'ps.player',
    'ps.dataService.donwloadManager'
])
    .constant('ItemPerPage', 12)
    .controller('ItemsSearchCtrl', function ($scope, $cacheFactory, $location, itemService, tagService, ngstomp, DonwloadManager, ItemPerPage, playlistService) {
        'use strict';

        // Gestion du cache de la pagination :
        var cache = $cacheFactory.get('paginationCache') || $cacheFactory('paginationCache');

        $scope.changePage = function() {
            $scope.searchParameters.page = ($scope.currentPage <= 1) ? 1 : ($scope.currentPage > Math.ceil($scope.totalItems / ItemPerPage)) ? Math.ceil($scope.totalItems / ItemPerPage) : $scope.currentPage;
            $scope.searchParameters.page -= 1;
            itemService.search($scope.searchParameters).then(function(itemsResponse) {

                $scope.items = itemsResponse.content;
                $scope.totalPages = itemsResponse.totalPages;
                $scope.totalItems = itemsResponse.totalElements;

                cache.put('search:currentPage', $scope.currentPage);
                cache.put('search:currentWord', $scope.term);
                cache.put('search:currentTags', $scope.searchTags);
                cache.put("search:direction", $scope.direction);
                cache.put("search:properties", $scope.properties);

                $location.search("page", $scope.currentPage);
            });
        };

        $scope.$on('$routeUpdate', function(){
            if ($scope.currentPage !== $location.search().page) {
                $scope.currentPage = $location.search().page || 1;
                $scope.changePage();
            }
        });

        $scope.swipePage = function(val) {
            $scope.currentPage += val;
            $scope.changePage();
        };

        //** Item Operation **//
        $scope.remove = function (item) {
            return item.remove().then(function(){
                playlistService.remove(item);
                return $scope.changePage();
            });
        };

        $scope.reset = function (item) {
            return item.reset().then(function (itemReseted) {
                var itemInList = _.find($scope.items, { 'id': itemReseted.id });
                _.assign(itemInList, itemReseted);
                playlistService.remove(itemInList);
            });
        };

        // Longeur inconnu au chargement :
        //{term : 'term', tags : $scope.searchTags, size: numberByPage, page : $scope.currentPage - 1, direction : $scope.direction, properties : $scope.properties}
        $scope.totalItems = Number.MAX_VALUE;
        $scope.maxSize = 10;

        $scope.searchParameters = {};
        $scope.searchParameters.size = ItemPerPage;
        $scope.currentPage = cache.get("search:currentPage") || 1;
        $scope.searchParameters.term = cache.get("search:currentWord") || undefined;
        $scope.searchParameters.searchTags = cache.get("search:currentTags") || undefined;
        $scope.searchParameters.direction = cache.get("search:direction") || undefined;
        $scope.searchParameters.properties = cache.get("search:properties") || undefined;

        $scope.changePage();

        //** DownloadManager **//
        $scope.stopDownload = DonwloadManager.stopDownload;
        $scope.toggleDownload = DonwloadManager.toggleDownload;
        $scope.loadTags = tagService.search;

        //** Playlist Manager **//
        $scope.addOrRemove = function(item) {
            return playlistService.addOrRemove(item);
        };
        $scope.isInPlaylist = function(item) {
            return playlistService.contains(item);
        };
        
        //** WebSocket Subscription **//
        var webSocketUrl = "/topic/download";
        ngstomp.subscribe(webSocketUrl, updateItemFromWS, $scope);

        function updateItemFromWS(message) {
            var item = JSON.parse(message.body);

            var elemToUpdate = _.find($scope.items, { 'id': item.id });
            if (elemToUpdate)
                _.assign(elemToUpdate, item);
        }

    });