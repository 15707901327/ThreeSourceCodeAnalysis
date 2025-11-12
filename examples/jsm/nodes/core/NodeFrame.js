/**
 * @author sunag / http://www.sunag.com.br/
 */
/**
 * @param time 时间
 * @constructor
 */
function NodeFrame( time ) {
	// 传入时间和
	this.time = time !== undefined ? time : 0;
	this.id = 0;
	// 当前传入时间
	// this.delta
}

NodeFrame.prototype = {

	constructor: NodeFrame,

	/**
	 * 更新时间
	 * @param delta
	 * @returns {NodeFrame}
	 */
	update: function ( delta ) {

		++ this.id;

		this.time += delta;
		this.delta = delta;

		return this;

	},

	setRenderer: function ( renderer ) {

		this.renderer = renderer;

		return this;

	},

	setRenderTexture: function ( renderTexture ) {

		this.renderTexture = renderTexture;

		return this;

	},

	/**
	 *
	 * @param node
	 * @returns {NodeFrame}
	 */
	updateNode: function ( node ) {

		if ( node.frameId === this.id ) return this;

		node.updateFrame( this );

		node.frameId = this.id;

		return this;

	}

};

export { NodeFrame };
