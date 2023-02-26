import { Pass } from './Pass.js';

/**
 * 掩码通道
 * @param scene 场景
 * @param camera 相机
 * @constructor
 */
class MaskPass extends Pass {

	constructor( scene, camera ) {

		super();

		this.scene = scene;
		this.camera = camera;

		this.clear = true;
		this.needsSwap = false;

		this.inverse = false;

	}
	
	/**
	 * 渲染
	 * @param renderer 渲染目标
	 * @param writeBuffer 写入渲染目标
	 * @param readBuffer 读出显然目标
	 */
	render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {
		
		// 上下文
		const context = renderer.getContext();
		// 渲染状态管理
		const state = renderer.state;

		// don't update color or depth
		state.buffers.color.setMask( false ); // 禁用写入颜色
		state.buffers.depth.setMask( false ); // 禁用写入深度

		// lock buffers
		state.buffers.color.setLocked( true ); // 锁定颜色
		state.buffers.depth.setLocked( true ); // 锁定深度

		// set up stencil

		let writeValue, clearValue;

		if ( this.inverse ) {

			writeValue = 0;
			clearValue = 1;

		} else {

			writeValue = 1;
			clearValue = 0;

		}

		// 启动模板测试
		state.buffers.stencil.setTest( true );
		// 设置测试时调用的功能，设定如何根据下一次渲染的结果来更新模板缓冲中的值。
		state.buffers.stencil.setOp( context.REPLACE, context.REPLACE, context.REPLACE );
		// 设置正面和背面功能以及模板测试的参考值。
		state.buffers.stencil.setFunc( context.ALWAYS, writeValue, 0xffffffff );
		state.buffers.stencil.setClear( clearValue );
		state.buffers.stencil.setLocked( true );

		// draw into the stencil buffer

		renderer.setRenderTarget( readBuffer );
		if ( this.clear ) renderer.clear();
		renderer.render( this.scene, this.camera );

		renderer.setRenderTarget( writeBuffer );
		if ( this.clear ) renderer.clear();
		renderer.render( this.scene, this.camera );

		// unlock color and depth buffer for subsequent rendering

		state.buffers.color.setLocked( false );
		state.buffers.depth.setLocked( false );

		// only render where stencil is set to 1

		state.buffers.stencil.setLocked( false );
		state.buffers.stencil.setFunc( context.EQUAL, 1, 0xffffffff ); // draw if == 1
		state.buffers.stencil.setOp( context.KEEP, context.KEEP, context.KEEP );
		state.buffers.stencil.setLocked( true );

	}

}

/**
 * 清空掩码通道
 * @constructor
 */
class ClearMaskPass extends Pass {

	constructor() {

		super();

		this.needsSwap = false;

	}

	render( renderer /*, writeBuffer, readBuffer, deltaTime, maskActive */ ) {

		renderer.state.buffers.stencil.setLocked( false );
		renderer.state.buffers.stencil.setTest( false );

	}

}

export { MaskPass, ClearMaskPass };
