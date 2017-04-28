/**
 * 系统设置
 * @type {Object}
 */
var setting = {
    brushSize: {    // 笔刷的大小
        x: 1,
        y: 1
    },
    sceneSize: {    // 场景大小
        x: 35,
        y: 35
    },
    floorSize: 4    // 每一块地板的尺寸
};

var meshs = {
    sampleObj: null, // moving状态下的临时物体
    removedByMovingObj: null, // move()后用来存放的临时物体
    selectedObj: null, // 当前被选择的物体
    floors:null // 所有地板
};

var color = {
    floor: "#fff", // 普通地板颜色
    floorEditValid: '#0f0', // 地板合法编辑颜色
    floorEditWarning: '#f00', // 地板非法编辑颜色
    objHignlight: '#f00', // 物体高亮默认颜色
    wallHignlight: '#ff0' // 物体高亮默认颜色
};

/**
 * device对Mesh的映射表
 * @type {Object}
 */
var deviceToMesh = {};

/**
 * 检查地板位置是否合法
 * @Author   chenht
 * @DateTime 2017-04-12
 * @param    {int}   x 地板的横坐标
 * @param    {int}   y 地板的纵坐标
 * @return   {boolean}     是否有效
 */
function _checkPosValid (x, y) {
    if (x < 0 || x >= setting.sceneSize.x) {
        return false;
    }
    if (y < 0 || y >= setting.sceneSize.y) {
        return false;
    }
    return true;
}

var grid;
/**
 * 创建场景中必要的物体
 * @Author   chenht
 * @DateTime 2017-04-12
 */
function initScene () {
    var gridTexture = new THREE.TextureLoader().load('./img/gridFloor.png');
    gridTexture.wrapS = THREE.RepeatWrapping;                     //S方向覆盖模式（横坐标）
    gridTexture.wrapT = THREE.RepeatWrapping;                     //T方向覆盖模式（纵坐标）
    gridTexture.repeat.set( setting.sceneSize.x, setting.sceneSize.y );
    grid = new THREE.Mesh(
        new THREE.PlaneGeometry(setting.sceneSize.x * setting.floorSize, setting.sceneSize.y * setting.floorSize), 
        new THREE.MeshLambertMaterial({
            map: gridTexture,
        })
    );
    grid.rotation.x = - 0.5 * Math.PI;
    grid.position.set(setting.sceneSize.x * setting.floorSize / 2, 0, setting.sceneSize.y * setting.floorSize / 2);
    scene.add(grid);

    scene.childrenList = new ChildrenList(scene);
}

/**
 * childrenList类
 * @Author   chenht
 * @DateTime 2017-04-12
 */
var ChildrenList = function (owner) {
    var scope = this;
    this.owner = owner;
    this.list = [];
    this.update = function () {
        if (deviceToMesh[this.owner.code] && deviceToMesh[this.owner.code].add) {
            var parent = deviceToMesh[this.owner.code];
            var height = - parent.position.y + 0.2;
            // 删除所有的子元素
            while (parent.children.length > 0) {
                parent.remove(parent.children[0]);
            }
            // 重新添加名称牌
            parent.nameTag.material.map = new THREE.Texture(_createNameTagCanvas(scope.owner.name));
            parent.nameTag.material.map.needsUpdate = true;
            parent.add(parent.nameTag);
            scope.list.forEach(function (v) {
                var mesh = deviceToMesh[v.code];
                parent.add(mesh);
                mesh.position.y = v.model.height / 2 + height;
                height += (v.model.height + 0.1);
            });
        }
        console.log('updated!');
    };
    this.push = function (v) {
        this.list.push(v);
        this.update();
    };
    this.remove = function (v) {
        var index = this.list.indexOf(v);
        this.list.splice(index, 1);
        this.update();
    };
};

/**
 * 添加mesh的prototype
 * @Author   chenht
 * @DateTime 2017-04-11
 */
