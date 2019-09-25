/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * 图层
 * 二进制的每一位为一个图层通道
 * @constructor
 */
function Layers() {
  this.mask = 1 | 0;
}

Object.assign(Layers.prototype, {

  /**
   * 设置图层通道左移位数
   * @param channel
   */
  set: function(channel) {
    this.mask = 1 << channel | 0;
  },

  /**
   * 启用图层1、channel+1
   * @param channel
   */
  enable: function(channel) {

    this.mask |= 1 << channel | 0;

  },

  enableAll: function() {

    this.mask = 0xffffffff | 0;

  },

  /**
   * 切换图层，异或运算
   * @param channel
   */
  toggle: function(channel) {
    this.mask ^= 1 << channel | 0;
  },

  disable: function(channel) {

    this.mask &= ~(1 << channel | 0);

  },
  disableAll: function() {

    this.mask = 0;

  },
  /**
   * 测试当前图层与传入图层是否位于一个通道
   * @param layers
   * @returns {boolean}
   */
  test: function(layers) {
    return (this.mask & layers.mask) !== 0;
  }

});

export {Layers};
