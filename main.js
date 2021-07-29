var lsoa_map;
var lsoa_layer;
var matrices_index;
var travel_time_matrix;
var destination_lsoa11cd = "W01001835";


var get_travel_time_for_origin = function (origin_id) {
  if(!travel_time_matrix){
    return NaN;
  }

  var destination_index = travel_time_matrix.data[0].indexOf(destination_lsoa11cd);

  if(!destination_index){
    return NaN;
  }

  var origin_row = travel_time_matrix.data.find(r => r[0] == origin_id);

  if(!origin_row){
    return NaN;
  }

  return origin_row[destination_index];
}


var get_colour_for_travel_time = function (travel_time){
  return isNaN(travel_time) ? "#333333" :
        typeof(travel_time) != "number" ? "#333333" :
        travel_time > 300 ? "#d73027" :
        travel_time > 240 ? "#f46d43" :
        travel_time > 180 ? "#fdae61" :
        travel_time > 120 ? "#fee090" :
        travel_time > 60 ? "#e0f3f8" :
        travel_time > 45 ? "#abd9e9" :
        travel_time > 30 ? "#74add1" :
        "#4575b4"

}

var lsoa_style = function (feature) {
  return {
      fillColor: 
        feature.properties.LSOA11CD == destination_lsoa11cd ? "#0000FF" : get_colour_for_travel_time(get_travel_time_for_origin(feature.properties.LSOA11CD)),
      weight: 0,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
      smoothFactor: 0
  };
}

var lsoa_click = function (evt){
  destination_lsoa11cd = evt.target.feature.properties.LSOA11CD;
  lsoa_layer.resetStyle();
}

var boundaries_loaded = function(boundaries_data){
  lsoa_layer.addData(boundaries_data);
}

// Travel Time Matrices index loading

var matrices_index_loaded = function (matrices_index_data) {
  matrices_index = matrices_index_data;

  $("#matrix_chooser").empty();

  matrix_radios = matrices_index.matrices.map( (e,i) => 
    $("<div class='matrix_choice'><input type='radio' id='matrix_radio"+i+"'" +
      "name='matrix' value='"+i+"'>"+
      "<label for='matrix_radio"+i+"'>" + e.name + "</label></div>")
    );

  $("#matrix_chooser").append(matrix_radios);

  $("#matrix_radio0").click();

}

$(function(){
  $("#matrix_chooser").change(function(evt){
    var i = $("input[name='matrix']:checked").val();
    travel_time_matrix = null;
    lsoa_layer.resetStyle();
    $.get("matrices/" + matrices_index.matrices[i].path, travel_time_matrix_fetched);
  });

});

//
// Travel Time Matrix loading
//

var travel_time_matrix_loaded = function(travel_time_matrix_results){
  travel_time_matrix = travel_time_matrix_results;
  lsoa_layer.resetStyle();
}

var travel_time_matrix_fetched = function(travel_time_matrix_data){
  Papa.parse(travel_time_matrix_data, {
    worker: true,
    dynamicTyping: true,
    complete: travel_time_matrix_loaded
  });
}


$(function() {
  lsoa_map = L.map('lsoa_map', {zoomControl: false}).setView([51.7, -3.3], 10);

  new L.Control.Zoom({ position: 'bottomleft' }).addTo(lsoa_map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(lsoa_map);

  lsoa_layer = L.geoJSON(null, 
    {
      style: lsoa_style,
      onEachFeature: function(feature, layer) {
        layer.on({
            click: lsoa_click
        })}
    }).addTo(lsoa_map);

  $.getJSON("not_wales.geojson", function (not_wales_data) {
    var not_wales_layer = L.geoJSON(not_wales_data, {style:{weight:0,fillColor:'black'}}).addTo(lsoa_map);
  });




  // Fetch LSOA GeoJSON
  $.getJSON("lsoa11_boundaries.geojson", boundaries_loaded);
  $.getJSON("matrices/index.json", matrices_index_loaded);

})