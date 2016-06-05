var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Kreiraj nov EHR zapis za pacienta in dodaj osnovne demografske podatke.
 * V primeru uspešne akcije izpiši sporočilo s pridobljenim EHR ID, sicer
 * izpiši napako.
 */
function kreirajEHRzaBolnika() {
	toggle = 0;
	$("#graf").empty();
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
                        	var opcijeVnos = document.getElementById("preberiObstojeciEHR");
		                    opcijeVnos.options[opcijeVnos.length] = new Option(ime + " " + priimek, ehrId);
		                    var opcijePreberiEhr = document.getElementById("preberiObstojeciVitalniZnak");
		                    opcijePreberiEhr.options[opcijePreberiEhr.length] = new Option(ime + " " + priimek, ehrId);
		                    var opcijePreberiPodatke = document.getElementById("preberiEhrIdZaVitalneZnake");
		                    opcijePreberiPodatke.options[opcijePreberiPodatke.length] = new Option(ime + " " + priimek, ehrId);
		                    var opcijeAktivnost = document.getElementById("predlagajAktivnost");
		                    opcijeAktivnost.options[opcijeAktivnost.length] = new Option(ime + " " + priimek, ehrId);
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}


/**
 * Za podan EHR ID preberi demografske podrobnosti pacienta in izpiši sporočilo
 * s pridobljenimi podatki (ime, priimek in datum rojstva).
 */
function preberiEHRodBolnika() {
	toggle = 0;
	$("#graf").empty();
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>Bolnik '" + party.firstNames + " " +
          party.lastNames + "', ki se je rodil '" + party.dateOfBirth +
          "'.</span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
	}
}


/**
 * Za dodajanje vitalnih znakov pacienta je pripravljena kompozicija, ki
 * vključuje množico meritev vitalnih znakov (EHR ID, datum in ura,
 * telesna višina, telesna teža, sistolični in diastolični krvni tlak,
 * nasičenost krvi s kisikom in merilec).
 */
function dodajMeritveVitalnihZnakov() {
	toggle = 0;
	$("#graf").empty();
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
      // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": 0,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		    committer: merilec
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>" +
              res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}


/**
 * Pridobivanje vseh zgodovinskih podatkov meritev izbranih vitalnih znakov
 * (telesna temperatura, filtriranje telesne temperature in telesna teža).
 * Filtriranje telesne temperature je izvedena z AQL poizvedbo, ki se uporablja
 * za napredno iskanje po zdravstvenih podatkih.
 */
 var itms = [];
 var weightMostRecent = 0;
