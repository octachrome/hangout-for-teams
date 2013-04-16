var spinning = '';
gapi.hangout.data.onStateChanged.add(function(event) {
  if (event.state.spinning == null) {
    return;
  }
  if (spinning != event.state.spinning) {
    spinning = event.state.spinning;
    console.log('spinning = ' + spinning);
    if (spinning != '') {
      disableButton();
      startSpinning(spinning);
    } else {
      enableButton();
    }
  }
});

function onSpin() {
  var participants = gapi.hangout.getParticipants();
  var selected = Math.floor(Math.random() * participants.length);
  gapi.hangout.data.setValue('spinning', participants[selected].id);
}

function disableButton() {
  $('#spinButton').attr('disabled', 'disabled');
}

function enableButton() {
  $('#spinButton').removeAttr('disabled');
}

var active = [];

function cacheActiveParticipants() {
  active = [];
  var participants = gapi.hangout.getParticipants();
  participants.sort(function(a, b)) {
    return a.displayIndex - b.displayIndex;
  });
  for (var i = 0; i < participants.length; i++) {
    active.push(participants[i].id);
  }
}

var counter = 0;
var limit = 0;

function startSpinning(spinning) {
  cacheActiveParticipants();
  var targetIndex = participants.indexOf(spinning);
  // TODO: adjust # cycles to give a limit of around 20
  limit = targetIndex + participants.length * 4;
  counter = 0;
  updateSpin();
}

function updateSpin() {
  if (counter > 0) {
    var prev = (counter - 1) % active.length;
    gapi.hangout.av.clearAvatar(active[prev]);
  }

  var idx = counter % active.length;
  if (counter < limit) {
    gapi.hangout.av.setAvatar(active[idx], 'https://hangout-for-teams.googlecode.com/git/spinning.png');
    setTimeout(updateSpin, 100*(limit-counter+5)/(limit-counter+1));
  } else {
    gapi.hangout.av.setAvatar(active[idx], 'https://hangout-for-teams.googlecode.com/git/active.png');
    gapi.hangout.data.setValue('spinning', '');
  }
}

function init() {
  // When API is ready...                                                         
  gapi.hangout.onApiReady.add(function(event) {
    if (event.isApiReady) {
      enableButton();
    }
  });
}

// Wait for gadget to load.
gadgets.util.registerOnLoadHandler(init);
