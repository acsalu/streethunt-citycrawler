var map;
var markers;
var hasSelectedDirection = false;

infowindow = null;

defaultPinColor = "FE7569";
highlightPinColor = "FFFF46";

ParseNode = Parse.Object.extend("Node");

$(document).ready(function() {
    Parse.initialize("0jrcxKZWUvcY7BXVmCj2hWmSYS2fDcJfWPbGW9p9", "36gNdjTKsLQecyy9Q4XODT9y22SgsdeRbPQOcUc7");

    $('#menu-direction a').click(function() {
      hasSelectedDirection = true;
      $('#direction').html($(this).html())
    });


    $('#btn-save').click(function() {
      $(this).toggleClass('disabled');
      $('#text-streetname').prop('disabled', true);
      var streetName = $('#text-streetname').val();

      if (hasSelectedDirection) {
        console.log("Saving model data for " + streetName);

        var parseNodes = new Array();

        for (i = 0; i < markers.length; ++i) {
          console.log(markers[i].toString());

          var parseNode = new ParseNode();
          parseNode.set("lat", markers[i].position.lat());
          parseNode.set("lng", markers[i].position.lng());
          parseNode.set("direction", $('#direction').html());
          parseNode.set("streetName", streetName);

          parseNodes.push(parseNode);
        }

        Parse.Object.saveAll(parseNodes, {
          success: function(list) {
            console.log("Saving " + list.length + " nodes succeeded");
            $('#btn-save').removeClass('disabled');
            $('#text-streetname').prop('disabled', false);
          }, error: function(error) {
            console.log("Saving nodes failed");
            $('#btn-save').removeClass('disabled');
            $('#text-streetname').prop('disabled', false);
          }
        });
      }
    });

    $('#btn-clear').click(function() {
      $('#btn-clear').addClass('disabled');
      
      var query = new Parse.Query(ParseNode);
      query.find({
        success: function(results) {
          Parse.Object.destroyAll(results, {
            success: function(list) {
              console.log("Destroying " + results.length + " nodes succeeded");
              $('#btn-clear').removeClass('disabled');
              $('#text-streetname').prop('disabled', false);
            }, error: function(error) {
              console.log("Destroying nodes failed");
              $('#btn-clear').removeClass('disabled');
              $('#text-streetname').prop('disabled', false);
            }
          });
        }, error: function() {

        }
      });
    });
});

function Node(id, lat, lng) {
  this.id = id;
  this.lat = lat;
  this.lng = lng;
};

google.maps.Marker.prototype.toString = function() {
  return "(" + this.position.lat() + ", " + this.position.lng() + ")";
}

function initialize() {
    markers = new Array();

    var mapOptions = {
      center: new google.maps.LatLng(25.037, 121.544),
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);

    google.maps.event.addListener(map, 'click', function(event) {

      if (infowindow) infowindow.close();
      infowindow = new google.maps.InfoWindow();
		  placeMarker(event.latLng, markers.length.toString());
    });
}


function placeMarker(location, markerId) {
    var marker = new google.maps.Marker({
      position: location,
      map: map,
      draggable: true,
      icon: getPinIcon(defaultPinColor),
      title: markerId
    });

    google.maps.event.addListener(marker, "dblclick", function() {
      var index = markers.indexOf(marker);
      if (index > -1) {
        console.log("Remove marker at " + index);
        markers.splice(index, 1);
        marker.setMap(null);
      }
    });

    google.maps.event.addListener(marker, "dragend", function(event) {
      var index = markers.indexOf(marker);
      if (index > -1) console.log("Marker " + index + " updated");
    });

    console.log("Maker placed: " + marker.toString());
    markers.push(marker);
}

function getPinIcon(pinColor) {
    return new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
            new google.maps.Size(21, 34),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 34));
}

Number.prototype.toDeg = function() {
	return this * 180 / Math.PI;
}

Number.prototype.toRad = function() {
  	 return this * Math.PI / 180;
}


//updateNodeWithEdgeId after calculating bearing.
function calculateBearingWithCurrentMarkerAndPressedMarkerLatLng(lat, lng){
    
    var Node = Parse.Object.extend("HeartMapNode");
    var query = new Parse.Query(Node);
    query.get(nodeArray[currentSelectedPin], {
       success: function(node) {
         // The object was retrieved successfully.
        var currentLat = node.get("lat");
        var currentLng = node.get("lng");
	currentLat = currentLat.toRad();
	currentLng = currentLng.toRad();
	var inLat = lat; inLat = inLat.toRad();
	var inLng = lng; inLng = inLng.toRad();
	var dLon = (inLng - currentLng).toRad();
	var y = Math.sin(dLon) * Math.cos(inLat);
	var x = Math.cos(currentLat)*Math.sin(inLat) - 
		Math.sin(currentLat)*Math.cos(inLat)*Math.cos(dLon);
	//brng is from the view of starting point
	var brng = Math.atan2(y,x).toDeg();
	console.log("generated bearing = " + brng);
	//from the view of end point.
	var brng2 = getBearing(lat, lng, node.get("lat"), node.get("lng"));
	console.log("generated bearing 2 = " + brng2);

	//save bearings in the edgeTable.
	edgeTable[edgeTable.length-1].bearing1 = brng;
	edgeTable[edgeTable.length-1].bearing2 = brng2;
	//console.log( edgeTable[edgeTable.length-1] );
	updateNodeWithEdgeId(edgeTable.length-1);
	setTimeout(function(){
	    updateNode2WithEdgeId(edgeTable.length-1);
	},1000);
	//save the new edge to parse.

       }
    
    });

}

function getBearingsWithTwoCoordinates(latlng1, latlng2){

    var lat1 = latlng1.lat().toRad();
    var lng1 = latlng1.lng().toRad();
    var lat2 = latlng2.lat().toRad();
    var lng2 = latlng2.lng().toRad();
    var dLon = (lng2-lng1).toRad();

    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) -
        Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x).toDeg();


}


function getBearing(lat1, lng1, lat2, lng2){
    console.log("in getBearing");
    //console.log(lat1);
    lat1 = lat1.toRad();
    //console.log(lat1);
    lng1 = lng1.toRad();
    lat2 = lat2.toRad();
    lng2 = lng2.toRad();    
    dLon = (lng2 - lng1);
    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1)*Math.sin(lat2) -
            Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x).toDeg(); 
    console.log(brng);
    return brng;

}



function distHaversine(p1, p2) {
  var R = 6371; // earth's mean radius in km
  var dLat  = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) * Math.sin(dLong/2) * Math.sin(dLong/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;

  return d.toFixed(3);
}



