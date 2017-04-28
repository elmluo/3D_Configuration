/**
 * 用户状态
 * @type {Object}
 */
var user = {};
Object.defineProperties(user, {
    state: {
        set: function (s) {
            var validList = ['normal', 'moving', 'selecting'];
            if (s === this._state || validList.indexOf(s) === -1) { // 与当前状态一致或非法，返回
                return;
            }
            __leaveUserFn[this._state].call(this); // 执行离开方法
            __enterUserFn[s].call(this); // 执行进入方法
            this._state = s;
        },
        get: function () {
            return this._state;
        }
    },
    _state: {
        value: 'normal',
        writable: true
    }
});
/**
 * 用户的状态
 * @type {Object}
 */
var __leaveUserFn = { // 离开状态的方法
    normal: function function_name() {
        canvas.removeEventListener('dblclick', handeler.onMouseClickSelect); //解除绑定鼠标点击事件1

        console.log('<-User leaving normal');
    }, 
    moving: function function_name() {
        canvas.removeEventListener('mousemove', handeler.onMouseMove); // 解除绑定鼠标移动事件
        canvas.removeEventListener('dblclick', handeler.onMouseClickConfirm); // 解除绑定鼠标点击事件2
        canvas.removeEventListener('mouseup', handeler.onMouseRightClick); // 解除绑定鼠标右键事件
        recover.allHighlight();

        console.log('<-User leaving moving');
    }, 
    selecting: function function_name() {
        canvas.removeEventListener('dblclick', handeler.onMouseClickSelect); //解除绑定鼠标点击事件1
        console.log('<-User leaving selecting');
    }
};
var __enterUserFn = { // 进入状态的方法
    normal: function function_name() {
        canvas.addEventListener('dblclick', handeler.onMouseClickSelect); // 绑定鼠标点击事件1
        intersecting.changeTarget(['obj']);

        console.log('->User entering normal');
    }, 
    moving: function function_name() {
        canvas.addEventListener('mousemove', handeler.onMouseMove);// 绑定鼠标移动事件
        canvas.addEventListener('dblclick', handeler.onMouseClickConfirm); // 绑定鼠标点击事件2
        canvas.addEventListener('mouseup', handeler.onMouseRightClick); // 绑定鼠标右键事件
        intersecting.changeTarget(['floor']);

        console.log('->User entering moving');
    }, 
    selecting: function function_name() {
        canvas.addEventListener('dblclick', handeler.onMouseClickSelect); // 绑定鼠标点击事件1
        intersecting.changeTarget(['obj']);

        console.log('->User entering selecting');
    }
};

/**
 * 恢复物体状态
 * @type {Object}
 */
var recover = {
    _highlightList: [],
    allHighlight: function () { // 恢复高亮列表里的高亮
        this._highlightList.forEach(function (v) {
            v.unHighlight();
            v.hide();
        });
        _highlightList = [];
    },
    pushHighlight: function (h) {
        this._highlightList.push(h);
    },
    all: function () {
        for (var i in this) {
            if (this[i] instanceof Function && i !== 'all' && i !== 'addRecover' && !i.match(/push/)) {
                this[i]();
            }
        }
    },
    /**
     * 注册一个recover，用法类似于allHighlight;
     * @Author   chenht
     * @DateTime 2017-04-11
     * @param    {rec: recover的名称, fn: 方法的语句}
     */
    addRecover: function (rec, fn) {
        this['_' + rec] = [];
        this['push' + rec[0].toUpperCase() + rec.substr(1)] = new Function('v', 'this._' + rec +'.push(v)');
        this['all' + rec[0].toUpperCase() + rec.substr(1)] = new Function('', 'this._' + rec +'.forEach(function(v){' + fn + '});this._' + rec + '=[]');
    },
};

/**
 * 事件方法
 * @type {Object}
 */
