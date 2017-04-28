(function () {
    var model = {
        size: {
            x: 2,
            y: 2
        },
        name: {
            type:'cabinet'
        },
        height: 12,
        above: 0,
        class: ['obj', 'cabinet'],
        highlightColor: color.objHignlight,
        once: false, 
        needContainer: false,
        showAddSymbol: function () {
            this.addSymbol = new THREE.Mesh(new THREE.CubeGeometry(1,1,1), new THREE.MeshBasicMaterial({color: "#ff0000"}));
            this.addSymbol.position.y = 10;
            recover.pushAllAddSymbol(this);
            this.add(this.addSymbol);
        },
        addToThis: function (device) {
            var model = device.model;
            var itemsCanBeAdded = ['cabinet', 'typeA', 'battery'];
            var flag = false; // 指示是否有对应的类型与itemsCanBeAdded中相同。
            model.class.forEach(function (v) {
                if (itemsCanBeAdded.indexOf(v) !== -1) {
                    flag = true;
                    return false;
                }
            });
            // 将物体添加到该容器
            if (flag) {
                console.log('添加成功！');
                /**
                 * 如果设备需要容器存放(即单独的设备，而不是机柜)
                 */
                if (device.needContainer) {
                    device.addToContainer(this.device.childrenList);
                } else {
                    var _this = this;
                    /**
                     * 如果自己整合到自己的话则：
                     */
                    if (this.device === device) {
                        device = {
                            childrenList: device.childrenList
                        };
                        this.device.childrenList = new ChildrenList(this.device);
                    } else {
                        delete deviceToMesh[device.code];
                    }
                    /*
                     * 在生成单个机柜的时候，会将临时物体加入新生成的物体，
                     * 而临时物体没有onCreate，所以没有childrenList属性
                     */
                    if (device.childrenList) {
                        var length = device.childrenList.list.length;
                        /**
                         * 之所以不用
                         * device.childrenList.list.forEach()
                         * 是因为在新建的时候设备依然是属于未添加的组中，而非临时机柜中。
                         */
                        while (length-- > 0) {
                            device.childrenList.list[length].addToContainer(_this.device.childrenList);
                        }
                    }  
                }
                return true;
            } else {
                console.log('无法添加该类物体！');
                return false;
            }
        },
        onCreate: function () {
            this.device.childrenList = new ChildrenList(this.device);
        },
        showDeviceInfo: function () {
            root.showDeviceInfo(this);
        },
        hideDeviceInfo: function () {
            root.showDeviceInfo(false);                
        },
        afterSelected: function(){
            //镜头移动动画
            camera.moveTo(this.position.x, this.position.y, this.position.z,0.5);
        }
    };
    deviceList.push({type:'机柜', code:''});

    var manager = new THREE.LoadingManager();
    manager.onLoad = function () {
        
    };

    loadModel('cabinet', model, '机柜');
    loadObj('cabinet', './obj/cabinet.obj', manager, [2,2,2]);
    loadTex('./img/cabinet/cabinet.jpg', manager, function (texture) {
        loadMat('cabinet', new THREE.MeshLambertMaterial({map: texture}));
    });

    recover.addRecover('allAddSymbol', 'v.remove(v.addSymbol); delete v.addSymbol');
})();