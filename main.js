var lsoa_map;
var lsoa_layer;
var matrices_index;
var matrices_cache = {};
var matrix_details;
var travel_time_matrix;
var destination_lsoa11cd = "W01001943";


var get_travel_time_for_origin = function (origin_id) {

  if(origin_id == destination_lsoa11cd){
    return 0;
  }

  if(travel_time_matrix == null){
    return NaN;
  }

  var destination_index = travel_time_matrix.data[0].indexOf(destination_lsoa11cd);

  if(destination_index ==  null){
    return NaN;
  }

  var origin_row = travel_time_matrix.data.find(r => r[0] == origin_id);

  if(origin_row == null){
    return NaN;
  }

  return origin_row[destination_index];
}

var lsoa_style = function (feature) {
  return {
      fillColor: get_colour_for_travel_time(get_travel_time_for_origin(feature.properties.LSOA11CD)),
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
    $("input[name='matrix']").prop('disabled', true);
    var i = $("input[name='matrix']:checked").val();
    travel_time_matrix = null;
    lsoa_layer.resetStyle();

    matrix_details = matrices_index.matrices[i];
    $("#download_matrix").attr('href', "matrices/"+ matrix_details.path);

    draw_travel_time_scale();
    fetch_and_load_travel_time_matrix(matrix_details.path);
  });

});

//
// Travel Time Matrix loading
//

var fetch_and_load_travel_time_matrix = function(path){

  if(matrices_cache[path]){
    return travel_time_matrix_loaded(matrices_cache[path]);
  }

  $.get("matrices/" + path, travel_time_matrix_fetched);
}

var travel_time_matrix_loaded = function(travel_time_matrix_results){

  if(matrices_cache[matrix_details.path] == null){
    matrices_cache[matrix_details.path] = travel_time_matrix_results;
  }

  travel_time_matrix = travel_time_matrix_results;
  lsoa_layer.resetStyle();
  $("input[name='matrix']").prop('disabled', false);
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