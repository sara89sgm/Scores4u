var name='';
var artist='';
var uriSong='';
var idScore=''; //Id actual score
var secret='';
var numPages='';
var actualPage='';
var player='';
function showSecond(){
    var options = {};
    $( "#firstSlide" ).hide();           
    
    $( "#secondSlide" ).show();
    return false;
    
}

function searchSong(){ 
    var name= $("#searchField").val();
    
    var url="http://ws.spotify.com/search/1/track.json?q="+name;
    url=encodeURI(url);
    $.ajax({
           url: url,
           dataType: "json",
           success: function(data, textStatus, jqXHR){
           
           fillResults(data);
           },
           error: function(jqXHR, textStatus, errorThrown){
           alert('login error: ' + textStatus);
           }
           });
    
    //deezer
    
    var url2="http://api.deezer.com/2.0/search?q="+name+"&output=jsonp";
    url2=encodeURI(url2);
    $.ajax({
           url: url2,
           dataType: "jsonp",
           success: function(data2, textStatus, jqXHR){
           
           if(data2!=null){
           fillResultsDeezer(data2);                }
           else{
           alert("data null");
           
           }
           
           },
           error: function(jqXHR, textStatus, errorThrown){
           alert('login error: ' + textStatus);
           }
           });    
    return false;
    
}




function fillResults(data){
    var track=data.tracks[0];
    var i=0;
    
    
    var j=0;
    var arrayClasses=new Array();
    arrayClasses[0]='button medium blue';
    arrayClasses[1]='button medium green';
    arrayClasses[2]='button medium orange';
    arrayClasses[3]='button medium gray';
    
    
    $("#spotifyResults").empty();
    while(((typeof(track)) != 'undefined') && (i<10)){
        var pars=""+track.name+"("+track.artists[0].name+")";
        var uri="'"+track.href+"','"+track.name+"','"+track.artists[0].name+"'";
        
        $("#spotifyResults").append('<a onclick="return searchLyrics('+uri+');" style="margin:5px" href="#" class="'+arrayClasses[j]+'">'+pars+'</a>');
        i++;
        if(j===3){
            j=0;
        }else{
            j++;
        }
        
        
        track=data.tracks[i];
        
    }
    
    
    
}

function fillResultsDeezer(data2){
    
    var track=data2.data[0];
    
    var i=0;
    
    
    var j=0;
    var arrayClasses=new Array();
    arrayClasses[0]='button medium blue';
    arrayClasses[1]='button medium green';
    arrayClasses[2]='button medium orange';
    arrayClasses[3]='button medium gray';
    
    
    $("#deezerResults").empty();
    while(((typeof(track)) != 'undefined') && (i<10)){
        var pars=""+track.title+"("+track.artist.name+")";
        var uri="'"+track.id+"','"+track.title+"','"+track.artist.name+"'";
        
        $("#deezerResults").append('<a onclick="return searchLyricsDeezer('+uri+');" style="margin:5px" href="#" class="'+arrayClasses[j]+'">'+pars+'</a>');
        i++;
        if(j===3){
            j=0;
        }else{
            j++;
        }
        
        
        track=data2.data[i];
        
    }      
    
    
    
}

function searchLyrics(uri,name2,artist2){ 
    uriSong=uri;
    name=name2;
    artist=artist2;
    getScoreMuseScore();
    showSecond();
    uriFrame="https://embed.spotify.com/?uri="+uriSong;
    $("#spotifyIframe").attr('src', uriFrame);
    total=""+name2+" "+artist2;
    //echonest
    var url="http://developer.echonest.com/api/v4/song/search?api_key=MXG5OCMN63QJ1C5OM&format=jsonp&results=10&combined="+total+"&bucket=id:musixmatch-WW&bucket=tracks&sort=song_hotttnesss-desc";
    url=encodeURI(url);
    $.ajax({
           url: url,
           dataType: "jsonp",
           success: function(data, textStatus, jqXHR){
           if(data!=null){
           
           fillMusixMatch(data);
           }
           else{
           alert("We have not found any lyrics for this track, sorry :(");
           
           }
           
           },
           error: function(jqXHR, textStatus, errorThrown){
           alert('login error: ' + textStatus);
           }
           });    
    
    
    
    
    
    
    return false;
}

