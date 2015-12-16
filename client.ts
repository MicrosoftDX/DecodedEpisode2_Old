declare var Kurve:any; //Letting Typescript know that Kurve exists
declare var $:any; //jQuery shortcut

var selectedPackage = null;
var curUser = null;
function getHeaders(user) {
	var headers = null;
	if(user != null) {
		headers = {userid: curUser.upn, tenantid: curUser.tenantId};
	}
	return headers;
}
function renderContributors(contributors) {
	$("#contributors_container").show();
	$("#contributors_title span").html(selectedPackage);
	var $container = $("#contributors tbody");
	$container.html("");
	$.each(contributors, function(idx, contributor) {
		$container.append(
			"<tr>" +
				"<td><img src='" + contributor.avatar_url + "' /></td>" +
				"<td>" + contributor.login + "</td>" +
				"<td>" + contributor.contributions + "</td>" +
			"</tr>");
	});
	
}
function renderRepos(repos) {
	var $container = $("#repos tbody");
	$container.html("");
	$.each(repos, function(idx, repo) {
		var btnClass = "btn-default";
		if(repo.favorite) {
			btnClass = "btn-success";
		}
		$container.append(
			"<tr>" +
				'<td><a data-repo="' + repo.name + '" href="#" class="favorite btn ' + btnClass + '"><span class="glyphicon glyphicon-star"></span></a></td>' +
				"<td><a class='repo' href='#'>" + repo.name + "</a></td>" +
			"</tr>"
		);
	});
	$(".repo").click(function(e) {
		var userName = $(e.target).html();
		selectedPackage = userName;
		
		$.ajax({
			url: "/contributors/" + userName,
			success: function(result) {
				renderContributors(result);
			}
		});
	});
	$(".favorite").click(function(e) {
		e.preventDefault();
		var $button = $(e.target).closest("a");
		var isFavorite = $button.hasClass("btn-default");
		$.ajax({
			url: "/favorite/" + $button.attr("data-repo"),
			type: 'post',
			data: {
				isFavorite: isFavorite
			},
			headers: getHeaders(curUser),
			success: function(data) {
				if(isFavorite) {
					$button.removeClass("btn-default").addClass("btn-success");
				} else {
					$button.removeClass("btn-success").addClass("btn-default");
				}
			}
		});
	});
}
function getRepos() {
	$.ajax({
		url: "/repos",
		headers: getHeaders(curUser),
		success: function(result) {
			renderRepos(result);
		}
	});
}
$(document).ready(function() {
	$.get("/identitycreds", function(result) {
		var identity = new Kurve.Identity(
			result.clientID,
			result.callbackURL
		);
		
		$("#login").click(function(e) {
			e.preventDefault();
			identity.login(function(error) {
				if(identity.isLoggedIn()) {
					curUser = identity.getIdToken();
					$("#contributors_container").hide();
					$("#login").hide();
					getRepos();
				}
			});
		});
	});
	
	getRepos();
});