function preberiMeritveVitalnihZnakov() {
	toggle = 0;
	
	$("#graf").empty();
	sessionId = getSessionId();

	var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();
	//$("#map").empty();
	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				if(tip == 'ITM')
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje " +
          "podatkov za <button type='button' class='clickable' onclick='narisiGraf()'><b>'" + tip + "'</b> uporabnika <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</button></span><br/><br/>");
        		else
        			$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje " +
          "podatkov za <b>'" + tip + "'</b> uporabnika <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</span><br/><br/>");
          
				if (tip == "telesna temperatura") {
					$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna temperatura</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time.substr(0,10) +"   "+ res[i].time.substr(11,5)+
                          "</td><td class='text-right'>" + res[i].temperature +
                          " " + res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna teža</th></tr>";
                    			var time = res[0].time;
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time.substr(0,10) +"   "+ res[i].time.substr(11,5) +
                          "</td><td class='text-right'>" + res[i].weight + " " 	+
                          res[i].unit + "</td>";
                        			
						        }
						        //console.log(time +" "+ weightMostRecent);
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				}
				else if(tip == "ITM"){
				var AQL =	"select " +
					        "a_a/data[at0002]/events[at0003]/time/value as cas, " +
					        "a_c/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/magnitude as visina, " +
					        "a_d/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as teza " +
						"from EHR e[ehr_id/value='"+ehrId+"']" +
						"contains COMPOSITION a " +
						"contains ( " +
						        "OBSERVATION a_d[openEHR-EHR-OBSERVATION.body_weight.v1] and " +
						        "OBSERVATION a_c[openEHR-EHR-OBSERVATION.height.v1] and " +
						        "OBSERVATION a_a[openEHR-EHR-OBSERVATION.body_temperature.v1] and " +
						        "OBSERVATION a_b[openEHR-EHR-OBSERVATION.blood_pressure.v1]) " +               
						"offset 0 limit 5";
					$.ajax({
					    url: baseUrl + "/query?" + $.param({"aql": AQL}),
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	console.log(res);
					    	var results = "<table class='table table-striped table-hover'>" +
                  "<tr><th>Datum in ura</th><th class='text-right'>" +
                  "ITM</th></tr>";
					    	if (res) {
					    		var rows = res.resultSet;
					    		itmAvg = 0;
						        for (var i in rows) {
						        	itms[i] = [rows[i].cas, Math.round(rows[i].teza/(rows[i].visina/100*rows[i].visina/100) *10)/10];
						            results += "<tr><td>" + rows[i].cas.substr(0,10) +"   "+ rows[i].cas.substr(11,5) +
                          "</td><td class='text-right'>" + Math.round(rows[i].teza/(rows[i].visina/100*rows[i].visina/100) *10)/10 + "</td></tr>"  ;
                          //<button type='button' class='klikabilen' onclick='narisigraf' value='"+rows[i].cas+"'>"+ rows[i].cas +"</button>
                        			itmAvg+=Math.round(rows[i].teza/(rows[i].visina/100*rows[i].visina/100) *10)/10;
						        }
						        itmAvg = itmAvg/rows.length;
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}

					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				}
			}
		});
	}
}
var itmAvg = 23;
var m = 0;
var lvl = 0;
var trasa = "";
function initMap(level) {
	$("#map").empty();
	$("#txt").empty();
	lvl=level;
	if(m == 0) {
		m = 1;
		$("#map").removeClass("map-visible");
		$("#total").removeClass("right-panel");
		document.getElementById('total').innerHTML ="";
		return;
	}
	m++;
	
	var easySS = [{lat: 46.0665, lng: 14.519}, {lat: 46.0665, lng: 14.519}];
	var easyWaypoints =  [{location: {lat: 46.079, lng: 14.52}},{location: {lat: 46.076, lng: 14.524}},{location: {lat: 46.07, lng: 14.526}}];
	var mediumSS =[{lat: 46.0665, lng: 14.519}, {lat: 46.0665, lng: 14.519}];
	var mediumWaypoints = [{location: {lat: 46.075, lng: 14.524}},{location: {lat: 46.082, lng: 14.52}},{location: {lat: 46.08, lng: 14.53}},{location: {lat: 46.075, lng: 14.54}},{location: {lat: 46.07, lng: 14.536}},{location: {lat: 46.066, lng: 14.52}}];
	var hardSS = [{lat: 46.0665, lng: 14.519}, {lat: 46.0665, lng: 14.519}];
	var hardWaypoints = [{location: {lat: 46.055, lng: 14.5}},{location: {lat: 46.053, lng: 14.482}},{location: {lat: 46.054, lng: 14.47}},{location: {lat: 46.0695, lng: 14.482}}];
	
	//level = 1;
	var startstop = [{lat: 46.05, lng: 14.5}];
	var wp = [];
	
	
	if(level == 1){
	  startstop = easySS;
	  wp = easyWaypoints;
	  trasa = "ENOSTAVNA";
	}
	else if(level == 2){
	  startstop = mediumSS;
	  wp = mediumWaypoints;
	  trasa = "SREDNJE TEZKA";
	}
	else if(level == 3){
	  startstop = hardSS;
	  wp = hardWaypoints;
	  trasa = "TEZKA";
	}
	
	var map = new google.maps.Map(document.getElementById('map'), {
	  zoom: 12,
	  center: startstop[0]  // Lj
	});
	$("#map").addClass("map-visible");
	$("#total").addClass("right-panel");
	var directionsService = new google.maps.DirectionsService;
	var directionsDisplay = new google.maps.DirectionsRenderer({
	  draggable: true,
	  map: map,
	  panel: document.getElementById('right-panel'),
	  suppressMarkers: true
	});
	
	directionsDisplay.addListener('directions_changed', function() {
		$("#txt").empty();
	  computeTotalDistance(directionsDisplay.getDirections());
	});
	console.log(distances);
	if(level != 0){
		var marker = new google.maps.Marker({
	    position: startstop[0],
	    map: map
	});
	displayRoute(startstop[0],startstop[0], directionsService,
	    directionsDisplay, wp);
	}
	
}
	
