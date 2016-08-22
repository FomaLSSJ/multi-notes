(function() {
    'use strict';
    angular.module('app', ['ngSanitize', 'ui.codemirror', 'ui.bootstrap']);
})();

(function() {
    'use strict';
    
    angular.module('app').controller('NotesController', NotesController);
    angular.module('app').controller('ModalController', ModalController);
    
    NotesController.$inject = ['$scope', '$sce', '$uibModal', '$timeout'];
    ModalController.$inject = ['$scope', '$uibModalInstance', '$http', '$timeout', 'data'];
    
    function NotesController($scope, $sce, $uibModal, $timeout) {
        var vm = this;
        
        var socket = io.connect();
        
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
        
        socket.on('connect', function(data) {
            vm.init(data);
        });
        
        socket.on('message', function(msg) {
            vm.messages.push(msg);
            $scope.$apply();
        });
        
        socket.on('roster', function(names) {
            vm.roster = names;
            $scope.$apply();
        });
        
        socket.on('notes', function(notes) {
            vm.notes = notes;
            $scope.$apply();
        });
        
        socket.on('owners', function(owners) {
            vm.owners = owners;
            $scope.$apply();
        });
        
        socket.on('already', function(data) {
            vm.noteOwned = data;
        });
        
        function init(data) {
            vm.setName();
            vm.getNotes();
        }
        
        function getNotes() {
            socket.emit('notes');
        }
        
        function send() {
            console.log('Sending message:', vm.text);
            socket.emit('message', vm.text);
            vm.text = '';
        }
        
        function setName() {
            socket.emit('identify');
        }
        
        function selectNote(index) {
            socket.emit('select', index);
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
            socket.emit('dropOwned');
        }
        
        function noteModal(object) {
            var data = {};
            
            if (typeof object !== 'undefined') {
                vm.selectNote(object.note._id);
                data = {object: object.note, button: 'Edit'};
            } else {
                data = {button:'Save'};
            }
            
            $timeout(function() {
                if ((typeof object === 'undefined') || (vm.noteOwned.id !== object.note._id)) {
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
                    });
                } else {
                    alert(vm.noteOwned.message);
                }
            }, 100);
        }
    }
    
    function ModalController($scope, $uibModalInstance, $http, $timeout, data) {
        var vm = this;
        
        vm.editor = {
            data: data,
            options: {
                lineWrapping : true,
                lineNumbers: true,
                autoRefresh: true
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
            $uibModalInstance.dismiss('cancel');
        }
    }
})();
