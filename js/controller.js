var root = new Vue({
    el: '#vue-root',
    data: {
        devices: {},
        isDeviceInfoShow: false,
        curType: 'wall',
        curContainer: null,
    },
    computed: {
        addedList: function () {
            var list = [];
            for (var i in deviceToMesh) {
                if (deviceToMesh[i].device.type === this.curType) {
                    list.push(deviceToMesh[i].device);
                }
            }
            return (this.devices[this.curType] && this.devices[this.curType].list.length > -1)?list : [];
        }
    },
    mounted: function () {
        init();
    },
    methods: {
        /**
         * 切换当前选中的设备类型
         * @Author   chenht
         * @DateTime 2017-04-11
         * @param    {type:要改变的类型}
         */
        changeType: function (type) {
            this.curType = type;
        },
        /**
         * 开始添加某一个,或多个设备
         * @Author   chenht
         * @DateTime 2017-04-11
         * @param    {device:设备}
         */
        addDevices: function (device) {
            if (user.state === 'selecting') {
                meshs.selectedObj.state='normal';
                meshs.selectedObj=null;
            } else if (user.state === 'moving') {
                operations.cancelMov();
            }

            user.state='normal';

            if (device) {
                if (device.needContainer && root.devices.cabinet) {
                    operations.newObj(device, root.devices.cabinet.list[0]);
                } else {
                    operations.newObj(device);  
                } 
            } else {
                var devices = [];
                this.devices[this.curType].list.forEach(function (v) {
                    if (v.readyToAdd) {
                        devices.push(v);
                    } 
                });
                if (devices.length > 0) {
                    operations.newObj(devices, root.devices.cabinet.list[0]);
                }  
            }     
        },   
        /**
         * 保存并更新别名
         * @Author   chenht
         * @DateTime 2017-04-17
         */
        saveName: function () {
            this.curContainer.childrenList.update();
        },
        /**
         * [addToBuffer description]
         * @Author   chenht
         * @DateTime 2017-04-21
         * @param    {[type]}   device [description]
         */
        addToBuffer: function (device) {
            if (device.needContainer) {
                Vue.set(device, 'readyToAdd', false);
                device.readyToAdd = true;
            } else {
                this.addDevices(device);
            }
        },
        showDeviceInfo: function (mesh) {
            if (mesh) {
                this.curContainer = mesh.device;
                this.isDeviceInfoShow = true;
            } else {
                this.isDeviceInfoShow = false;
            }
        },
        /**
         * 从机柜删除一个设备
         * @Author   chenht
         * @DateTime 2017-04-21
         * @param    {[type]}   device [description]
         * @return   {[type]}          [description]
         */
        deleteDeviceFromContainer: function (device) {
            device.addToContainer(this.devices[device.type]);
        },
        /**
         * 从机柜移动一个设备
         * @Author   chenht
         * @DateTime 2017-04-21
         * @param    {[type]}   device [description]
         * @return   {[type]}          [description]
         */
        moveDeviceFromContainer: function (device) {
            this.addDevices(device);
        },
        selectDevice: function (v) {            
            if (user.state === 'selecting') {
                meshs.selectedObj.state='normal';
                meshs.selectedObj=null;
            } else if (user.state === 'moving') {
                operations.cancelMov();
            }
            meshs.selectedObj = deviceToMesh[v.code];
            deviceToMesh[v.code].state = 'selected';  
            user.state = 'selecting';
        },

        /* 保存场景 */
        scene_save: function(){
            var simpleScene = new THREE.Scene();

            scene.traverse(function(node){
                if(node.device){        //将带有设备信息的物体的uuid和deviceCode保存到userData映射表
                    node.name.deviceCode = node.device.code;
                    node.name.label = node.device.name;
                }
                if(node.name && node.occupiedFloor){       //保存机柜占用的地板坐标
                    var usedFloor = [];
                    for(var i=0;i<node.occupiedFloor.length;i++){
                        usedFloor.push({
                            x: node.occupiedFloor[i].x,
                            y: node.occupiedFloor[i].y,
                        });
                    }
                    node.name.usedFloor = JSON.stringify(usedFloor);
                }
            });

            for(var i=0;i<scene.children.length;i++){
                if(scene.children[i].name.type != "floor"){         //传给后台的数据中不包括地板
                    simpleScene.children.push(scene.children[i]);
                }
            }

            sceneIO.save(simpleScene);
        },
        scene_import: function(){
            allDevices.forEach(function (v) {
                if (root.devices[v.type].list.indexOf(v) === -1) {
                    root.devices[v.type].list.push(v);
                    v.parent = root.devices[v.type];
                }    
            });

            var loader = new THREE.ObjectLoader();
            var sceneData = sceneIO.import(JSON.parse(localStorage.getItem('scene')));
            sceneIO.conversion(sceneData.object);         //根据物体的name属性进行转化

            loader.parse(sceneData,function(obj){
                scene.children = obj.children;
                initFloors();
                initScene();
                conversion(scene);
 
                user.state = 'moving';
                user.state = 'normal';

            });

            //遍历所有物体，为其添加设备信息
            function conversion(node){
                if(node.material){        //过滤光源等没有材质的物体
                    node.material = node.material.clone();
                }
                if(Object.keys(model).indexOf(node.name.type) !== -1){
                    var mesh = node;

                    var device;

                    // 如果是唯一设备
                    if (model[node.name.type].once) {

                        var ifDeviceExist = false; // 该设备是否存在

                        /*  为设备设置type与typeName */
                        if (node.name.deviceCode) {
                            deviceList.forEach(function (v) {
                                if (v.code === node.name.deviceCode) {
                                    ifDeviceExist = true;
                                    return false;
                                }
                            });
                        } 

                        if (!ifDeviceExist) {
                            node.parent.remove(node);
                            return;
                        }

                        root.devices[node.name.type].list.forEach(function (v) {
                            if (v.code === node.name.deviceCode) {
                                device = v;
                                return false;
                            }
                        });

                    } else {

                        device = new Device({
                            model: model[node.name.type],
                            once: model[node.name.type].once,
                            needContainer: model[node.name.type].needContainer,
                            parent: null, // scene.childrenList,
                            code: node.name.deviceCode || null,
                            type: node.name.type,
                            typeName: model[node.name.type].typeName,
                            name: node.name.label
                        });
                    }

                    _bindDevice(mesh, device);  // 为场景内物体绑定设备信息
                    if (mesh.name.usedFloor) {
                        _setOccupied(JSON.parse(mesh.name.usedFloor).map(function (v) {     //设置地板占用情况
                            return meshs.floors[v.x][v.y];
                        }), mesh);
                    }
                }
                if(node.name.type === "nameTag"){
                    var name = node.parent.name.label || "未命名";

                    var nameImg = sceneIO.createNameTagCanvas(name);
                    node.material.map = new THREE.Texture(nameImg);
                    node.material.map.needsUpdate = true;
                    node.parent.nameTag = node;
                }

                if(node.children && node.children.length !== 0){
                    for(var i=0;i<node.children.length;i++){
                        conversion(node.children[i]);

                    }
                }

                if(node.addToThis){         //对容器类物体做特殊处理
                    var list = [];
                    node.children.forEach(function (v) {
                        if (v.name.type !== 'nameTag') {
                            list.push(v);
                        }
                    });
                    // console.log(node.device.childrenList.list.)
                    list.forEach(function (v) {
                        v.device.addToContainer(node.device.childrenList);
                        // node.device.childrenList.push(v.device);
                    });

                }
            }
        },
        scene_remove: function(){
            localStorage.removeItem('scene');
           //console.log(JSON.parse(localStorage.getItem('userdata')));
        },
    }
});