function displayRoute(origin, destination, service, display,wp) {
	service.route({
	  origin: origin,
	  destination: destination,
	  waypoints: wp/*[{location: {lat: 46.075, lng: 14.524}},{location: {lat: 46.082, lng: 14.52}},{location: {lat: 46.08, lng: 14.53}},{location: {lat: 46.075, lng: 14.54}},{location: {lat: 46.07, lng: 14.536}},{location: {lat: 46.066, lng: 14.52}}/*{location: {lat: 46.06, lng: 14.5}}, {location: {lat: 46.05, lng: 14.5}}]*/,
	  travelMode: google.maps.TravelMode.WALKING,
	  avoidTolls: true
	}, function(response, status) {
	  if (status === google.maps.DirectionsStatus.OK) {
	    display.setDirections(response);
	  } else {
	    alert('Could not display directions due to: ' + status);
	  }
	});
}

kcal = [0,0];
function calories(dist, weight, activity) {
	var kcal = 0;
	//mile <-- km: 1.609344
	//pounds <-- kg: 0.45359237
	var k =  1.609344* 0.45359237;
	//hoja
	if(activity == 1){
		kcal = 0.30*weight*dist/k;
	}
	//tek
	else if(activity == 2){
		kcal = 0.63*weight*dist/k;
	}
	return kcal;
}
	
var distances = [];
function computeTotalDistance(result) {
	$("#txt").empty;
	var total = 0;
	var myroute = result.routes[0];
	for (var i = 0; i < myroute.legs.length; i++) {
	  total += myroute.legs[i].distance.value;
	}
	total = total / 1000;
	
		sessionId = getSessionId();
	var ehrId = $("#aktivnostId").val();
	distances[lvl-1] = total;
	console.log(total);
	var text = "";
	$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
	    		var party = data.party;
				$.ajax({
				    url: baseUrl + "/view/" + ehrId + "/" + "weight",
				    type: 'GET',
				    headers: {"Ehr-Session": sessionId},
				    success: function (res) {
				    	if (res.length > 0) {
                			var time = res[0].time;
					        for (var i in res) {
                    			//console.log(res[i].time);
                    			if(res[i].time.substr(0,4)*100+res[i].time.substr(5,2)*10+res[i].time.substr(8,2) >= time.substr(0,4)*100+time.substr(5,2)*10+time.substr(8,2)){
                    				time = res[i].time;
                    				weightMostRecent = res[i].weight;
                    			}
					        }
					        kcal[0] = Math.round(calories(total,weightMostRecent,1));
							kcal[1] = Math.round(calories(total,weightMostRecent,2));
							var title = "";
							title = "<h4><b>"+trasa+"</b> trasa</h4></br>";
							text = 'S hojo na tej razdalji porabite priblizno '+kcal[0]+' kcal, s tekom pa ' + kcal[1]+' kcal.';
							
							//document.getElementById('total').innerHTML = 'Dolzina izbrane trase: '+total + ' km</br>'+text;
								//$("#rezultatPredlaganeAktivnosti").append("<div id='txt'>Dolzina izbrane trase: "+total + " km</br>"+text +"</div>");
								$("#txt").append(title+"Dolzina izbrane trase: "+total + " km</br>"+text);
					        console.log(lvl);
				    	} else {
				    		$("#predlaganeAktivnostiSporocilo").html(
                "<span class='obvestilo label label-warning fade-in'>" +
                "Ni podatkov!</span>");
				    	}
				    },
				    error: function() {
				    	$("#predlaganeAktivnostiSporocilo").html(
              "<span class='obvestilo label label-danger fade-in'>Napaka '" +
              JSON.parse(err.responseText).userMessage + "'!");
				    }
				});
	    	}
	    	
	});

	
	
}
var users = [['Selina', 'Kyle', '1975-03-14'],['Bruce', 'Wayne', '1972-02-19'],['Random', 'Citizen','1990-06-08']];

