var travel_time_scale = [
 {max_minutes:Infinity, colour:"#333333"},
 {max_minutes:360, colour:"#a50026"},
 {max_minutes:240, colour:"#d73027"},
 {max_minutes:180, colour:"#f46d43"},
 {max_minutes:150, colour:"#fdae61"},
 {max_minutes:120, colour:"#fee090"},
 {max_minutes:90, colour:"#ffffbf"},
 {max_minutes:75, colour:"#e0f3f8"},
 {max_minutes:60, colour:"#abd9e9"},
 {max_minutes:45, colour:"#74add1"},
 {max_minutes:30, colour:"#4575b4"},
 {max_minutes:15, colour:"#313695"},
 {max_minutes:0,  colour:"#0000FF"}, // Used for the selected LSOA
 {max_minutes:-Infinity,  colour:"#0000FF"}
].sort(function(a,b){return b.max_minutes - a.max_minutes})

var get_colour_for_travel_time = function (travel_time){
  if(isNaN(travel_time)){
    return travel_time_scale[0].colour;
  } 

  if(typeof(travel_time) != "number"){
    return travel_time_scale[0].colour;
  } 

  var tts_i = 1;

  while(!(travel_time_scale[tts_i].max_minutes == null) && (travel_time <= travel_time_scale[tts_i].max_minutes)){
    tts_i = tts_i + 1;
  }

  return travel_time_scale[tts_i-1].colour;
};

var draw_travel_time_scale = function(){

  var ref_time = luxon.DateTime.fromISO(matrix_details.time_ref); 

  $("#travel_time_scale_title").empty().append("Leave at…")

  var prettyScaleLabel = function(max_minutes){
    if(max_minutes == Infinity){
      return "Unknown"
    }
    return ref_time.minus({minutes:max_minutes}).toLocaleString(luxon.DateTime.TIME_SIMPLE);
  }

  var scale_entries = travel_time_scale.slice(0, travel_time_scale.length-2).map( r =>
    $("<div style='background-color:"+ r.colour +"'>"+ prettyScaleLabel(r.max_minutes) +"</div>"));

  $("#travel_time_scale_entries").empty().append(scale_entries);
};