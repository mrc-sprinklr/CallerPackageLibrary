#  CallerPackage

Caller Package is used to handle cross window calling service , using JsSIP. This library moved the intra-window calling logic to a popup window.
This makes the state of popup window independent of state of parent window , overall mitigating the issues caused by this previously like refresh causing call end, etc.

##  Requirements

* JsSIP : https://www.npmjs.com/package/jssip
```
$ npm install --save jssip
```
* path : https://www.npmjs.com/package/path
```
$ npm install --save path
```
</br>

##  Installation
npm : https://www.npmjs.com/package/callerpackage-sprinklr
```
$ npm i callerpackage-sprinklr
```
##  Getting Started

After installation on package, create a instance of it.
```
const callerPackage = new CallerPackage();
```
Then call callerPackage.connect with params as config and a callback function.
```
callerPackage.connect({
		sip:,
		password: ,
		server_address:,
		port: ,
	},
	callback()
);
```
After this popup window will be created, if its not already active.

<div align="center" style="display:flex; flex-direction:row;justify-content:center; gap:20px;">

<img src="https://raw.githubusercontent.com/divyatez-sprinklr/CallerPackage/main/readme_media/connecting.png" height="300">

<img src="https://raw.githubusercontent.com/divyatez-sprinklr/CallerPackage/main/readme_media/connected.png" height="300">

</div>

---
##  Events
Syntax for all events is as follow.
```
callerPackage.on(event,callback);
```

####  Example
```
callerPackage.on('INFORM_SOCKET_CONNECTED',()=>{
console.log('Socket is connected');

});

```

###  INFORM_SOCKET_CONNECTED

Fired when socket is connected in popup window.

###  INFORM_SOCKET_DISCONNECTED

Fired when socket is disconnected in popup window.

###  ACK_OUTGOING_CALL_START

Fired when outgoing call is connected.

###  ACK_OUTGOING_CALL_END

Fired when outgoing call is ended.

###  ACK_OUTGOING_CALL_FAIL

Fired when outgoing call is failed.

###  ACK_CALL_HOLD

Fired when call is put on hold.

###  ACK_CALL_UNHOLD

Fired when call is put on unhold.

###  ACK_CALL_MUTE

Fired when call is put on mute.

###  ACK_CALL_UNMUTE

Fired when call is put on unmute.

###  ACK_SESSION_DETAILS

Fired when session details is recieved.

####  Example
```
callerPackage.on('ACK_SESSION_DETAILS',()=>{
	let sessionDetails = callerPackage.getCallObject();
	console.log(sessionDetails);
});
```


##  Methods

###  connect()

This method is used to connect to popup.

If popup is already active it will connect to that, otherwise it will start a new popup window.

#####  Arguments
- config = {
			sip:,
			password: ,
			server_address:,
			port: ,
	},
- callback function

#####  Example:

```

callerPackage.connect({
		sip: 1000,
		password: 2000_pass ,
		server_address: 117.220.120.39,
		port: 7443/ws,
	},() => {
updateSocketConnectedInUI();
});

```
---

###  call()

This method is called to invoke call procedure.

#####  Arguments

- number

#####  Example:
```
// Request to start call
callerPackage.call('9838949386****');

// Confirmation on call established
callerPackage.on("ACK_OUTGOING_CALL_START", () => {
	updateConfirmCallUI();
});

// Confirmation on session fail
callerPackage.on("ACK_OUTGOING_CALL_FAIL", () => {
	updateSessionFailUI();
});
```
---

###  terminate()

This method is called to end call.
```
// Request to terminate call
callerPackage.terminate();

// Confirmation on call termination
callerPackage.on("ACK_OUTGOING_CALL_END", () => {
	updateCallEndUI();
});
```
---

###  hold()

This method is called to hold ongoing call.
```
// Request to hold call
callerPackage.hold();

// Confirmation on call hold
callerPackage.on("ACK_CALL_HOLD", () => {
	updateCallHoldUI();
});
```
---
###  unhold()

This method is called to unhold ongoing call.
```
// Request to unhold call
callerPackage.unhold();

// Confirmation on call unhold
callerPackage.on("ACK_CALL_UNHOLD", () => {
	updateCallUnholdUI();
});
```
---
###  mute()
This method is called to mute ongoing call.
```
// Request to mute call
callerPackage.mute();

// Confirmation on call mute
callerPackage.on("ACK_CALL_MUTE", () => {
	updateCallMuteUI();
});
```
---
###  unmute()
This method is called to unmute ongoing call.
```
// Request to unmute call
callerPackage.unmute();

// Confirmation on call unmute
callerPackage.on("ACK_CALL_UNMUTE", () => {
	updateCallUnmuteUI();
});
```

</br>
