import {MTLLoader} from './jsm/loaders/MTLLoader.js';
import {OBJLoader} from './jsm/loaders/OBJLoader.js';

/**
 * 场景初始化区
 */
(function(PGL) {
  /**
   * 场景创建类
   * @param config 加载配置文件
   * @param options
   *  container: 挂载点
   *  enabledClick：控制是否开启射线拾取 true
   *  enabledSkyBox: 开启天空盒子 true
   */
  PGL.scene3D = function(config, options) {
    this.config = config || {
      modelData: {}
    };
    this.options = options || {};

    this.container = options.container !== undefined ? options.container : document.getElementById("container");
    this.enabledClick = options.enabledClick !== undefined ? options.enabledClick : true;
    this.enabledSkyBox = options.enabledSkyBox !== undefined ? options.enabledSkyBox : true;
  };
  Object.assign(PGL.scene3D.prototype, {
    /**
     * 初始化场景
     */
    init: function() {
      var _this = this;

      this.initWebGLRenderer();
      this.initScene();
      this.initCamera();
      this.initLight();
      this.initOrbitControls();
      this.initStats();
      this.initObject();

      this.initEvent();
      animate();

      function animate() {
        requestAnimationFrame(animate);

        //更新控制器
        if (_this.orbitControls) {
          _this.orbitControls.update();
        }
        _this.render();
        _this.stats.update();
      }

      // 天空盒子
      if (this.enabledSkyBox) {
        this.initSkyBox();
      }

      // 射线摄取
      this.rayControls = new PGL.RayControls(this.camera, this.scene, {
        domElement: this.webGLRenderer.domElement
      });
      this.rayControls.selectObjectsCallBack = function(mesh) {
        _this.selectObjectsCallBack(mesh);
      };
      this.rayControls.selectFirstObjectCallBack = function(object) {
        console.log(object);
      };
    },
    initWebGLRenderer: function() {
      this.webGLRenderer = new THREE.WebGLRenderer({
        antialias: true
      });
      this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
      this.webGLRenderer.setClearColor(0x000000);
      this.container.appendChild(this.webGLRenderer.domElement);
    },
    initScene: function() {
      this.scene = new THREE.Scene();
      // this.scene.background = new THREE.Color(0xff0000);

      // this.scene.fog = new THREE.Fog(0xffffff, 300, 1200);
      // var axes = new THREE.AxesHelper(100);
      // this.scene.add(axes);
    },
    initCamera: function() {
      this.camera = new THREE.PerspectiveCamera(45, this.getWidth() / this.getHeight(), 0.1, 30000);
      this.camera.position.set(3, 3, 7);
      this.camera.lookAt(0, 0, 0);
    },
    initLight: function() {
      // var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      // this.scene.add(ambientLight);

      var light = new THREE.DirectionalLight(0xffffff, 0.5);
      light.position.set(1.5, 3.0, 4.0);
      this.scene.add(light);

      // var helper = new THREE.DirectionalLightHelper( light, 4 );
      // this.scene.add( helper );

      // var SpotLight = new THREE.SpotLight(0xffffff, .6);
      // SpotLight.castShadow = true;
      // SpotLight.position.set(-200, 200, -200);
      // SpotLight.shadow.mapSize.width = 4096;
      // SpotLight.shadow.mapSize.height = 4096;
      // this.scene.add(SpotLight);
    },
    initOrbitControls: function() {
      this.orbitControls = new THREE.OrbitControls(this.camera, this.webGLRenderer.domElement);
      // 如果使用animate方法时，将此函数删除
      //controls.addEventListener( 'change', render );
      // 使动画循环使用时阻尼或自转 意思是否有惯性
      this.orbitControls.enableDamping = false;
      //动态阻尼系数 就是鼠标拖拽旋转灵敏度
      this.orbitControls.dampingFactor = 0.5;
      //是否可以缩放
      this.orbitControls.enableZoom = true;
      //是否自动旋转
      this.orbitControls.autoRotate = false;
      //设置相机距离原点的最远距离
      // this.orbitControls.minDistance = 0.1;
      //设置相机距离原点的最远距离
      // this.orbitControls.maxDistance = 30000;
      //是否开启右键拖拽
      this.orbitControls.enablePan = true;
      this.orbitControls.enableRotatePhi = false;
      var orbitControls = this.orbitControls;

      document.getElementById("item1").addEventListener("click", function(event) {
        orbitControls.handleScale(-1);
      });
      document.getElementById("item2").addEventListener("click", function(event) {
        orbitControls.handleScale(1);
      });
    },
    initStats: function() {
      this.stats = new Stats();
      this.container.appendChild(this.stats.dom);
    },
    render: function() {
      this.webGLRenderer.render(this.scene, this.camera);
    },
    initEvent: function() {
      var _onWindowResize = this._bind(this, this.onWindowResize);
      window.addEventListener("resize", _onWindowResize, false)
    },

    initObject: function() {
      var geometry = new THREE.BufferGeometry();

      var vertices = [
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,

        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0
      ]; // 顶点
      var color = [
        // 颜色
        1.0, 1.0, 1.0,  // v0 White
        1.0, 0.0, 1.0,  // v1 Magenta
        1.0, 0.0, 0.0,  // v2 Red
        1.0, 1.0, 0.0,  // v3 Yellow
        0.0, 1.0, 0.0,  // v4 Green
        0.0, 1.0, 1.0,  // v5 Cyan
        0.0, 0.0, 1.0,  // v6 Blue
        0.0, 0.0, 0.0   // v7 Black
      ];
      var indices = [
        0, 1, 2, 0, 2, 3,    // front
        0, 3, 4, 0, 4, 5,    // right
        0, 5, 6, 0, 6, 1,    // up
        1, 6, 7, 1, 7, 2,    // left
        7, 4, 3, 7, 3, 2,    // down
        4, 7, 6, 4, 6, 5     // back
      ]; // 顶点索引

      // 顶点坐标
      var posA = new THREE.Vector3();
      var posB = new THREE.Vector3();
      var posC = new THREE.Vector3();

      // 面上的向量
      var nab = new THREE.Vector3();
      var nbc = new THREE.Vector3();

      var faceNormals = [];
      var count = indices.length / 3;
      for (var i = 0; i < count; i++) {
        posA.set(
          vertices[indices[i * 3] * 3],
          vertices[indices[i * 3] * 3 + 1],
          vertices[indices[i * 3] * 3 + 2]
        );
        posB.set(
          vertices[indices[i * 3 + 1] * 3],
          vertices[indices[i * 3 + 1] * 3 + 1],
          vertices[indices[i * 3 + 1] * 3 + 2]
        )
        posC.set(
          vertices[indices[i * 3 + 2] * 3],
          vertices[indices[i * 3 + 2] * 3 + 1],
          vertices[indices[i * 3 + 2] * 3 + 2]
        )

        nab.subVectors(posA, posB);
        nbc.subVectors(posB, posC);

        var faceNormal = new THREE.Vector3();
        faceNormal.crossVectors(nab, nbc);
        faceNormals.push(faceNormal.normalize());
      }

      var vertex_count = vertices.length / 3;
      var vertexNormals = [];
      for (var i = 0; i < vertex_count; i++) {

        // 包含顶点的面法线
        var vertexfaceNormals = [];
        for (var j = 0; j < indices.length; j++) {
          if (i === indices[j]) {
            var faceNormal = faceNormals[Math.floor(j / 3)];
            // 去除重复元素
            var isVisible = false;
            for (var k = 0; k < vertexfaceNormals.length; k++) {
              if (vertexfaceNormals[k].x === faceNormal.x && vertexfaceNormals[k].y === faceNormal.y && vertexfaceNormals[k].z === faceNormal.z) {
                isVisible = true;
                break;
              }
            }

            if (!isVisible) {
              vertexfaceNormals.push(faceNormals[Math.floor(j / 3)]);
            }
          }
        }

        var vertexNormal = new THREE.Vector3();
        for (var j = 0; j < vertexfaceNormals.length; j++) {
          vertexNormal.add(vertexfaceNormals[j]);
        }

        vertexNormal.normalize();
        vertexNormals.push(vertexNormal.x);
        vertexNormals.push(vertexNormal.y);
        vertexNormals.push(vertexNormal.z);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(vertexNormals, 3));
      geometry.setIndex(indices);

      var material = new THREE.MeshPhongMaterial({
        color: 0xaaaaaa,
        specular: 0xffffff,
        shininess: 250,
        side: THREE.DoubleSide,
        vertexColors: true
      });
      var mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
    },
    /**
     * 添加天空盒子
     */
    initSkyBox: function() {
      let texture = new THREE.TextureLoader().load('textures/skybox/sky.png');
      let sphereGeometry = new THREE.SphereGeometry(700, 50, 50);
      sphereGeometry.scale(-1, 1, 1);
      let sphereMaterial = new THREE.MeshBasicMaterial({
        map: texture
      });
      let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      this.scene.add(sphere);
    },

    /**
     * 获取渲染面的范围
     * @returns {*|jQuery}
     */
    getHeight: function() {
      return $(this.container).height();
    },
    getWidth: function() {
      return $(this.container).width();
    },
    /***************************** 事件 ************************************/
    onWindowResize: function() {
      this.camera.aspect = this.getWidth() / this.getHeight();
      this.camera.updateProjectionMatrix();
      this.render();
      this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
    },
    _bind: function(scope, fn) {
      return function() {
        fn.apply(scope, arguments);
      };
    },

    /***************************** 回调函数 ********************************/
    /**
     * 射线拾取回调函数
     */
    selectObjectsCallBack: function(mesh) {
    }
  });
})(PGL);

$(function() {
  var scene3D = new PGL.scene3D({}, {
    container: document.getElementById("container"),
    enabledSkyBox: false
  });
  scene3D.init();
});