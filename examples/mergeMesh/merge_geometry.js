(function (PGL) {
  /**
   * 创建场景类
   * @constructor
   */
  PGL.Scene3D = function () {
  };
  Object.assign(PGL.Scene3D.prototype, {
    /***************************** 初始化 *******************************/
    init: function () {
      this.renderer = PGL.initRender();
      document.body.appendChild(this.renderer.domElement);

      this.scene = PGL.initScene();
      this.camera = PGL.initPerspectiveCamera();
      PGL.initLight(this.scene);
      this.controls = PGL.initOrbitControls(this.camera, this.renderer);

      this.initGUI();

      this.stats = this.initStats();

      window.onresize = this.onWindowResize.bind(this);

      var _this = this;
      animate();

      function animate() {
        _this.render();
        requestAnimationFrame(animate);
      }
    },

    /**
     * 初始化
     * @return {*}
     */
    initStats: function () {
      var stats = new Stats();
      document.body.appendChild(stats.dom);
      return stats;
    },

    /**
     * 初始化GUI
     */
    initGUI: function () {
      var _this = this;
      var gui = {
        numberOfObjects: 500, //当前场景中模型的个数
        combined: false, //是否合并模型
        redraw: function () {
          var i;
          //删除场景内现有的立方体
          var arr = [];
          _this.scene.traverse(function (e) {
            if (e instanceof THREE.Mesh) arr.push(e);
          });
          arr.forEach(function (value) {
            _this.scene.remove(value);
          });

          //重新生成立方体
          if (gui.combined) {
            //合并模型，则使用merge方法合并
            var geometry = new THREE.Geometry();
            //merge方法将两个几何体对象或者Object3D里面的几何体对象合并,(使用对象的变换)将几何体的顶点,面,UV分别合并.
            //THREE.GeometryUtils: .merge() has been moved to Geometry. Use geometry.merge( geometry2, matrix, materialIndexOffset ) instead.
            for (i = 0; i < gui.numberOfObjects; i++) {
              var cube = _this.addCube();
              cube.updateMatrix();
              geometry.merge(cube.geometry, cube.matrix);
            }

            _this.scene.add(new THREE.Mesh(geometry));
          }
          else {
            for (i = 0; i < gui.numberOfObjects; i++) {
              _this.scene.add(_this.addCube());
            }
          }
        }
      };
      var datGui = new dat.GUI();
      datGui.add(gui, "numberOfObjects", 0, 20000);
      datGui.add(gui, "combined");
      datGui.add(gui, "redraw");

      gui.redraw();
    },

    addCube: function () {
      var cubeSize = 1.0;
      var cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      //创建立方体的方法
      var cubeMaterial = new THREE.MeshLambertMaterial({color: 0x00ff00, transparent: true, opacity: 0.8});

      var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

      cube.position.x = -100 + Math.round(Math.random() * 200);
      cube.position.y = -100 + Math.round(Math.random() * 200);
      cube.position.z = -100 + Math.round(Math.random() * 200);

      return cube;
    },

    /**
     * 渲染调用
     */
    render: function () {
      this.stats.update();
      this.controls.update();

      this.renderer.render(this.scene, this.camera);
    },

    /***************************** 事件 *******************************/
    onWindowResize: function () {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.render();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });
})(PGL);