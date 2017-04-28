```
user.state = {
    set (s){
        if (s === this._state || 非法值) {
            return
        }
        __leaveUserFn[this._state].call(this)
        __enterUserFn[s].call(this)
        this._state = s
    }
}
var __leaveUserFn = { // 离开状态的方法
    normal(正常): {
        解除绑定鼠标点击事件1
    }, 
    moving(移动): {
        解除绑定鼠标移动事件
        解除绑定鼠标点击事件2
    }, 
    selecting(选择): {
        解除绑定鼠标点击事件1
    }
}
var __enterUserFn = { // 进入状态的方法
    normal(正常): {
        绑定鼠标点击事件1
        intersecting.changeTarget(可以交互的物体)
    }, 
    moving(移动): {
        绑定鼠标移动事件
        绑定鼠标点击事件2
        intersecting.changeTarget(地板)
    }, 
    selecting(选择): {
        绑定鼠标点击事件1
        intersecting.changeTarget(可以交互的物体)
    }
}

handeler = {
    鼠标点击事件1 () {
        oprations.select( intersect() )
    },
    鼠标点击事件2 () {
        oprations.comfirmMov()
    },
    鼠标移动事件 () {
        判断地面选区是否合法
        对地板设置高亮
        meshs.sampleObj.position = ... // 移动Mesh

    }
}

var intersecting = {}
intersecting.list = []
intersecting.changeTarget = function (target) {
    ... // 删选被选择队列
}

metaDatas = {
    (uuid)(物体id): {
        texture,
        metaData
    }
}

meshs = {
    sampleObj(示例物体)
    removedByMovingObj(移动的物体临时安置)
    selectedObj(被选择的物体)
}

oprations = {
    newObj(新建): (新建物体的参数){
        scene.remove(meshs.sampleObj)
        meshs.sampleObj = new (新建物体的参数)
        meshs.sampleObj.state = 'moving'
        user.state = 'moving'
    },
    move(移动): {
        meshs.removedByMovingObj = meshs.selectedObj
        ... // 保存物体信息
        scene.remove(meshs.removedByMovingObj)
        meshs.sampleObj = meshs.clone()
        meshs.sampleObj.state = 'moving'
        user.state = 'moving'    
    },
    rotate(旋转): {
        meshs.selectedObj.retate()
    },
    deleteObj(删除): {
        result = modal() // 弹出提示框 是否删除
        if (result) {
            .. //删除物体
        }
    },
    select(选择): (result){
        if (result) {
            meshs.selectedObj = resultObj
            meshs.selectedObj.state = 'selected'
            user.state = 'selecting'
        } else {
            meshs.selectedObj && meshs.selectedObj.state = 'normal'
            meshs.selectedObj = null
            user.state = 'normal'
        }
    },
    comfirmMov(确认移动): {
        scene.remove(meshs.sampleObj)
        if (meshs.removedByMovingObj) { // 来自移动
            meshs.selectedObj = meshs.removedByMovingObj
            meshs.removedByMovingObj = null
        } else {  // 来自新建
            meshs.selectedObj = new (新建物体的参数)
            meshs.selectedObj.options = ... // 设置物体信息
        }        
        meshs.selectedObj.options = ... // 设置物体位置
        scene.add(meshs.selectedObj)
        meshs.selectedObj.state = 'selected'
        user.state = 'selecting'
    }, 
    cancel(取消移动): {
        scene.remove(meshs.sampleObj)
        if (meshs.removedByMovingObj) { // 来自移动
            meshs.selectedObj = meshs.removedByMovingObj
            meshs.removedByMovingObj = null
            scene.add(meshs.selectedObj)
            meshs.selectedObj.state = 'selected'
            user.state = 'selecting'
        } else { // 来自新建
            user.state = 'normal'
        }
    }
}

var __leaveMeshFn = { // 离开状态的方法
    normal () {},
    selected () {
        this.beforeCancelSelected && this.beforeCancelSelected()
        this.unHighlight()
        hideDeviceInfo(this) 
    },
    moving () {
        this.beforeCancelMoving && this.beforeCancelMoving()
        this.setOpacity(1)
    }
}
var __enterMeshFn = { // 进入状态的方法
    normal () {

    },
    selected () {
        this.beforeSelected && this.beforeSelected()
        this.highlight()
        showDeviceInfo()
    },
    moving () {
        this.beforeMoving && this.beforeMoving()
        this.setOpacity(0.5)
    }
}

THREE.Mesh.prototype += {
    state: {
        set (s) {
            if (s === this._state || 非法值) {
                return
            }
            __leaveMeshFn[this._state].call(this)
            __enterMeshFn[s].call(this)
            this._state = s
        },
        get () {
            return this._state
        }
    }
}

user.state = 'normal'

```