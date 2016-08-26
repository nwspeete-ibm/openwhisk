var Promise = require('bluebird');
var rp = require('request-promise');
var _ = require('lodash');

var ds = rp.defaults({
  baseUrl: 'http://localhost:9999/api',
  headers: {
    accept: 'application/json'
  }
});

/**
 * 1. set current:false on old snapshot
 * 2. create new snapshot
 * 3. add api
 * 4. update other APIs with new snapshot ID
 * 5. update static-product with apis and new snapshot id
 * 6. check optimized data
 */
var loadNewAPI = function(api){
  var newSnapId, oldSnapId;
  return(invalidateCurrentSnapshot())
    .then(function(id){
      oldSnapId = id;
    })
    .then(function(){
      return createNewSnapshot()
    })
    .then(function(id){
      newSnapId = id;
    })
    .then(function(){
      var id = api.info["x-ibm-name"] + ':' + api.info.version;
      return createNewAPI(id, newSnapId, api)
    })
    .then(function(){
      return getAPIsWithoutMatchingSnapId(newSnapId);
    })
    .then(function(apis){
      return updateAPIsWithNewSnapId(apis, newSnapId);
    })
    .then(function(){
      return updateProductAPIs(newSnapId);
    })
    .then(function(){
      var urls = [];
      for(var path in api.paths){
        urls.push(api.basePath + path);
      }
      return {
        "snapshot-id": newSnapId,
        api: api.info["x-ibm-name"] + ':' + api.info.version,
        URLs: urls
      };
    });
};

function createNewSnapshot(){
  var newSnapId = Math.floor(Math.random() * 65000);
  return ds.post({
    uri: '/snapshots',
    json: {
      id: newSnapId,
      refcount: 1,
      current: true
    }
  }).then(function(){
    return newSnapId;
  })
}

function createNewAPI(id, snapshot, api){
  var doc = {
    id: id,
    catalog: {},
    'snapshot-id': snapshot,
    document: api
  };
  return ds.post({
    uri: '/apis',
    json: doc
  }).then(function(resp){
    return resp
  });
}

function getAllAPIs(){
  return ds.get('/apis')
    .then(function(apis){
      return JSON.parse(apis);
    })
}

function getAPIsWithoutMatchingSnapId(snapId){
  return getAllAPIs()
    .then(function(apis){
      return _.filter(apis, function(api){
        return api['snapshot-id'] != snapId;
      });
    });
}

function updateAPIsWithNewSnapId(apis, snapId){
  return Promise.all(apis.map(function(api){
    api['snapshot-id'] = snapId;
    return ds.put({
      uri: '/apis',
      json: api
    });
  }))
}

function getStaticProduct(){
  return ds.get('/products')
    .then(function(products){
      products = JSON.parse(products);
      return _.filter(products, function(product){
        return product.document.info.title == 'static-product';
      })
    })
    .then(function(arr){
      return arr[0];
    });
}

function updateProductAPIs(newSnapId){
  return Promise.join(getStaticProduct(), getAllAPIs(), function(product, apis){
    var apiObj = apis.reduce(function(o, i) {
      o[i.document.info['x-ibm-name']] = i.document;
      return o;
    }, {});
    var oldId = product.dummyid;
    product.document.apis = apiObj;
    product.document.plans.default.apis = apiObj;
    product.catalog['snapshot-id'] = newSnapId;
    product['snapshot-id'] = newSnapId;
    delete product.dummyid;
    return Promise.join(ds.delete({
      uri: '/products/' + oldId
    }), ds.post({
      uri: '/products',
      json: product
    }), function(del, cre){
      return cre.dummyid;
    })
  })
}

function invalidateCurrentSnapshot(){
  return ds.get('/snapshots/current')
    .then(function(snap){
      var snap = JSON.parse(snap).snapshot;
      snap.current = false;
      return ds.put({
        uri: '/snapshots/' + snap.id,
        json: snap
      })})
    .then(function(updatedSnap){
        return updatedSnap.id;
      });
}

module.exports = {
  loadNewAPI: loadNewAPI
};