import { MTLLoader } from './../jsm/loaders/MTLLoader.js';
import { OBJLoader } from './../jsm/loaders/OBJLoader.js';
import { MathUtils } from '../../examples/jsm/utils/MathUtils.js';
import { GeometryUtils } from '../../examples/jsm/utils/GeometryUtils.js';
import { GradientVertShader } from './v6/GradientVertShader.js';

import { GradientFragShader } from './v6/v6-1/GradientFragShader.js';
import { pointsData } from './v6/v6-1/data.js';

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
				//
				// console.log(_this.camera.position);
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
			this.webGLRenderer.shadowMap.enabled = true;
			this.webGLRenderer.shadowMap.type = THREE.VSMShadowMap;
			this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
			this.webGLRenderer.setClearColor(0x000000);
			this.container.appendChild(this.webGLRenderer.domElement);
		},
		initScene: function() {
			this.scene = new THREE.Scene();
			// this.scene.background = new THREE.Color(0xff0000);

			// this.scene.fog = new THREE.Fog(0xffffff, 300, 1200);
			var axes = new THREE.AxesHelper(100);
			this.scene.add(axes);
		},
		initCamera: function() {
			this.camera = new THREE.PerspectiveCamera(45, this.getWidth() / this.getHeight(), 0.1, 30000);
			this.camera.position.set(-44.84938961774735, 58.131056826939, 27.007293192608213);
			this.camera.lookAt(-30, 20, 0);
		},
		initLight: function() {
			var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
			this.scene.add(ambientLight);

			// var light = new THREE.DirectionalLight(0xffffff, 1.0);
			// light.position.set(0, 100.0, 0);
			// light.castShadow = true;
			// this.scene.add(light);

			// var helper = new THREE.DirectionalLightHelper( light, 4 );
			// this.scene.add( helper );

			var SpotLight = new THREE.SpotLight(0xffffff, .6);
			SpotLight.castShadow = true;
			SpotLight.position.set(0, 10, 0);
			SpotLight.shadow.mapSize.width = 4096;
			SpotLight.shadow.mapSize.height = 4096;
			this.scene.add(SpotLight);
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

			var points = pointsData[2];

			var targetPoints = [];
			// this.scaleValuePoints2(targetPoints, points);
			// console.log("*************** 传入点集 *************************");
			// console.log(points);
			// console.log(targetPoints);

			const EPSIANGLE = 30;

			const geometry1 = new THREE.PlaneBufferGeometry(500, 500, 500);
			const material1 = new THREE.MeshBasicMaterial({
				color: 0xdad8d4,
				side: THREE.DoubleSide
			});
			const plane = new THREE.Mesh(geometry1, material1);
			plane.position.setY(-10);
			plane.rotation.set(-Math.PI / 2, 0, 0, 'XYZ');
			this.scene.add(plane);

			var heartShape = this.createShape(points);
			var geometry = new THREE.ShapeBufferGeometry(heartShape);

			var arr = [];
			this.computeGradientPoints(arr, points, EPSIANGLE);

			// 创建材质
			let material = new THREE.ShaderMaterial({
				defines: {
					UNROLLED_LOOP_INDEX: arr.length
				},
				uniforms: {
					"color": {
						value: new THREE.Color("#ff0000")
					},
					"alpha": {
						value: 1.0
					},
					"arr": {
						value: arr
					},
					"minWidth": {
						value: 0.0
					},
					"edgeAlpha": {
						value: 0.2
					},
					"powValue": {
						value: 2.0
					}
				},
				vertexShader: GradientVertShader,
				fragmentShader: GradientFragShader,
				transparent: true
			});
			var mesh = new THREE.Mesh(geometry, material);
			mesh.rotation.set(-Math.PI / 2, 0, 0, 'XYZ');

			const edges = new THREE.EdgesGeometry(geometry, 1);
			let edgesMaterial = new THREE.MeshBasicMaterial({
				color: 0xff0000
			});
			let line = new THREE.LineSegments(edges, edgesMaterial);

			this.scene.add(mesh);
			// mesh.add(line);

			this.test(arr);
		},

		test: function(arr) {

			console.log("点的个数", arr.length / 2 - 1);

			let EPSILON = 0.0001;
			let minWidth = 0.5;

			let v = new THREE.Vector2(0.0, 7.5); // 模型坐标
			console.log("当前点坐标", v);

			let gradientAlpha = 0.0;
			let gradientAlpha2 = 1.0;

			let tempB1 = new THREE.Vector2();
			let isConnect = false;
			let count = 0;

			// 保存数据
			let arr2 = [];
			for (let i = 0; i < arr.length; i++) {
				arr2[i] = -1.0;
			}
			let vdLength = 0.0;

			// 计算点与所有边的垂线
			for (var i = 0; i < arr.length - 2; i += 2) {
				var A = new THREE.Vector2(arr[i], arr[i + 1]);
				var B = new THREE.Vector2(arr[i + 2], arr[i + 3]);

				// 判断垂点是否在线
				let isOnLineAB = MathUtils.isOnLine(A, B, v);

				// 计算AB中点
				var D = A.clone();
				D.add(B);
				D.divideScalar(2.0);

				// 计算AB的中垂线向量
				var vecAB = B.clone();
				vecAB.sub(A);
				var vecabT = new THREE.Vector2();
				vecabT.x = -vecAB.y;
				vecabT.y = vecAB.x;

				// 计算中垂线上一点
				var D1 = D.clone();
				D1.add(vecabT);

				// 获取垂点坐标
				var d = MathUtils.calculateVerticalPoint(A, B, v);
				// 给定点与垂点距离
				let vd = v.distanceTo(d);

				let minP1 = new THREE.Vector2();
				let minP1Distance = -1.0;
				let minP2 = new THREE.Vector2();
				let minP2Distance = -1.0;

				let minP3 = d.clone();
				let minP3Distance = vd;
				let minP4 = new THREE.Vector2();
				let minP4Distance = -1.0;

				let minD1 = D.clone();
				let minD1Distance = 0.0;
				let minD2 = new THREE.Vector2();
				let minD2Distance = -1.0;

				// 标记边是否是凹边
				let isConcaveEdge = false;

				for (let j = 0; j < arr.length - 2; j += 2) {
					let A1 = new THREE.Vector2(arr[j], arr[j + 1]);
					let B1 = new THREE.Vector2(arr[j + 2], arr[j + 3]);

					/*
					 * 计算中垂线交点
					 * 去除AB、A1B1两条是同一条线段
					 */
					if (!(Math.abs(A.x - A1.x) < EPSILON && Math.abs(A.y - A1.y) < EPSILON)) {
						if (MathUtils.isIntersection(A1, B1, D, D1)) {
							let p = MathUtils.getIntersection(A1, B1, D, D1);

							if (D.distanceTo(p) > minWidth) {
								if (!MathUtils.isSameDirection(D, D1, p)) {
									if (minD2Distance === -1.0 || minD2Distance > D.distanceTo(p)) {
										minD2Distance = D.distanceTo(p);
										minD2.copy(p);
									}
								} else {
									if (minD1Distance > D.distanceTo(p)) {
										minD1Distance = D.distanceTo(p);
										minD1.copy(p);
									}
								}
							}
						}
					}

					// 获取垂点在AB线段上的交点坐标
					if (isOnLineAB) {
						if (MathUtils.isIntersection(A1, B1, v, d)) {
							let p = MathUtils.getIntersection(A1, B1, v, d);

							if (MathUtils.isOnLine(A1, B1, p)) {
								// 判断是同向还是异向
								if (MathUtils.isSameDirection(v, d, p)) {

									if (minP1Distance === -1.0 || minP1Distance > v.distanceTo(p)) {
										minP1Distance = v.distanceTo(p);
										minP1.copy(p);
									}
								} else {
									if (minP2Distance === -1.0 || minP2Distance > v.distanceTo(p)) {
										minP2Distance = v.distanceTo(p);
										minP2.copy(p);
									}
								}
							}
						}
					}

					// 获取垂点在AB线段外的交点坐标
					if (!isOnLineAB) {
						if (MathUtils.isIntersection(A1, B1, v, d)) {
							let p = MathUtils.getIntersection(A1, B1, v, d);

							if (MathUtils.isOnLine(A1, B1, p)) {
								// 判断是同向还是异向
								if (MathUtils.isSameDirection(v, d, p)) {
									if (minP3Distance > v.distanceTo(p)) {
										minP3Distance = v.distanceTo(p);
										minP3.copy(p);
									}
								} else {
									if (minP4Distance === -1.0 || minP4Distance > v.distanceTo(p)) {
										minP4Distance = v.distanceTo(p);
										minP4.copy(p);
									}
								}
							}
						}
					}

					// 计算外延长线是否起作用
					if (!(Math.abs(A.x - A1.x) < EPSILON && Math.abs(A.y - A1.y) < EPSILON)) {
						if (MathUtils.isIntersection(A1, B1, v, A)) {
							let p = MathUtils.getIntersection(A1, B1, v, A);

							// 交点不在线段的两个端点
							if (!MathUtils.isSamePoint(p, A1) && !MathUtils.isSamePoint(p, B1)) {
								// 交点在A1B1线段上
								if (!MathUtils.isSameDirection(p, A1, B1)) {
									// 交点在vA线段上
									if (!MathUtils.isSameDirection(p, v, A)) {
										isConcaveEdge = true;
									}
								}
							}
						}
					}
					if (!(Math.abs(A.x - A1.x) < EPSILON && Math.abs(A.y - A1.y) < EPSILON)) {
						if (MathUtils.isIntersection(A1, B1, v, B)) {
							let p = MathUtils.getIntersection(A1, B1, v, B);

							// 交点不在线段的两个端点
							if (!MathUtils.isSamePoint(p, A1) && !MathUtils.isSamePoint(p, B1)) {
								// 交点在A1B1线段上
								if (!MathUtils.isSameDirection(p, A1, B1)) {
									// 交点在vB线段上
									if (!MathUtils.isSameDirection(p, v, B)) {
										isConcaveEdge = true;
									}
								}
							}
						}
					}
				}

				let centerD = new THREE.Vector2(0.0, 0.0);
				centerD.addVectors(D, minD2);
				centerD.divideScalar(2.0);

				let cDD = centerD.distanceTo(D);

				let centerd = new THREE.Vector2(0.0, 0.0);
				centerd.addVectors(minP3, minP4);
				centerd.divideScalar(2.0);

				let cdd = centerd.distanceTo(d);

				/*
				 * 实现：
				 * 1. v到AB的垂点d在AB线段上
				 * 		1.1 v到AB的垂点d在AB线段上, v点在多边形内
				 */
				// 1. v到AB的垂点d在AB线段上
				if (isOnLineAB) {
					if (vd < cDD) {
						// 1.1 v到AB的垂点d在AB线段上, v点在多边形内
						if (minP1.distanceTo(d) < EPSILON) {

							arr2[i] = vd;
							arr2[i + 1] = cDD;
							vdLength += vd;
						}
					}
				}
			}

			for (var i = 0; i < arr.length; i += 2) {
				let vd = arr2[i];
				let cDD = arr2[i + 1];

				if (vd + 1.0 != 0.0) {
					gradientAlpha += (vd / cDD) * (vd / vdLength);
				}
			}

			console.log("长度：", vdLength);
			console.log(arr2);
			console.log("gradientAlpha", gradientAlpha)
		},

		/***
		 * 放大基点
		 * @private
		 */
		scaleValuePoints2(targetPoints, points) {
			if (this._scaleValue === 0) {
				targetPoints = points;
			}

			return GeometryUtils.scalePointsValue(targetPoints, points, 5.0);
		},

		/**
		 * 计算渐变数组
		 */
		computeGradientPoints(arr, points, EPSIANGLE) {
			let count = 0;

			for (let i = 0; i < points.length - 1; i++) {

				let A;
				let A1 = points[i];
				let B;
				if (i == 0) {
					A = new THREE.Vector2(points[points.length - 2].x, points[points.length - 2].y);
					B = new THREE.Vector2(points[i + 1].x, points[i + 1].y);
				} else if (i == points.length - 2) {
					A = new THREE.Vector2(points[i - 1 - count].x, points[i - 1 - count].y);
					B = new THREE.Vector2(points[0].x, points[0].y);
				} else {
					A = new THREE.Vector2(points[i - 1 - count].x, points[i - 1 - count].y);
					B = new THREE.Vector2(points[i + 1].x, points[i + 1].y);
				}

				// 去掉小于epsAngle角度的点
				let cosAA1B = MathUtils.computeCos(A, A1, B);
				// 1. 当两个点过于接近时,去掉
				if (cosAA1B > Math.cos((180 - EPSIANGLE) * Math.PI / 180) && cosAA1B < Math.cos(EPSIANGLE * Math.PI / 180) && B.distanceTo(A1) > 0.1) {
					arr.push(points[i].x, points[i].y);
					count = 0;
				} else {
					count++;
				}
			}
			arr.push(arr[0], arr[1]);
		},

		/**
		 * 创建平面shape
		 * @param points
		 * @param isClose
		 * @returns shape {THREE.Shape}
		 */
		createShape(points, isClose) {
			const shape = new THREE.Shape();

			shape.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				shape.lineTo(points[i].x, points[i].y)
			}
			if (isClose) {
				shape.lineTo(points[0].x, points[0].y)
			}
			return shape;
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