(function () {
    var model = {
        size: {
            x: 1,
            y: 1
        },
        name: {
            type:'battery'
        },
        height: 1,
        above: 0,
        class: ['obj', 'battery'],
        highlightColor: color.objHignlight,
        once: true, 
        needContainer: true,
        afterSelected: function(){
            //吐舌头
            new TWEEN.Tween(this.position)
                        .to({x: 2},500)
                        .easing(TWEEN.Easing.Sinusoidal.InOut)
                        .start();

            camera.moveTo.apply(camera, this.parent.position.toArray().concat(0.5));
        },
        beforeCancelSelected: function(){
            //缩回舌头
            new TWEEN.Tween(this.position)
                        .to({x: 0},500)
                        .easing(TWEEN.Easing.Sinusoidal.InOut)
                        .start();
        }
    };
    loadModel('battery', model, '蓄电池组');
    loadGeo('battery', new THREE.CubeGeometry(3.6,1,3.6));
    loadMat('battery', new THREE.MeshLambertMaterial({color: '#123456'}));
})();