var PGL = PGL || {};
/**
 * 场景初始化区
 */
(function (PGL) {
    /**
     *
     * @param config 加载配置文件
     * @param options
     *  container: 挂载点
     *  enabledClick：控制是否开启射线拾取 true
     *  enabledSkyBox: 开启天空盒子 true
     */
    PGL.scene3D = function (config, options) {
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
        init: function () {
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
                _this.orbitControls.update();
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
            this.rayControls.selectObjectsCallBack = function (mesh) {
                _this.selectObjectsCallBack(mesh);
            };
            this.rayControls.selectFirstObjectCallBack = function (object) {
                console.log(object);
            };
        },
        initWebGLRenderer: function () {
            this.webGLRenderer = new THREE.WebGLRenderer({
                antialias: true
            });
            this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
            this.container.appendChild(this.webGLRenderer.domElement);
        },
        initScene: function () {
            this.scene = new THREE.Scene();
            // this.scene.fog = new THREE.Fog(0xffffff, 300, 1200);
            var axes = new THREE.AxesHelper(100);
            this.scene.add(axes);
        },
        initCamera: function () {
            this.camera = new THREE.PerspectiveCamera(45, this.getWidth() / this.getHeight(), 0.1, 30000);
            this.camera.position.set(0, 0, 5);
        },
        initLight: function () {
            var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);

            var light = new THREE.DirectionalLight(0xffffff, .6);
            light.position.set(-200, 200, 100);
            light.castShadow = true;
            this.scene.add(light);

            var SpotLight = new THREE.SpotLight(0xffffff, .6);
            SpotLight.castShadow = true;
            SpotLight.position.set(-200, 200, -200);
            SpotLight.shadow.mapSize.width = 4096;
            SpotLight.shadow.mapSize.height = 4096;
            this.scene.add(SpotLight);
        },
        initOrbitControls: function () {
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
        },
        initStats: function () {
            this.stats = new Stats();
            this.container.appendChild(this.stats.dom);
        },
        render: function () {
            // this.mesh.rotateZ(Math.PI / 4);
            this.webGLRenderer.render(this.scene, this.camera);
        },
        initEvent: function () {
            var _onWindowResize = this._bind(this, this.onWindowResize);
            window.addEventListener("resize", _onWindowResize, false)
        },

        initObject: function () {
            var bufferGeometry = new THREE.BufferGeometry();

            var positions = new Float32Array([
                0.0, 0.5, -0.4,
                -0.5, -0.5, -0.4,
                0.5, -0.5, -0.4,

                0.5, 0.4, -0.2,
                -0.5, 0.4, -0.2,
                0.0, -0.6, -0.2,

                0.0, 0.5, 0.0,
                -0.5, -0.5, 0.0,
                0.5, -0.5, 0.0
            ]);
            var color = new Float32Array([
                0.4, 1.0, 0.4,
                0.4, 1.0, 0.4,
                1.0, 0.4, 0.4,

                1.0, 0.4, 0.4,
                1.0, 1.0, 0.4,
                1.0, 1.0, 0.4,

                0.4, 0.4, 1.0,
                0.4, 0.4, 1.0,
                1.0, 0.4, 0.4
            ]);
            bufferGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            bufferGeometry.addAttribute('color', new THREE.Float32BufferAttribute(color, 3));

            var meshPhongMaterial = new THREE.MeshPhongMaterial();
            meshPhongMaterial.vertexColors = THREE.VertexColors;

            var mesh = new THREE.Mesh(bufferGeometry, meshPhongMaterial);
            this.mesh = mesh;
            this.scene.add(mesh);
        },
        /**
         * 添加天空盒子
         */
        initSkyBox: function () {
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
        getHeight: function () {
            return $(this.container).height();
        },
        getWidth: function () {
            return $(this.container).width();
        },
        /***************************** 事件 ************************************/
        onWindowResize: function () {
            this.camera.aspect = this.getWidth() / this.getHeight();
            this.camera.updateProjectionMatrix();
            this.render();
            this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
        },
        _bind: function (scope, fn) {
            return function () {
                fn.apply(scope, arguments);
            };
        },

        /***************************** 回调函数 ********************************/
        /**
         * 射线拾取回调函数
         */
        selectObjectsCallBack: function (mesh) {
        }
    });
})(PGL);

$(function () {
    var scene3D = new PGL.scene3D({}, {
        container: document.getElementById("container"),
        enabledSkyBox: false
    });
    scene3D.init();
});