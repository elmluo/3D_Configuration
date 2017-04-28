(function () {
    var model = {
        size: {
            x: 1,
            y: 1
        },
        name: {
            type:'distributor'
        },
        height: 8,
        above: 0,
        class: ['obj', 'distributor'],
        highlightColor: color.objHignlight,
        once: true, 
        needContainer: false
    };
    loadModel('distributor', model, '配电柜');
    loadGeo('distributor', new THREE.CubeGeometry(4,8,4));
    loadMat('distributor', new THREE.MeshLambertMaterial({color: '#845710'}));
})();