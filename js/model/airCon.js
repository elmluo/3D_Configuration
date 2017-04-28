(function () {
    var model = {
        size: {
            x: 1,
            y: 1
        },
        name: {
            type:'airCon'
        },
        height: 12,
        above: 0,
        class: ['obj', 'airCon'],
        highlightColor: color.objHignlight,
        once: false,
        needContainer: false
    };

    deviceList.push({type:'空调', code:''});

    loadModel('airCon', model, '空调');
    loadGeo('airCon', new THREE.CubeGeometry(4,12,4));
    loadMat('airCon', new THREE.MeshLambertMaterial({color: '#854834'}));
})();