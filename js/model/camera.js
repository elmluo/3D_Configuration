(function () {
    var model = {
        size: {
            x: 1,
            y: 1
        },
        name: {
            type:'camera'
        },
        height: 2,
        above: 40,
        class: ['obj', 'camera'],
        highlightColor: color.objHignlight,
        once: true, 
        needContainer: false
    };
    loadModel('camera', model, '摄像头');
    loadGeo('camera', new THREE.CubeGeometry(2,2,2));
    loadMat('camera', new THREE.MeshLambertMaterial({color: '#123456'}));
})();