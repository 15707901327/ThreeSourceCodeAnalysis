/**
 * 管理和优化 WebGL 应用的动画循环
 * @returns {{start: *, stop: *, setAnimationLoop: *, setContext: *}}
 * @constructor
 */
function WebGLAnimation() {

	let context = null; // 上下文，webXR 会话
	let isAnimating = false; // 标记正在运行
	let animationLoop = null;
	let requestId = null; // 执行动画ID

	function onAnimationFrame( time, frame ) {

		animationLoop( time, frame );

		requestId = context.requestAnimationFrame( onAnimationFrame );

	}

	return {

		start: function () {

			if ( isAnimating === true ) return;
			if ( animationLoop === null ) return;

			requestId = context.requestAnimationFrame( onAnimationFrame );

			isAnimating = true;

		},

		stop: function () {

			context.cancelAnimationFrame( requestId );

			isAnimating = false;

		},

		setAnimationLoop: function ( callback ) {

			animationLoop = callback;

		},

		setContext: function ( value ) {

			context = value;

		}

	};

}

export { WebGLAnimation };
