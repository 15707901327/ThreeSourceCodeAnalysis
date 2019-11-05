import * as THREE from "../../../build/three_r110.module.js";

var PGL = PGL || {};

// 初始化
(function(PGL) {
  /**
   * 初始化渲染器
   * @return {*}
   */
  PGL.initRender = function() {
    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 默认的是，没有设置的这个清晰 THREE.PCFShadowMap
    renderer.castShadow = true;
    return renderer;
  };
  /**
   * 初始化场景
   * @return {*}
   */
  PGL.initScene = function() {
    var scene = new THREE.Scene();
    return scene;
  };
  PGL.initPerspectiveCamera = function() {
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 40, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
  };
  /**
   * 初始化OrbitControls控制器
   * @param camera 相机
   * @param renderer 渲染器
   * @return {THREE.OrbitControls}
   */
  PGL.initOrbitControls = function(camera, renderer) {
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    // 如果使用animate方法时，将此函数删除
    //controls.addEventListener( 'change', render );
    // 使动画循环使用时阻尼或自转 意思是否有惯性
    controls.enableDamping = true;
    //动态阻尼系数 就是鼠标拖拽旋转灵敏度
    //controls.dampingFactor = 0.25;
    //是否可以缩放
    controls.enableZoom = true;
    //是否自动旋转
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    //设置相机距离原点的最近距离
    controls.minDistance = 10;
    //设置相机距离原点的最远距离
    controls.maxDistance = 500;
    //是否开启右键拖拽
    controls.enablePan = true;

    return controls;
  };
  /**
   * 添加灯光
   * @param scene 场景
   */
  PGL.initLight = function(scene) {
    scene.add(new THREE.AmbientLight(0xffffff));

    var light = new THREE.DirectionalLight(0x00ffff);
    light.position.set(15, 50, 10);

    light.castShadow = true;

    scene.add(light);
  };
})(PGL);

/**
 * 矩阵
 */
(function(PGL) {
  PGL.Matrix = {};
  /**
   * 随机生成矩阵
   */
  PGL.Matrix.randomizeMatrix = function() {

    var position = new THREE.Vector3();
    var rotation = new THREE.Euler();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    return function(matrix) {

      position.x = Math.random() * 40 - 20;
      position.y = Math.random() * 40 - 20;
      position.z = Math.random() * 40 - 20;

      rotation.x = Math.random() * 2 * Math.PI;
      rotation.y = Math.random() * 2 * Math.PI;
      rotation.z = Math.random() * 2 * Math.PI;

      quaternion.setFromEuler(rotation, false);

      scale.x = scale.y = scale.z = Math.random() * 1;

      matrix.compose(position, quaternion, scale);

    };

  }()
})(PGL);

/**
 * 功能实现
 */
