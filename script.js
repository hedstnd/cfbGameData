var dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var day;// = dayOfWeek[(new Date()).getDay()].toLowerCase();
var timeOffset = (new Date()).getTimezoneOffset() / 60;
var teams = [];
var twos = ["home","away"];
const baseURL = "https://site.api.espn.com/apis/site/v2/sports/football/college-football/";
var vars;
var uRL;
var hideCode = "";
var d = new Date();
d.setHours(d.getHours() - timeOffset);
var r = document.querySelector(':root');
window.onload = function() {
	getData(baseURL + "scoreboard?groups=80").then((value) => {
		console.log(value);
		if (value.events.length > 0) {
			g = value.events.filter(e => e.status.type.state == "in");
		} else {
			g = [];
		}
		tab = document.createElement("table");
		for (var i = 0; i < g.length/4; i++) {
			row = document.createElement("tr");
			for (var j = i * 4; j < i*4+4 && j < g.length; j++) {
				if (/*g[j].teams.away.score!=null && g[j].teams.home.score!=null*/true) {
					game = document.createElement("td");
					if (g[j].status.type.state != "in") {
						game.innerHTML += g[j].name + "<br/>" + getGameTime(g[j].date);
					} else {
						game.innerHTML += g[j].name +"<br/>"+g[j].status.type.shortDetail;
						// if (g[j].status.statusCode != g[j].status.codedGameState) {
							// game.innerHTML+= " ("+g[j].status.detailedState+")";
						// }
					}
					if (g[j].status.type.state == "" || g[j].status.type.state == "in") {
						game.setAttribute("onclick","runGD(\""+baseURL+"summary?event="+g[j].id+"\",\""+ g[j].description +"\")");
					}
					row.appendChild(game);
				}  else if (g[j].status.statusCode != g[j].status.codedGameState) {
					game = document.createElement("td");
					game.innerHTML = g[j].teams.away.team.name + " @ " + g[j].teams.home.team.name + "<br/>" + g[j].status.detailedState + " - " + g[j].status.reason;
					row.appendChild(game);
				} else if (g[j].status.statusCode == "P") {
					game = document.createElement("td");
					game.innerHTML = g[j].teams.away.team.name + " @ " + g[j].teams.home.team.name + "<br/>First Pitch: " + getGameTime(g[j].gameDate);
					if (g[j].linescore.offense.battingOrder && g[j].linescore.defense.battingOrder) {
						if (g[j].gamedayType == "P") {
							game.setAttribute("onclick","runGD(\""+baseURL+g[j].link+"\",\""+ g[j].description +"\")");
						} else {
								game.setAttribute("onclick","runGD(\""+baseURL+g[j].link+"\")");
							}
					}
					row.appendChild(game);
				}
			}
			tab.appendChild(row);
		}
		// document.getElementById("scores").innerHTML = "";
		document.getElementById("scores").appendChild(tab);
		if (g.length == 0) {
			document.getElementById("scores").innerHTML += "<table><td>No active games</td></table>";
		}
	});
}
function gameDay() {
	url = uRL;
	console.log(url);
	getData(url).then((value) => {
		console.log(value);
		// if (value.liveData.plays.currentPlay.about.isTopInning) {
			pitchDisplay(value);
		// } else {
			// pitchDisplay(value);
		// }
	});
	
}
function runGD(url, desc="") {
	document.getElementById("sett").className +=" gameOn";
	uRL = url;
	gameDay();
	if (desc.length > 0) {
		var splText = splitInHalf(desc);
		document.getElementById("awayDesc").innerHTML = splText[0];
		// document.getElementById("awayDesc").after(document.createElement("br"));
		document.getElementById("homeDesc").innerHTML = splText[1];
		// document.getElementById("homeDesc").after(document.createElement("br"));
	}
	run = setInterval(gameDay,15000);
}
async function pitchDisplay(game) {
	var lastPlay;
	var curDrive;
	try {
		curDrive = game.drives.current;
		lastPlay = game.drives.current.plays.pop();
	} catch (err) {
		curDrive = game.drives.previous.pop();
		lastPlay = curDrive.plays.pop();
	}
	console.log(curDrive);
	console.log(lastPlay);
	var wp = new Object();
	try {
		var winProbElem = game.winprobability.filter(e => e.playId == lastPlay.id)[0];;
		wp.home = Math.round(winProbElem.homeWinPercentage * 1000)/10;
		console.log("winProb = " + wp.home);
		console.log(winProbElem);
	} catch (err) {
		console.log(err);
		try {
			wp.home = game.predictor.homeTeam.gameProjection;
		} catch(e2) {
			console.log(e2);
			wp.home = 50;
			console.log("winProb = 50");
		}
	}
	wp.away = Math.round((100-wp.home)*10)/10;
	for (var i = 0; i < 2; i++) {
		var tm = game.header.competitions[0].competitors[i];
		console.log(tm);
		console.log(tm.homeAway);
		var wProbText = tm.team.abbreviation +  " Win&nbsp;Probability:&nbsp;";
		wProbText += wp[tm.homeAway]+"%";
		document.getElementById(tm.homeAway+"WPSpan").style.width = wp[tm.homeAway] + "%";
		
		// document.getElementById(tm.homeAway+"WP").innerText = "";
		// document.getElementById(tm.homeAway+"WPSpan").innerText = "";
			// document.getElementById(tm.homeAway+"WPImg").src="";
			wP = document.getElementById(tm.homeAway+"WP");//createElement("span");
			// wP.className = 'winProb';
			wP.innerHTML = wProbText;
			if (game.header.competitions[0].tournamentId && tm.rank) {
				document.getElementById(tm.homeAway+"Name").innerHTML = "(" + tm.rank + ") " + tm.team.nickname;
			} else {
				document.getElementById(tm.homeAway+"Name").innerHTML = tm.team.name;
			}
			var lpScore;
			if (lastPlay) {
				lpScore = lastPlay[tm.homeAway+"Score"];
			} else {
				lpScore = tm.score || "";
			}
			document.getElementById(tm.homeAway+"Score").innerHTML = lpScore;
			// top.before(wP);
			// document.getElementById(tm.homeAway+"WPSpan").value=valCM.awayWinProbability;
		if (wp[tm.homeAway] <= 2) {
			// document.getElementById(tm.homeAway+"WPSpan").innerHTML = wProbText;
			document.getElementById(tm.homeAway+"WPImg").style.opacity = "0";
			document.getElementById(tm.homeAway+"WPImg").style.width = "0";
		} else {
			document.getElementById(tm.homeAway+"WPImg").style.opacity = "1";
			document.getElementById(tm.homeAway+"WPImg").style.width = "3dvh";
		}
	
	// var popUp = document.getElementById("popText");
	// setTimeout(() => {}, document.getElementById("offset").value * 1000);
	// if (game.gameData.status.statusCode != "I" && game.gameData.status.statusCode != "PW" && game.gameData.status.statusCode != hideCode) {
		// popUp.parentElement.style.display = "block";
		// popUp.innerText = game.gameData.status.detailedState;
		// if (game.gameData.status.statusCode == "P") {
			// popUp.innerHTML += "<br/>First Pitch: " + getGameTime(game.gameData.datetime.dateTime);
		// }
		// document.getElementById("close").setAttribute("onclick","hideModal(\""+game.gameData.status.statusCode+"\")");
	// } else {
		// popUp.parentElement.style.display = "none";
		// popUp.innerHTML = "";
		// if (hideCode != game.gameData.status.statusCode) {
			// hideCode = "";
		// }
	// }
	// document.getElementById("topBot").innerText = game.liveData.linescore.inningState;
	// document.getElementById("innNum").innerText = game.liveData.linescore.currentInningOrdinal;
	try {
		document.getElementById(tm.homeAway+"WPImg").src = tm.team.logos[3].href;
	} catch (err) {
		try {
			document.getElementById(tm.homeAway+"WPImg").src = tm.team.logos[1].href;
		} catch (e2) {
			document.getElementById(tm.homeAway+"WPImg").src = tm.team.logos[0].href;
		}
	}
	try {
		r.style.setProperty("--"+tm.homeAway+"Logo","url('"+(tm.team.logos[1].href) + "')");
	} catch {
		r.style.setProperty("--"+tm.homeAway+"Logo","url('"+(tm.team.logos[0].href) + "')");
	}
	document.getElementById(tm.homeAway+"WPSpan").style.backgroundColor = "#" + tm.team.color;
	if (tm.team.color) {
		r.style.setProperty("--"+tm.homeAway+"Bg","#"+tm.team.color);
	}
	if (tm.team.alternateColor) {
		if (tm.team.alternateColor == tm.team.color && tm.team.color != "#FFFFFF") {
			r.style.setProperty("--"+tm.homeAway+"T","#FFFFFF");
		} else if (tm.team.alternateColor == tm.team.color && tm.team.color == "#FFFFFF") {
			r.style.setProperty("--"+tm.homeAway+"T","#000000");
		} else {
			r.style.setProperty("--"+tm.homeAway+"T","#"+tm.team.alternateColor);
		}
	}
	var lead = game.leaders.filter(e => e.team.id == tm.id)[0];
	console.log(lead);

	// var flTrb = [];
	// var onCourt = [];
	var box = new Object();
	var leadOrd = ["Pass","Rec","Rush"];
	// console.log(flTrb);
	// document.getElementById(tm.homeAway+"Fls").innerHTML = "Foul Trouble";
	// if (flTrb.length == 0) {
		// document.getElementById(tm.homeAway+"Fls").innerHTML +="<br/>NONE";
	// }
	// for (var j = 0; j < flTrb.length; j++) {
		// document.getElementById(tm.homeAway + "Fls").innerHTML+="<br/>"+flTrb[j].athlete.shortName;
		// if (flTrb[j].stats[flKey] == 6) {
			 // document.getElementById(tm.homeAway + "Fls").innerHTML+= " - OUT";
		// } else if (flTrb.ejected) {
			// document.getElementById(tm.homeAway + "Fls").innerHTML+= " - EJE";
		// } else {
			// document.getElementById(tm.homeAway + "Fls").innerHTML+= " - " + flTrb[j].stats[flKey];
		// }
	// }
	var plyrBox = game.boxscore.players.filter(e => e.team.id == tm.team.id)[0];
	console.log(plyrBox);
	if (curDrive.team.abbreviation == tm.team.abbreviation) {
		console.log("offense team " + tm.team.abbreviation);
	document.getElementById(tm.homeAway+"Stat").innerHTML = (lastPlay.end.downDistanceText || "" )+ "<br/>" + curDrive.description + "<br/>" + lastPlay.text;
	var recLds = plyrBox.statistics[2].athletes.sort(function(a,b){return b.stats[1] - a.stats[1];});
	for (var j = 1; j < 4; j++) {
		if (j < recLds.length) {
			try {
				document.getElementById(tm.homeAway+"P"+(j)).innerHTML = "<span id=\""+tm.homeAway+"P"+(j)+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P"+(j)+"Pos\" class=\""+tm.homeAway+"Pos\"></span>"+"<img src=\""+nflHeadshot(recLds[j].athlete.id)+"\" alt=\""+recLds[j].athlete.shortName+"\"><br/>"+recLds[j].athlete.displayName;
			} catch(err) {
				document.getElementById(tm.homeAway+"P"+(j)).innerHTML = "<span id=\""+tm.homeAway+"P"+(j)+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P"+(j)+"Pos\" class=\""+tm.homeAway+"Pos\"></span>" + "<img src=\"\" alt=\""+recLds[j].athlete.displayName+"\" class=\"noImg\"><br/>"+recLds[j].athlete.displayName;
			}
			document.getElementById(tm.homeAway+"P"+(j)).innerHTML+= "<br/>"+recLds[j].stats[0] + " REC " + recLds[j].stats[1] + " YDS " + recLds[j].stats[2] + " AVG " + recLds[j].stats[4]+ " LONG " + recLds[j].stats[3] + " TD";
			document.getElementById(tm.homeAway+"P"+(j)+"Num").innerText = recLds[j].athlete.jersey;
			// document.getElementById(tm.homeAway+"P"+(j)+"Pos").innerText = recLds[j].athlete.position.abbreviation;
		} else {
			document.getElementById(tm.homeAway+"P"+j).innerHTML = "";
		}
	}
	var kickLd = plyrBox.statistics[plyrBox.statistics.length - 2].athletes.sort(function(a,b){return b.stats[4] - a.stats[4]});
	try {
		try {
				document.getElementById(tm.homeAway+"P4").innerHTML = "<span id=\""+tm.homeAway+"P4"+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P4"+"Pos\" class=\""+tm.homeAway+"Pos\"></span>"+"<img src=\""+nflHeadshot(kickLd[0].athlete.id)+"\" alt=\""+kickLd[0].athlete.displayName+"\"><br/>"+kickLd[0].athlete.displayName;
			} catch(er) {
				document.getElementById(tm.homeAway+"P4").innerHTML = "<span id=\""+tm.homeAway+"P4"+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P4"+"Pos\" class=\""+tm.homeAway+"Pos\"></span>" + "<img src=\"\" alt=\""+kickLd[0].athlete.lastName+"\" class=\"noImg\"><br/>"+kickLd[0].athlete.displayName;
			}
			document.getElementById(tm.homeAway+"P4").innerHTML+= "<br/>"+kickLd[0].stats[0] + " FG " + kickLd[0].stats[3]+ " XP " + kickLd[0].stats[2] + " LONG " + kickLd[0].stats[4] + " PTS";
			document.getElementById(tm.homeAway+"P4"+"Num").innerText = kickLd[0].athlete.jersey;
			// document.getElementById(tm.homeAway+"P4"+"Pos").innerText = kickLd[0].athlete.position.abbreviation;
	} catch (err) {
		document.getElementById(tm.homeAway+"P4").innerHTML = "";
	}
	var puntLd = plyrBox.statistics[plyrBox.statistics.length - 1].athletes.sort(function(a,b){return b.stats[1] - a.stats[1]});
	console.log(puntLd);
	try {
		try {
				document.getElementById(tm.homeAway+"P5").innerHTML = "<span id=\""+tm.homeAway+"P5"+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P5"+"Pos\" class=\""+tm.homeAway+"Pos\"></span>"+"<img src=\""+nflHeadshot(puntLd[0].athlete.id)+"\" alt=\""+puntLd[0].athlete.lastName+"\"><br/>"+puntLd[0].athlete.displayName;
			} catch(er) {
				console.log(er);
				document.getElementById(tm.homeAway+"P5").innerHTML = "<span id=\""+tm.homeAway+"P5"+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P5"+"Pos\" class=\""+tm.homeAway+"Pos\"></span>" + "<img src=\"\" alt=\""+puntLd[0].athlete.lastName+"\" class=\"noImg\"><br/>"+puntLd[0].athlete.displayName;
			}
			document.getElementById(tm.homeAway+"P5").innerHTML+= "<br/>"+puntLd[0].stats[0] + " PUNT " + puntLd[0].stats[1]+ " YDS " + puntLd[0].stats[2] + " AVG ";
			if (puntLd[0].stats[5]) {
				document.getElementById(tm.homeAway+"P5").innerHTML+= puntLd[0].stats[5] + " LONG ";
			}
			document.getElementById(tm.homeAway+"P5").innerHTML+= puntLd[0].stats[4] + " IN 20";
			document.getElementById(tm.homeAway+"P5"+"Num").innerText = puntLd[0].athlete.jersey;
			// document.getElementById(tm.homeAway+"P5"+"Pos").innerText = puntLd[0].athlete.position.abbreviation;
	} catch (err) {
		console.log(err);
		document.getElementById(tm.homeAway+"P5").innerHTML = "";
	}
	for (var j = 0; j < lead.leaders.length; j++) {
		var ad = document.getElementById(tm.homeAway+leadOrd[j]+"Ld");
		ad.innerHTML = lead.leaders[j].displayName + " Leader<br/>";
		try {
			ad.innerHTML+= "<img src=\"" + lead.leaders[j].leaders[0].athlete.headshot.href+"\"/><br/>";
		} catch (err) {
		}
		try {
			ad.innerHTML+= "#" + lead.leaders[j].leaders[0].athlete.jersey + " " + lead.leaders[j].leaders[0].athlete.shortName + " (" + lead.leaders[j].leaders[0].displayValue + ")";
			// ad.innerHTML+= ", " + 
		} catch (err) {
			ad.innerHTML += "None";
		}
	}
	} else {
		if (plyrBox.statistics.length < 10) {
			console.log(plyrBox);
	await getData("https://site.web.api.espn.com/apis/site/v3/sports/football/college-football/leaders?region=us&lang=en&contentorigin=espn&limit=6&team="+tm.id).then((leaderboard) => {
		console.log(leaderboard);
		console.log("defense team" + tm.team.abbreviation);
	var tklLead;
	// try {
		// tklLead = plyrBox.statistics[4].athletes.sort(function(a,b) {return b.stats[0] - a.stats[0];});
		// document.getElementById(tm.homeAway+"PassLd").innerHTML = "Tackle Leader<br/><img src=\""+nflHeadshot(tklLead[0].athlete.id)+"\"><br/>#"+tklLead[0].athlete.jersey + " " + tklLead[0].athlete.lastName + " ("+tklLead[0].stats[0] + " TOT, " + tklLead[0].stats[1] + " SOLO, " + tklLead[0].stats[3] + " TFL)";
	// } catch (err) {
		tklLead = leaderboard.leaders.categories[6].leaders;
		document.getElementById(tm.homeAway+"PassLd").innerHTML = "Tackle Leader (Season)<br/><img src=\""+nflHeadshot(tklLead[0].athlete.id)+"\"><br/>#"+tklLead[0].athlete.jersey + " " + tklLead[0].athlete.shortName + " ("+tklLead[0].displayValue + " TOT)";
	// }
	for (var j = 1; j < 3; j++) {
		if (j < tklLead.length) {
			console.log(tklLead[j]);
			document.getElementById(tm.homeAway+"P"+(j)).innerHTML = "<span id=\""+tm.homeAway+"P"+(j)+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P"+(j)+"Pos\" class=\""+tm.homeAway+"Pos\"></span>"+"<img src=\""+nflHeadshot(tklLead[j].athlete.id)+"\" alt=\""+tklLead[j].athlete.shortName+"\"><br/>"+tklLead[j].athlete.displayName;
			document.getElementById(tm.homeAway+"P"+(j)).innerHTML+= "<br/>"+tklLead[j].displayValue + " TKL (Season)";
			document.getElementById(tm.homeAway+"P"+(j)+"Num").innerText = tklLead[j].athlete.jersey;
			try {
				document.getElementById(tm.homeAway+"P"+(j)+"Pos").innerText = tklLead[j].athlete.position.abbreviation;
			} catch (e) {
				
			}
		} else {
			document.getElementById(tm.homeAway + "P"+j).innerHTML = "<img src=\"\">";
		}
	}
	var sackLead;
	// try {
		// sackLead = plyrBox.statistics[4].athletes.sort(function(a,b) {return b.stats[2] - a.stats[2];});
		// document.getElementById(tm.homeAway+"RushLd").innerHTML = "Sack Leader<br/><img src=\""+nflHeadshot(sackLead[0].athlete.id)+"\"><br/>#"+sackLead[0].athlete.jersey + " " + sackLead[0].athlete.lastName + " ("+sackLead[0].stats[2] + " SACK, " + sackLead[0].stats[5] + " QB HITS, " + sackLead[0].stats[3] + " TFL)";
	// } catch (err) {
		sackLead = leaderboard.leaders.categories[7].leaders;
		document.getElementById(tm.homeAway+"RushLd").innerHTML = "Sack Leader (Season)<br/><img src=\""+sackLead[0].athlete.headshot.href+"\"><br/>#"+sackLead[0].athlete.jersey + " " + sackLead[0].athlete.shortName + " ("+sackLead[0].displayValue + " SACK)";
	// }
	console.log(sackLead);
	for (var j = 3; j < 5; j++) {
		if (j < sackLead.length + 1) {
			document.getElementById(tm.homeAway+"P"+(j)).innerHTML = "<span id=\""+tm.homeAway+"P"+(j)+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P"+(j)+"Pos\" class=\""+tm.homeAway+"Pos\"></span>"+"<img src=\""+nflHeadshot(sackLead[j-2].athlete.id)+"\" alt=\""+sackLead[j-2].athlete.shortName+"\"><br/>"+sackLead[j-2].athlete.displayName;
			document.getElementById(tm.homeAway+"P"+(j)).innerHTML+= "<br/>"+sackLead[j-2].displayValue + " SACK (Season)";
			document.getElementById(tm.homeAway+"P"+(j)+"Num").innerText = sackLead[j-2].athlete.jersey;
			try {
				document.getElementById(tm.homeAway+"P"+(j)+"Pos").innerText = sackLead[j-2].athlete.position.abbreviation;
			} catch (e) {
				
			}
		} else {
			document.getElementById(tm.homeAway + "P"+j).innerHTML = "<img src=\"\">";
		}
	}
	var intLead;
	var intLeadNum = 0;
	try {
		intLead = plyrBox.statistics.filter(e => e.name == "interceptions")[0].athletes.sort(function(a,b) {return b.stats[0] - a.stats[0];});
		document.getElementById(tm.homeAway+"RecLd").innerHTML = "INT Leader (Today)<br/><img src=\""+nflHeadshot(intLead[0].athlete.id)+"\"><br/>#"+intLead[0].athlete.jersey + " " + intLead[0].athlete.lastName + " ("+intLead[0].stats[0] + " INT, " + intLead[0].stats[1] + " YDS, " + intLead[0].stats[2] + " TD)";
		intLeadNum = 1;
		intLead = [intLead[0]].concat(leaderboard.leaders.categories[8].leaders);
		console.log(intLead);
	} catch (err) {
		console.log(err);
		intLead = leaderboard.leaders.categories[8].leaders || [];
		if (intLead.length > 0) {
		document.getElementById(tm.homeAway+"RecLd").innerHTML = "INT Leader (Season)<br/><img src=\""+intLead[0].athlete.headshot.href+"\"><br/>#"+intLead[0].athlete.jersey + " " + intLead[0].athlete.shortName + " ("+intLead[0].displayValue + " INT)";
		} else {
			document.getElementById(tm.homeAway+"RecLd").innerHTML = "";
		}
	}
	if (intLead.length > 1) {
		document.getElementById(tm.homeAway+"P5").innerHTML = "<span id=\""+tm.homeAway+"P5"+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P5"+"Pos\" class=\""+tm.homeAway+"Pos\"></span>"+"<img src=\""+nflHeadshot(intLead[intLeadNum].athlete.id)+"\" alt=\""+intLead[intLeadNum].athlete.shortName+"\"><br/>"+intLead[intLeadNum].athlete.displayName;
		document.getElementById(tm.homeAway+"P5").innerHTML+= "<br/>"+intLead[1].displayValue + " INT (Season)";
		document.getElementById(tm.homeAway+"P5"+"Num").innerText = intLead[1].athlete.jersey;
		document.getElementById(tm.homeAway+"P5"+"Pos").innerText = intLead[1].athlete.position.abbreviation;
	} else {
		document.getElementById(tm.homeAway + "P5").innerHTML = "<img src=\"\">";
	}});
		} else {
		var tklLead;
	try {
		tklLead = plyrBox.statistics[4].athletes.sort(function(a,b) {return b.stats[0] - a.stats[0];});
		document.getElementById(tm.homeAway+"PassLd").innerHTML = "Tackle Leader<br/><img src=\""+nflHeadshot(tklLead[0].athlete.id)+"\"><br/>#"+tklLead[0].athlete.jersey + " " + tklLead[0].athlete.lastName + " ("+tklLead[0].stats[0] + " TOT, " + tklLead[0].stats[1] + " SOLO, " + tklLead[0].stats[3] + " TFL)";
	} catch (err) {
		tklLead = [];
		document.getElementById(tm.homeAway+"PassLd").innerHTML = "";
	}
	console.log(tklLead);
	for (var j = 1; j < 6; j++) {
		if (j < tklLead.length) {
			document.getElementById(tm.homeAway+"P"+(j)).innerHTML = "<span id=\""+tm.homeAway+"P"+(j)+"Num\" class=\""+tm.homeAway+"Num\"></span><span id=\""+tm.homeAway+"P"+(j)+"Pos\" class=\""+tm.homeAway+"Pos\"></span>"+"<img src=\""+nflHeadshot(tklLead[j].athlete.id)+"\" alt=\""+tklLead[j].athlete.lastName+"\"><br/>"+tklLead[j].athlete.displayName;
			document.getElementById(tm.homeAway+"P"+(j)).innerHTML+= "<br/>"+tklLead[j].stats[0] + " TKL " + tklLead[j].stats[1]+ " SOLO " + tklLead[j].stats[2] + " SACK " + tklLead[j].stats[3] + " TFL";
			document.getElementById(tm.homeAway+"P"+(j)+"Num").innerText = tklLead[j].athlete.jersey;
		} else {
			document.getElementById(tm.homeAway + "P"+j).innerHTML = "<img src=\"\">";
		}
	}
	var sackLead;
	try {
		sackLead = plyrBox.statistics[4].athletes.sort(function(a,b) {return b.stats[2] - a.stats[2];});
		document.getElementById(tm.homeAway+"RushLd").innerHTML = "Sack Leader<br/><img src=\""+nflHeadshot(sackLead[0].athlete.id)+"\"><br/>#"+sackLead[0].athlete.jersey + " " + sackLead[0].athlete.lastName + " ("+sackLead[0].stats[2] + " SACK, " + sackLead[0].stats[5] + " QB HITS, " + sackLead[0].stats[3] + " TFL)";
	} catch (err) {
		sackLead = [];
		document.getElementById(tm.homeAway+"RushLd").innerHTML = "";
	}
	var intLead;
	try {
		intLead = plyrBox.statistics[plyrBox.statistics.length - 5].athletes.sort(function(a,b) {return b.stats[0] - a.stats[0];});
		document.getElementById(tm.homeAway+"RecLd").innerHTML = "INT Leader<br/><img src=\""+nflHeadshot(intLead[0].athlete.id)+"\"><br/>#"+intLead[0].athlete.jersey + " " + intLead[0].athlete.lastName + " ("+intLead[0].stats[0] + " INT, " + intLead[0].stats[1] + " YDS, " + intLead[0].stats[2] + " TD)";
	} catch (err) {
		try {
			intLead = plyrBox.statistics[4].athletes.sort(function(a,b) {return b.stats[4] - a.stats[4];});
			document.getElementById(tm.homeAway+"RecLd").innerHTML = "PD Leader<br/><img src=\""+nflHeadshot(intLead[0].athlete.id)+"\"><br/>#"+intLead[0].athlete.jersey + " " + intLead[0].athlete.lastName + " ("+intLead[0].stats[4] + " PD, " + intLead[0].stats[0] + " TACK, 0 INT)";
		} catch (er) {
			intLead = [];
			document.getElementById(tm.homeAway+"RecLd").innerHTML = "";
		}
	}
		}
	// for (var j = 0; j < 3; j++) {
		// var ad = document.getElementById(tm.homeAway+leadOrd[j]+"Ld");
		// ad.innerHTML = lead.leaders[j].displayName + " Leader<br/>";
		// try {
			// ad.innerHTML+= "<img src=\"" + lead.leaders[j].leaders[0].athlete.headshot.href+"\"/><br/>";
		// } catch (err) {
		// }
		// try {
			// ad.innerHTML+= "#" + lead.leaders[j].leaders[0].athlete.jersey + " " + lead.leaders[j].leaders[0].athlete.shortName + " (" + lead.leaders[j].leaders[0].displayValue + ")";
			// ad.innerHTML+= ", " + 
		// } catch (err) {
			// ad.innerHTML += "None";
		// }
	// }
	document.getElementById(tm.homeAway+"Stat").innerHTML = "Penalties/Yards:<br/>"+game.boxscore.teams[0].team.abbreviation+": "+game.boxscore.teams[0].statistics[10].displayValue+"<br/>"+game.boxscore.teams[1].team.abbreviation+": "+game.boxscore.teams[1].statistics[10].displayValue;
	// });}
	}
	}
	var timeLeft = "";
	try {
		if (lastPlay.clock && lastPlay.clock.displayValue == "0:00") {
			timeLeft = "End " + lastPlay.period.number + "Q";
		} else if (lastPlay.clock) {
			timeLeft+= lastPlay.clock.displayValue + " Quarter " + lastPlay.period.number;
		}
	} catch (err) {
		timeLeft = game.header.competitions[0].status.type.detail;
	}
	var timeSpl = [timeLeft.substring(0,timeLeft.length/2),timeLeft.substring(timeLeft.length/2)];
	document.getElementById("awayDesc").innerText = timeSpl[0];
	document.getElementById("homeDesc").innerText = timeSpl[1];
	document.getElementById("scores").style.display = "none";
	document.getElementById("game").style.display="block";
}
function getMatchupData(match) {
	if (match.includes("RH")) {
		return "vr";
	} else {
		return "vl";
	}
}
function makeSplitsWork(data) {
	ret = new Object();
	for (var i = 0; i < data.length; i++) {
		if (data[i].type.displayName != "pitchArsenal" && data[i].type.displayName != "statSplits" && data[i].type.displayName != "statSplitsAdvanced") {
			ret[data[i].type.displayName] = data[i].splits[0].stat;
		} else if (data[i].type.displayName == "pitchArsenal") {
			ret[data[i].type.displayName] = data[i].splits;
		} else if (data[i].type.displayName == "statSplits" || data[i].type.displayName == "statSplitsAdvanced") {
			ret[data[i].type.displayName] = new Object();
			for (var j = 0; j < data[i].splits.length; j++) {
				ret[data[i].type.displayName][data[i].splits[j].split.code] = data[i].splits[j].stat;
			}
		}
	}
	return ret;
}
function getGameTime(dt) {
	var gTime = dt.substring(11).split(":");
	gTime[0] = (parseInt(gTime[0]) - timeOffset);
	if (gTime[0] < 0) {
		gTime[0] += 24;
	}
	if (gTime[0] < 12) {
		gTime[2] = " AM";
	} else {
		gTime[2] = " PM";
	}
	//return (gTime[0] % 12) + ":" + gTime[1] + gTime[2];
	var ret = new Date(dt).toLocaleTimeString();
	return ret.replaceAll(":00 "," ");
}
async function getData(url) {
	var ret;
	var jso = await fetch(url);
	ret = await jso.json();
	return ret;
}

function hideModal(code) {
	document.getElementById("popUp").style.display = "none";
	hideCode = code;
}
function splitInHalf(string) {
	var spl = [];
	spl.push(string.substring(0,Math.round(string.length/2)));
	spl.push(string.substring(Math.round(string.length/2)));
	return spl;
}
function delayTime() {
	document.getElementById("delaySec").innerText = document.getElementById("offset").value + "s";
}
function showSett() {
	document.getElementById("sett").style.display = "block";
}
function closeSett() {
	document.getElementById("sett").style.display = "none";
}
function nflHeadshot(id) {
	return "https://a.espncdn.com/i/headshots/college-football/players/full/"+id+".png";
}