var handeler = {
    onMouseMove: function (e) { // moving状态下鼠标移动事件
        recover.all();
        _getMousePos(e); // 更新mouse的属性值
        var res = _getRect(setting.brushSize.x, setting.brushSize.y); // 根据笔刷尺寸获取地板块
        if (res) {              
            if ((res.out || res.occupied) && !res.addable) { // 如果位置非法
                meshs.sampleObj.hide();
                res.array.forEach(function (v) { // 对每一个地板设置警告高亮
                    recover.pushHighlight(v);
                    v.show();
                    v.warningHignlight();
                });
            } else { // 正常情况         
                res.array.forEach(function (v) { // 对每一个地板设置高亮
                    recover.pushHighlight(v);
                    v.show();
                    v.highlight();
                });
                meshs.sampleObj.show();
                meshs.sampleObj.position.x = res.center[0]; // 移动sampleObj的位置
                meshs.sampleObj.position.z = res.center[1];
            }
        } else {
            meshs.sampleObj.hide();
        }
    },
    onMouseClickConfirm: function (e) { // moving状态下点击鼠标的事件
        _getMousePos(e);
        var res = _getRect(setting.brushSize.x, setting.brushSize.y);
        if (!res.out && !res.occupied || res.addable) { // 如果不出界，不被占用 或者 可以添加到当前机柜。
            operations.comfirmMov();
        }
        // if (meshs.sampleObj && meshs.sampleObj.isShow()){ // 如果sampleObj显示，即位置合法
            
        // }

    },
    onMouseClickSelect: function (e) { // normal&selecting状态下鼠标点击事件
        _getMousePos(e);
        var intersected = _intersect(); // 射线获取
        operations.select(intersected);        
    },
    onMouseRightClick: function (e) { // moving状态右键（旋转）事件
        if (e.button === 2) {
            var temp = setting.brushSize.x; // 交互笔刷尺寸
            setting.brushSize.x = setting.brushSize.y;
            setting.brushSize.y = temp;
            meshs.sampleObj.rotation.y += 0.5 * Math.PI;
        }
    }
};

var mouse = new THREE.Vector2(0, 0);
var raycaster = new THREE.Raycaster();


/**
 * 更新鼠标位置
 * @Author   chenht
 * @DateTime 2017-04-11
 * @param    {e}
 */
var _getMousePos = function (e) {
    mouse.x = ((e.clientX - canvas.offsetLeft + document.scrollingElement.scrollLeft) / canvas.offsetWidth) * 2 - 1;   
    mouse.y = -((e.clientY - canvas.offsetTop + document.scrollingElement.scrollTop) / canvas.offsetHeight) * 2 + 1;
};

/**
 * 射线获取列表
 * @type {Object}
 */
var intersecting = {
    list: [],
    /**
     * 替换射线获取列表
     * @param    {target}
     */
    changeTarget: function (target) {
        this.list = [];
        var list = [];
        for (var j in deviceToMesh) {
            list.push(deviceToMesh[j]);
        }
        list = list.concat(meshs.floorsPlain);
        for (j in list) {
            var v = list[j];
            for (var i = 0; i < target.length; i++) {
                if(v.class && v.class.indexOf(target[i]) !== -1) {
                    this.list.push(v);
                    break;
                } 
            }  
        }
    }
};

/**
 * 射线采集物体
 * @Author   chenht
 * @DateTime 2017-04-11
 * @return   {[type]}
 */
var _intersect = function () {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects( intersecting.list );

    if (intersects[0]) {
        return intersects[0].object;
    } else {
        return false;
    }
};

/**
 * 获取地板上的一个矩形空间
 * @Author   chenht
 * @DateTime 2017-04-11
 * @param    {width 长度}
 * @param    {height 宽度}
 * @param    {_origin 中点}
 * @return   {返回的矩形空间}
 */
