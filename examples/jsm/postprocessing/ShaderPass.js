import {
	ShaderMaterial,
	UniformsUtils
} from "../../../build/three.module.js";
import { Pass } from "../postprocessing/Pass.js";

/**
 * shader材质通道
 * @param shader shader或则shader数据
 * @param textureID
 * @constructor
 */
var ShaderPass = function ( shader, textureID ) {

	Pass.call( this );

	this.textureID = ( textureID !== undefined ) ? textureID : 'tDiffuse';

	if ( shader instanceof ShaderMaterial ) {
		this.uniforms = shader.uniforms;
		this.material = shader;
	}
	else if ( shader ) {
		this.uniforms = UniformsUtils.clone( shader.uniforms );
		this.material = new ShaderMaterial( {
			defines: Object.assign( {}, shader.defines ),
			uniforms: this.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		});
	}

	this.fsQuad = new Pass.FullScreenQuad( this.material );
};

ShaderPass.prototype = Object.assign( Object.create( Pass.prototype ), {

	constructor: ShaderPass,

  /**
   * 渲染
   * @param renderer 渲染器
   * @param writeBuffer 写入目标
   * @param readBuffer 读取目标
   */
	render: function ( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {

		if ( this.uniforms[ this.textureID ] ) {
			this.uniforms[ this.textureID ].value = readBuffer.texture;
		}

		this.fsQuad.material = this.material;

		if ( this.renderToScreen ) {
			renderer.setRenderTarget( null );
			this.fsQuad.render( renderer );
		}
		else {
			renderer.setRenderTarget( writeBuffer );
			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
			this.fsQuad.render( renderer );
		}
	}

} );

export { ShaderPass };
