# todo

openNewPopup


# CallerPackage

Caller Package is used to handle cross window calling service , using JsSIP.
This library moved the intra-window calling logic to a popup window.
This makes the state of popup window independent of state of parent window , overall mitigating the issues caused by this previously like refresh causing call end, etc. 

<div style='height:.5px;background-color: #d3d3d3'></div>

## Requirements 

* JsSIP : https://www.npmjs.com/package/jssip
    ```
        $ npm install jssip
    ```

* path : https://www.npmjs.com/package/path
    ```
        $ npm install --save path
    ```

<div style='height:.5px;background-color: #d3d3d3'></div>
</br>

## Installation

</br>
</br>


## Configuration
> Add Config details in popup.html manually or through running.

</br>

## Getting Started
```
const callerPackage = new CallerPackage();

```
In popup.html , add config using  input , or hardcode the config.


## Attributes 
This is needed to be configured in popup side.

### config
```
{
	sip: , 
    password: , 
    server_address: , 
    port: 
}
```
#### Example:

```
{
	sip: sample1234, 
    password: samplePassword, 
    server_address: 12.34.56.78, 
    port: 7654/ws
}
```
<div align="center" style="display:flex; flex-direction:row;justify-content:center; gap:20px;">
<img src="https://raw.githubusercontent.com/divyatez-sprinklr/CallerPackage/main/readme_media/popup.png" height="300">
<img src="https://raw.githubusercontent.com/divyatez-sprinklr/CallerPackage/main/readme_media/connecting.png" height="300">
<img src="https://raw.githubusercontent.com/divyatez-sprinklr/CallerPackage/main/readme_media/connected.png" height="300">
</div>


## Methods

###  connect()
This method is used to connect to popup.
If popup is already active it will connect to that, otherwise it will start a new popup window.
##### Arguments
- callback function
##### Example:

```
callerPackage.connect(() => {
    updateSocketConnectedInUI();
});
```
---

### call()
This method is called to invoke call procedure.
##### Arguments
- number 
##### Example:

```
callerPackage.call('9838949386****');
```

---

### endOut()
This method is called to end outgoing call.
```
callerPackage.endOut();
```
---

### endIn()
This method is called to end incoming call.
```
callerPackage.endOut();
```

---

### hold()
This method is called to hold ongoing call.
```
callerPackage.hold();
```

---

### unhold()
This method is called to unhold ongoing call.
```
callerPackage.unhold();
```

---

### mute()
This method is called to mute ongoing call.
```
callerPackage.mute();
```

---

### unmute()
This method is called to unmute ongoing call.
```
callerPackage.unmute();
```

---


## Events
Syntax for all events is as follow.
```
callerPackage.on(event,callback);
```
#### Example
```
callerPackage.on('INFORM_SOCKET_CONNECTED',()=>{
    console.log('Socket is connected');
});
```

### INFORM_SOCKET_CONNECTED
    Fired when socket is connected in popup window.
### INFORM_SOCKET_DISCONNECTED
    Fired when socket is disconnected in popup window.
### ACK_OUTGOING_CALL_START
    Fired when outgoing call is connected.
### ACK_OUTGOING_CALL_END
    Fired when outgoing call is ended.
### ACK_OUTGOING_CALL_FAIL
    Fired when outgoing call is failed.
### ACK_CALL_HOLD
    Fired when call is put on hold.
### ACK_CALL_UNHOLD
    Fired when call is put on unhold.
### ACK_CALL_MUTE
    Fired when call is put on mute.
### ACK_CALL_UNMUTE
    Fired when call is put on unmute.
### ACK_SESSION_DETAILS
    Fired when session details is recieved.
#### Example
```
callerPackage.on('ACK_SESSION_DETAILS',()=>{
        console.log('Session details fetched from popup');
        let sessionDetails = callerPackage.getCallObject();
        console.log(sessionDetails);
});
```
</br>