var _getRect = function (width, height, _origin) {
    var origin; // 中心的一块地板
    if (_origin) {
        origin = _origin;
    } else {
        origin = _intersect();
    }
    if (!origin) {
        return false;
    }

    var arr = [];
    var out = false;
    var occupied = false;
    var addable = false;
    for (var i = 0; i < width; i++){
        for (var j = 0; j < height; j++){
            var x = origin.x + i + 1 - Math.ceil(width / 2);
            var y = origin.y + j + 1 - Math.ceil(height / 2);
            if (_checkPosValid(x, y)) {
                arr.push(meshs.floors[x][y]);
                if (meshs.floors[x][y].occupied) {
                    occupied = true;
                }
            } else {
                out = true;
            }
        }
    }

    if (origin.occupied && origin.occupied.addToThis) {
        addable = true;
        origin.occupied.showAddSymbol();
    }

    return {
        array: arr, // 返回的地板数组
        out: out, // 是否出界
        occupied: occupied, // 是否有地板被占用
        addable: addable, // 是否有地板被占用
        center: [(arr[0].position.x + arr[arr.length-1].position.x) / 2, (arr[0].position.z + arr[arr.length-1].position.z) / 2] // 中间的坐标
    };
};

/**
 * 将传入的地板置位占用
 * @Author   chenht
 * @DateTime 2017-04-11
 * @param    {arr}
 * @param    {mesh}
 */
var _setOccupied = function (arr, mesh) {
    mesh.occupiedFloor = arr;
    arr.forEach(function (v) {
        v.occupied = mesh;
    });
};

/**
 * 将传入的地板置位闲置
 * @Author   chenht
 * @DateTime 2017-04-11
 * @param    {arr}
 */
var _setFree = function (arr) {
    arr.forEach(function (v) {
        v.occupied = false;
    });
};

/**
 * 复制一个对象
 * @Author   chenht
 * @DateTime 2017-04-12
 * @param    {Object}   obj 复制原型
 * @return   {Object}       复制的结果
 */
var _clone = function (obj) {
    var temp;
    if (obj instanceof Array) {
        temp = [];
        obj.forEach(function (v) {
            temp.push(v);
        });
        for (var i in obj) {
            if (!Number(i)) {
                temp[i] = obj[i];
            }
        }
        return temp;
    } 
    if (obj == null) {  
        return obj;
    } 
    if (ChildrenList.prototype.isPrototypeOf(obj)) {  
        var cl = new ChildrenList(obj.owner);
        cl.list = obj.list;
        return cl;
    }
    if (typeof obj === 'function') {  
        return obj;
    }
    if (typeof obj === 'object') {  
        temp = {};      
        for (var j in obj) {
            if (j === 'model') {
                temp[j] = obj[j];
            } else {
                temp[j] = _clone(obj[j]);
            }            
        }
        return temp;
    } 
    return obj;
};

/**
 * 整数前补上n位0
 * @Author   chenht
 * @DateTime 2017-04-17
 * @param    {int}   num 被补零的数
 * @param    {int}   n   补零结果的长度（位数）
 * @return   {string}    补零的结果
 */
function _prefixInteger(num, n) {
    return (Array(n).join(0) + num).slice(-n);
}

/**
 * 为没有设备编号的设备添加编号
 * @Author   chenht
 * @DateTime 2017-04-17
 * @param    {device}   device 传入的设备
 * @return   {String}          新建的设备编号
 */
var _createCode = function (device) {
    var n = 1;
    while (true) {
        if (!deviceToMesh[device.type + '_' + _prefixInteger(n, 8)]) {
            return device.type + '_' + _prefixInteger(n, 8);
        }
        n++;
    }
};

/**
 * 为没有名称的设备添加别名
 * @Author   chenht
 * @DateTime 2017-04-17
 * @param    {device}   device 传入的设备
 * @return   {String}          新建的设备别名
 */
var _createName = function (device) {
    return '未命名' + device.typeName + Number(device.code.split('_')[1]);
};

/**
 * 创建设备名称牌上所需的canvas
 * @Author   chenht
 * @DateTime 2017-04-17
 * @param    {string}   name 设备名称
 * @return   {canvas}        
 */
var _createNameTagCanvas = function (name) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 32;
    var context = canvas.getContext('2d');
    context.font = "Bold 28px Arial";
    context.textAlign = 'center';
    context.fillStyle = "rgba(255,255,255,0.95)";
    context.fillText(name, 128, 28);
    return canvas;
};

