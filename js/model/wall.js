(function(){
    var model = {
        size: {
            x: 1,
            y: 1
        },
        height: 16,
        above: 0,
        class: ['obj', 'wall'],
        name:{
            type: "wall"
        },
        highlightColor: color.wallHignlight,
        once: false, 
        needContainer: false,
        /**
         * 地板高亮、添加sample墙体
         * @param    {e}
         * @return   {undefined}
         */
        _hoverWall: function (e) { 
            _getMousePos(e);
            recover.allHighlight();
            recover.allSampleWallList();
            raycaster.setFromCamera(mouse, camera); // 获取射线的目标
            var intersects = raycaster.intersectObjects( meshs.selectedObj._intersectList );
            var cur = intersects[0] ? intersects[0].object : null;
            if (!cur) {
                return;
            }
            var floor = meshs.selectedObj.occupiedFloor[0];  // floor为当前选中墙体的地板
            if (cur.x !== floor.x && cur.y !== floor.y ||  cur.x === floor.x && cur.y === floor.y) {
                return;
            }
            var dir; // 获取目标墙体对于当前墙体的方向
            if (cur.x === floor.x) {
                if (cur.y > floor.y) {
                    dir = 'down';
                } else {
                    dir = 'up';
                }
            } else {
                if (cur.x > floor.x) {
                    dir = 'right';
                } else {
                    dir = 'left';
                }
            }
            var next = floor[dir]; // 依次向该方向遍历
            while (next && !next.occupied && next !== cur) {
                next = next[dir];
            }
            if (next.occupied || next !== cur) { // 如果中间有其他东西则返回
                return;
            } else { // 否则显示地板高亮并且展示sample墙壁
                next = floor[dir];
                while (next !== cur[dir]) {
                    recover.pushHighlight(next);
                    next.highlight();
                    var device = _clone(meshs.selectedObj.device);
                    device.code = 'tempWall';
                    var mesh = _createObj(device);
                    mesh.position.x = next.position.x;
                    mesh.position.z = next.position.z;
                    mesh.setOpacity(0.5);
                    mesh.occupiedFloor = [next];
                    scene.add(mesh);
                    recover.pushSampleWallList(mesh);
                    next = next[dir];
                }
                delete deviceToMesh.tempWall;
            }
        },
        /**
         * 添加正式墙体
         * @return   {undefined}
         */
        _connectWall: function () {
            if (recover._sampleWallList.length > 0) {
                recover._sampleWallList.forEach(function (v) {
                    var device = _clone(v.device);
                    device.code = null;
                    var mesh = _createObj(device);
                    mesh.position.x = v.position.x;
                    mesh.position.z = v.position.z;
                    mesh.occupiedFloor = v.occupiedFloor;
                    mesh.occupiedFloor[0].occupied = mesh;
                    scene.add(mesh);
                });
            }            
            recover.allHighlight();
            recover.allSampleWallList();
        },
        /*
            选中之后的hook方法
         */
        afterSelected: function () {
            var _this = this; 
            this._intersectList = []; // 添加墙体自身的候选列表。
            scene.children.forEach(function (v) {
                if(v.class && v.class.indexOf('floor') !== -1) {
                    _this._intersectList.push(v);
                }       
            });
            /*
                添加两个鼠标事件
             */
            canvas.addEventListener('mousemove', this._hoverWall); // 鼠标移动时 地板高亮、添加sample墙体
            canvas.addEventListener('dblclick', this._connectWall, true); // 鼠标点击时 添加正式墙体
            console.log('wall afterSelected');
        },
        beforeMove: function () { // 移动之前
            recover.allHighlight();
            recover.allSampleWallList();
            canvas.removeEventListener('mousemove', this._hoverWall);
            canvas.removeEventListener('dblclick', this._connectWall, true);
            console.log('wall beforeMove');
        },
        beforeDelete: function () { // 删除之前
            recover.allHighlight();
            recover.allSampleWallList();
            canvas.removeEventListener('mousemove', this._hoverWall);
            canvas.removeEventListener('dblclick', this._connectWall, true); 
            console.log('wall beforeDelete');
        },
        afterComfirmMov: function () { // 确认移动之后
            canvas.addEventListener('mousemove', this._hoverWall);
            canvas.addEventListener('dblclick', this._connectWall, true);
            console.log('wall afterComfirmMov');
        },
        beforeCancelSelected: function () { // 取消选中之前
            recover.allHighlight();
            recover.allSampleWallList();
            canvas.removeEventListener('mousemove', this._hoverWall);
            canvas.removeEventListener('dblclick', this._connectWall, true);
            console.log('beforeCancelSelected');
        }
    };

    deviceList.push({type:'墙体', code:''});

    var manager = new THREE.LoadingManager();
    manager.onLoad = function () {
        
    };

    loadModel('wall', model, '墙体');
    loadGeo('wall', new THREE.CubeGeometry(4,16,4));
    loadTex('./img/board.jpg', manager, function (texture){
        loadMat('wall', new THREE.MeshLambertMaterial({color: '#987654', map: texture}));
    });

    recover.addRecover('sampleWallList', 'scene.remove(v)'); // 添加recover方法
})();

