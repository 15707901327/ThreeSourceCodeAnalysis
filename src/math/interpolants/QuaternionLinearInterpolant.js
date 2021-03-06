import { Interpolant } from '../Interpolant.js';
import { Quaternion } from '../Quaternion.js';

/**
 * Spherical linear unit quaternion interpolant.
 *
 * @author tschw
 */
/**
 * 四元数线性插值
 * @param parameterPositions 时间列表
 * @param sampleValues 相关值列表
 * @param sampleSize 相关值的长度
 * @param resultBuffer 结果集合
 * @constructor
 */
function QuaternionLinearInterpolant( parameterPositions, sampleValues, sampleSize, resultBuffer ) {
	Interpolant.call( this, parameterPositions, sampleValues, sampleSize, resultBuffer );
}

QuaternionLinearInterpolant.prototype = Object.assign( Object.create( Interpolant.prototype ), {

	constructor: QuaternionLinearInterpolant,

	interpolate_: function ( i1, t0, t, t1 ) {

		var result = this.resultBuffer,
			values = this.sampleValues,
			stride = this.valueSize,

			offset = i1 * stride,

			alpha = ( t - t0 ) / ( t1 - t0 );

		for ( var end = offset + stride; offset !== end; offset += 4 ) {

			Quaternion.slerpFlat( result, 0, values, offset - stride, values, offset, alpha );

		}

		return result;

	}

} );


export { QuaternionLinearInterpolant };