/**
 * 创建一个物体
 * @Author   chenht
 * @DateTime 2017-04-11
 * @param    {device}
 * @return   {mesh}
 */
var _createObj = function (device) {
    var model = device.model;
    var mesh = new THREE.Mesh(model.geometry, model.material.clone());


    if (device.once) {
        mesh.device = device; // 保存原型
    } else {
        mesh.device = _clone(device);
    }

    _bindDevice(mesh, mesh.device);

    mesh.width = setting.brushSize.x; // 设置尺寸
    mesh.height = setting.brushSize.y; 

    for (var i in model) { // 将model中的方法保存在mesh中
        if (model[i] instanceof Function) {
            mesh[i] = model[i];
        }
    }

    if (!mesh.device.code) {
        mesh.device.code = _createCode(mesh.device);
        mesh.device.name = _createName(mesh.device);
    }

    if (mesh.onCreate) { // 有oncreate则执行oncreate
        mesh.onCreate();
    }


    // 为该物体添加nameTag
    var spriteMap = new THREE.Texture(_createNameTagCanvas(mesh.device.name));
    spriteMap.needsUpdate = true;
    var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap} );

    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.name = {
        type:"nameTag"
    };
    sprite.position.y = device.model.height / 2 + 1;
    sprite.scale.set(12, 2, 1);

    mesh.add(sprite);
    mesh.nameTag = sprite;

    console.log('Mesh Created!');

    return mesh;
};

var _bindDevice = function (mesh, device) {
    var model = device.model;
     mesh.position.y = model.height / 2 + model.above; // 设置高度使其可以紧贴地面
    mesh.highlightColor = model.highlightColor; // 设置高亮颜色
    mesh.class = model.class; // 设置类名
    if (!mesh.name) {
        mesh.name = {};
    }
    mesh.name.type = model.name.type;
    if (device.once) {
        mesh.device = device; // 保存原型
    } else {
        mesh.device = _clone(device);
    }
    mesh.width = setting.brushSize.x; // 设置尺寸
    mesh.height = setting.brushSize.y; 

    for (var i in model) { // 将model中的方法保存在mesh中
        if (model[i] instanceof Function) {
            mesh[i] = model[i];
        }
    }

    if (!mesh.device.code) {
        mesh.device.code = _createCode(mesh.device);
        mesh.device.name = _createName(mesh.device);
    }

    if (mesh.onCreate) { // 有oncreate则执行oncreate
        mesh.onCreate();
    }


    deviceToMesh[mesh.device.code] = mesh;
};

/**
 * 操作
 * @type {Object}
 */
