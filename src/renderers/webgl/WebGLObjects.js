/**
 * 对象管理
 * @param gl 上下文
 * @param geometries 几何体管理
 * @param attributes 属性管理
 * @param info{WebGLInfo}
 * @return {{update: update, dispose: dispose}}
 * @constructor
 */
function WebGLObjects(gl, geometries, attributes, info) {

    let updateMap = new WeakMap();

    /**
     * 解析渲染对象几何体
     * @param object 对象
     * @returns {*}
     */
    function update(object) {

        const frame = info.render.frame;
        const geometry = object.geometry;
        // 获取buffergeometry几何体
        const buffergeometry = geometries.get(object, geometry);

        // Update once per frame

        if (updateMap.get(buffergeometry) !== frame) {

            geometries.update(buffergeometry);

            updateMap.set(buffergeometry, frame);

        }

        if (object.isInstancedMesh) {

            if (object.hasEventListener('dispose', onInstancedMeshDispose) === false) {

                object.addEventListener('dispose', onInstancedMeshDispose);

            }

            attributes.update(object.instanceMatrix, gl.ARRAY_BUFFER);

            if (object.instanceColor !== null) {

                attributes.update(object.instanceColor, gl.ARRAY_BUFFER);

            }

        }

        return buffergeometry;
    }

    function dispose() {

        updateMap = new WeakMap();

    }

    function onInstancedMeshDispose(event) {

        const instancedMesh = event.target;

        instancedMesh.removeEventListener('dispose', onInstancedMeshDispose);

        attributes.remove(instancedMesh.instanceMatrix);

        if (instancedMesh.instanceColor !== null) attributes.remove(instancedMesh.instanceColor);

    }

    return {

        update: update,
        dispose: dispose

    };
}

export {WebGLObjects};
