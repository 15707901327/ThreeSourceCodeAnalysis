/**
 * @author alteredq / http://alteredqualia.com/
 */

/**
 * Clock对象的构造函数.用来记录时间.Clock对象的功能函数采用
 * 定义构造的函数原型对象来实现
 * 用法：
 *      var clock = new Clock(true)
 *      创建时钟来记录时间，传递参数true，设置自动开始记录
 *      参数(autostart)为true,自动开始记录,省略该参数也自动开始记录时间,设置为false,穿件时间,但不开始记录.以毫秒为单位,从 1 January 1970 00:00:00 UTC开始.
 * */
function Clock( autoStart ) {

    // 自动开始记录时间
	this.autoStart = ( autoStart !== undefined ) ? autoStart : true;

    // 开始记录的时间截,以毫秒为单位,从 1 January 1970 00:00:00 UTC开始.
	this.startTime = 0;
    // 上一次记录时间截.以毫秒为单位,从 1 January 1970 00:00:00 UTC开始.
	this.oldTime = 0;
    // 记录当前时间距离上一次记录时间截.以毫秒为单位,从 1 January 1970 00:00:00 UTC开始.
	this.elapsedTime = 0;

    // 用来跟踪时钟是否在记录时间.
	this.running = false;
}

/****************************************
 ****下面是Clock对象提供的功能函数.
 ****************************************/
Object.assign( Clock.prototype, {

    // start方法用来开始记录时间,获得开始的时间截.
	start: function () {

		this.startTime = ( typeof performance === 'undefined' ? Date : performance ).now(); // see #10732

		this.oldTime = this.startTime;
		this.elapsedTime = 0;
		this.running = true;

	},

    // stop方法用来停止记录时间,获得结束的时间截.
	stop: function () {

		this.getElapsedTime();
		this.running = false;
		this.autoStart = false;

	},

    // getElapsedTime方法用来返回从oldTimed到stop之间的时间长度,以秒为单位.
	getElapsedTime: function () {

		this.getDelta();
		return this.elapsedTime;

	},

    // getDelta方法是getElapsedTime方法的实现,具体的算法.
	getDelta: function () {

		var diff = 0;

		if ( this.autoStart && ! this.running ) {

			this.start();
			return 0;

		}

		if ( this.running ) {

			var newTime = ( typeof performance === 'undefined' ? Date : performance ).now();

			diff = ( newTime - this.oldTime ) / 1000;
			this.oldTime = newTime;

			this.elapsedTime += diff;

		}

		return diff; //返回时间长度
	}

} );

export { Clock };