var operations = {
    newObj: function (device, container) { // 新建
        if (user.state === 'selecting') {
            return;
        }

        if (meshs.sampleObj) { // 如果有sampleObj则去除
            scene.remove(meshs.sampleObj);
        }

        var model;
        if (container) {
            model = container.model;
            if (!(device instanceof Array)) {
                device = [device];
            }
            meshs.sampleObj = _createObj(container);
            meshs.sampleObj.device.childrenList= new ChildrenList(meshs.sampleObj.device);
            device.forEach(function (v) {
                meshs.sampleObj.device.childrenList.push(_createObj(v).device);
            });            
        } else {
            model = device.model;
            meshs.sampleObj = _createObj(device); // 通过model新建物体
        }

        meshs.sampleObj.hide(); // 防止一开始出现在(0,0,0)
        scene.add(meshs.sampleObj);
        setting.brushSize.x = model.size.x; // 设置笔刷尺寸
        setting.brushSize.y = model.size.y;

        meshs.sampleObj.state = 'moving';
        user.state = 'moving';
    },
    move: function () { // 移动
        if (user.state !== 'selecting') {
            return;
        }

        if (meshs.selectedObj.beforeMove) { // hook 移动之后调用
            meshs.selectedObj.beforeMove();
        }

        meshs.selectedObj.state = 'normal';
        _setFree(meshs.selectedObj.occupiedFloor); // 将原先被占用的地板释放
        meshs.removedByMovingObj = meshs.selectedObj; // 将被选物体保存在 removedByMovingObj
        meshs.selectedObj = null;
        // ... // 保存物体信息
        scene.remove(meshs.removedByMovingObj); 

        setting.brushSize.x = meshs.removedByMovingObj.width; // 设置笔刷尺寸
        setting.brushSize.y = meshs.removedByMovingObj.height;

        meshs.sampleObj = _createObj(meshs.removedByMovingObj.device); // 根据原型新建sampleObj
        if (meshs.removedByMovingObj.addToThis) { // 如果是容器，则将原来的childrenList复制给它
            meshs.sampleObj.device.childrenList.list = meshs.removedByMovingObj.device.childrenList.list;
            meshs.sampleObj.device.childrenList.update();
        }

        meshs.sampleObj.position.copy(meshs.removedByMovingObj.position); // 复制原本的几何信息
        meshs.sampleObj.rotation.copy(meshs.removedByMovingObj.rotation);

        scene.add(meshs.sampleObj);

        meshs.sampleObj.state = 'moving';
        user.state = 'moving';
    },
    rotate: function () { // 旋转
        if (user.state !== 'selecting') {
            return;
        }

        _setFree(meshs.selectedObj.occupiedFloor); // 先将原先被占用的地板释放

        var first = meshs.selectedObj.occupiedFloor[0];
        var last = meshs.selectedObj.occupiedFloor[meshs.selectedObj.occupiedFloor.length - 1];
        var originX = Math.floor((first.x + last.x) / 2); // 获取该物体的中心地板块
        var originY = Math.floor((first.y + last.y) / 2);

        var res = _getRect(meshs.selectedObj.height, meshs.selectedObj.width, meshs.floors[originX][originY]); // 获取旋转之后的地板块

        meshs.selectedObj.rotation.y += Math.PI * 0.5; // 直接旋转物体，并交换长和宽
        var temp = meshs.selectedObj.width;
        meshs.selectedObj.width = meshs.selectedObj.height;
        meshs.selectedObj.height = temp;

        if (res && !res.occupied && !res.out) { // 合法的话直接保存
            meshs.selectedObj.occupiedFloor = res.array;
            meshs.selectedObj.position.x = res.center[0]; // 重新设置物体位置
            meshs.selectedObj.position.z = res.center[1];
            _setOccupied(meshs.selectedObj.occupiedFloor, meshs.selectedObj);
        } else { // 非法的话则需要移动操作
            operations.move();

            meshs.removedByMovingObj.rotation.y -= Math.PI * 0.5; // 重新将保存的物体转回去，并还原长和宽。
            temp = meshs.removedByMovingObj.width;  // 这是为了防止用户在旋转并移动之后取消、导致位置不正常
            meshs.removedByMovingObj.width = meshs.removedByMovingObj.height;
            meshs.removedByMovingObj.height = temp;
        }
    },
    deleteObj: function () { // 删除
        if (user.state !== 'selecting') {
            return;
        }

        var result = confirm('sure?'); // 弹出提示框 是否删除
        if (result) {
            if (meshs.selectedObj.beforeDelete) { // hook 确认删除之后调用
                meshs.selectedObj.beforeDelete();
            }

            _setFree(meshs.selectedObj.occupiedFloor); // 将原先被占用的地板释放
            scene.remove(meshs.selectedObj);
            meshs.selectedObj = null;

            user.state = 'normal';
        }
    },
    select: function (result) { // 选择
        if (user.state === 'moving') {
            return;
        }

        if (meshs.selectedObj) { // 没选中的话切回正常
            meshs.selectedObj.state = 'normal';
            meshs.selectedObj = null;
        }
        if (result) {
            meshs.selectedObj = result;

            user.state = 'selecting';
            meshs.selectedObj.state = 'selected';
        } else {
            user.state = 'normal';
        }
    },
    comfirmMov: function () { // 确认移动
        if (user.state !== 'moving') {
            return;
        }

        var origin = _intersect(); 
        var rect = _getRect(setting.brushSize.x, setting.brushSize.y, origin);


        /**
         * 这段写的不好，由于添加物体到一个机柜和添加一个物体到场景虽然操作上是一致的，
         * 但是逻辑上不一致，这导致了代码常用度减少。
         */
        // 添加设备到容器
        // 如果sampleObj能够加入到当前中心地板对应的物体之中的话。
        if (origin.occupied && origin.occupied.addToThis) {
            if (!origin.occupied.addToThis(meshs.sampleObj.device)) {
                return;
            }
            scene.remove(meshs.sampleObj);
            meshs.sampleObj = null;
            meshs.selectedObj = origin.occupied;
            meshs.removedByMovingObj = null;    

            meshs.selectedObj.state = 'selected';  
            user.state = 'selecting';    
            return;
        }

        // 添加设备到场景
        scene.remove(meshs.sampleObj);
        if (meshs.removedByMovingObj) { // 来自移动
            deviceToMesh[meshs.removedByMovingObj.device.code] = meshs.removedByMovingObj; // 将设备映射表中相应设备的Mesh改为removedByMovingObj
            if (meshs.removedByMovingObj.addToThis) {
                meshs.removedByMovingObj.device.childrenList.update();
            }
            meshs.selectedObj = meshs.removedByMovingObj; // 读取原来的物体
            meshs.removedByMovingObj = null;
        } else {  // 来自新建
            meshs.sampleObj.device.addToContainer(scene.childrenList);
            // meshs.selectedObj = _createObj(meshs.sampleObj.device); // 新建
            meshs.selectedObj = meshs.sampleObj;

            if (meshs.selectedObj.addToThis) {
                meshs.selectedObj.addToThis(meshs.sampleObj.device);
            }

            // meshs.selectedObj.options = ... // 设置物体信息
        }        

        meshs.selectedObj.position.copy(meshs.sampleObj.position.clone()); // 复制sampleObj的几何信息
        meshs.selectedObj.rotation.copy(meshs.sampleObj.rotation.clone());

        meshs.selectedObj.occupiedFloor = rect.array;  // 地板设为占用
        _setOccupied(rect.array, meshs.selectedObj);

        meshs.selectedObj.width = setting.brushSize.x; // 重设物体的尺寸
        meshs.selectedObj.height = setting.brushSize.y;

        scene.add(meshs.selectedObj);
        meshs.sampleObj = null;

        if (meshs.selectedObj.afterComfirmMov) { // hook 确认移动之后调用
            meshs.selectedObj.afterComfirmMov();
        }

        meshs.selectedObj.state = 'selected';  
        user.state = 'selecting';
    }, 
    cancelMov: function () { // 取消移动
        if (user.state !== 'moving') {
            return;
        }

        scene.remove(meshs.sampleObj);
        if (meshs.removedByMovingObj) { // 来自移动

            if (meshs.sampleObj.beforeCancelMoving) { // hook 取消移动之前调用
                meshs.sampleObj.beforeCancelMoving();
            }      

            deviceToMesh[meshs.removedByMovingObj.device.code] = meshs.removedByMovingObj; // 将设备映射表中相应设备的Mesh改为removedByMovingObj

            meshs.selectedObj = meshs.removedByMovingObj; // 读取原来的物体
            meshs.removedByMovingObj = null;
            _setOccupied(meshs.selectedObj.occupiedFloor, meshs.selectedObj); // 重新设为占用
            scene.add(meshs.selectedObj);

            if (meshs.selectedObj.device.childrenList) {
                meshs.selectedObj.device.childrenList.update();
            }

            meshs.selectedObj.state = 'selected';
            user.state = 'selecting';
        } else { // 来自新建
            /*
            如果取消新建则要将临时创建的设备删除。
             */
            delete deviceToMesh[meshs.sampleObj.device.code];
            meshs.sampleObj = null;
            user.state = 'normal';
        }
    }
};