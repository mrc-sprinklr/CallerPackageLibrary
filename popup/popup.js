const { Wrapper } = require("./wrapper");
import { MESSAGE_TYPE, AGENT_TYPE } from "../static/enums";
import { CLIENT_POPUP_CHANNEL } from "../static/constants";
const EMPTY_CALL_OBJECT = {
    sender: "",
    receiver: "",
    startTime: "",
    endTime: "",
    hold: false,
    mute: false,
};
class Popup {
    constructor(config) {
        console.log("PopUp Instance Created");
        this.callActive = false;
        this.channel = new BroadcastChannel(CLIENT_POPUP_CHANNEL);
        this.channel.onmessage = (messageEvent) => {
            this.receiveEngine(messageEvent.data);
        };
        this.callObject = EMPTY_CALL_OBJECT;
        this.JsSIP_Wrapper = new Wrapper(config);
    }
    connect(callback) {
        this.JsSIP_Wrapper.connect(callback);
    }
    sendEngine(message) {
        this.channel.postMessage(message);
    }
    resetCallObject() {
        this.setCallObject(EMPTY_CALL_OBJECT);
    }
    setCallObject(callObject) {
        if (callObject.sender) {
            this.callObject.sender = callObject.sender;
        }
        if (callObject.receiver) {
            this.callObject.receiver = callObject.receiver;
        }
        if (callObject.startTime) {
            this.callObject.startTime = callObject.startTime;
        }
        if (callObject.endTime) {
            this.callObject.endTime = callObject.endTime;
        }
        if (callObject.hold) {
            this.callObject.hold = callObject.hold;
        }
        if (callObject.mute) {
            this.callObject.mute = callObject.mute;
        }
    }
    handleOutgoingCallStart(callObject) {
        console.log("HandleOutgoingCallStart");
        this.sendEngine({
            to: AGENT_TYPE.WRAPPER,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.REQUEST_OUTGOING_CALL_START,
            object: { receiver: callObject.receiver, sender: null, startTime: null, endTime: null, hold: null, mute: null },
        });
    }
    handleOutgoingCallEnd() {
        console.log("handleOutgoingCallEnd");
        this.sendEngine({
            to: AGENT_TYPE.WRAPPER,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.REQUEST_OUTGOING_CALL_END,
            object: EMPTY_CALL_OBJECT,
        });
    }
    handleCallHold() {
        console.log("handleCallHold");
        this.sendEngine({
            to: AGENT_TYPE.WRAPPER,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.REQUEST_CALL_HOLD,
            object: EMPTY_CALL_OBJECT,
        });
    }
    handleCallUnhold() {
        console.log("handleCallUnhold");
        this.sendEngine({
            to: AGENT_TYPE.WRAPPER,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.REQUEST_CALL_UNHOLD,
            object: EMPTY_CALL_OBJECT,
        });
    }
    handleCallMute() {
        console.log("handleCallMute");
        this.sendEngine({
            to: AGENT_TYPE.WRAPPER,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.REQUEST_CALL_MUTE,
            object: EMPTY_CALL_OBJECT,
        });
    }
    handleCallUnmute() {
        console.log("handleCallUnmute");
        this.sendEngine({
            to: AGENT_TYPE.WRAPPER,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.REQUEST_CALL_UNMUTE,
            object: EMPTY_CALL_OBJECT,
        });
    }
    handleSessionDetails() {
        console.log("handleSessionDetails");
        this.sendEngine({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_SESSION_DETAILS,
            object: this.callObject,
        });
    }
    receiveEngine(message) {
        if (message.to == AGENT_TYPE.POPUP) {
            console.log("Recieved:", message);
            if (message.type == MESSAGE_TYPE.REQUEST_OUTGOING_CALL_START) {
                this.handleOutgoingCallStart(message.object);
            }
            else if (message.type == MESSAGE_TYPE.REQUEST_OUTGOING_CALL_END) {
                this.handleOutgoingCallEnd();
            }
            else if (message.type == MESSAGE_TYPE.REQUEST_CALL_HOLD) {
                this.handleCallHold();
            }
            else if (message.type == MESSAGE_TYPE.REQUEST_CALL_UNHOLD) {
                this.handleCallUnhold();
            }
            else if (message.type == MESSAGE_TYPE.REQUEST_CALL_MUTE) {
                this.handleCallMute();
            }
            else if (message.type == MESSAGE_TYPE.REQUEST_CALL_UNMUTE) {
                this.handleCallUnmute();
            }
            else if (message.type == MESSAGE_TYPE.REQUEST_SESSION_DETAILS) {
                this.handleSessionDetails();
            }
            else {
                console.log("UNKNOWN TYPE: ", message);
            }
        }
    }
}
module.exports = { Popup: Popup };