function generirajPodatke(userNo){
	console.log(userNo);
	//if(userNo in [1,2,3]){
		console.log(users[userNo-1][0]);
		$("#kreirajIme").val(users[userNo-1][0]);
		$("#kreirajPriimek").val(users[userNo-1][1]);
		$("#kreirajDatumRojstva").val(users[userNo-1][2]);
	//}
	var id;
    kreirajEHRzaBolnika();

	
	var year = rand(1992,2016);
	var month = rand(1,12);
	var day = 0;
	if(month in [1,3,5,7,8,10,12]){
		day = rand(1,31);
	}
	else if(month == 2){
		if(year%4 == 0 && (year%100 != 0 || year%400 == 0))
			day = rand(1,29);
		else
			day = rand(1,28);
	}
	else
		day = rand(1,30);
	var h = rand(0,23);
	var min = rand(0,59);
	var myTimer =setTimeout(function() {
    	id = $("#preberiEHRid").val();
    	//console.log(id);
    	$("#dodajVitalnoEHR").val(id); 
		//console.log($("#dodajVitalnoEHR").val());
		users[userNo-1][3] = id;
		for(var i = 0; i < 5; i++){
			$("#dodajVitalnoDatumInUra").val(year +"-"+ month+"-"+day+"T"+h+":"+min);
			$("#dodajVitalnoTelesnaVisina").val(rand(160, 180)+10*userNo);
			$("#dodajVitalnoTelesnaTeza").val(rand(50,65)+20*(userNo-1));
			$("#dodajVitalnoKrvniTlakSistolicni").val(rand(60, 220));
			$("#dodajVitalnoKrvniTlakDiastolicni").val(rand(40, 120));
			$("#dodajVitalnoMerilec").val('Grumpy nurse');
			//function f(x, callback){
				dodajMeritveVitalnihZnakov();
			// 	callback();
			// }
			// f(userNo, function clearAll(){
				
			// });
		}
		return id;
	}, 3000);
}

var IDs = [];
function generiraj(){
	users = [['Selina', 'Kyle', '1975-03-14'],['Bruce', 'Wayne', '1972-02-19'],['Random', 'Citizen','1990-06-08']];
	$("#preberiPredlogoBolnika").empty();
	$("#preberiObstojeciEHR").empty();
    $("#preberiObstojeciVitalniZnak").empty();
    $("#preberiEhrIdZaVitalneZnake").empty();
    $("#predlagajAktivnost").empty();
    var opcijePredloga = document.getElementById("preberiPredlogoBolnika");
    opcijePredloga.options[opcijePredloga.length] = new Option("","");
    var opcijeVnos = document.getElementById("preberiObstojeciEHR");
    opcijeVnos.options[opcijeVnos.length] = new Option("","");
    var opcijePreberiEhr = document.getElementById("preberiObstojeciVitalniZnak");
    opcijePreberiEhr.options[opcijePreberiEhr.length] = new Option("","");
    var opcijePreberiPodatke = document.getElementById("preberiEhrIdZaVitalneZnake");
    opcijePreberiPodatke.options[opcijePreberiPodatke.length] = new Option("","");
    var opcijeAktivnost = document.getElementById("predlagajAktivnost");
    opcijeAktivnost.options[opcijeAktivnost.length] = new Option("","");
    //$("#preberiEHRid").val(ehrId);
	
	IDs[0] = generirajPodatke(1);
	var myTimer =setTimeout(function() {
		IDs[1] = generirajPodatke(2);
		var myTimer2 =setTimeout(function() {
			IDs[2] = generirajPodatke(3);
			var myTimer3 =setTimeout(function() {
				console.log(users);
				$("#kreirajIme").val("");
				$("#kreirajPriimek").val("");
				$("#kreirajDatumRojstva").val("");
				$("#dodajVitalnoEHR").val(""); 
				$("#dodajVitalnoDatumInUra").val("");
				$("#dodajVitalnoTelesnaVisina").val("");
				$("#dodajVitalnoTelesnaTeza").val("");
				$("#dodajVitalnoKrvniTlakSistolicni").val("");
				$("#dodajVitalnoKrvniTlakDiastolicni").val("");
				$("#dodajVitalnoMerilec").val("");
				document.getElementById("kreirajSporocilo").innerHTML="<span class='obvestilo " +
                          "label label-success fade-in'>"+"Testni uporabniki so bili uspešno kreirani. Do podatkov o njih lahko dostopate preko spustnega menija</span>";
			},2000);
		},3000);
	},3000);
	
	
}
function rand(min, max){
	return Math.floor(Math.random()* (max - min + 1)) + min;
}

function predlagajAktivnosti(){
	if(!aktivnostId || aktivnostId == null || aktivnostId == undefined){
		    	$("#predlaganeAktivnostiSporocilo").html(
      "<span class='obvestilo label label-danger fade-in'>Prosim vnesite zahtevan podatek!</span>");
      return;
	}
	$("#rezultatPredlaganeAktivnosti").empty();
	$("#txt").empty;
	var results = "<table class='table table-striped table-hover'>" +
                  "<tr><th>Stopnja zahtevnosti </th></tr>";//<th class='text-right'>Dolzina trase</th>
	results+= "<tr><td><button type='button' class='clickable' onclick='initMap(1)' id='enostavna'>Enostavna</button></td></tr>";
	results+= "<tr><td><button type='button' class='clickable' onclick='initMap(2)' id='srednje'>Srednja </button></td></tr>";
	results+= "<tr><td><button type='button' class='clickable' onclick='initMap(3)' id='tezka'>Tezka </button></td></tr>";
	
	results+='</table><div id="txt"></div';
	$("#rezultatPredlaganeAktivnosti").append(results);

}

