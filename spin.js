var participants;
// Total number of pixels scrolled
var t;
// Current speed
var v;
// Total number of participants to scroll
var max;
// Time of last update
var lastTime;

// Height of spin window
var sheight = 200;
// Height of one entry = height + padding + border
var pheight = 26;

// Starting speed
var startingV = 0.4;
// Deceleration
var a = 0.0001;
// Deceleration will kick in when there are this many lines left to scroll
var slowafter = 33;
// Speed cannot fall below this value
var minv = 0.1;

function compare(a, b) {
  if (a == b) {
    return 0;
  } else if (a < b) {
    return -1;
  } else {
    return 1;
  }
}

function nameIdComparator(a, b) {
  var c = compare(a.person.displayName, b.person.displayName);
  if (c == 0) {
    return compare(a.id, b.id);
  } else {
    return c;
  }
}

function drawParticipants() {
  participants = gapi.hangout.getParticipants();
  participants.sort(nameIdComparator);
  
  var container = $('.container');
  container.html('');

  var reps = 1 + Math.ceil(sheight / (participants.length * pheight));
  for (var i = 0; i < reps; i++) {
    for (var j = 0; j < participants.length; j++) {
      var person = participants[j].person;
      var displayName = person != null ? person.displayName : 'Unknown';
      var p = $('<div class="participant">' + displayName + '</div>');
      container.append(p);
    }
  }
}

function go(participantId) {
  var participant = gapi.hangout.getParticipantById(participantId);
  max = 40 + participants.indexOf(participant);
  t = 0;
  v = startingV;
  lastTime = null;
  setTimeout(run, 1);
}

function run() {
  var time = new Date().getTime();
  if (lastTime == null) {
    lastTime = time - 1;
  }
  var dt = time - lastTime;
  lastTime = time;

  var top = t % (pheight * participants.length) - pheight * participants.length;
  $('.container').css('top', top + 'px');

  var remaining = max - Math.floor(t / pheight);

  var delta = v * dt;
  if (remaining > 0) {
    t += delta;
    setTimeout(run, 10);
  } else {
    gapi.hangout.data.setValue('spinning', '');
  }

  if (remaining < slowafter) {
    v -= a * dt;
  }
  if (v < minv) {
    v = minv;
  }
}

var spinning = '';
gapi.hangout.data.onStateChanged.add(function(event) {
  if (event.state.spinning == null) {
    return;
  }
  if (spinning != event.state.spinning) {
    spinning = event.state.spinning;
    console.log('spinning = ' + spinning);
    if (spinning != '') {
      drawParticipants();
      go(spinning);
    } else {
      console.log('done');
    }
  }
});

function onSpin() {
  var participants = gapi.hangout.getParticipants();
  var selected = Math.floor(Math.random() * participants.length);
  gapi.hangout.data.setValue('spinning', participants[selected].id);
}

function init() {
  // When API is ready...                                                         
  gapi.hangout.onApiReady.add(function(event) {
    if (event.isApiReady) {
      drawParticipants();
    }
  });
}

// Wait for gadget to load.
gadgets.util.registerOnLoadHandler(init);
