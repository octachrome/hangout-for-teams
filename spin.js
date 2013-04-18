var spinIndex;
var spinningOverlay;

function onSpin() {
  var limit = 20;
  var counter = 0;
  gapi.hangout.data.submitDelta({
    limit: String(limit),
    counter: String(counter)
  });
}

function onStateChanged(event) {
  if (event.state.counter == null) {
    return;
  }
  calculateSpinIndex();
  console.log('spinIndex = ' + spinIndex);
  var totalParticipants = gapi.hangout.getParticipants().length;
  var counter = parseInt(event.state.counter);
  var limit = parseInt(event.state.limit);
  if (counter % totalParticipants == spinIndex) {
    spinningOverlay.setVisible(true);
    if (counter < limit) {
      setTimeout(function() {
        console.log('showing');
        gapi.hangout.data.setValue('counter', String(counter + 1));
      }, 50);
    }
  } else {
   console.log('hiding');
   spinningOverlay.setVisible(false);
  }
}

function calculateSpinIndex() {
  var participants = gapi.hangout.getParticipants();
  var ids = [];
  for (var i = 0; i < participants.length; i++) {
    ids[ids.length] = participants[i].id;
  }
  ids.sort();
  spinIndex = ids.indexOf(gapi.hangout.getLocalParticipantId());
}

function disableButton() {
  $('#spinButton').attr('disabled', 'disabled');
}

function enableButton() {
  $('#spinButton').removeAttr('disabled');
}

var counter = 0;
var limit = 0;

function startSpinning(spinning) {
  cacheActiveParticipants();
  var targetIndex = active.indexOf(spinning);
  // TODO: adjust # cycles to give a limit of around 20
  limit = targetIndex + active.length * 4;
  counter = 0;
  updateSpin();
}

function updateSpin() {
  if (counter > 0) {
    var prev = (counter - 1) % active.length;
    gapi.hangout.av.setAvatar(active[prev], 'https://upload.wikimedia.org/wikipedia/commons/5/59/Empty.png');
  }

  var idx = counter % active.length;
  if (counter < limit) {
    console.log('Activating ' + active[idx]);
    gapi.hangout.av.setAvatar(active[idx], 'https://hangout-for-teams.googlecode.com/git/spinning.png');
    setTimeout(updateSpin, 100*(limit-counter+5)/(limit-counter+1));
    counter++;
  } else {
    gapi.hangout.av.setAvatar(active[idx], 'https://hangout-for-teams.googlecode.com/git/active.png');
    gapi.hangout.data.setValue('spinning', '');
  }
}

function init() {
  // When API is ready...                                                         
  gapi.hangout.onApiReady.add(function(event) {
    if (event.isApiReady) {
      var spinningImage = gapi.hangout.av.effects.createImageResource(
        'https://hangout-for-teams.googlecode.com/git/spinning.png');
      spinningImage.onLoad.add(function(event) {
        if (event.isLoaded) {
          spinningOverlay = spinningImage.createOverlay();
          gapi.hangout.data.onStateChanged.add(onStateChanged);
          enableButton();
        }
      });
    }
  });
}

// Wait for gadget to load.
gadgets.util.registerOnLoadHandler(init);
