/**
 * 图层
 * 二进制的每一位为一个图层通道
 * @constructor
 */
class Layers {

    constructor() {

        this.mask = 1 | 0;

    }

    /**
     * 设置图层通道左移位数
     * @param channel
     */
    set(channel) {

        this.mask = (1 << channel | 0) >>> 0;

    }

    /**
     * 启用图层1、channel+1
     * @param channel
     */
    enable(channel) {

        this.mask |= 1 << channel | 0;

    }

    enableAll() {

        this.mask = 0xffffffff | 0;

    }

    /**
     * 切换图层，异或运算
     * @param channel
     */
    toggle(channel) {

        this.mask ^= 1 << channel | 0;

    }

    disable(channel) {

        this.mask &= ~(1 << channel | 0);

    }

    disableAll() {

        this.mask = 0;

    }

    /**
     * 测试当前图层与传入图层是否位于一个通道
     * @param layers
     * @returns {boolean}
     */
    test(layers) {

        return (this.mask & layers.mask) !== 0;
    }

    isEnabled(channel) {

        return (this.mask & (1 << channel | 0)) !== 0;

    }

}

export {Layers};
