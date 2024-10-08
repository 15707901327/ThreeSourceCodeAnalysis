import {AnimationAction} from './AnimationAction.js';
import {EventDispatcher} from '../core/EventDispatcher.js';
import {LinearInterpolant} from '../math/interpolants/LinearInterpolant.js';
import {PropertyBinding} from './PropertyBinding.js';
import {PropertyMixer} from './PropertyMixer.js';
import {AnimationClip} from './AnimationClip.js';

/**
 *
 * Player for AnimationClips.
 * 说明：
 *  AnimationMixer是场景中播放特定对象的动画播放器。当场景中多个对象动画独立时，可以为每个对象使用一个AnimationMixer。
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 *
 * 内存结构：
 * _bindingsByRootAndName：{
 *   "rootUnit":{
 *     "trackName": PropertyMixer
 *   }
 * }
 *
 * _bindings:[PropertyMixer...]
 * PropertyMixer：{
 *   _cacheIndex：在数组中的下标
 * }
 */
function AnimationMixer(root) {

  // 模型
  this._root = root;
  // 初始化内存管理器
  this._initMemoryManager();

  this._accuIndex = 0;

  // 记录总时间
  this.time = 0;

  // 时间放大
  this.timeScale = 1.0;

}

AnimationMixer.prototype = Object.assign(Object.create(EventDispatcher.prototype), {

  constructor: AnimationMixer,

  /**
   * 绑定action
   * @param action 动画动作
   * @param prototypeAction
   * @private
   */
  _bindAction: function(action, prototypeAction) {

    var root = action._localRoot || this._root, // 模型
      tracks = action._clip.tracks, // 轨道
      nTracks = tracks.length,      // 轨道数目
      bindings = action._propertyBindings,// 绑定轨道属性信息
      interpolants = action._interpolants,// 插值数据
      rootUuid = root.uuid,         // 模型id
      bindingsByRoot = this._bindingsByRootAndName,
      bindingsByName = bindingsByRoot[rootUuid];

    // 初始化模型名称
    if (bindingsByName === undefined) {
      bindingsByName = {};
      bindingsByRoot[rootUuid] = bindingsByName;
    }

    for (var i = 0; i !== nTracks; ++i) {
      var track = tracks[i],
        trackName = track.name,
        binding = bindingsByName[trackName];

      if (binding !== undefined) {
        bindings[i] = binding;
      }
      else {
        binding = bindings[i];
        if (binding !== undefined) {
          // existing binding, make sure the cache knows
          if (binding._cacheIndex === null) {
            ++binding.referenceCount;
            this._addInactiveBinding(binding, rootUuid, trackName);
          }
          continue;
        }

        // 创建属性合成器
        var path = prototypeAction && prototypeAction._propertyBindings[i].binding.parsedPath;
        binding = new PropertyMixer(PropertyBinding.create(root, trackName, path), track.ValueTypeName, track.getValueSize());
        ++binding.referenceCount;

        // 添加非活动绑定
        this._addInactiveBinding(binding, rootUuid, trackName);

        bindings[i] = binding;
      }
      interpolants[i].resultBuffer = binding.buffer;
    }
  },

  /**
   * 激活动作
   * @param action
   * @private
   */
  _activateAction: function(action) {

    if (!this._isActiveAction(action)) {

      if (action._cacheIndex === null) {
        // this action has been forgotten by the cache, but the user
        // appears to be still using it -> rebind

        var rootUuid = (action._localRoot || this._root).uuid,
          clipUuid = action._clip.uuid,
          actionsForClip = this._actionsByClip[clipUuid];

        this._bindAction(action, actionsForClip && actionsForClip.knownActions[0]);

        this._addInactiveAction(action, clipUuid, rootUuid);
      }

      var bindings = action._propertyBindings;

      // increment reference counts / sort out state
      for (var i = 0, n = bindings.length; i !== n; ++i) {
        var binding = bindings[i];
        if (binding.useCount++ === 0) {
          this._lendBinding(binding);
          binding.saveOriginalState();
        }
      }
      this._lendAction(action);
    }

  },

  _deactivateAction: function(action) {

    if (this._isActiveAction(action)) {

      var bindings = action._propertyBindings;

      // decrement reference counts / sort out state
      for (var i = 0, n = bindings.length; i !== n; ++i) {

        var binding = bindings[i];

        if (--binding.useCount === 0) {

          binding.restoreOriginalState();
          this._takeBackBinding(binding);

        }

      }

      this._takeBackAction(action);

    }

  },

  // Memory manager
  /**
   * 初始化内存管理器
   * @returns {number|*}
   * @private
   *
   */
  _initMemoryManager: function() {

    this._actions = []; // 'nActiveActions' followed by inactive ones
    this._nActiveActions = 0;

    this._actionsByClip = {};

    // 属性合成器集合
    this._bindings = []; // 'nActiveBindings' followed by inactive ones
    this._nActiveBindings = 0;

    this._bindingsByRootAndName = {}; // inside: Map< name, PropertyMixer >

    this._controlInterpolants = []; // same game as above
    this._nActiveControlInterpolants = 0;

    var scope = this;

    this.stats = {
      actions: {
        get total() {
          return scope._actions.length;
        },
        get inUse() {
          return scope._nActiveActions;
        }
      },
      bindings: {
        get total() {
          return scope._bindings.length;
        },
        get inUse() {
          return scope._nActiveBindings;
        }
      },
      controlInterpolants: {
        get total() {
          return scope._controlInterpolants.length;
        },
        get inUse() {
          return scope._nActiveControlInterpolants;
        }
      }
    };
  },

  // Memory management for AnimationAction objects
  /**
   * 激活动作
   * @param action
   * @returns {boolean} true 激活 false 未激活
   * @private
   */
  _isActiveAction: function(action) {
    var index = action._cacheIndex;
    return index !== null && index < this._nActiveActions;
  },

  /**
   * 添加无效动作
   * @param action
   * @param clipUuid
   * @param rootUuid
   * @private
   */
  _addInactiveAction: function(action, clipUuid, rootUuid) {

    var actions = this._actions,
      actionsByClip = this._actionsByClip,
      actionsForClip = actionsByClip[clipUuid];

    if (actionsForClip === undefined) {
      actionsForClip = {
        knownActions: [action],
        actionByRoot: {}
      };

      action._byClipCacheIndex = 0;

      actionsByClip[clipUuid] = actionsForClip;

    } else {
      var knownActions = actionsForClip.knownActions;

      action._byClipCacheIndex = knownActions.length;
      knownActions.push(action);

    }

    action._cacheIndex = actions.length;
    actions.push(action);

    actionsForClip.actionByRoot[rootUuid] = action;
  },

  _removeInactiveAction: function(action) {

    var actions = this._actions,
      lastInactiveAction = actions[actions.length - 1],
      cacheIndex = action._cacheIndex;

    lastInactiveAction._cacheIndex = cacheIndex;
    actions[cacheIndex] = lastInactiveAction;
    actions.pop();

    action._cacheIndex = null;


    var clipUuid = action._clip.uuid,
      actionsByClip = this._actionsByClip,
      actionsForClip = actionsByClip[clipUuid],
      knownActionsForClip = actionsForClip.knownActions,

      lastKnownAction =
        knownActionsForClip[knownActionsForClip.length - 1],

      byClipCacheIndex = action._byClipCacheIndex;

    lastKnownAction._byClipCacheIndex = byClipCacheIndex;
    knownActionsForClip[byClipCacheIndex] = lastKnownAction;
    knownActionsForClip.pop();

    action._byClipCacheIndex = null;


    var actionByRoot = actionsForClip.actionByRoot,
      rootUuid = (action._localRoot || this._root).uuid;

    delete actionByRoot[rootUuid];

    if (knownActionsForClip.length === 0) {

      delete actionsByClip[clipUuid];

    }

    this._removeInactiveBindingsForAction(action);

  },

  _removeInactiveBindingsForAction: function(action) {

    var bindings = action._propertyBindings;
    for (var i = 0, n = bindings.length; i !== n; ++i) {

      var binding = bindings[i];

      if (--binding.referenceCount === 0) {

        this._removeInactiveBinding(binding);

      }

    }

  },

  /**
   * 借贷行动
   * @param action
   * @private
   */
  _lendAction: function(action) {

    // [ active actions |  inactive actions  ]
    // [  active actions >| inactive actions ]
    //                 s        a
    //                  <-swap->
    //                 a        s

    var actions = this._actions,
      prevIndex = action._cacheIndex,

      lastActiveIndex = this._nActiveActions++,

      firstInactiveAction = actions[lastActiveIndex];

    action._cacheIndex = lastActiveIndex;
    actions[lastActiveIndex] = action;

    firstInactiveAction._cacheIndex = prevIndex;
    actions[prevIndex] = firstInactiveAction;

  },

  _takeBackAction: function(action) {

    // [  active actions  | inactive actions ]
    // [ active actions |< inactive actions  ]
    //        a        s
    //         <-swap->
    //        s        a

    var actions = this._actions,
      prevIndex = action._cacheIndex,

      firstInactiveIndex = --this._nActiveActions,

      lastActiveAction = actions[firstInactiveIndex];

    action._cacheIndex = firstInactiveIndex;
    actions[firstInactiveIndex] = action;

    lastActiveAction._cacheIndex = prevIndex;
    actions[prevIndex] = lastActiveAction;

  },

  // Memory management for PropertyMixer objects
  /**
   * 添加非活动绑定
   * @param binding 属性合成器 PropertyMixer
   * @param rootUuid 模型id
   * @param trackName 轨道名称
   * @private
   */
  _addInactiveBinding: function(binding, rootUuid, trackName) {

    var bindingsByRoot = this._bindingsByRootAndName,
      bindingByName = bindingsByRoot[rootUuid],

      bindings = this._bindings;

    if (bindingByName === undefined) {
      bindingByName = {};
      bindingsByRoot[rootUuid] = bindingByName;
    }

    bindingByName[trackName] = binding;

    // 在数组中的下标
    binding._cacheIndex = bindings.length;
    bindings.push(binding);

  },

  _removeInactiveBinding: function(binding) {

    var bindings = this._bindings,
      propBinding = binding.binding,
      rootUuid = propBinding.rootNode.uuid,
      trackName = propBinding.path,
      bindingsByRoot = this._bindingsByRootAndName,
      bindingByName = bindingsByRoot[rootUuid],

      lastInactiveBinding = bindings[bindings.length - 1],
      cacheIndex = binding._cacheIndex;

    lastInactiveBinding._cacheIndex = cacheIndex;
    bindings[cacheIndex] = lastInactiveBinding;
    bindings.pop();

    delete bindingByName[trackName];

    if (Object.keys(bindingByName).length === 0) {

      delete bindingsByRoot[rootUuid];

    }

  },

  _lendBinding: function(binding) {

    var bindings = this._bindings,
      prevIndex = binding._cacheIndex,

      lastActiveIndex = this._nActiveBindings++,

      firstInactiveBinding = bindings[lastActiveIndex];

    binding._cacheIndex = lastActiveIndex;
    bindings[lastActiveIndex] = binding;

    firstInactiveBinding._cacheIndex = prevIndex;
    bindings[prevIndex] = firstInactiveBinding;

  },

  _takeBackBinding: function(binding) {

    var bindings = this._bindings,
      prevIndex = binding._cacheIndex,

      firstInactiveIndex = --this._nActiveBindings,

      lastActiveBinding = bindings[firstInactiveIndex];

    binding._cacheIndex = firstInactiveIndex;
    bindings[firstInactiveIndex] = binding;

    lastActiveBinding._cacheIndex = prevIndex;
    bindings[prevIndex] = lastActiveBinding;

  },


  // Memory management of Interpolants for weight and time scale

  _lendControlInterpolant: function() {

    var interpolants = this._controlInterpolants,
      lastActiveIndex = this._nActiveControlInterpolants++,
      interpolant = interpolants[lastActiveIndex];

    if (interpolant === undefined) {

      interpolant = new LinearInterpolant(
        new Float32Array(2), new Float32Array(2),
        1, this._controlInterpolantsResultBuffer);

      interpolant.__cacheIndex = lastActiveIndex;
      interpolants[lastActiveIndex] = interpolant;

    }

    return interpolant;

  },

  _takeBackControlInterpolant: function(interpolant) {

    var interpolants = this._controlInterpolants,
      prevIndex = interpolant.__cacheIndex,

      firstInactiveIndex = --this._nActiveControlInterpolants,

      lastActiveInterpolant = interpolants[firstInactiveIndex];

    interpolant.__cacheIndex = firstInactiveIndex;
    interpolants[firstInactiveIndex] = interpolant;

    lastActiveInterpolant.__cacheIndex = prevIndex;
    interpolants[prevIndex] = lastActiveInterpolant;

  },

  _controlInterpolantsResultBuffer: new Float32Array(1),

  // return an action for a clip optionally using a custom root target
  // object (this method allocates a lot of dynamic memory in case a
  // previously unknown clip/root combination is specified)
  /**
   * 片段动作
   * @param clip 动画片段
   * @param optionalRoot 参数详细
   * @return {*}
   */
  clipAction: function(clip, optionalRoot) {

    // 模型
    var root = optionalRoot || this._root,
      // 模型id
      rootUuid = root.uuid,

      // 动画片段
      clipObject = typeof clip === 'string' ? AnimationClip.findByName(root, clip) : clip,

      // 片段id
      clipUuid = clipObject !== null ? clipObject.uuid : clip,

      actionsForClip = this._actionsByClip[clipUuid],
      prototypeAction = null;

    if (actionsForClip !== undefined) {
      var existingAction = actionsForClip.actionByRoot[rootUuid];

      if (existingAction !== undefined) {
        return existingAction;
      }

      // we know the clip, so we don't have to parse all
      // the bindings again but can just copy
      prototypeAction = actionsForClip.knownActions[0];

      // also, take the clip from the prototype action
      if (clipObject === null)
        clipObject = prototypeAction._clip;

    }

    // clip must be known when specified via string
    if (clipObject === null) return null;

    // allocate all resources required to run it
    // 创建动画，动作
    var newAction = new AnimationAction(this, clipObject, optionalRoot);

    // 绑定动作
    this._bindAction(newAction, prototypeAction);

    // and make the action known to the memory manager
    this._addInactiveAction(newAction, clipUuid, rootUuid);

    return newAction;

  },

  // get an existing action
  existingAction: function(clip, optionalRoot) {

    var root = optionalRoot || this._root,
      rootUuid = root.uuid,

      clipObject = typeof clip === 'string' ?
        AnimationClip.findByName(root, clip) : clip,

      clipUuid = clipObject ? clipObject.uuid : clip,

      actionsForClip = this._actionsByClip[clipUuid];

    if (actionsForClip !== undefined) {

      return actionsForClip.actionByRoot[rootUuid] || null;

    }

    return null;

  },

  // deactivates all previously scheduled actions
  stopAllAction: function() {

    var actions = this._actions,
      nActions = this._nActiveActions,
      bindings = this._bindings,
      nBindings = this._nActiveBindings;

    this._nActiveActions = 0;
    this._nActiveBindings = 0;

    for (var i = 0; i !== nActions; ++i) {

      actions[i].reset();

    }

    for (var i = 0; i !== nBindings; ++i) {

      bindings[i].useCount = 0;

    }

    return this;

  },

  // advance the time and update apply the animation
  /**
   * 刷新
   * @param deltaTime 时间
   * @returns {EventDispatcher}
   */
  update: function(deltaTime) {

    deltaTime *= this.timeScale;

    var actions = this._actions,
      nActions = this._nActiveActions,

      time = this.time += deltaTime,
      timeDirection = Math.sign(deltaTime),

      accuIndex = this._accuIndex ^= 1;

    // 运行激活的动作
    for (var i = 0; i !== nActions; ++i) {
      var action = actions[i];
      action._update(time, deltaTime, timeDirection, accuIndex);
    }

    // update scene graph

    var bindings = this._bindings,
      nBindings = this._nActiveBindings;

    for (var i = 0; i !== nBindings; ++i) {

      bindings[i].apply(accuIndex);

    }

    return this;

  },

  // Allows you to seek to a specific time in an animation.
  setTime: function(timeInSeconds) {

    this.time = 0; // Zero out time attribute for AnimationMixer object;
    for (var i = 0; i < this._actions.length; i++) {

      this._actions[i].time = 0; // Zero out time attribute for all associated AnimationAction objects.

    }

    return this.update(timeInSeconds); // Update used to set exact time. Returns "this" AnimationMixer object.

  },

  // return this mixer's root t_activateActionarget object
  getRoot: function() {

    return this._root;

  },

  // free all resources specific to a particular clip
  uncacheClip: function(clip) {

    var actions = this._actions,
      clipUuid = clip.uuid,
      actionsByClip = this._actionsByClip,
      actionsForClip = actionsByClip[clipUuid];

    if (actionsForClip !== undefined) {

      // note: just calling _removeInactiveAction would mess up the
      // iteration state and also require updating the state we can
      // just throw away

      var actionsToRemove = actionsForClip.knownActions;

      for (var i = 0, n = actionsToRemove.length; i !== n; ++i) {

        var action = actionsToRemove[i];

        this._deactivateAction(action);

        var cacheIndex = action._cacheIndex,
          lastInactiveAction = actions[actions.length - 1];

        action._cacheIndex = null;
        action._byClipCacheIndex = null;

        lastInactiveAction._cacheIndex = cacheIndex;
        actions[cacheIndex] = lastInactiveAction;
        actions.pop();

        this._removeInactiveBindingsForAction(action);

      }

      delete actionsByClip[clipUuid];

    }

  },

  // free all resources specific to a particular root target object
  uncacheRoot: function(root) {

    var rootUuid = root.uuid,
      actionsByClip = this._actionsByClip;

    for (var clipUuid in actionsByClip) {

      var actionByRoot = actionsByClip[clipUuid].actionByRoot,
        action = actionByRoot[rootUuid];

      if (action !== undefined) {

        this._deactivateAction(action);
        this._removeInactiveAction(action);

      }

    }

    var bindingsByRoot = this._bindingsByRootAndName,
      bindingByName = bindingsByRoot[rootUuid];

    if (bindingByName !== undefined) {

      for (var trackName in bindingByName) {

        var binding = bindingByName[trackName];
        binding.restoreOriginalState();
        this._removeInactiveBinding(binding);

      }

    }

  },

  // remove a targeted clip from the cache
  uncacheAction: function(clip, optionalRoot) {

    var action = this.existingAction(clip, optionalRoot);

    if (action !== null) {

      this._deactivateAction(action);
      this._removeInactiveAction(action);

    }

  }

});


export {AnimationMixer};
