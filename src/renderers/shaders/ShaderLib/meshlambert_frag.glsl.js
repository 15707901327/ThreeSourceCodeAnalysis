export default /* glsl */`
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

varying vec3 vLightFront;
varying vec3 vIndirectFront;

// 处理渲染正反面
#ifdef DOUBLE_SIDED
	varying vec3 vLightBack;
	varying vec3 vIndirectBack;
#endif


#include <common>                    // 包含着色器公共模块(包含常用的数学工具函数以及一些常量定义等)
#include <packing>                   // 选中
#include <dithering_pars_fragment>   // 是否对颜色应用抖动以消除条纹的外观
#include <color_pars_fragment>       // 包含顶点颜色所需要的定义
#include <uv_pars_fragment>          // 包含处理uv所需要的一些定义
#include <uv2_pars_fragment>         // 包含处理uv2所需要的一些定义
#include <map_pars_fragment>         // 包含处理贴图所需要的一些定义
#include <alphamap_pars_fragment>    // 灰度纹理
#include <aomap_pars_fragment>       // ao纹理
#include <lightmap_pars_fragment>    // 灯光图。 默认为空。 lightMap需要第二组UV。
#include <emissivemap_pars_fragment> // 发光图
#include <envmap_common_pars_fragment>   // 包含环境贴图定义
#include <envmap_pars_fragment>          // 包含环境贴图处理
#include <cube_uv_reflection_fragment>   // 包含天空图定义与处理
#include <bsdfs>                         // 包含灯光相关计算方法
#include <lights_pars_begin>             // 包含灯光相关的一些定义
#include <fog_pars_fragment>             // 包含雾化效果所需要的定义
#include <shadowmap_pars_fragment>       // 阴影贴图
#include <shadowmask_pars_fragment>      // 阴影计算方法
#include <specularmap_pars_fragment>     // Specular map
#include <logdepthbuf_pars_fragment>     // 包含对数深度缓存定义
#include <clipping_planes_pars_fragment> // 包含裁剪面定义

void main() {

	#include <clipping_planes_fragment>  // 裁剪处理

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>   // 对数深度缓存
	#include <map_fragment>           // 贴图处理
	#include <color_fragment>         // 颜色处理
	#include <alphamap_fragment>      // specularMap
	#include <alphatest_fragment>     // ALPHATEST
	#include <specularmap_fragment>   // specularMap
	#include <emissivemap_fragment>   // emissivemap

	// accumulation

	#ifdef DOUBLE_SIDED

		reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;

	#else

		reflectedLight.indirectDiffuse += vIndirectFront;

	#endif

	#include <lightmap_fragment>  // lightMap

	reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );

	#ifdef DOUBLE_SIDED

		reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;

	#else

		reflectedLight.directDiffuse = vLightFront;

	#endif

	reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();

	// modulation
	
	#include <aomap_fragment>    // aomap

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	#include <envmap_fragment>  // envmap

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>  // 映射
	#include <encodings_fragment>    // 颜色赋值
	#include <fog_fragment>          // 雾化效果处理
	#include <premultiplied_alpha_fragment>  // 是否预乘alpha（透明度）值
	#include <dithering_fragment>            // 是否对颜色应用抖动以消除条纹的外观。
}
`;
