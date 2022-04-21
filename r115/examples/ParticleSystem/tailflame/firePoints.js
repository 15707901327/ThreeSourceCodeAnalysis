import * as THREE from '../../../build/three.module.js';

/**
 * 粒子移动器
 * @constructor
 */
function Mover() {

    this.position = new THREE.Vector3();     // 粒子位置
    this.speed = new THREE.Vector3();        // 速度

    this.is_active = false;                  // 标记激活
}

Object.assign(Mover.prototype, {

    /**
     * 初始化移动器参数
     * @param position 初始化位置
     */
    init: function (position) {

        this.position = position.clone();
        this.speed.set(0, 0, 0);
    },

    // 更新位置
    updatePosition: function () {
        this.position.add(this.speed);
    },

    /**
     * 设置粒子加速值
     * @param vector
     */
    applyForce: function (vector) {
        this.speed.add(vector);
    },
});

/**
 * 火焰粒子
 * @param options {object} 参数集合
 * @param options.size {number} 粒子大小，默认2
 * @param options.direction {Vector3} 方向
 * @param options.acceleration {number} 加速度
 * @param options.diffusionSpeed {number} 扩散速度
 * @constructor
 */
function FirePoints(options) {

    options = options || {};

    this.size = options.size !== undefined ? options.size : 3; // 粒子大小
    this.direction = options.direction !== undefined ? options.direction : new THREE.Vector3(0, -0.2, -1); // 方向
    this.acceleration = options.acceleration !== undefined ? options.acceleration : 0.1;                           // 方向加速度
    this.particlePosition = new THREE.Vector3(0, 0, 0); // 初始化位置
    this.diffusionSpeed = options.diffusionSpeed !== undefined ? options.diffusionSpeed : 0.08; // 扩散速度

    this.activeNum = 40; // 每次释放的粒子数量
    this.length = 5;     // 火焰长度
    this.movers_num = this.activeNum * this.length * 5; // 粒子数量

    this.movers = [];                                             // 单个粒子管理

    this.geometry = new THREE.Geometry();                                            // 几何体
    this.material = new THREE.PointsMaterial({
        color: 0xff6633,
        size: this.size,
        transparent: true,
        opacity: 0.5,
        map: this._createTexture(),
        depthTest: false,
        blending: THREE.AdditiveBlending,
    }); // 材质

    this.renderNode = null; // 粒子对象
    this._init();

}

Object.assign(FirePoints.prototype, {
    /**
     * 初始化创建粒子
     * @private
     */
    _init: function () {

        for (let i = 0; i < this.movers_num; i++) {

            // 移动器
            let mover = new Mover();
            this.movers.push(mover);

            // 设置几何体的位置
            this.geometry.vertices.push(mover.particlePosition);
        }

        this.renderNode = new THREE.Points(this.geometry, this.material);
    },

    // 更新粒子
    update: function () {
        this.activateMover();

        let points_vertices = [];

        for (let i = 0; i < this.movers.length; i++) {
            let mover = this.movers[i];
            // 移动激活的粒子
            if (mover.is_active) {
                // 粒子加速度
                mover.applyForce(this.direction.clone().multiplyScalar(this.acceleration));
                // 更新粒子位置
                mover.updatePosition();

                if (mover.position.length() > this.length) {
                    mover.is_active = false;
                    mover.init(this.particlePosition);
                }
            }

            points_vertices.push(mover.position);
        }
        this.renderNode.geometry.vertices = points_vertices;
        this.renderNode.geometry.verticesNeedUpdate = true;
    },

    /**
     * 激活粒子
     */
    activateMover: function () {
        let count = 0;

        // 遍历粒子控制器
        for (let i = 0; i < this.movers.length; i++) {

            let mover = this.movers[i];

            if (mover.is_active) continue;
            mover.is_active = true;

            let x = this._getRandomInt(-this.diffusionSpeed, this.diffusionSpeed);
            let y = this._getRandomInt(-this.diffusionSpeed, this.diffusionSpeed);
            let z = this._getRandomInt(-this.diffusionSpeed, this.diffusionSpeed);
            mover.applyForce(new THREE.Vector3(x, y, z));

            count++;
            if (count >= this.activeNum) break;
        }
    },

    /**
     * 获取从最小值到最大值的整数随机数
     * @param min 最小值
     * @param max 最大值
     * @returns {*}
     */
    _getRandomInt: function (min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 创建二维贴图
     * @private
     */
    _createTexture: function () {
        var canvas = document.getElementById('show_canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;

        // 渐变的圆
        let grad = ctx.createRadialGradient(100, 100, 20, 100, 100, 100);
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.arc(100, 100, 100, 0, Math.PI / 180, true);
        ctx.fill();

        let texture = new THREE.Texture(canvas);
        texture.minFilter = THREE.NearestFilter;
        texture.needsUpdate = true;

        return texture;
    }
});

export {FirePoints};