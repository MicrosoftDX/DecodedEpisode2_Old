declare var Kurve:any; //Letting Typescript know that Kurve exists
declare var $:any; //jQuery shortcut

var selectedContributor = null;
var curUser = null;
function getHeaders(user) {
	var headers = null;
	if(user != null) {
		headers = {userid: curUser.upn, tenantid: curUser.tenantId};
	}
	return headers;
}
function renderContributors(contributors) {
	var $container = $("#contributors tbody");
	$container.html("");
	$.each(contributors, function(idx, contributor) {
		$container.append(
			"<tr>" +
				"<td><img src='" + contributor.avatar_url + "' /></td>" +
				"<td><a class='contributor' href='#'>" + contributor.login + "</a></td>" +
				"<td>" + contributor.contributions + "</td>" +
			"</tr>");
	});
	$(".contributor").click(function(e) {
		var userName = $(e.target).html();
		selectedContributor = userName;
		
		$.ajax({
			url: "/repos/" + userName,
			headers: getHeaders(curUser),
			success: function(result) {
				renderRepos(userName, result);
			}
		});
	});
}
function renderRepos(user, repos) {
	var $container = $("#repos tbody");
	$("#repo_title span").html(user);
	$("#repo_title").show();
	$container.html("");
	$.each(repos, function(idx, repo) {
		var btnClass = "btn-default";
		if(repo.favorite) {
			btnClass = "btn-success";
		}
		$container.append(
			"<tr>" +
				'<td><a data-repo="' + repo.name + '" href="#" class="favorite btn ' + btnClass + '"><span class="glyphicon glyphicon-star"></span></a></td>' +
				"<td>" + repo.name + "</td>" +
			"</tr>"
		);
	});
	$("#repos").show();
	$(".favorite").click(function(e) {
		e.preventDefault();
		var $button = $(e.target).closest("a");
		var isFavorite = $button.hasClass("btn-default");
		$.ajax({
			url: "/favorite/" + selectedContributor + "/" + $button.attr("data-repo"),
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
					$("#repo_title").hide();
					$("#repos").hide();
					$("#login").hide();
				}
			});
		});
	});
	
	$.get("http://localhost:2346/contributors", function(result) {
		renderContributors(result);
	});
});