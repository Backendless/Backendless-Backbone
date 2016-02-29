(function(factory) {

  var root = (typeof self === 'object' && self.self === self && self) ||
    (typeof global === 'object' && global.global === global && global);

  if (typeof define === 'function' && define.amd) {
    define(['backendless', 'backbone', 'underscore'], function(Backendless, Backbone, _) {
      factory(root, Backendless, Backbone, _);
    });

  } else if (typeof exports !== 'undefined') {
    var Backendless = require('backendless')
      , _           = require('underscore')
      , Backbone    = require('backbone');

    factory(root, Backendless, Backbone, _);
  } else {
    factory(root, root.Backendless, root.Backbone, root._);
  }

}(function(root, Backendless, Backbone, _) {

  var LOAD_SCHEMA_PATH = '/properties';
  var CLASS_KEY = '___class';
  var ID_ATTRIBUTE = 'objectId';

  Backendless.extendAjaxOptionsByBackendlessHeaders = extendAjaxOptionsByBackendlessHeaders;

  (function() {
    var QUERY_PARAMS = {
      props         : 'properties',
      loadRelations : 'relations',
      relationsDepth: 'relationsDepth',
      sortBy        : 'sortingBy',
      where         : 'condition'
    };

    var BackboneModel = Backbone.Model;
    var BackboneModelPrototypes = Backbone.Model.prototype;

    var BackendlessModelProps = {
      schemaName : null,
      schemaTypes: null,

      properties    : null,
      relations     : null,
      relationsDepth: null,
      sortingBy     : null,
      condition     : null
    };

    Backbone.Model = BackboneModel.extend({

      constructor: function(attrs, options) {
        options = options || {};

        var schemaName = this.schemaName || options.schemaName || (options.collection && options.collection.schemaName);

        if (!schemaName && !_.isEmpty(attrs)) {
          schemaName = attrs[CLASS_KEY];
        }

        if (schemaName) {
          attrs = _.clone(attrs) || {};
          attrs[CLASS_KEY] = this.schemaName = schemaName;

          _.defaults(this, BackendlessModelProps);

          this.idAttribute = ID_ATTRIBUTE;
          this.schemaTypes = this.schemaTypes || options.schemaTypes;
        }

        BackboneModel.call(this, attrs, options);
      },

      urlRoot: function() {
        if (this.schemaName) {
          return getDataUrl(this.schemaName);
        }
      },

      getUrlParams: function(options) {
        return getUrlParams(this, QUERY_PARAMS, options);
      },

      describe: function(options) {
        if (this.schemaName) {
          return describeSchema(this, options);
        }
      },

      toClasses: function(data, key) {
        if (!this.schemaName || (data instanceof Backbone.Model) || (data instanceof Backbone.Collection)) {
          return data;
        }

        if (_.isArray(data)) {
          var itemsSchemaName = (data.length && data[0][CLASS_KEY]) || (this.schemaTypes && this.schemaTypes[key]);

          if (itemsSchemaName) {
            return this.updateRelatedItem(data, key, itemsSchemaName, Backbone.Collection);
          }

          _.each(data, function(v, k) {
            data[k] = this.toClasses(v, k);
          }, this);

        } else if (_.isObject(data)) {
          var itemSchemaName = data[CLASS_KEY] || (this.schemaTypes && this.schemaTypes[key]);

          if (itemSchemaName) {
            return this.updateRelatedItem(data, key, itemSchemaName, Backbone.Model);
          }

          _.each(data, function(v, k) {
            data[k] = this.toClasses(v, k);
          }, this);

        }

        return data;
      },

      updateRelatedItem: function(data, key, schemaName, ItemClass) {
        var relatedItem = this.get(key);
        var parent = this;

        if (!relatedItem || !(relatedItem instanceof ItemClass)) {
          relatedItem = new ItemClass(null, {schemaName: schemaName});
          relatedItem.on('all', function() {
            var args = Array.prototype.slice.call(arguments);
            args[0] = key + '.' + args[0]; //build new event, person.address.change:city
            parent.trigger.apply(parent, args);
          });
        }

        if (relatedItem instanceof Backbone.Collection) {
          relatedItem.set(data);
        } else {
          var unsetData = {};

          _.each(relatedItem.attributes, function(v, k) {
            if (!data[k] && k !== CLASS_KEY) {
              unsetData[k] = undefined;
            }
          });

          relatedItem.set(unsetData, {unset: true});
          relatedItem.set(data);
        }

        return relatedItem;
      },

      /**
       * @override
       * @link {Backbone.Model.fetch}
       */
      fetch: function(options) {
        options = _.clone(options) || {};

        if (this.schemaName) {
          if (options.id) {
            this.set(ID_ATTRIBUTE, options.id);
          } else if (options.isLast) {
            this.unset(ID_ATTRIBUTE);
          }

          options.url = _.result(this, 'url');

          if (!this.id) {
            if (options.isLast) {
              options.url += '/last';
            } else {
              options.url += '/first';
            }
          }

          options.url += getUrlParamsString(this.getUrlParams(options));
        }

        return BackboneModelPrototypes.fetch.call(this, options);
      },

      /**
       * @override
       * @link {Backbone.Model.set}
       */
      set: function(key, val, options) {
        if (key == null) return this;

        var attrs;
        if (typeof key === 'object') {
          attrs = key;
          options = val;
        } else {
          (attrs = {})[key] = val;
        }

        if (this.schemaName) {
          attrs = _.mapObject(attrs, this.toClasses, this);
        }

        return BackboneModelPrototypes.set.call(this, attrs, options);
      },

      /**
       * @override
       * @link {Backbone.Model.sync}
       */
      sync: function(method, model, options) {
        if (this.schemaName) {
          if (method === 'patch') {
            method = 'update';
          }

          return backendlessSync(method, model, options);
        }

        return BackboneModelPrototypes.sync(method, model, options);
      },

      /**
       * @override
       * @link {Backbone.Model.toJSON}
       */
      toJSON: function() {
        return toJSON(this.attributes);
      }
    });

  }());

  (function() {
    var QUERY_PARAMS = {
      offset        : 'offsetItems',
      pageSize      : 'itemsPerPage',
      props         : 'properties',
      loadRelations : 'relations',
      relationsDepth: 'relationsDepth',
      sortBy        : 'sortingBy',
      where         : 'condition'
    };

    var BackboneCollection = Backbone.Collection;
    var BackboneCollectionPrototypes = Backbone.Collection.prototype;

    var BackendlessCollectionProto = {

      totalItems: null,

      offsetItems : 0,
      itemsPerPage: 10,

      properties    : null,
      relations     : null,
      relationsDepth: null,
      sortingBy     : null,
      condition     : null

    };

    Backbone.Collection = BackboneCollection.extend({

      model: Backbone.Model,

      constructor: function(models, options) {
        var schemaName = this.schemaName || (options && options.schemaName) || this.model.prototype.schemaName;

        if (!schemaName && !_.isEmpty(models)) {
          schemaName = (models[0]instanceof Backbone.Model) ? models[0].schemaName : models[0][CLASS_KEY];
        }

        if (schemaName) {
          _.defaults(_.extend(this, {schemaName: schemaName}), BackendlessCollectionProto);
        }

        BackboneCollection.call(this, models, options);
      },

      getUrlParams: function(options) {
        if (this.schemaName) {
          return getUrlParams(this, QUERY_PARAMS, options);
        }
      },

      describe: function(options) {
        if (this.schemaName) {
          return describeSchema(this, options);
        }
      },

      /**
       * @override
       * @link {Backbone.Collection.modelId}
       */
      modelId: function(attrs) {
        var modelIdAttribute = this.schemaName ? ID_ATTRIBUTE : this.model.prototype.idAttribute;
        return attrs[modelIdAttribute || 'id'];
      },

      /**
       * @override
       * @link {Backbone.Collection.url}
       */
      url: function() {
        if (this.schemaName) {
          return getDataUrl(this.schemaName);
        }
      },

      /**
       * @override
       * @link {Backbone.Collection.fetch}
       */
      fetch: function(options) {
        if (this.schemaName) {
          options = _.clone(options) || {};
          options.url = _.result(this, 'url') + getUrlParamsString(this.getUrlParams(options));
        }

        return BackboneCollectionPrototypes.fetch.call(this, options);
      },

      /**
       * @override
       * @link {Backbone.Collection.parse}
       */
      parse: function(resp) {
        if (this.schemaName) {
          this.offsetItems = resp.offset;
          this.totalItems = resp.totalObjects;

          return resp.data;
        }

        return resp;
      },

      /**
       * @override
       * @link {Backbone.Collection.sync}
       */
      sync: function(method, model, options) {
        return this.schemaName
          ? backendlessSync(method, model, options)
          : BackboneCollectionPrototypes.sync(method, model, options);
      }
    });

  }());

  function toJSON(data) {
    return _[_.isArray(data) ? 'map' : 'mapObject'](data, function(value) {
      if ((value instanceof Backbone.Model) || (value instanceof Backbone.Collection)) {
        return value.toJSON();

      } else if (_.isObject(value)) {
        return toJSON(value);
      }

      return value;
    });
  }

  function extendAjaxOptionsByBackendlessHeaders(ajaxOptions) {
    var userToken = Backendless.LocalCache.get('user-token');
    var headers = ajaxOptions.headers = ajaxOptions.headers || {};

    headers['application-type'] = 'JS';
    headers['application-id'] = Backendless.applicationId;
    headers['secret-key'] = Backendless.secretKey;

    if (userToken) {
      headers['user-token'] = userToken;
    }

    return ajaxOptions;
  }

  function getUrlParams(model, queryParams, options) {
    var result = {};

    _.each(queryParams, function(key, urlKey) {
      var optionsValue = options && options[key];
      var value = optionsValue !== undefined ? optionsValue : _.result(model, key);

      if (value != null) {
        result[urlKey] = value;
      }
    });

    return result;
  }

  function getUrlParamsString(params) {
    var urlParamsString = _.map(params, function(value, key) {
      return key + '=' + value;
    }).join('&');

    return urlParamsString ? ('?' + encodeURI(urlParamsString)) : '';
  }

  function getDataUrl(schemaName) {
    if (schemaName === 'GeoPoint') {
      return Backendless.appPath + '/geo/points';
    }

    return Backendless.appPath + '/data/' + schemaName;
  }

  function describeSchema(model, options) {
    options = _.clone(options) || {};
    options.url = getDataUrl(model.schemaName) + LOAD_SCHEMA_PATH;

    var success = options.success;

    options.success = function(resp) {
      model.schema = resp;
      model.trigger('schema:loaded');

      success && success.apply(model, arguments);
    };

    return backendlessSync('read', model, options);
  }

  function backendlessSync(method, model, options) {
    //wrapper for base Backbone.js sync, just extend request by Backendless header (appId, serverKey, appType, userToken)
    return Backbone.sync.call(model, method, model, extendAjaxOptionsByBackendlessHeaders(options));
  }

}));
