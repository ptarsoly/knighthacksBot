var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyDuu7P8Kxdq6GxmqjVkZTmq8Qc4k4Tl6JI',
    Promise: Promise
  });

var placeSearchParams = {
    'location' : null,
    'radius' : 10000,
    'keyword' : null
};

  var placeFinder = module.exports = {
    find: function(location) {
        
    }

  };