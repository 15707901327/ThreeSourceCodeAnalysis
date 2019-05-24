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
            // var axes = new THREE.AxesHelper(100);
            // this.scene.add(axes);
        },
        initCamera: function () {
            this.camera = new THREE.PerspectiveCamera(45, this.getWidth() / this.getHeight(), 0.1, 30000);
            this.camera.position.set(0, 0, 10);
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
            this.orbitControls.minDistance = 1;
            //设置相机距离原点的最远距离
            this.orbitControls.maxDistance = 30000;
            //是否开启右键拖拽
            this.orbitControls.enablePan = true;
        },
        initStats: function () {
            this.stats = new Stats();
            this.container.appendChild(this.stats.dom);
        },
        render: function () {
            this.mesh.rotateZ(Math.PI/4);
            this.webGLRenderer.render(this.scene, this.camera);
        },
        initEvent: function () {
            var _onWindowResize = this._bind(this, this.onWindowResize);
            window.addEventListener("resize", _onWindowResize, false)
        },

        initObject: function () {
            var bufferGeometry = new THREE.BufferGeometry();

            var positions = new Float32Array([0.0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
            bufferGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            var meshPhongMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color(1, 0, 0)
            });

            var mesh = new THREE.Mesh(bufferGeometry, meshPhongMaterial);
            this.mesh = mesh;
            this.scene.add(mesh);

            // // 拉伸体
            // var arr = [
            //     [40.52500000002626, 26.459999999966193, 80.99999999999999],
            //     [36.634000000079624, 26.959999999966424, 80.99999999999999],
            //     [36.57030044973772, 26.464290099220907, 80.99999999999999],
            //     [33.701000000006054, 26.833000000102444, 80.99999999999999],
            //     [33.49407705513509, 25.222725642377508, 80.99999999999999],
            //     [30.527000000002328, 25.6040000002868, 80.99999999999999],
            //     [30.276968907796963, 23.535438281022106, 80.99999999999999],
            //     [23.95100000000447, 24.331999999939416, 80.99999999999999],
            //     [24.30987265532082, 27.19533831626037, 80.99999999999999],
            //     [27.11900000006603, 26.919000000225612, 80.99999999999999],
            //     [27.478000000006052, 29.922999999951895, 80.99999999999999],
            //     [25.97846627236111, 30.105401669629337, 80.99999999999999],
            //     [14.201000000002887, 31.538000000174716, 80.99999999999999],
            //     [14.635000000006519, 34.84600000037118, 80.99999999999999],
            //     [13.661000000086613, 34.99300000024936, 80.99999999999999],
            //     [14.096000000015552, 38.44599999999436, 80.99999999999999],
            //     [3.09800000000298, 39.82500000018561, 80.99999999999999],
            //     [1.8754457793016917, 30.455517484342494, 80.99999999999999],
            //     [0.9760000000307336, 30.54000000003669, 80.99999999999999],
            //     [0.0, 22.901000000071992, 80.99999999999999],
            //     [1.4840000000543891, 22.672000000256812, 80.99999999999999],
            //     [1.0393455140318721, 19.130212833174085, 80.99999999999999],
            //     [0.8220000000485219, 17.399000000206986, 80.99999999999999],
            //     [4.726000000029523, 16.813000000083587, 80.99999999999999],
            //     [5.318883500185236, 20.76285867579556, 80.99999999999999],
            //     [6.697000000043865, 20.55600000033318, 80.99999999999999],
            //     [6.795000000045448, 21.235000000334857, 80.99999999999999],
            //     [7.888389264470338, 21.100516625218138, 80.99999999999999],
            //     [6.99499999999823, 13.83700000029439, 80.99999999999999],
            //     [11.987000000077671, 13.2230000002339, 80.99999999999999],
            //     [12.453684766656252, 17.017283964904863, 80.99999999999999],
            //     [14.578000000100582, 16.756000000053458, 80.99999999999999],
            //     [14.805772755992132, 18.607859280429455, 80.99999999999999],
            //     [15.951000000000745, 18.46700000017886, 80.99999999999999],
            //     [14.642000000110547, 7.996000000278838, 80.99999999999999],
            //     [20.0200000000176, 7.3760000001638195, 80.99999999999999],
            //     [20.468325108641665, 11.264858764131413, 80.99999999999999],
            //     [20.736000000035204, 11.23400000017425, 80.99999999999999],
            //     [21.682624788611566, 11.1345270154987, 80.99999999999999],
            //     [20.90800000005681, 4.473000000232784, 80.99999999999999],
            //     [23.897132867132964, 4.056048264264967, 80.99999999999999],
            //     [23.775000000021418, 3.2020000000472644, 80.99999999999999],
            //     [27.97708259022031, 2.614745110275969, 80.99999999999999],
            //     [28.964772880189585, 9.682129723483975, 80.99999999999999],
            //     [29.977347049630804, 9.54408225324247, 80.99999999999999],
            //     [29.668000000067984, 6.772000000349944, 80.99999999999999],
            //     [31.12813672446748, 6.625312284104712, 80.99999999999999],
            //     [30.438000000085495, 0.8340000002640299, 80.99999999999999],
            //     [37.11600000003455, 0.0, 80.99999999999999]
            // ];
            // var extrudeMesh = new THREE.ExtrudeMesh();
            // console.log(extrudeMesh.getArrLength(arr));
            // var geometry = extrudeMesh.createExtrudeBufferGeometry(arr, 100);
            // var texture = new THREE.TextureLoader().load('textures/cube/skybox/nx.jpg');
            // texture.wrapS = THREE.RepeatWrapping;
            // texture.wrapT = THREE.RepeatWrapping;
            // texture.repeat.set( 1, 1 );
            //
            // var material = new THREE.MeshPhongMaterial({
            //     map: texture
            // });
            // var mesh = new THREE.Mesh(geometry, material);
            // this.scene.add(mesh);
            // console.log(mesh);
        },
        /**
         * 添加天空盒子
         */
        initSkyBox: function () {
            let texture = new THREE.TextureLoader().load('../statics/image/skybox/sky.png');
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