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

// Pixel offset to make the active row line up with the centre line
var activeOffset = 10;

// Sounds to play when spin is initiated and when it finishes
var startSound, endSound;

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

function onMouseDown() {
  $(this).css('background-position-x', '-242px');
  if (spinning == null) {
    $(this).off('mousedown');
    onSpin();
  }
}

function setup() {
  var machine = $('.machine');
  machine.mousedown(onMouseDown);
  machine.mouseup(function() {
    $(this).delay(200).animate({'background-position-x': 0}, 0);
  });
  drawParticipants();
}

function drawParticipants(state) {
  if (state == null) {
    state = gapi.hangout.data.getState();
  }
  participants = gapi.hangout.getParticipants();
  participants.sort(nameIdComparator);
  
  var container = $('.container');
  container.html('');

  var reps = 1 + Math.ceil(sheight / (participants.length * pheight));
  for (var i = 0; i < reps; i++) {
    for (var j = 0; j < participants.length; j++) {
      var cls = 'participant';
      if (state[participants[j].id] == 'spun') {
        cls += ' spun';
      }
      var p = $('<div class="' + cls + '">' + nameOf(participants[j]) + '</div>');
      container.append(p);
    }
  }
  container.css('top', - pheight * participants.length + activeOffset + 'px');
}

function go(participantId) {
  var participant = gapi.hangout.getParticipantById(participantId);
  var i = participants.indexOf(participant);
  max = Math.ceil(40 / participants.length) * participants.length - i + 1;
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

  var top = t % (pheight * participants.length) - pheight * participants.length + activeOffset;
  $('.container').css('top', top + 'px');

  var remaining = max - Math.floor(t / pheight);

  var delta = v * dt;
  if (remaining > 0) {
    t += delta;
    setTimeout(run, 10);
  } else {
    console.log('finished');
    var delta = {'spinning': ''};
    if (spinning) {
      delta[spinning] = 'spun';
    }
    gapi.hangout.data.submitDelta(delta);
  }

  if (remaining < slowafter) {
    v -= a * dt;
  }
  if (v < minv) {
    v = minv;
  }
}

// If set, the machine is spinning and will end on the participant with this id
var spinning = null;
// If set, the machine has recently spun and ended on the participant with this id
var activeSpeaker = null;

function onStateChanged(event) {
  if (event.state.spinning == '') {
    if (spinning) {
      // A spin has just ended.
      endSound.play({loop: false, global: false});

      // The participant with id stored in spinning was just selected - show them as the active speaker
      gapi.hangout.av.setAvatar(spinning, 'https://hangout-for-teams.googlecode.com/git/active.png');
      activeSpeaker = spinning;
    }
    // Re-enable the spin button
    spinning = null;
    $('.machine').mousedown(onMouseDown);
    console.log('reset');
  } else if (event.state.spinning) {
    if (spinning) {
      // Ignore new spin events if there is already one active - this avoids the problem where several
      // people click to spin at the same time.
      return;
    }
    // A spin has just begun.
    startSound.play({loop: false, global: false});

    if (activeSpeaker) {
      // The participant with id stored in activeSpeaker has now finished speaking - show them as a 'previous' speaker
      gapi.hangout.av.setAvatar(activeSpeaker, 'https://hangout-for-teams.googlecode.com/git/previous.png');
      activeSpeaker = null;
    }

    // Disable the spin button
    $(this).off('mousedown');
    spinning = event.state.spinning;
    console.log('spinning = ' + spinning);
    drawParticipants(event.state);
    // Start the animation
    go(spinning);
  }
}

function onSpin() {
  var participants = gapi.hangout.getParticipants();
  var state = gapi.hangout.data.getState();
  var eligible = [];
  for (var i = 0; i < participants.length; i++) {
    var participant = participants[i];
    if (state[participant.id] != 'spun') {
      eligible.push(participant);
    }
  }
  if (eligible.length == 0) {
    console.log('no eligible participants');
    $('.machine').mousedown(onMouseDown);
  } else {
    var selected = Math.floor(Math.random() * eligible.length);
    console.log('selected ' + nameOf(eligible[selected]));
    gapi.hangout.data.setValue('spinning', eligible[selected].id);
  }
}

function nameOf(participant) {
  if (participant.person) {
    var id = String(participant.person.id);
    return participant.person.displayName + ' ' + id.substring(id.length - 3);
  } else {
    id = participant.id;
    return 'Unknown ' + id.substring(id.length - 3);
  }
}

var init2 = _.after(2, function() {
  setup();
  gapi.hangout.data.onStateChanged.add(onStateChanged);
  gapi.hangout.onParticipantsChanged.add(drawParticipants);
});

function init() {
  // When API is ready...                                                         
  gapi.hangout.onApiReady.add(function(event) {
    if (event.isApiReady) {
      var startAudio = gapi.hangout.av.effects.createAudioResource(
        'https://rawgithub.com/octachrome/hangout-for-teams/master/ker-ching.wav');
      startAudio.onLoad.add(function(event) {
        if (event.isLoaded) {
          startSound = startAudio.createSound();
          init2();
        }
      });
      var endAudio = gapi.hangout.av.effects.createAudioResource(
        'https://rawgithub.com/octachrome/hangout-for-teams/master/bell.wav');
      endAudio.onLoad.add(function(event) {
        if (event.isLoaded) {
          endSound = endAudio.createSound();
          init2();
        }
      });
    }
  });
}

// Wait for gadget to load.
gadgets.util.registerOnLoadHandler(init);

console.log('loaded spin.js');
