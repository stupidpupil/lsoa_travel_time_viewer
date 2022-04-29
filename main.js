var lsoa_map;
var lsoa_boundaries_layer;
var outside_boundaries_layer;
var lsoa_points_layer;
var lsoa_details;
var matrices_index;
var matrices_cache = {};
var matrix_details;
var travel_time_matrix;
var destination_lsoa11cd = "W01001943";
var destination_col = {};

var matrices_root = "https://stupidpupil.github.io/wales_ish_r5r_runner/";


var update_map_styles = function(){
  update_destination_col();
  lsoa_boundaries_layer.resetStyle();
  lsoa_points_layer.resetStyle();   
}

var update_destination_col = function (){

  destination_col = {};

  if(travel_time_matrix == null){
    return false;
  }

  var destination_index = travel_time_matrix.data[0].indexOf(destination_lsoa11cd);
  travel_time_matrix.data.forEach( row => {
    if(row[0] == 'from_id'){
      return false;
    }
    destination_col[row[0]] = parseInt(row[destination_index], 10);
  });
}

var get_travel_time_for_origin = function (origin_id) {

  if(origin_id == destination_lsoa11cd){
    return 0;
  }

  if(destination_col[origin_id]){
    return destination_col[origin_id];
  }

  return NaN;
}

var lsoa_points_style = function (feature) {
  return {
      fillColor: get_colour_for_travel_time(get_travel_time_for_origin(feature.properties.LSOA11CD)),
      weight: 0,
      fillOpacity: 1.0,
      smoothFactor: 0
  };
}

var lsoa_boundaries_style = function (feature) {
  return {
      fillColor: get_colour_for_travel_time(get_travel_time_for_origin(feature.properties.LSOA11CD)),
      weight: 0,
      fillOpacity: 0.8,
      smoothFactor: 0
  };
}

var lsoa_click = function (evt){
  destination_lsoa11cd = evt.target.feature.properties.LSOA11CD;
  update_lsoa11_details();
  update_map_styles();
}

var boundaries_loaded = function(boundaries_data){
  lsoa_boundaries_layer.addData(boundaries_data);
}

var points_loaded = function(points_data){
  lsoa_points_layer.addData(points_data);
}

// Travel Time Matrices index loading

var matrices_index_loaded = function (matrices_index_data) {
  matrices_index = matrices_index_data;

  $("#matrix_chooser").empty();

  matrix_radios = matrices_index.matrices.map( (e,i) => 
    {if(e.time_ref_type == 'arrive_by'){
      return($("<div class='matrix_choice'><input type='radio' id='matrix_radio"+i+"'" +
        "name='matrix' value='"+i+"' data-path='"+e.path+"'>"+
        "<label for='matrix_radio"+i+"'>" + e.name + "</label></div>"))
    }else{
      return($())
    }}
    );

  $("#matrix_chooser").append(matrix_radios);

  $("#matrix_radio0").click();

}

$(function(){
  $("#matrix_chooser").change(function(evt){
    //$("input[name='matrix']").prop('disabled', true);
    var i = $("input[name='matrix']:checked").val();
    travel_time_matrix = null;
    update_map_styles();

    matrix_details = matrices_index.matrices[i];
    $("#download_matrix").attr('href', matrices_root+ matrix_details.path);


    draw_travel_time_scale();
    fetch_and_load_travel_time_matrix(matrix_details.path);
  });

});

//
// Travel Time Matrix loading
//

var fetch_and_load_travel_time_matrix = function(path){

  if(matrices_cache[path]){
    if(matrices_cache[path] != 'loading'){ // HACK
      return travel_time_matrix_loaded(matrices_cache[path], path);      
    }
  }

  $("input[data-path='"+path+"']").addClass('loading');

  matrices_cache[path] = 'loading';
  
  if(clicky != null){
    clicky.log('#'+path, "Load Travel Time Matrix")
  }
  
  $.get(matrices_root + path, dat => travel_time_matrix_fetched(dat, path));
}

var travel_time_matrix_loaded = function(travel_time_matrix_results, matrix_path){

  if(matrices_cache[matrix_path] == 'loading'){
    matrices_cache[matrix_path] = travel_time_matrix_results;
  }

  if(matrix_details.path == matrix_path){
    travel_time_matrix = travel_time_matrix_results;
    update_map_styles(); 
  }

  $("input[data-path='"+matrix_path+"']").removeClass('loading');

}

var travel_time_matrix_fetched = function(travel_time_matrix_data, matrix_path){
  Papa.parse(travel_time_matrix_data, {
    worker: true,
    fastMode: true,
    comments: '#',
    complete: (res => travel_time_matrix_loaded(res, matrix_path))
  });
}

var update_lsoa11_details = function(){
  var r = lsoa11_details.data.find(r => r.LSOA11Code == destination_lsoa11cd);
  $("#travel_time_scale_lsoa11").empty().append(r.LSOA11Code + "<br/> in " + r.MSOA11Name);
}


$(function() {
  lsoa_map = L.map('lsoa_map', {zoomControl: false}).setView([51.7, -3.3], 10);

  new L.Control.Zoom({ position: 'bottomleft' }).addTo(lsoa_map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(lsoa_map);

  lsoa_points_layer = L.geoJSON(null, 
    {

      style:lsoa_points_style,
      onEachFeature: function(feature, layer) {
        layer.on({
            click: lsoa_click
        })},

      pointToLayer: function (feature, latlng) {
          return L.circle(latlng, {radius:150});
      }
    });

  lsoa_boundaries_layer = L.geoJSON(null, 
    {
      style: lsoa_boundaries_style,
      onEachFeature: function(feature, layer) {
        layer.on({
            click: lsoa_click
        })}
    }).addTo(lsoa_map);

  $.getJSON("not_wales.geojson", function (not_wales_data) {
    outside_boundaries_layer = L.geoJSON(not_wales_data,
      {invert:true,
      style:{weight:0,fillColor:'black'}}
      ).addTo(lsoa_map);
  });
  
  L.control.layers(
    {}, 
    {"LSOA Boundaries":lsoa_boundaries_layer, "LSOA Trip Points":lsoa_points_layer},
    {position:'bottomright', collapsed: false}).addTo(lsoa_map);

  var geocoder = new L.Control.Geocoder.Nominatim({ // Bit of a HACK.
    geocodingQueryParams:{viewbox:"-5.66912337939577,51.3751114295802,-2.65009749848435,53.4357105443111"}});

  new L.Control.geocoder({
    geocoder: geocoder,
    defaultMarkGeocode: false, 
    position: 'bottomleft' }).on('markgeocode', function(e) {
    var centre = e.geocode.center;
    var lsoa = leafletPip.pointInLayer(centre, lsoa_boundaries_layer, true);

    lsoa_map.fitBounds(lsoa[0].getBounds(), {maxZoom: 10});
    lsoa[0].fireEvent('click');
  }).addTo(lsoa_map);


  $.get("lsoa11_details.csv", function(d){Papa.parse(d, {
    header: true,
    complete: function(results) {
      lsoa11_details = results;
      update_lsoa11_details();
    }
  })})


  // Fetch LSOA GeoJSON
  $.getJSON("https://raw.githubusercontent.com/stupidpupil/wales_lsoa_trip_points/points-releases/lsoa11_boundaries.geojson", boundaries_loaded);
  $.getJSON("https://raw.githubusercontent.com/stupidpupil/wales_lsoa_trip_points/points-releases/lsoa11_nearest_road_points.geojson", points_loaded);
  $.getJSON(matrices_root + "index.json", matrices_index_loaded);

})