(function(PGL) {
  /**
   * 根据参数生成天空盒子加到场景的背景上
   */
  PGL.SkyBox = function(scene, baseFileUrl) {
    this.scene = scene;
    this.baseFileUrl = baseFileUrl !== undefined ? baseFileUrl : "source/textures/cube/";
    this.cubePic = {
      "skyboxsun25deg": ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'],
      "skybox": ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'],
      "MilkyWay": ['dark-s_px.jpg', 'dark-s_nx.jpg', 'dark-s_py.jpg', 'dark-s_ny.jpg', 'dark-s_pz.jpg', 'dark-s_nz.jpg']
    };
  };
  Object.assign(PGL.SkyBox.prototype, {

    constructor: PGL.SkyBox,

    update: function(fileName) {

      if (!fileName) {
        fileName = "skyboxsun25deg"
      }

      var loader = new THREE.CubeTextureLoader();
      loader.setPath(this.baseFileUrl + fileName + '/');
      this.scene.background = loader.load(this.cubePic[fileName]);
    }
  });

  /**
   * 射线的相关方法
   * @param camera：相机
   * @param scene：场景
   * @param options = {
   *    domElement: 操作的dom结构
   *    objects{Array}： 射线查找的物体 scene.children
   *    enableDetection{Boolean}：设置是否启动碰撞检测 false
   *    enabledChangeMaterialColor{Boolean}：控制碰撞检测是否显示颜色 false
   *    enabledClick{Boolean}：控制是否开启点选功能
   *  }
   * @constructor
   */
  PGL.RayControls = function(camera, scene, options) {

    // 初始化参数
    options = options || {};
    this.camera = camera; // 相机
    this.scene = scene; // 场景
    this.domElement = (options.domElement !== undefined) ? options.domElement : document; // 事件绑定的dom，默认为整个文档
    this.objects = options.objects !== undefined ? options.objects : this.scene.children; // 射线查找的物体

    // 鼠标事件相关属性
    // 常量值
    this.MOUSEDOWN = "mouseDown";
    this.MOUSEMOVE = "mouseMove";
    this.MOUSEDOWNMOVE = "mouseDownMove"; // 按下鼠标并移动
    this.MOUSEDOWNNOMOVE = "mouseDownNoMove"; // 按下鼠标没有移动
    this.MOUSENO = "mouseNo";
    this.mouseState = this.MOUSENO; // 记录鼠标的状态

    this.mouseX = 0; // 鼠标的位置
    this.mouseY = 0;

    this.mouse = new THREE.Vector2(); // threejs中的标准坐标

    // 拾取物体
    this.raycaster = new THREE.Raycaster();
    this.filterMesh = false; // 射线拾取只返回mesh
    this.filterX = null; // 射线拾取时，返回小于filterX值的项
    this.filterY = null; // 射线拾取时，返回小于filterY值的项
    this.filterZ = null; // 射线拾取时，返回小于filterZ值的项

    // 点选物体所用到的参数
    this.enabledClick = options.enabledClick !== undefined ? options.enabledClick : true; // 是否启用点选功能

    // 添加事件
    this.initEvent();
  };
  Object.assign(PGL.RayControls.prototype, {
    /**
     * 重置属性
     * @param options 重置参数
     *  options = {
     *    camera：相机
     *    scene：场景
     *    domElement: 操作的dom结构
     *    objects{Array}： 射线查找的物体 scene.children
     *    enableDetection{Boolean}：设置是否启动碰撞检测 false
     *    enabledChangeMaterialColor{Boolean}：控制碰撞检测是否显示颜色 false
     *    enabledClick{Boolean}：控制是否开启点选功能
     *  }
     *
     */
    reset: function(options) {
      options = options || {};
      if (options.camera !== undefined) {
        this.camera = options.camera;
      }
      if (options.scene !== undefined) {
        this.scene = options.scene;
      }
      if (options.domElement !== undefined) {
        this.domElement = options.domElement;
      }
      if (options.objects !== undefined) {
        this.objects = options.objects;
      }
      if (options.enableDetection !== undefined) {
        this.enableDetection = options.enableDetection;
      }
    },
    /************************ 点击事件相关方法*****************************/
    /**
     * 点击事件，改变选中几何体的颜色
     * @param event
     * @private
     */
    _selectObjects: function(event) {
      this._convertCoordinate(event);
      var intersects = this._intersectObjects(this.objects, {
        filterMesh: this.filterMesh,
        filterX: this.filterX,
        filterY: this.filterY,
        filterZ: this.filterZ
      });

      if (intersects.length > 0) {
        var mesh = this._findFirstMesh(intersects);
      }

      // 调用返回函数
      if (this.selectObjectsCallBack) {
        this.selectObjectsCallBack(mesh);
      }
    },

    /************************ 计算鼠标位置*********************************/
    /**
     * 将鼠标位置的屏幕坐标转成threejs中的标准坐标
     * @param event
     * @private
     */
    _convertCoordinate: function(event) {
      var left = this._getOffsetLeft(this.domElement);
      var top = this._getOffsetTop(this.domElement);
      this.mouse.x = ((event.clientX - left) / this.domElement.offsetWidth) * 2 - 1;
      this.mouse.y = -((event.clientY - top) / this.domElement.offsetHeight) * 2 + 1;
    },
    /**
     * 获取元素obj到左边的距离
     * @param obj
     * @returns {number}
     * @private
     */
    _getOffsetLeft: function(obj) { //获取某元素以浏览器左上角为原点的坐标
      var l = obj.offsetLeft; //对应父容器的上边距
      //判断是否有父容器，如果存在则累加其边距
      while(obj = obj.offsetParent){//等效 obj = obj.offsetParent;while (obj != undefined)
        l += obj.offsetLeft; //叠加父容器的左边距
      }
      return l;
    },
    /**
     * 获取元素obj到上边的距离
     * @param obj
     * @returns {number}
     * @private
     */
    _getOffsetTop: function(obj) { //获取某元素以浏览器左上角为原点的坐标
      var t = obj.offsetTop; //获取该元素对应父容器的上边距
      //判断是否有父容器，如果存在则累加其边距
      while(obj = obj.offsetParent){//等效 obj = obj.offsetParent;while (obj != undefined)
        t += obj.offsetTop; //叠加父容器的上边距
      }
      return t;
    },

    /************************ 射线检测相关的方法***************************/
    /**
     * 射线查找物体
     * @param objects：查找的数组
     * @param option：控制可选参数
     *  filterMesh：是否过滤出mesh
     *  filterX：过滤x值大小
     *  filterY：过滤y值大小
     *  filterZ：过滤z值大小
     * @returns {Array}
     * @private
     */
    _intersectObjects: function(objects, option) {
      option = option || {};
      var result = [];
      this.raycaster.setFromCamera(this.mouse, this.camera);
      var intersects = this.raycaster.intersectObjects(objects, true);

      if (intersects.length > 0) {
        if (option.filterMesh || option.filterX || option.filterY || option.filterZ) {
          for (var i = 0; i < intersects.length; i++) {
            if (!option.filterMesh || (option.filterMesh && intersects[i].object instanceof THREE.Mesh)) {
              var isFilter = false;
              if (option.filterX && (intersects[i].point.x > option.filterX)) {
                isFilter = true;
              }
              if (option.filterY && (intersects[i].point.y > option.filterY)) {
                isFilter = true;
              }
              if (option.filterZ && (intersects[i].point.z > option.filterZ)) {
                isFilter = true;
              }

              if (!isFilter) {
                result.push(intersects[i]);
              }
            }
          }
        } else {
          result = intersects;
        }
      }

      if (result.length < 0) result = null;
      return result;
    },
    /**
     * 射线查找物体（适用于碰撞检测）
     * @param objects：查找的数组
     * @param cameraEnd{THREE.Vector3}：相机坐标中的结束点坐标
     * @returns {Array}
     */
    intersectObjectsByCameraLocal: function(objects, cameraEnd) {
      var result = [];

      var origin = new THREE.Vector3();
      origin.setFromMatrixPosition(this.camera.matrixWorld);
      var end = this.camera.localToWorld(cameraEnd);
      this.raycaster.set(origin, end.sub(origin).normalize());

      var intersects = this.raycaster.intersectObjects(objects, true);
      if (intersects.length > 0) {
        result = intersects;
      }

      return result;
    },
    /**
     * 射线查找物体
     * @param objects 范围
     * @param origin 起点
     * @param direction 方向
     * @return {Array}
     */
    intersectObjects: function(objects, origin, direction) {
      var result = [];
      this.raycaster.set(origin, direction);
      var intersects = this.raycaster.intersectObjects(objects, true);
      if (intersects.length > 0) {
        result = intersects;
      }

      return result;
    },
    /**
     * 检测相机离地高度
     * @param objects
     * @param characterPosition 人物相对于相机的坐标
     */
    checkCameraHeight: function(objects, characterPosition) {
      var origin = new THREE.Vector3();
      origin.setFromMatrixPosition(this.camera.matrixWorld);

      var intersects = this.intersectObjects(objects, new THREE.Vector3(characterPosition.x, origin.y, characterPosition.z), new THREE.Vector3(0, -1, 0));
      var distance = 8;
      if (intersects.length > 0) {
        distance = intersects[0].distance;
      }
      return distance;
    },
    /**
     * 根据射线查找结果，获取第一个有效的网格
     * @param intersects
     * @return {null}
     * @private
     */
    _findFirstMesh: function(intersects) {
      for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].object.constructor === THREE.Mesh) {
          return intersects[i].object;
        }
      }
      return null;
    },

    /************************** 事件 *********************************************/
    initEvent: function() {
      this._onMouseMove = this._bind(this, this.onMouseMove);
      this._onMouseDown = this._bind(this, this.onMouseDown);
      this._onMouseUp = this._bind(this, this.onMouseUp);

      this.domElement.addEventListener('mousemove', this._onMouseMove, false);
      this.domElement.addEventListener('mousedown', this._onMouseDown, false);
      this.domElement.addEventListener('mouseup', this._onMouseUp, false);
    },

    _bind: function(scope, fn) {
      return function() {
        fn.apply(scope, arguments);
      };
    },

    onMouseDown: function(event) {
      event.preventDefault();
      // event.stopPropagation();
      // console.log("射线：onMouseDown");

      this.mouseState = this.MOUSEDOWN;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    },
    onMouseMove: function(event) {
      event.preventDefault();
      // event.stopPropagation();
      // console.log("射线：onMouseMove");

      // 设置鼠标状态
      if ((this.mouseState === this.MOUSEDOWN) || (this.mouseState === this.MOUSEDOWNMOVE)) {
        if (this.mouseX === event.clientX && this.mouseY === event.clientY) {
          this.mouseState = this.MOUSEDOWNNOMOVE;
        } else {
          this.mouseState = this.MOUSEDOWNMOVE;
        }
      } else {
        this.mouseState = this.MOUSEMOVE;
      }
    },
    onMouseUp: function(event) {
      event.preventDefault();
      // event.stopPropagation();
      // console.log("射线：onMouseUp");

      // 触发拾取功能
      if (this.enabledClick) {
        if (this.mouseState === this.MOUSEDOWNNOMOVE || this.mouseState === this.MOUSEDOWN) {
          this._selectObjects(event);
        }
      }

      this.mouseState = this.MOUSENO;
    },

    /**
     * 删除鼠标事件
     */
    dispose: function() {
      this.domElement.removeEventListener('mousedown', this._onMouseDown, false);
      this.domElement.removeEventListener('mouseup', this._onMouseMove, false);
      this.domElement.removeEventListener('mousemove', this._onMouseUp, false);
    },

    /**************************** 返回函数 **********************************/
    /**
     * 点选的返回函数
     * @param mesh
     */
    selectObjectsCallBack: function(mesh) {
    }
  });

  /**
   * 控制修改材质
   * @constructor
   */
  PGL.MaterialController = function() {
    this.preMeshes = []; // 保存点选改变了的材质
    this.color = new THREE.Color(0xff0000); // 选中默认颜色
    this.changeOpacity = 0.5;
    this.isChangeAllMeshOpacity = false; // 记录是否修改了场景中mesh的透明度
  };
  Object.assign(PGL.MaterialController, {
    // 定义改变材质颜色的类型
    COMMON_TYPE: 0, // 没有进行修改颜色
    ALARM_TYPE: 1, // 警报修改颜色
    LIGHT_TYPE: 2, // 开灯修改颜色
    CLICK_TYPE: 3, // 点选修改颜色

    // 定义颜色级别
    A_LEVEL: "A",
    B_LEVEL: "B",
    C_LEVEL: "C",
    D_LEVEL: "D",
    E_LEVEL: "E"
  });
  Object.assign(PGL.MaterialController.prototype, {
    /****************** 改变材质颜色 ****************************************/
    /**
     * 警报更换颜色
     * @param mesh 机械对象
     * @param option
     *  level：级别
     *  color{THREE.Color}：颜色
     */
    alarmChangeMaterial: function(mesh, option) {
      var color;
      if (option.color) {
        color = option.color;
      } else {
        color = this._getLevelColor(option.level);
      }

      this._changeColorByType(mesh, color, LR.MaterialController.ALARM_TYPE)
    },

    /**
     * 点选修改mesh颜色
     * @param meshes{Array}
     * @param color{THREE.Color}
     * @param isInverseSelect{Boolean} : false 不反选 true 反选 默认反选
     */
    clickChangeColor: function(meshes, color, isInverseSelect) {
      // 检查传入参数
      if (color === undefined) {
        color = this.color;
      }
      if (isInverseSelect !== false) {
        isInverseSelect = true;
      }

      // 判断当前选中的是否和前一次选中的一样
      var isChangCommon = this._isClickChangeCommon(meshes);

      // 恢复上一个选中的meshes
      if (!(isChangCommon && !isInverseSelect)) {
        this._restoreMeshesMaterialColor();
      }

      if (!isChangCommon) {

        for (var i = 0; i < meshes.length; i++) {
          this._changeColorByType(meshes[i], color, PGL.MaterialController.CLICK_TYPE);
        }

        // 记录当前改变的材质
        this.preMeshes = meshes;
      }
    },

    /**
     * 开灯
     * @param mesh
     * @param materialIndex 灯泡id
     */
    lightChangeColor: function(mesh, materialIndex) {
      this._changeColorByType(mesh, null, LR.MaterialController.LIGHT_TYPE, materialIndex);
    },
    /**
     * 关灯时，修改材质
     * @param mesh
     */
    closeLightChange: function(mesh) {
      if (mesh.userData.TYPE === LR.MaterialController.LIGHT_TYPE) {
        mesh.material = mesh.userData.sourceMaterial;
      }

      // 删除亮灯的材质颜色
      if (mesh.userData.openedLightMaterial) {
        this._disposeMaterial(mesh.userData.openedLightMaterial);
      }

      mesh.userData.isOpenedLight = false;
    },

    /**
     * 改变网格材质颜色
     * @param mesh 待修改的网格
     * @param color 材质修改的颜色
     * @param type 改变类型
     * @param materialIndex
     */
    _changeColorByType: function(mesh, color, type, materialIndex) {
      if (color === undefined) {
        color = this.color;
      }

      var currentMaterial;

      // 保存当前材质信息
      this._saveCurrentMaterial(mesh);

      if (type === PGL.MaterialController.LIGHT_TYPE) {
        // 修改灯泡材质
        var currentMaterials = [];
        for (var i = 0; i < mesh.material.length; i++) {
          if (i === materialIndex) {
            currentMaterial = mesh.userData.sourceMaterial[i].clone();

            currentMaterial.color = new THREE.Color(0xffffff);
            currentMaterial.emissive = new THREE.Color(0xece967);
            currentMaterial.emissiveIntensity = 200;
            currentMaterial.opacity = 0.5;
            currentMaterial.transparent = true;

            currentMaterials.push(currentMaterial);
          } else {
            currentMaterials.push(mesh.userData.sourceMaterial[i]);
          }
        }

        if (mesh.userData.isClick || mesh.userData.isAlarm) {
          mesh.userData.openedLightMaterial = currentMaterials;
        } else {
          mesh.material = currentMaterials;
          mesh.userData.TYPE = type;
        }

        mesh.userData.isOpenedLight = true;
      } else {
        // 警报类型 点选类型
        var newMaterial = [];
        if (Array.prototype.isArrayFn(mesh.material)) {
          for (var j = 0; j < mesh.material.length; j++) {
            currentMaterial = mesh.userData.sourceMaterial[j].clone();
            currentMaterial.color = color;
            newMaterial.push(currentMaterial);
          }
        } else {
          currentMaterial = mesh.userData.sourceMaterial.clone();
          currentMaterial.color = color;
          newMaterial = currentMaterial;
        }
      }

      // 警报类型
      if (type === PGL.MaterialController.ALARM_TYPE) {
        if (mesh.userData.isClick) {
          mesh.userData.AlarmMaterial = newMaterial;
        } else {
          mesh.material = newMaterial;
          mesh.userData.TYPE = type;
        }

        mesh.userData.isAlarm = true;
      }
      // 点选类型
      if (type === PGL.MaterialController.CLICK_TYPE) {
        mesh.material = newMaterial;
        mesh.userData.isClick = true;
        mesh.userData.TYPE = type;
      }
    },
    /**
     * 保存当前材质信息
     * @param mesh
     * @private
     */
    _saveCurrentMaterial: function(mesh) {
      // 保存原始材质信息
      if (mesh.userData.TYPE === PGL.MaterialController.CLICK_TYPE) {
        if (!mesh.userData.clickMaterial) mesh.userData.clickMaterial = mesh.material;
      } else if (mesh.userData.TYPE === PGL.MaterialController.LIGHT_TYPE) {
        if (!mesh.userData.openedLightMaterial) mesh.userData.openedLightMaterial = mesh.material;
      } else if (mesh.userData.TYPE === PGL.MaterialController.ALARM_TYPE) {
        if (!mesh.userData.AlarmMaterial) {
          mesh.userData.AlarmMaterial = mesh.material;
        }
      } else {
        if (!mesh.userData.sourceMaterial) mesh.userData.sourceMaterial = mesh.material;
      }
    },
    /**
     * 获取级别对应的颜色对象
     * @param level 级别 A\B\C\D\E
     * @private
     */
    _getLevelColor: function(level) {
      if (level === PGL.MaterialController.A_LEVEL) {
        return new THREE.Color(0xf39606);
      } else if (level === PGL.MaterialController.B_LEVEL) {
        return new THREE.Color(0xff0000);
      } else if (level === PGL.MaterialController.C_LEVEL) {
        return new THREE.Color(0x0000ff);
      } else if (level === PGL.MaterialController.D_LEVEL) {
        return new THREE.Color(0x00ffff);
      } else if (level === PGL.MaterialController.E_LEVEL) {
        return new THREE.Color(0xffff00);
      }
    },
    /**
     * 恢复上次点选改变的材质颜色
     */
    _restoreMeshesMaterialColor: function() {
      for (var i = 0; i < this.preMeshes.length; i++) {
        if (this.preMeshes[i].userData.TYPE === PGL.MaterialController.CLICK_TYPE) {
          if (this.preMeshes[i].userData.isAlarm) {
            this.preMeshes[i].material = this.preMeshes[i].userData.AlarmMaterial;
            this.preMeshes[i].userData.TYPE = PGL.MaterialController.ALARM_TYPE;
          } else if (this.preMeshes[i].userData.isOpenedLight) {
            this.preMeshes[i].material = this.preMeshes[i].userData.openedLightMaterial;
            this.preMeshes[i].userData.TYPE = PGL.MaterialController.LIGHT_TYPE;
          } else {
            this.preMeshes[i].material = this.preMeshes[i].userData.sourceMaterial;
            this.preMeshes[i].userData.TYPE = PGL.MaterialController.COMMON_TYPE;
          }
          this.preMeshes[i].userData.isClick = false;
        }
        this._disposeMaterial(this.preMeshes[i].userData.clickMaterial);
        delete this.preMeshes[i].userData.clickMaterial;
      }

      this.preMeshes = [];
    },
    /**
     * 删除材质
     */
    _disposeMaterial: function(materials) {
      if (materials === undefined) return;
      if (Array.prototype.isArrayFn(materials)) {
        for (var i = 0; i < materials.length; i++) {
          if (materials[i].map) {
            materials[i].map.dispose();
          }
          materials[i].dispose();
        }
      } else {
        if (materials.map) {
          materials.map.dispose();
        }
        materials.dispose();
      }
    },
    /**
     * 判断当前选中颜色和上一个选中颜色是否一致
     * @param arr{Array}
     * @return {boolean} 相同 true 不同 false
     * @private
     */
    _isClickChangeCommon: function(arr) {
      var i;
      if (this.preMeshes.length !== arr.length) {
        return false;
      } else {
        for (i = 0; i < arr.length; i++) {
          if (this.preMeshes[i] !== arr[i]) {
            return false;
          }
        }
      }

      return true;
    },
    /****************** 改变材质透明度 ****************************************/
    /**
     * 改变object中所有除meshes中网格的透明度
     * @param object 透明的范围
     * @param meshes 网格
     * @param changOpacity 透明度值
     */
    changeOtherMeshesOpacity: function(object, meshes, changOpacity) {

      changOpacity = changOpacity || this.changeOpacity;

      searchObject(object, changOpacity);
      this.isChangeAllMeshOpacity = true;

      function searchObject(object, changOpacity) {
        var i;
        var isChangeOpacity = true;
        if (object.constructor === THREE.Mesh) {
          for (i = 0; i < meshes.length; i++) {
            if (object === meshes[i]) {
              isChangeOpacity = false;
            }
          }

          if (Array.prototype.isArrayFn(object.material)) {
            for (i = 0; i < object.material.length; i++) {

              if (isChangeOpacity) {
                object.material[i].userData.originTransparent = object.material[i].userData.originTransparent || object.material[i].transparent;
                object.material[i].userData.originOpacity = object.material[i].userData.originOpacity || object.material[i].opacity;

                object.material[i].opacity = changOpacity;
                object.material[i].transparent = true;
              } else {
                if (object.material[i].userData.originTransparent) {
                  object.material[i].transparent = object.material[i].userData.originTransparent;
                }
                if (object.material[i].userData.originOpacity) {
                  object.material[i].opacity = object.material[i].userData.originOpacity;
                }
              }
            }
          } else {
            if (isChangeOpacity) {
              object.material.userData.originTransparent = object.material.userData.originTransparent || object.material.transparent;
              object.material.userData.originOpacity = object.material.userData.originOpacity || object.material.opacity;

              object.material.opacity = changOpacity;
              object.material.transparent = true;
            } else {
              if (object.material.userData.originTransparent) {
                object.material.transparent = object.material.userData.originTransparent;
              }
              if (object.material.userData.originOpacity) {
                object.material.opacity = object.material.userData.originOpacity;
              }
            }
          }
        } else if (object.constructor === THREE.Object3D || object.constructor === THREE.Group) {
          for (i = 0; i < object.children.length; i++) {
            searchObject(object.children[i], changOpacity)
          }
        }
      }
    },
    /**
     * 取消透明设置
     */
    restoreAllMeshOpacity: function(object) {
      if (this.isChangeAllMeshOpacity) {
        searchObject(object);
        this.isChangeAllMeshOpacity = false;
      }

      function searchObject(object) {
        var i;
        if (object.constructor === THREE.Mesh) {
          if (Array.prototype.isArrayFn(object.material)) {

            for (i = 0; i < object.material.length; i++) {
              if (object.material[i].userData.originOpacity) {
                object.material[i].opacity = object.material[i].userData.originOpacity;
                object.material[i].transparent = object.material[i].userData.originTransparent;

                if (object.userData.TYPE === PGL.MaterialController.ALARM_TYPE) {
                  object.userData.AlarmMaterial[i].opacity = object.userData.AlarmMaterial[i].userData.originOpacity;
                  object.userData.AlarmMaterial[i].transparent = object.userData.AlarmMaterial[i].userData.originTransparent;
                }
              }
            }
          } else {
            if (object.material.userData.originOpacity) {
              object.material.opacity = object.material.userData.originOpacity;
              object.material.transparent = object.material.userData.originTransparent;

              if (object.userData.TYPE === PGL.MaterialController.ALARM_TYPE) {
                object.userData.AlarmMaterial.opacity = object.AlarmMaterial.userData.originOpacity;
                object.userData.AlarmMaterial.transparent = object.AlarmMaterial.userData.originTransparent;
              }
            }
          }
        } else if (object.constructor === THREE.Object3D || object.constructor === THREE.Group) {
          for (i = 0; i < object.children.length; i++) {
            searchObject(object.children[i])
          }
        }
      }
    }
  });
})(PGL);

