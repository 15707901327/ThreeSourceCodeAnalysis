import {
  SpriteMaterial,
  CanvasTexture,
  AdditiveBlending,
  Sprite
} from '../../build/three_r108.module.js';
import {TWEEN} from '../jsm/libs/tween.module.min.js';

let SpriteCloud = function(scene) {
  this.scene = scene;
  scene.onBeforeRender = function() {
    TWEEN.update();
  }
};
SpriteCloud.prototype.constructor = SpriteCloud;
Object.assign(SpriteCloud.prototype, {
  type: "SpriteCloud",

  start: function() {
    let material = new SpriteMaterial({
      map: new CanvasTexture(this.generateSprite()),
      blending: AdditiveBlending
    });

    for (let i = 0; i < 1000; i++) {
      let particle = new Sprite(material);
      this.initParticle(particle, i * 10);
      this.scene.add(particle);
    }
  },
  /**
   * 获取渐变贴图
   * @returns {HTMLCanvasElement}
   */
  generateSprite: function() {

    var canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,1)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    return canvas;

  },

  /**
   * 初始化粒子动画
   * @param particle 单个粒子
   * @param delay 延迟时间
   */
  initParticle: function(particle, delay) {
    let scope = this;

    particle.position.set(0, 0, 0);
    particle.scale.x = particle.scale.y = Math.random() * 32 + 16;

    new TWEEN.Tween(particle).delay(delay).to({}, 10000).onComplete(function() {
      scope.initParticle(particle, delay);
    }).start();

    new TWEEN.Tween(particle.position).delay(delay).to({
      x: Math.random() * 4000 - 2000,
      y: Math.random() * 1000 - 500,
      z: Math.random() * 4000 - 2000
    }, 10000).start();

    new TWEEN.Tween(particle.scale).delay(delay).to({x: 0.01, y: 0.01}, 10000).start();

  }
});

export {SpriteCloud};