function initMeshPrototype() {
    var __leaveMeshFn = { // 离开状态的方法
        normal: function function_name() {
            console.log('  <-Mesh leaving normal');
        }, 
        moving: function function_name() {
            this.setOpacity(1);

            console.log('  <-Mesh leaving moving');
        }, 
        selected: function function_name() {            
            if (this.beforeCancelSelected) { // hook 取消移动之后调用
                this.beforeCancelSelected();
            }

            this.unHighlight();
            if (this.hideDeviceInfo) {
                this.hideDeviceInfo();  
            }  

            console.log('  <-Mesh leaving selected');
        }
    };
    var __enterMeshFn = { // 进入状态的方法
        normal: function function_name() {
            console.log('  ->Mesh entering normal');
        }, 
        moving: function function_name() {
            this.setOpacity(0.5);

            console.log('  ->Mesh entering moving');
        }, 
        selected: function function_name() {
            this.highlight();
            if (this.showDeviceInfo) {
                this.showDeviceInfo();  
            }  

            if (this.afterSelected) { // hook 确认选择之后调用
                this.afterSelected();
            }
            console.log('  ->Mesh entering selected');
        }
    };

    // 对自身设置高亮
    THREE.Mesh.prototype.highlight = function (color) {
        this.originColor = this.material.color.clone();
        if (color) {
            this.material.color.set(color);
        } else {
            this.material.color.set(this.highlightColor);
        }        
    };
    // 对自身取消高亮
    THREE.Mesh.prototype.unHighlight = function () {
        this.material.color.set(this.originColor);
    };
    // 对自身设置透明度
    THREE.Mesh.prototype.setOpacity = function (o) {
        if (o >= 1) {
            this.material.opacity = 1;
            this.material.transparent = false;
        } else {
            this.material.transparent = true;
            this.material.opacity = o;
        }
    };
    // 隐藏自身
    THREE.Sprite.prototype.hide = THREE.Mesh.prototype.hide = function () {
        this.children.forEach(function (c) { // 执行所有子元素的方法。
            c.hide && c.hide();
        });        
        this.material.visible = false;    
    };
    // 显示自身
    THREE.Sprite.prototype.show = THREE.Mesh.prototype.show = function () {
        this.children.forEach(function (c) { // 执行所有子元素的方法。
            c.show && c.show();
        });        
        this.material.visible = true;
    };
    // 是否隐藏
    THREE.Sprite.prototype.isShow = THREE.Mesh.prototype.isShow = function () {
        return this.material.visible;
    };
    Object.defineProperties(THREE.Mesh.prototype, {
        showName: {
            set: function (v) {
                if (v === this._showName || v !== true && v !== false) {
                    return;
                }
                if (v) {
                    this.nameTag.show();
                } else {
                    this.nameTag.hide();
                }
                this._showName = v;
            },
            get: function () {
                return this._showName;
            }
        },
        _showName: {
            value: true,
            writable: true
        }
    });
    // 设置物体状态
    Object.defineProperties(THREE.Mesh.prototype, {
        state: {
            set: function (v) {
                var validList = ['normal', 'moving', 'selected'];
                if (v === this._state || validList.indexOf(v) === -1) { // 与当前状态一致或非法，返回
                    return;
                }
                __leaveMeshFn[this._state].call(this); // 执行离开方法
                __enterMeshFn[v].call(this); // 执行进入方法
                // this.children.forEach(function (c) { // 修改所有子物体的状态。
                //     c.state = v;
                // });
                this._state = v;
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
}

/**
 * 新建地板
 * @Author   chenht
 * @DateTime 2017-04-11
 */
function initFloors() {
    // 获取上下左右地板的方法
    var _getLeft = function () {
        return _checkPosValid(this.x - 1, this.y) ? meshs.floors[this.x - 1][this.y] : false;
    };
    var _getRight = function () {
        return _checkPosValid(this.x + 1, this.y) ? meshs.floors[this.x + 1][this.y] : false;
    };
    var _getUp = function () {
        return _checkPosValid(this.x, this.y - 1) ? meshs.floors[this.x][this.y - 1] : false;
    };
    var _getDown = function () {
        return  _checkPosValid(this.x, this.y + 1) ? meshs.floors[this.x][this.y + 1] : false;
    };
    // 警告高亮方法
    var _warningHighlight = function () {
        this.highlight(this.warningColor);
    };
    meshs.floors = [];
    meshs.floorsPlain = [];
    for (var i = 0; i < setting.sceneSize.x; i++) {
        meshs.floors[i] = [];
        for (var j = 0; j < setting.sceneSize.y; j++){
            var planeGeometry = new THREE.PlaneGeometry(setting.floorSize, setting.floorSize);
            var planeMaterial = new THREE.MeshLambertMaterial({
                color: color.floor, 
                side: THREE.DoubleSide,
                visible: false
            });
            var mesh = new THREE.Mesh(planeGeometry, planeMaterial);
            meshs.floors[i][j] = mesh;
            mesh.rotation.x = -0.5*Math.PI;
            mesh.x = i;
            mesh.y = j;
            mesh.occupied = false; // 是否被占用
            mesh.highlightColor = color.floorEditValid; // 设置高亮颜色
            mesh.warningColor = color.floorEditWarning; // 设置警告高亮颜色
            mesh.warningHignlight = _warningHighlight;  // 设置警告高亮方法
            mesh.class = ['floor'];
            mesh.name = {
                type:"floor"
            };
            Object.defineProperties(mesh, {
                left: {
                    get: _getLeft
                },
                right: {
                    get: _getRight
                },
                up: {
                    get: _getUp
                },
                down: {
                    get: _getDown
                }
            });
            mesh.position.set(i * setting.floorSize + setting.floorSize / 2, 0.2, j * setting.floorSize + setting.floorSize / 2);
            scene.add(mesh);
            meshs.floorsPlain.push(mesh);
        }
    }    
}

function init() {
    initScene();
    initMeshPrototype();
    initFloors();
}