function painterSortStable(a, b) {

    if (a.groupOrder !== b.groupOrder) {

        return a.groupOrder - b.groupOrder;

    } else if (a.renderOrder !== b.renderOrder) {

        return a.renderOrder - b.renderOrder;

    } else if (a.material.id !== b.material.id) {

        return a.material.id - b.material.id;

    } else if (a.z !== b.z) {

        return a.z - b.z;

    } else {

        return a.id - b.id;

    }

}

function reversePainterSortStable(a, b) {

    if (a.groupOrder !== b.groupOrder) {

        return a.groupOrder - b.groupOrder;

    } else if (a.renderOrder !== b.renderOrder) {

        return a.renderOrder - b.renderOrder;

    } else if (a.z !== b.z) {

        return b.z - a.z;

    } else {

        return a.id - b.id;

    }

}

/**
 *
 * @returns {{init: init, opaque: Array, unshift: unshift, sort: sort, transparent: Array, push: push}}
 * @constructor
 */
function WebGLRenderList() {

    // 保存对象渲染项信息
    const renderItems = [];
    let renderItemsIndex = 0;

    const opaque = [];
    const transmissive = [];
    const transparent = [];

    function init() {
        renderItemsIndex = 0;

        opaque.length = 0;
        transmissive.length = 0;
        transparent.length = 0;
    }

    /**
     * 信息存放至渲染列表
     * @param object 对象
     * @param geometry 集合体
     * @param material 材质
     * @param groupOrder 渲染级别
     * @param z 深度值
     * @param group
     */
    function getNextRenderItem(object, geometry, material, groupOrder, z, group) {

        let renderItem = renderItems[renderItemsIndex];

        if (renderItem === undefined) {
            renderItem = {
                id: object.id,
                object: object,
                geometry: geometry,
                material: material,
                groupOrder: groupOrder,
                renderOrder: object.renderOrder,
                z: z,
                group: group
            };
            renderItems[renderItemsIndex] = renderItem;
        } else {
            renderItem.id = object.id;
            renderItem.object = object;
            renderItem.geometry = geometry;
            renderItem.material = material;
            renderItem.groupOrder = groupOrder;
            renderItem.renderOrder = object.renderOrder;
            renderItem.z = z;
            renderItem.group = group;
        }

        renderItemsIndex++;

        return renderItem;

    }

    /**
     * 信息存放至渲染列表
     * @param object 对象
     * @param geometry 集合体
     * @param material 材质
     * @param groupOrder 渲染级别
     * @param z 深度值
     * @param group
     */
    function push(object, geometry, material, groupOrder, z, group) {

        const renderItem = getNextRenderItem(object, geometry, material, groupOrder, z, group);

        if (material.transmission > 0.0) {

            transmissive.push(renderItem);

        } else if (material.transparent === true) {

            transparent.push(renderItem);

        } else {

            opaque.push(renderItem);

        }

    }

    /**
     *
     * @param object 对象
     * @param geometry 几何体
     * @param material 材质
     * @param groupOrder 0
     * @param z 0
     * @param group null
     */
    function unshift(object, geometry, material, groupOrder, z, group) {

        const renderItem = getNextRenderItem(object, geometry, material, groupOrder, z, group);

        if (material.transmission > 0.0) {

            transmissive.unshift(renderItem);

        } else if (material.transparent === true) {

            transparent.unshift(renderItem);

        } else {

            opaque.unshift(renderItem);

        }

    }

    function sort(customOpaqueSort, customTransparentSort) {

        if (opaque.length > 1) opaque.sort(customOpaqueSort || painterSortStable);
        if (transmissive.length > 1) transmissive.sort(customTransparentSort || reversePainterSortStable);
        if (transparent.length > 1) transparent.sort(customTransparentSort || reversePainterSortStable);

    }

    function finish() {

        // Clear references from inactive renderItems in the list

        for (let i = renderItemsIndex, il = renderItems.length; i < il; i++) {

            const renderItem = renderItems[i];

            if (renderItem.id === null) break;

            renderItem.id = null;
            renderItem.object = null;
            renderItem.geometry = null;
            renderItem.material = null;
            renderItem.group = null;

        }

    }

    return {
        opaque: opaque,
        transmissive: transmissive,
        transparent: transparent,

        init: init,
        push: push,
        unshift: unshift,
        finish: finish,

        sort: sort
    };

}

/**
 * 渲染列表管理
 * @returns {{get: (function(*=, *=): {init: init, opaque: Array, unshift: unshift, sort: sort, transparent: Array, push: push}), dispose: dispose}}
 * @constructor
 */
function WebGLRenderLists() {

    let lists = new WeakMap();

    function get(scene, renderCallDepth) {

        const listArray = lists.get(scene);
        let list;

        if (listArray === undefined) {

            list = new WebGLRenderList();
            lists.set(scene, [list]);

        } else {

            if (renderCallDepth >= listArray.length) {

                list = new WebGLRenderList();
                listArray.push(list);

            } else {

                list = listArray[renderCallDepth];

            }

        }

        return list;

    }

    function dispose() {

        lists = new WeakMap();

    }

    return {
        get: get,
        dispose: dispose
    };

}


export {WebGLRenderLists, WebGLRenderList};
