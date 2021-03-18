import {GLTFLoader} from './jsm/loaders/GLTFLoader_r115.js';
import PGL from './jsm/PGL/PGL.js';
import Stats from "./jsm/libs/stats.module.js";
import {OrbitControls} from "./jsm/controls/OrbitControls.js";
import * as THREE from "../build/three_r115.module.js";

function searchALLMaterial(model, callback) {
    if (model.constructor === THREE.Mesh) {
        callback(model.material);
    } else if (model.constructor === THREE.Group || model.constructor === THREE.Object3D || model.constructor === THREE.Scene) {
        for (var i = 0; i < model.children.length; i++) {
            searchALLMaterial(model.children[i], callback);
        }
    }
}

/**
 * 场景初始化区
 */
(function (PGL) {
    /**
     * 场景创建类
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

        this.clock = new THREE.Clock();
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

                let delta = _this.clock.getDelta();
                if (_this.mixer) {
                    _this.mixer.update(delta);
                }
                //更新控制器
                _this.orbitControls.update();
                _this.render();
                _this.stats.update();
            }

            this.animate = animate;

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
            this.webGLRenderer.setClearColor(0x000000);
            this.container.appendChild(this.webGLRenderer.domElement);
        },
        initScene: function () {
            this.scene = new THREE.Scene();
            // this.scene.background = new THREE.Color(0xff0000);

            // this.scene.fog = new THREE.Fog(0xffffff, 300, 1200);
            var axes = new THREE.AxesHelper(100);
            this.scene.add(axes);
        },
        initCamera: function () {
            this.camera = new THREE.PerspectiveCamera(45, this.getWidth() / this.getHeight(), 0.1, 500000);
            this.camera.position.set(0, 100, -250);
        },
        initLight: function () {
            var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambientLight);

            var light = new THREE.DirectionalLight(0xffffff, 1.0);
            light.position.set(0.5, 3.0, 4.0);
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
        initOrbitControls: function () {
            this.orbitControls = new OrbitControls(this.camera, this.webGLRenderer.domElement);
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
            this.orbitControls.target.set(0, 100, 0);
        },
        initStats: function () {
            this.stats = new Stats();
            this.container.appendChild(this.stats.dom);
        },
        render: function () {

            var time = performance.now();
            searchALLMaterial(this.scene, function (material) {
                material.time = time;
                material.needsUpdate = true;
            });

            this.webGLRenderer.render(this.scene, this.camera);
        },
        initEvent: function () {
            var _onWindowResize = this._bind(this, this.onWindowResize);
            window.addEventListener("resize", _onWindowResize, false)
        },

        initObject: function () {
            let _this = this;

            new GLTFLoader().load('models/gltf/SOHO.glb', function (gltf) {
                var model = gltf.scene;
                _this.scene.add(model);

                searchALLMaterial(model, function (material) {
                    material.onBeforeCompile = function (shaderobject, renderer) {
                        shaderobject.uniforms.time = {value: this.time};
                        if (this.program) {
                            this.program.cacheKey = null;
                        }

                        var index = shaderobject.vertexShader.indexOf("varying vec3 vViewPosition;");
                        shaderobject.vertexShader = shaderobject.vertexShader.slice(0, index) + 'varying vec3 vPosition;\n' + shaderobject.vertexShader.slice(index);

                        index = shaderobject.vertexShader.indexOf("vViewPosition = - mvPosition.xyz;");
                        shaderobject.vertexShader = shaderobject.vertexShader.slice(0, index) + 'vPosition = position;\n' + shaderobject.vertexShader.slice(index);

                        index = shaderobject.fragmentShader.indexOf("uniform");
                        shaderobject.fragmentShader = shaderobject.fragmentShader.slice(0, index) + '\nuniform float time;\nvarying vec3 vPosition;\n' + shaderobject.fragmentShader.slice(index);
                        index = shaderobject.fragmentShader.indexOf("gl_FragColor");
                        shaderobject.fragmentShader = shaderobject.fragmentShader.slice(0, index) + '\noutgoingLight.r += sin( vPosition.x * 0.2  + time * 0.002) * 0.5;\n' + shaderobject.fragmentShader.slice(index);
                        // shaderobject.fragmentShader = shaderobject.fragmentShader.slice(0, index) + '\noutgoingLight.r += smoothstep(0.3, 0.5, sin(-vPosition.z * 0.02  + time * 0.002) * 0.5);\n' + shaderobject.fragmentShader.slice(index);
                    };
                });

            });
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