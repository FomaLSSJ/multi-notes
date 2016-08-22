(function() {
    'use strict';
    angular.module('app', ['ngSanitize', 'ui.codemirror', 'ui.bootstrap']);
})();

(function() {
    'use strict';
    
    angular.module('app').factory('SocketIO', SocketIO);
    angular.module('app').controller('NotesController', NotesController);
    angular.module('app').controller('ModalController', ModalController);
    
    SocketIO.$inject = ['$rootScope'];
    NotesController.$inject = ['$scope', '$sce', '$uibModal', '$timeout', 'SocketIO'];
    ModalController.$inject = ['$scope', '$uibModalInstance', '$http', '$timeout', 'SocketIO', 'data'];
    
    function SocketIO($rootScope) {
        var socket = io.connect();
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {  
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            }
        };
    }
    
    function NotesController($scope, $sce, $uibModal, $timeout, SocketIO) {
        var vm = this;
        
        //var socket = io.connect();
        
        vm.messages = [];
        vm.roster = [];
        vm.notes = [];
        vm.owners = [];
        
        vm.noteOwned = {};
        
        vm.init = init;
        vm.send = send;
        vm.getNotes = getNotes;
        vm.setName = setName;
        vm.selectNote = selectNote;
        vm.getOwner = getOwner;
        vm.dropOwned = dropOwned;
        vm.noteModal = noteModal;
        
        //$scope.name = '';
        //$scope.text = '';
        
        SocketIO.on('connect', function(data) {
            vm.init(data);
        });
        
        SocketIO.on('message', function(msg) {
            vm.messages.push(msg);
            //$scope.$apply();
        });
        
        SocketIO.on('roster', function(names) {
            vm.roster = names;
            //$scope.$apply();
        });
        
        SocketIO.on('notes', function(notes) {
            vm.notes = notes;
            //$scope.$apply();
        });
        
        SocketIO.on('owners', function(owners) {
            vm.owners = owners;
            //$scope.$apply();
        });
        
        SocketIO.on('already', function(data) {
            vm.noteOwned = data;
        });
        
        function init(data) {
            vm.setName();
            vm.getNotes();
        }
        
        function getNotes() {
            SocketIO.emit('notes');
        }
        
        function send() {
            console.log('Sending message:', vm.text);
            SocketIO.emit('message', vm.text);
            vm.text = '';
        }
        
        function setName() {
            SocketIO.emit('identify');
        }
        
        function selectNote(index) {
            SocketIO.emit('select', index);
        }
        
        function getOwner(object) {
            var owner = '';
            vm.owners.forEach(function(own) {
                if (own.id == object.note._id) {
                    owner = '<div class="label label-primary pull-right">' + own.owner + '</div>';
                }
            });
            return owner;
        }
        
        function dropOwned() {
            SocketIO.emit('dropOwned');
        }
        
        function noteModal(object) {
            var data = {};
            
            if (typeof object !== 'undefined') {
                vm.selectNote(object.note._id);
                data = {object: object.note, button: false};
            } else {
                data = {button: 'nocursor'};
            }
            
            $timeout(function() {
                if ((typeof object === 'undefined') || (vm.noteOwned.id !== object.note._id)) {
                    data.read = false;
                } else {
                    data.read = true;
                    //alert(vm.noteOwned.message);
                }
                
                var modalInstance = $uibModal.open({
                    templateUrl: '/partials/note-create',
                    controller: 'ModalController as vm',
                    resolve: {
                        data: function() {
                            return data;
                        }
                    }
                });
            
                modalInstance.result.then(function(res) {
                    vm.selected = res;
                    vm.getNotes();
                }, function () {
                    vm.dropOwned();
                    vm.getNotes();
                });
            }, 100);
        }
    }
    
    function ModalController($scope, $uibModalInstance, $http, $timeout, SocketIO, data) {
        var vm = this;
        
        vm.editor = {
            data: data,
            options: {
                lineWrapping : true,
                lineNumbers: true,
                autoRefresh: true,
                readOnly: data.read,
                onLoad: function(cm) {
                    vm.init();
                    if (typeof data.object !== 'undefined') {
                        SocketIO.on('change', function(object) {
                            if (data.object._id === object.id) {
                                cm.replaceRange(object.change.text, object.change.from, object.change.to);
                            }
                        });
                        cm.on('change', function(e, c) {
                            SocketIO.emit('change', { id: data.object._id, change: c });
                        });
                    }
                }
            }
        };
        
        vm.init = init;
        vm.ok = ok;
        vm.cancel = cancel;
        
        if (typeof data.object !== 'undefined') {
            vm.editor.text = data.object.text;
            vm.note = {
                title: data.object.title,
                type: data.object.type
            };
        }
        
        function init() {
            $timeout(function() {
                vm.editor.refresh = true;
            }, 100);
        }
        
        function ok() {
            $http({
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                url: '/note/create',
                data: $.param({
                    title: vm.note.title,
                    text: vm.editor.text,
                    type: vm.note.type
                })
            }).then(function(res) {
                $uibModalInstance.close(res);
            });
        }

        function cancel() {
            if (typeof data.object !== 'undefined') {
                $http({
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    url: '/note/update',
                    data: $.param({
                        id: vm.editor.data.object._id,
                        title: vm.note.title,
                        text: vm.editor.text,
                        type: vm.note.type
                    })
                }).then(function(res) {
                    $uibModalInstance.dismiss('cancel');
                });
            }
        }
    }
})();
