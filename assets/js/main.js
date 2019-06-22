$(document).ready(function(){

	// AJAX Cache
	var APOD_cache = {};
	// Local browser cache for caching successful requests to the API and reducing API key uses.
		// cache[DATE] = AJAX Response

	// Constraints
	const today = new Date();
	const last_date = new Date("1995", "05", "16"); // June 16th, 1995
	
	// Manipulated date variable
	var date = new Date();
    
    $(".copyright").text("Michael Rooplall © 2018-" + date.getFullYear());


	var requested_date = getUrlParameter("date");
	if (requested_date != ""){

		var split_params = requested_date.split("-");
		console.log("Split parameters: ", split_params);

		var year = split_params[0];
		var month = split_params[1];
		var day = split_params[2];

		if ((parseInt(year) != NaN) &&(parseInt(month) != NaN) && (parseInt(day) != NaN)){

			date = new Date(year, month - 1, day);
			console.log("Parsed Date", date);

		}

	}

	// Date Navigation

	function goto_nextDate(){

		var next_date = new Date(date.getTime());
		next_date.setDate(next_date.getDate() + 1);

		console.log("Current Date", date);
		console.log("Next Date", next_date);

		if (next_date > today){
			// Sorry, you're trying to get too far ahead.
			alert("Sorry, the NASA APOD API does not go that far ahead!");
		} else {
			date = next_date;
			displayAPOD(date);
		}

	}

	function goto_previousDate(){

		var previous_date = new Date(date.getTime());
		previous_date.setDate(previous_date.getDate() - 1);

		console.log("Current Date", date);
		console.log("Previous Date", previous_date);

		if (previous_date < last_date){
			// Sorry, you're trying to go too far back.
			alert("Sorry, the NASA APOD API does not go that far back!\nThe initial date of the project was June 16th, 1995.");
		} else {
			date = previous_date;
			displayAPOD(date);
		}
		
	}

	$("#date_next_btn").click(goto_nextDate);
	
	$("#date_previous_btn").click(goto_previousDate)

	$(document).on("keydown", function(event){

		if ((event.keyCode == 39) && ($("#date_next_btn").prop("disabled") !== true)){
			goto_nextDate();
		} else if ((event.keyCode == 37) && ($("#date_previous_btn").prop("disabled") !== true)){
			goto_previousDate();
		} else if (event.keyCode == 79){
			$("#Date_Modal").modal("toggle");
		}

	});

	function manageDateNavigation(){

		setUrlParameter("date", (date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()));

		$("#date_next_btn").prop("disabled", date_helpers.compare(date, today));
		$("#date_previous_btn").prop("disabled", date_helpers.compare(date, last_date));

	}

	if (getUrlParameter("hd") == "true"){
		$("#hd_toggle").addClass("active");
	} else {
		$("#hd_toggle").removeClass("active");
	}

	$("#hd_toggle").click(function(){
		$("#hd_toggle").toggleClass("active");
		setUrlParameter("hd", ($("#hd_toggle").hasClass("active")) ? "true" : "")
	})

	// Main

	function displayAPOD(query_date){

		manageDateNavigation();

		$("#Content").hide();
		$("#Loading").show();

		var query_url_date;

		console.log("Passed Date", query_date);

		if (query_date){
			query_url_date = query_date.getFullYear() + "-" + (query_date.getMonth() + 1) + "-" + query_date.getDate();
			console.log("Query_Date:", query_url_date);
		}

		var query_url = 'https://api.nasa.gov/planetary/apod?hd=' + ($("#hd_toggle").hasClass("active") ? "true" : "false") + (query_url_date ? ('&date=' + query_url_date) : '') + '&api_key=YxsdGf4qyCOyMbPqLkQQMXLOEXJHZtaYKGujuq5H'
		console.log("Query_URL:", query_url);

		if (!query_date){
			// Logic for setting the query_date is done after setting the query_url.
			// This is here for the sake of caching the request locally, but not requesting a specific date from the API Service.
			query_date = new Date();
			query_url_date = query_date.getFullYear() + "-" + (query_date.getMonth() + 1) + "-" + query_date.getDate();
		};

		// Cache Lookup
		var cached_APOD_response = APOD_cache[query_date];

		if (cached_APOD_response){

			console.log("Found cache results for ", query_date, " : ", cached_APOD_response);
			displayAPOD_results(cached_APOD_response);

		} else {

			$.ajax({

				url : query_url,

				success : function(results){

					console.log("AJAX Success Results:", results);
					displayAPOD_results(results, true);

				},

				error : function(xhr, status, error){

					console.log("An AJAX error has occured - ", xhr, error);

					// Most likely the requested date does not exist

					$(".title-h").addClass("prespacer");

					$(".date-p").text(date_helpers.format_month[query_date.getMonth()] + " " + date_helpers.date_suffix(query_date.getDate()) + ", " + query_date.getFullYear());

					if (xhr.status == 503){

						$(".title-h").text("No Data | 503 - Server Error");
						$(".description-p").text("Sorry! It looks like the NASA APOD API is currently down. This may be due to an issue with the API itself, or a temporary lack of mainentance due to issues with government funding.\n\nThe issue is temporary, but out of the control of this application. You are welcome to come back and try again at a later time!");
					
					} else {

						$(".title-h").text("No Data");
						$(".description-p").text("Sorry! It looks like either something went wrong, or the NASA APOD API does not have any data archived for this date.\n\nYou can still however continue browsing!");
					
					}

					$(".download-url").attr("href", "");
					
					$(".image-display").attr("src", "");
					$(".video-display").attr("src", "");
					$(".video-container").hide();
					$(".image-container").hide();

					$(".copyright-p").hide();
				},

				complete: function(){
					$("#Content").show();
					$("#Loading").hide();
				}

			})

		}

		function displayAPOD_results(results, doCacheResults){

			if (query_date != date){
				// When the user navigates before the previous content has loaded, there is a risk that slow-loading content will over-write the current request content when it completes.
				// To handle this, just return and let the next API request be the one to do the rendering.
				return;
			}

			if (doCacheResults){
				console.log("Added ", query_url_date, " to cache. ", results);
				APOD_cache[query_url_date] = results;
			}
		
			$(".date-p").text(date_helpers.format_month[query_date.getMonth()] + " " + date_helpers.date_suffix(query_date.getDate()) + ", " + query_date.getFullYear());

			var worst_source_url = results["url"] ? results["url"] : results["hdurl"];
			var best_source_url = results["hdurl"] ? results["hdurl"] : results["url"];
			var source_url = $("#hd_toggle").hasClass("active") ? best_source_url : worst_source_url;

			$(".image-display").attr("src", "");
			$(".video-display").attr("src", "");

			if (results.media_type == "video"){

				$(".video-display").attr("src", source_url);
				$(".image-container").hide();
				$(".video-container").show();

			} else {

				$(".image-display").attr("src", source_url);
				$(".video-container").hide();
				$(".image-container").show();

			}
			
			$(".title-h").removeClass("prespacer");
			$(".title-h").text(results.title);
			$(".description-p").text( filter_p(results.explanation) );
			$(".download-url").attr("href", best_source_url);

			if (results["copyright"] && results["copyright"].replace(/ /g, "") != ""){
				$(".copyright-p").html(results.copyright + ' <i class="fa fa-copyright"></i>');
				$(".copyright-p").show();
			} else {
				$(".copyright-p").hide();
			}

			if (!doCacheResults){
				// When not called from an AJAX request, display content outside of AJAX's 'complete' event.
				$("#Content").show();
				$("#Loading").hide();
			}

		}
	}

	function filter_p(text){
		text = text.replace("Free Download: 2019 APOD Calendar", "");
		
		var issue0_index = text.indexOf("APOD in other languages");

		if (issue0_index !== -1){
			text = text.substring(0, issue0_index - 1);
		}

		var issue1_index = text.indexOf("Follow APOD on: ");

		if (issue1_index !== -1){
			text = text.substring(0, issue1_index - 1);
		}

		return text;
	}


	// Date Modal

	$("#date_modal_trigger").click(function(){
		$("#Date_Modal").modal();
	})

	$(".date_modal_go").click(function(){
		$("#Date_Modal").modal("hide");
		date = $(".plugin-bsdate").datepicker("getDate");
		displayAPOD(date);
	})

	function setDatePicker(new_date, skipUpdate){
		$("#date_modal_input").val((new_date.getMonth() + 1) + "/" + new_date.getDate() + "/" + new_date.getFullYear());

		if (!skipUpdate){
			$(".plugin-bsdate").datepicker('update', new_date);
		}
		
	}

	$("#date_modal_today").click(function(){
		setDatePicker(today);
	})

	$("#date_modal_first").click(function(){
		setDatePicker(last_date);
	})

	// Plugin Setup
	$(".plugin-bsdate").datepicker({
		format: "mm-dd-yyyy",
		startDate: "06 16 1995",
		endDate: "tomorrow",
		maxViewMode: 3,
		todayHighlight: true
	});

	$(".plugin-bsdate").datepicker().on("changeDate", function(){
		
		date = $(".plugin-bsdate").datepicker("getDate");
		setDatePicker(date, true);

	});

	$("#date_modal_input").val((date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear());
	$(".plugin-bsdate").datepicker('update', date);
	
	// About Modal
	
	$("#footer-about-trigger, #navbar-about-trigger").click(function(){
		$("#About_Modal").modal();
	})

	displayAPOD(date);
		
})


// Url Parameters
function getUrlParameter(parameter) {

	var url = window.location.href;

	parameter = parameter.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
	var regex = new RegExp('[\\?|&]' + parameter.toLowerCase() + '=([^&#]*)');
	var results = regex.exec('?' + url.toLowerCase().split('?')[1]);
	return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}


function setUrlParameter(key, value) {

	var url = window.location.href + "";

	var baseUrl = url.split('?')[0],
		urlQueryString = '?' + url.split('?')[1],
		newParam = key + '=' + value,
		params = '?' + newParam;

	if (urlQueryString) {

		var updateRegex = new RegExp('([\?&])' + key + '[^&]*');
		var removeRegex = new RegExp('([\?&])' + key + '=[^&;]+[&;]?');

		if (typeof value === 'undefined' || value === null || value === '' || value === "") { // Remove param if value is empty
			params = urlQueryString.replace(removeRegex, "$1");
			params = params.replace(/[&;]$/, "");

		} else if (urlQueryString.match(updateRegex) !== null) { // If param exists already, update it
			params = urlQueryString.replace(updateRegex, "$1" + newParam);

		} else { // Otherwise, add it to end of query string
			params = urlQueryString + '&' + newParam;
		}

	}

	console.log("params", params);

	// no parameter was set so we don't need the question mark
	params = params === '?' ? '' : params;

	// Hotfix for strange "undefined" parameter bug
	params = params.replace("?undefined&","?");
	params = params.replace("?undefined", "");

	history.pushState(null, '', params);
}

// Date Formatting

date_helpers = {

	format_day : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],

	format_month : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	
	date_suffix : function(date_num){

		date_num = date_num.toString();
		var lastDigit = date_num[date_num.length - 1];

		switch(lastDigit){
			case "1":
				// 1st 11th 21st 31st
				return date_num + ((date_num == "11") ? "th" : "st");
			case "2":
				// 2nd 12th 22nd 32nd
				return date_num + ((date_num == "12") ? "th" : "nd");
			case "3":
				// 3rd, 13th, 23rd
				return date_num + ((date_num == "12") ? "th" : "rd");
			default :
				return date_num + "th";
		}


	},
	
	compare : function(d1, d2){
		return ((d1.getFullYear() == d2.getFullYear()) && (d1.getMonth() == d2.getMonth()) && (d1.getDate() == d2.getDate()))
	}
}