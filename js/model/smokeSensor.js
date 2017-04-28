(function () {
    var model = {
        size: {
            x: 1,
            y: 1
        },
        name: {
            type:'smokeSensor'
        },
        height: 2,
        above: 40,
        class: ['obj', 'smokeSensor'],
        highlightColor: color.objHignlight,
        once: true, 
        needContainer: false,

    };
    loadModel('smokeSensor', model, '烟雾传感器');
    loadGeo('smokeSensor', new THREE.CubeGeometry(2,2,2));
    loadMat('smokeSensor', new THREE.MeshLambertMaterial({color: '#a8c666'}));
})();