Array.prototype.isArrayFn = (function() {
  return function(value) {
    if (typeof Array.isArray === "function") {
      return Array.isArray(value);
    } else {
      return Object.prototype.toString.call(value) === "[object Array]";
    }
  };
})();

PGL.ExtrudeMesh = function() {

};
Object.assign(PGL.ExtrudeMesh.prototype, {
  /**
   * 创建ExtrudeBufferGeometry
   * @param arr 数组
   * @param depth 深度
   * @returns {THREE.ExtrudeBufferGeometry}
   */
  createExtrudeBufferGeometry: function(arr, depth) {

    var pts = this._getPts(arr);
    var shape = new THREE.Shape(pts);

    var extrudeSettings = {
      steps: 2,
      depth: depth,
      bevelEnabled: false, // 对形状
      // bevelThickness: 1,
      // bevelSize: 1,
      // bevelOffset: 0,
      // bevelSegments: 1
    };

    return new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
  },

  /**
   * 获取vector2数组
   * @param arr
   * @returns {Array}
   * @private
   */
  _getPts: function(arr) {
    var pts = [];
    for (var i = 0; i < arr.length; i++) {
      pts.push(new THREE.Vector2(arr[i][0], arr[i][1]));
    }

    return pts;
  },

  /**
   * 获取面的长度
   * @param arr
   * @returns {Array}
   */
  getArrLength: function(arr) {
    var arr2 = [];
    for (var i = 1; i < arr.length; i++) {
      arr2.push(Math.sqrt(Math.pow(arr[i][0] - arr[i - 1][0], 2) + Math.pow(arr[i][1] - arr[i - 1][1], 2)));
    }
    arr2.push(Math.sqrt(Math.pow(arr[0][0] - arr[arr.length - 1][0], 2) + Math.pow(arr[0][1] - arr[arr.length - 1][1], 2)));
    return arr2;
  }
});

export default PGL;