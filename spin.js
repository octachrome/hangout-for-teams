var spinning;
gapi.hangout.data.onStateChanged.add(function(event) {
  if (spinning != event.state.spinning) {
    spinning = event.state.spinning;
    if (spinning != null) {
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
  gapi.hangout.data.setValue('spinning', selected);
}

function disableButton() {
  $('spinButton').attr('disabled', 'disabled');
}

function enableButton() {
  console.log('enableButton');
  $('spinButton').removeAttr('disabled');
}

function startSpinning(spinning) {
  var participants = gapi.hangout.getParticipants();
  var participant = participants[spinning];
  gapi.hangout.av.setAvatar(participant.id, 'http://4.bp.blogspot.com/_t4ycBBIANiM/SszTB6CmZRI/AAAAAAAACf0/2KFiYY7FydU/s1600/HGG_koi-fishframe.png');
}

function init() {
  // When API is ready...                                                         
  gapi.hangout.onApiReady.add(function(event) {
    console.log('onApiReady');
    if (event.isApiReady) {
      enableButton();
    }
  });
}

// Wait for gadget to load.                                                       
gadgets.util.registerOnLoadHandler(init);
console.log('here');