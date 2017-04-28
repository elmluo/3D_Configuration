(function () {
    var model = {
        size: {
            x: 1,
            y: 1
        },
        name: {
            type:'BBDS'
        },
        height: 0.8,
        above: 0,
        class: ['obj', 'BBDS'],
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
    loadModel('BBDS', model, 'BBDS蓄电池组');
    loadGeo('BBDS', new THREE.CubeGeometry(3.6,0.8,3.6));
    loadMat('BBDS', new THREE.MeshLambertMaterial({color: '#653298'}));
})();