function searchLyricsDeezer(id,name2,artist2){ 
    uriSong=id;
    name=name2;
    artist=artist2;
    getScoreMuseScore();
    showSecond();
    $("#spotifyPlayer").hide();
    $("#deezerPlayer").show();
    DZ.init({
            appId  : '103141',
            channelUrl : 'https://geomusic.herokuapp.com/scores4u/channel.html',
            player : {
            container : 'deezerIframe',
            cover : true,
            playlist : true,
            width : 300,
            height : 500,
            
            onload : function(){
            DZ.player.playTracks([id, 1152226], 0, function(response){
                                 console.log("track list", response.tracks);
                                 });
            
            
            
            }
            }
            });
    DZ.player.playTracks([id, 1152226], 0, function(response){
                         console.log("track list", response.tracks);
                         });
    total=""+name2+" "+artist2;
    //echonest
    var url="http://developer.echonest.com/api/v4/song/search?api_key=MXG5OCMN63QJ1C5OM&format=jsonp&results=10&combined="+total+"&bucket=id:musixmatch-WW&bucket=tracks&sort=song_hotttnesss-desc";
    url=encodeURI(url);
    $.ajax({
           url: url,
           dataType: "jsonp",
           success: function(data, textStatus, jqXHR){
           if(data!=null){
           
           fillMusixMatch(data);
           }
           else{
           alert("We have not found any lyrics for this track, sorry :(");
           
           }
           
           },
           error: function(jqXHR, textStatus, errorThrown){
           alert('login error: ' + textStatus);
           }
           });    
    
    
    
    
    
    
    return false;
}


function fillMusixMatch(data){
    var lyricsId=data.response.songs[0].tracks[0].foreign_id;
    
    var n=lyricsId.split(":");
    
    
    var url="http://api.musixmatch.com/ws/1.1/track.lyrics.get?apikey=6c65d0497150dd473772788db6a4008c&track_id="+n[2]+"&format=jsonp&callback=rr";
    url=encodeURI(url);
    $.ajax({
           url: url,
           dataType: "jsonp",
           success: function(data, textStatus, jqXHR){
           if(data!=null){
           
           $("#lyricsM").empty();
           $("#lyricsM").append('<div><p>');
           
           $("#lyricsM").append(data.message.body.lyrics.lyrics_body);
           $("#lyricsM").append('</div>');
           }
           else{
           alert("data null");
           
           }
           
           },
           error: function(jqXHR, textStatus, errorThrown){
           alert('login error: ' + textStatus);
           }
           });    
    
    
    
    
    
}




function getScoreMuseScore(){
    
    text=encodeURIComponent(''+artist+' '+name);
    var url='http://api.musescore.com/services/rest/score.jsonp?text='+text+'&oauth_consumer_key=musichackday&callback=tt';
    
    
    
    $.ajax({
           url: url,
           dataType: "jsonp",
           success: function(data, textStatus, jqXHR){
           if(data!=null){
           idScore=data[0].id;
           secret=data[0].secret;
           numPages=data[0].metadata.pages-1;
           actualPage=0;
           
           showScore(data[0].id);
           }
           else{
           $("#score2").empty();
           $("#score2").append("<h4> We don't find the score.....do you want to write it?</h4>");
           $("#score2").append('<input type="button" value="Write Score" onclick="write()" />');
           
           }
           
           },
           error: function(jqXHR, textStatus, errorThrown){
           alert('login error: ' + textStatus);
           }
           });
    
    
    
}  

function showScore(id){
    $("#scorePng").empty();
    $("#scorePng").append("<img src='http://static.musescore.com/"+idScore+"/"+secret+"/score_"+actualPage+".png'/>");
    $("#count").empty();
    $("#count").append("Page: "+(actualPage+1)+" of "+(numPages+1));
    
}
function prev(){
    if(actualPage!=0){
        actualPage--;
        $("#scorePng").empty();
        $("#scorePng").append("<img src='http://static.musescore.com/"+idScore+"/"+secret+"/score_"+actualPage+".png'/>");
        $("#count").empty();
        $("#count").append("Page: "+(actualPage+1)+" of "+(numPages+1));
    }
    
}
function next(){
    if(actualPage!=numPages){
        actualPage++;
        $("#scorePng").empty();
        $("#scorePng").append("<img src='http://static.musescore.com/"+idScore+"/"+secret+"/score_"+actualPage+".png'/>");
        $("#count").empty();
        $("#count").append("Page: "+(actualPage+1)+" of "+(numPages+1));
    }
}
// $("#firstSlide").hide();
// $("#secondSlide").show();