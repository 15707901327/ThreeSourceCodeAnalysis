/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * 图层
 * @constructor
 */
function Layers() {
	this.mask = 1 | 0;
}

Object.assign( Layers.prototype, {

	/**
	 * 设置图层数
	 * @param channel
	 */
	set: function ( channel ) {
		this.mask = 1 << channel | 0;
	},

	enable: function ( channel ) {

		this.mask |= 1 << channel | 0;

	},

	toggle: function ( channel ) {

		this.mask ^= 1 << channel | 0;

	},

	disable: function ( channel ) {

		this.mask &= ~ ( 1 << channel | 0 );

	},

	test: function ( layers ) {

		return ( this.mask & layers.mask ) !== 0;

	}

} );


export { Layers };
