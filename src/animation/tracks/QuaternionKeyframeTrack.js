import { InterpolateLinear } from '../../constants.js';
import { KeyframeTrack } from '../KeyframeTrack.js';
import { QuaternionLinearInterpolant } from '../../math/interpolants/QuaternionLinearInterpolant.js';

/**
 *
 * A Track of quaternion keyframe values.
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */
/**
 * 四元数关键帧轨道
 * @param name 名称
 * @param times 时间列表
 * @param values 相关属性值
 * @param interpolation 插值类型
 * @constructor
 */
function QuaternionKeyframeTrack( name, times, values, interpolation ) {

	KeyframeTrack.call( this, name, times, values, interpolation );

}

QuaternionKeyframeTrack.prototype = Object.assign( Object.create( KeyframeTrack.prototype ), {

	constructor: QuaternionKeyframeTrack,

	ValueTypeName: 'quaternion',

	// ValueBufferType is inherited

	DefaultInterpolation: InterpolateLinear,

	/**
	 * 线性插值方法
	 * @param result
	 * @returns {QuaternionLinearInterpolant}
	 * @constructor
	 */
	InterpolantFactoryMethodLinear: function ( result ) {
		return new QuaternionLinearInterpolant( this.times, this.values, this.getValueSize(), result );
	},

	InterpolantFactoryMethodSmooth: undefined // not yet implemented

} );

export { QuaternionKeyframeTrack };
