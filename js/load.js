/**
 * 模拟的后台的传入数据
 * 这里name没有用到。
 */
var deviceList = [{
    code: '33010400011070001',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '33010400011070002',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '33010400011070003',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '33010400011070004',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '33010400011070005',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '33010400011070006',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '33010400011070007',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '33010400011070008',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '33010400011070009',
    name: "220V UPS",
    type:"蓄电池组"
},{
    code: '12452365467457845',
    name: "某个A型设备",
    type: "A类设备"
},{
    code: '12452365467457846',
    name: "另一个个A型设备 UPS",
    type: "A类设备"
},{
    code: '78956753696748',
    name: "BBDS1",
    type: "BBDS蓄电池组"
},{
    code: '78956753696749',
    name: "BBDS2",
    type: "BBDS蓄电池组"
},{
    code: '12323254135613660',
    name: "摄像头1",
    type: "摄像头"
},{
    code: '12323254135613661',
    name: "摄像头2",
    type: "摄像头"
},{
    code: 'sdf56asf7sad56f1',
    name: "配电柜1",
    type: "配电柜"
},{
    code: 'sdf56asf7sad56f2',
    name: "配电柜2",
    type: "配电柜"
},{
    code: 'aiuhfos87aa93wryfoas1',
    name: "烟雾传感器1",
    type: "烟雾传感器"
},{
    code: 'aiuhfos87aa93wryfoas2',
    name: "烟雾传感器2",
    type: "烟雾传感器"
}];

var model = {};
var geometries = {};
var materials = {};
var allDevices = [];
root.devices = {};

/**
 * Device类的创建
 * @Author   chenht
 * @DateTime 2017-04-22
 * @param    {[type]}   device [description]
 */
function Device (device) {
    this.type = device.type;
    this.typeName = device.typeName;
    this.name = device.name;
    this.code = device.code;
    this.model = device.model;
    this.once = device.once;
    this.needContainer = device.needContainer;
    this.parent = device.parent;
    this.addToContainer = addToContainer;
}


/**
 * 创建Geometry列表
 * @Author   chenht
 * @DateTime 2017-04-11
 * @return   {undefined}
 */
var loadGeo = function (name, geo) {
    geometries['geometry_' + name] = geo;
    geometries['geometry_' + name].uuid = 'geometry_' + name;
    model[name].geometry = geometries['geometry_' + name];

    sceneIO.geometries.push(geometries['geometry_' + name].toJSON());
};

/**
 * 创建Material列表
 * @Author   chenht
 * @DateTime 2017-04-13
 * @param    {String}   name 创建的材质名称
 * @param    {mat}   mat  传入的材质对象
 */
var loadMat = function (name, mat) {
    materials['material_' + name] = mat;
    materials['material_' + name].uuid = 'material_' + name;
    model[name].material = materials['material_' + name];

    var json = materials['material_' + name].toJSON();

    if (json.textures) {
        json.textures.forEach(function (v) {
            sceneIO.textures.push(v);
        });
        delete json.textures;
    }
    if (json.images) {
        json.images.forEach(function (v) {
            sceneIO.images.push(v);
        });
        delete json.images;
    }
    sceneIO.materials.push(json);
};

/**
 * 异步导入贴图，并且执行传入的回调函数
 * @Author   chenht
 * @DateTime 2017-04-22
 * @param    {[type]}   texUrl  [description]
 * @param    {[type]}   manager [description]
 * @param    {Function} cb      [description]
 */
var loadTex = function (texUrl, manager, cb) {

    new THREE.TextureLoader(manager).load(texUrl, function (t) {
        console.log('texture "'+texUrl+'" loaded!');
        cb(t);
    });   
};


/**
 * 读取本地的OBJ文件
 * @Author   chenht
 * @DateTime 2017-04-13
 * @param    {String}   name   传入的obj的名称·
 * @param    {String}   objUrl obj文件的路径
 * @param    {Array}   [scale]  需要缩放的尺寸
 */
var loadObj = function (name, objUrl, manager, scale) {
    var loader = new THREE.OBJLoader(manager);
    loader.load(objUrl, function ( object ) {
        geometries['geometry_' + name] = object.children[0].geometry;
        geometries['geometry_' + name].uuid = 'geometry_' + name;
        if (scale) {
            geometries['geometry_' + name].scale.apply(geometries['geometry_' + name], scale);
        }
        model[name].geometry = geometries['geometry_' + name];
        sceneIO.geometries.push(geometries['geometry_' + name].toJSON());

        console.log('obj loaded!');
    });
};
/**
 * 创建model，并放入设备列表
 * @Author   chenht
 * @DateTime 2017-04-13
 * @param    {String}   name     创建的模型名称
 * @param    {Object}   m        传入的模型
 * @param    {String}   typeName 类型名称
 * @param    {Object}   setting  设置 包括 once 是否唯一，needContainer 是否需要机柜存储
 */
var loadModel = function (name, m, typeName) {
    if (!model[name]) {
        model[name] = {};
    }
    for (var i in m) {
        model[name][i] = m[i];
    }
    model[name].typeName = typeName;
    /*
    在一个对象内新疆对象需要使用Vue的set方法。(在使用Vue的情况下。)
     */
    Vue.set(root.devices, name, new ChildrenList(root.devices));
    // root.devices[name] = new ChildrenList(root.devices);
    root.devices[name].type = name;
    root.devices[name].typeName = typeName;
    deviceList.forEach(function (v) {
        if (v.type === typeName) {
            var d = new Device({
                type: name,
                name: v.name,
                typeName: typeName,
                code: v.code,
                model: model[name],
                once: model[name].once,
                needContainer: model[name].needContainer,
                parent: root.devices[name]
            });
            v.typeName = typeName;
            v.type = name;
            root.devices[name].push(d); // 需要先将设备推入devices列表，不然Observe（响应式）将会污染整个对象。

            if (model[name].once) {
                allDevices.push(d);
            }
        }
    });
};

/**
 * 加入场景，或者从一个机柜移动到另一个位置时的hook方法
 * @Author   chenht
 * @DateTime 2017-04-11
 */
function addToContainer(container) {
    if (this.once) {
        if (this.parent) { // 从原本的容器中删除
            this.parent.remove(this);
        }
        delete this.parent; // 非VUE情况下请删除
        this.parent = container;
        if (container) { // 加入新的容器
            container.push(this);
        }
    }
}
    