var toggle = 0;
function narisiGraf(){
	$("#graf").empty();
	if(toggle == 1){
		toggle = 0;
		return;
	}
	toggle = 1;
	var w = $("#graf").parent().width();
	var h = 300;
	var padding = 30;
	var l = itms.length;
	//The data for our line
	var data = [];
	for(var i = 0; i < itms.length; i++){
		data[i] = {
			'x': i+1,
			'y': itms[i][1]
		}
	}
	
	var xScale = d3.scale.linear().domain([0.5, l+2]).range([padding, w - padding]);
	var yScale = d3.scale.linear().domain([14, 45]).range([h - padding, padding]);
	
	//The SVG Container
	var svg = d3.select("#graf").append("svg").style("background-color", '#f2f2f2').style("border", "1px solid black").attr("width", w).attr("height", h);
	
	//Define and draw X and Y axes
	var xAxis = d3.svg.axis()
	    .scale(xScale)
	    .orient("bottom")
	    .ticks(10);
	var yAxis = d3.svg.axis()
	    .scale(yScale)
	    .orient("left")
	    .ticks(10);
	
	svg.append("g")
	    .attr("class", "axis")
	    .attr("transform", "translate(0.1,"+(h-padding)+")")
		.style("fill","black")
	    .call(xAxis);
	
	svg.append("g")
	    .attr("class", "axis")
	    .attr("transform", "translate(" + padding + ",0.1)")
		.style("fill","black")
	    .call(yAxis);
	
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 40)
		.attr("x",-50 - (h / 2))
		.attr("dy", "1em")
		.style("text-anchor", "start")
		.style("fill","dark-red")
		.text("izmerjen ITM");
	 
	 var lineFunction = d3.svg.line()
	                          .x(function(d) { return xScale(d.x); })
	                          .y(function(d) { return yScale(d.y); })
	                         .interpolate("linear");
	
	
	
	
	var lineGraph = svg.append("path")
	                            .attr("d", lineFunction(data))
	                           .attr("stroke", "red")
	                            .attr("stroke-width", 2)
	                            .attr("fill", "none");
	
	
	 var circles = svg.selectAll("circle").data(data).enter().append("circle");
	 var circleAttributes = 
	 circles.attr("cx", function(d) { return xScale(d.x); }).attr("cy", function(d) { return yScale(d.y); }).attr("r", function (d) { return 10; }).style("fill", function(d,i)
	 	{
	 		if (d.y < 18.5) return "#33ccff";
	 		else if (d.y < 24.9) return "#66ff66";
	 		else if (d.y < 29) return "yellow";
	 		else if (d.y < 39) return "#ffcc00";
	 		else return "red";
	 	});
}

$(document).ready(function() {

  /**
   * Napolni testne vrednosti (ime, priimek in datum rojstva) pri kreiranju
   * EHR zapisa za novega bolnika, ko uporabnik izbere vrednost iz
   * padajočega menuja (npr. Pujsa Pepa).
   */
  $('#preberiPredlogoBolnika').change(function() {
    $("#kreirajSporocilo").html("");
    var podatki = $(this).val().split(",");
    $("#kreirajIme").val(podatki[0]);
    $("#kreirajPriimek").val(podatki[1]);
    $("#kreirajDatumRojstva").val(podatki[2]);
  });

  /**
   * Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
   * ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Dejan Lavbič, Pujsa Pepa, Ata Smrk)
   */
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});

  /**
   * Napolni testne vrednosti (EHR ID, datum in ura, telesna višina,
   * telesna teža, telesna temperatura, sistolični in diastolični krvni tlak,
   * nasičenost krvi s kisikom in merilec) pri vnosu meritve vitalnih znakov
   * bolnika, ko uporabnik izbere vrednosti iz padajočega menuja (npr. Ata Smrk)
   */
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});

  /**
   * Napolni testni EHR ID pri pregledu meritev vitalnih znakov obstoječega
   * bolnika, ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Ata Smrk, Pujsa Pepa)
   */
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
	
	$('#predlagajAktivnost').change(function() {
		$("#predlaganeAktivnostiSporocilo").html("");
		$("#rezultatPredlaganeAktivnosti").html("");
		$("#aktivnostId").val($(this).val());
		
	});
});