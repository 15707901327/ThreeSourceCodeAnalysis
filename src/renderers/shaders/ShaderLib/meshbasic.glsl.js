export const vertex = /* glsl */`
#include <common> // 包含着色器公共模块(包含常用的数学工具函数以及一些常量定义什么的)
#include <batching_pars_vertex>
#include <uv_pars_vertex> // 包含处理uv所需要的一些定义
#include <envmap_pars_vertex>
#include <color_pars_vertex> // 包含顶点颜色所需要的定义
#include <fog_pars_vertex>  // 包含雾化效果所需要的定义
#include <morphtarget_pars_vertex> // 包含变形动画所需要的定义
#include <skinning_pars_vertex> // 包含蒙皮动画所需要的定义
#include <logdepthbuf_pars_vertex>  // 包含深度处理的一些定义
#include <clipping_planes_pars_vertex> // 包含裁剪平面所需要的一些定义

void main() {

	#include <uv_vertex> // uv 数据处理
	#include <color_vertex> // 颜色 数据处理
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )

		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>

	#endif

	#include <begin_vertex> // 定义 transformed
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex> // mvPosition
	#include <logdepthbuf_vertex> // logDepth深度运算
	#include <clipping_planes_vertex> // 裁剪平面运算

	#include <worldpos_vertex> // 世界坐标运算
	#include <envmap_vertex>
	#include <fog_vertex> // 雾化所需要的运算

}
`;

export const fragment = /* glsl */`
uniform vec3 diffuse;
uniform float opacity;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

#include <common>                 // 包含着色器公共模块(包含常用的数学工具函数以及一些常量定义等)
#include <dithering_pars_fragment>
#include <color_pars_fragment>    // 包含顶点颜色所需要的定义
#include <uv_pars_fragment>       // 包含处理uv所需要的一些定义
#include <map_pars_fragment>      // 包含处理贴图所需要的一些定义
#include <alphamap_pars_fragment> // 灰度纹理
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>    // ao纹理
#include <lightmap_pars_fragment> // 灯光图。 默认为空。 lightMap需要第二组UV。
#include <envmap_common_pars_fragment>  // 包含环境贴图定义
#include <envmap_pars_fragment>         // 包含环境贴图处理
#include <fog_pars_fragment>            // 包含雾化效果所需要的定义
#include <specularmap_pars_fragment>    // Specular map
#include <logdepthbuf_pars_fragment>    // 包含对数深度缓存定义
#include <clipping_planes_pars_fragment>// 包含裁剪面定义

void main() {

	#include <clipping_planes_fragment>  // 裁剪处理

	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>   // 对数深度缓存
	#include <map_fragment>           // 贴图处理
	#include <color_fragment>         // 颜色处理
	#include <alphamap_fragment>      // specularMap
	#include <alphatest_fragment>     // ALPHATEST
	#include <alphahash_fragment>
	#include <specularmap_fragment>   // specularMap

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

	// accumulation (baked indirect lighting only)
	#ifdef USE_LIGHTMAP

		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;

	#else

		reflectedLight.indirectDiffuse += vec3( 1.0 );

	#endif

	// modulation
	#include <aomap_fragment>  // aomap

	reflectedLight.indirectDiffuse *= diffuseColor.rgb;

	vec3 outgoingLight = reflectedLight.indirectDiffuse;

	#include <envmap_fragment> // envmap

	#include <opaque_fragment>

	#include <tonemapping_fragment>         // 映射
	#include <colorspace_fragment>         // 颜色赋值
	#include <fog_fragment>                 // 雾化效果处理
	#include <premultiplied_alpha_fragment> // 是否预乘alpha（透明度）值
	#include <dithering_fragment>

}
`;
