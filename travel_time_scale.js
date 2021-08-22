var travel_time_scale = [
 {max_minutes:Infinity, colour:"#333333", contrast_colour:'#FFFFFF'},
 {max_minutes:360, colour:"#a50026", contrast_colour:'#FFFFFF'},
 {max_minutes:240, colour:"#d73027", contrast_colour:'#FFFFFF'},
 {max_minutes:180, colour:"#f46d43"},
 {max_minutes:150, colour:"#fdae61"},
 {max_minutes:120, colour:"#fee090"},
 {max_minutes:90, colour:"#ffffbf"},
 {max_minutes:75, colour:"#e0f3f8"},
 {max_minutes:60, colour:"#abd9e9"},
 {max_minutes:45, colour:"#74add1"},
 {max_minutes:30, colour:"#4575b4", contrast_colour:'#FFFFFF'},
 {max_minutes:15, colour:"#313695", contrast_colour:'#FFFFFF'},
 {max_minutes:0,  colour:"#0000FF", contrast_colour:'#FFFFFF'}, // Used for the selected LSOA
 {max_minutes:-Infinity,  colour:"#0000FF", contrast_colour:'#FFFFFF'}
].
  sort(function(a,b){return b.max_minutes - a.max_minutes}).
  map(function(e,i,a){
    if(a[i+1]){
      e.min_minutes = a[i+1].max_minutes+1;
    }else{
      e.min_minutes = -Infinity;
    }
    return e;
  })

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

$(function(){
  $("#scale_chooser").change(function(evt){
    draw_travel_time_scale();
  });
});

var draw_travel_time_scale = function(){

  var scale_choice = $("input[name='scale']:checked").val();
  var ref_time = luxon.DateTime.fromISO(matrix_details.time_ref);
  var ref_type = matrix_details.time_ref_type;

  $("#travel_time_scale_header").empty().append("Leave at…");
  $("#travel_time_scale_midder").empty().append("to get to");
  $("#travel_time_scale_footer").empty().append("by "+ref_time.toLocaleString(luxon.DateTime.TIME_SIMPLE));

  var contrastColour = function(r){
    if(r.contrast_colour){
      return r.contrast_colour;
    }

    return '#000000';
  }

  var period_format_string = "h'hrs 'mm'min'";
  var prettyScaleLabel = function(r){

    if (scale_choice == 'period') {
      if(r.max_minutes == Infinity){
        return "Unknown"
      }

      var max_str = luxon.Duration.fromObject({minutes:r.max_minutes}).toFormat(period_format_string);
      return max_str;
    }

    if(r.max_minutes == Infinity){
      return "Unknown"
    }
    return ref_time.minus({minutes:r.max_minutes}).toLocaleString(luxon.DateTime.TIME_SIMPLE);
  }

  var scale_entries = travel_time_scale.slice(0, travel_time_scale.length-2).map( r =>
    $("<div style='background-color:"+ r.colour +";color:"+contrastColour(r)+"'>"+ 
      prettyScaleLabel(r) +"</div>"));

  $("#travel_time_scale_entries").empty().append(scale_entries);
};