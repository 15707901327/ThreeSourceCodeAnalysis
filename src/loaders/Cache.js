/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * 缓存
 * @type {{add: Cache.add, get: (function(*): *), clear: Cache.clear, files: {}, enabled: boolean, remove: Cache.remove}}
 */
var Cache = {

	enabled: false,

	files: {},

	add: function ( key, file ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Adding key:', key );

		this.files[ key ] = file;

	},

	get: function ( key ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Checking key:', key );

		return this.files[ key ];

	},

	remove: function ( key ) {

		delete this.files[ key ];

	},

	clear: function () {

		this.files = {};

	}

};


export { Cache };
