const EventEmitter = require("events");
const path = require("path");
import { MESSAGE_TYPE, AGENT_TYPE } from "./static/enums";
import { IS_POPUP_ACTIVE, CLIENT_POPUP_CHANNEL, CONFIG_CHANNEL, PING_INTERVAL_MS, POPUP_WINDOW_LEFT, POPUP_WINDOW_TOP, POPUP_WINDOW_WIDTH, POPUP_WINDOW_HEIGHT } from "./static/constants";
const EMPTY_CALL_OBJECT = {
    sender: "",
    receiver: "",
    startTime: "",
    endTime: "",
    hold: false,
    mute: false,
};
class CallerPackage {
    constructor() {
        this.#callActive = false;
        this.#eventEmitter = new EventEmitter();
        this.#channel = new BroadcastChannel(CLIENT_POPUP_CHANNEL);
        this.#channel.onmessage = (messageEvent) => {
            this.#receiveEngine(messageEvent.data);
        };
        this.#config_channel = new BroadcastChannel(CONFIG_CHANNEL);
        this.#callObject = {
            sender: "",
            receiver: "",
            startTime: "",
            endTime: "",
            hold: false,
            mute: false,
        };
        this.#popupWindow = null;
        setInterval(() => {
            if (this.#popupWindow) {
                // console.log(this.#popupWindow.name);
                if (this.#popupWindow.name === null || this.#popupWindow.name === "")
                    this.#eventEmitter.emit(MESSAGE_TYPE.INFORM_SOCKET_DISCONNECTED);
            }
        }, PING_INTERVAL_MS);
        this.#sendEngine({
            to: AGENT_TYPE.WRAPPER,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_SESSION_DETAILS,
            object: EMPTY_CALL_OBJECT,
        });
    }
    #callActive;
    #eventEmitter;
    #channel;
    #config_channel;
    #callObject;
    #popupWindow;
    #resetCallObject() {
        this.#setCallObject({
            sender: "",
            receiver: "",
            startTime: "",
            endTime: "",
            hold: false,
            mute: false,
        });
    }
    /**
     * This returns the private call object variable.
     * @returns object
     */
    getCallObject() {
        return this.#callObject;
    }
    /**
     * This function handles recieved messege and directs the logic.
     * @param {object} message
     */
    #receiveEngine(message) {
        if (message.to == "PARENT") {
            console.log(message);
            if (message.type == MESSAGE_TYPE.INFORM_SOCKET_CONNECTED) {
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.INFORM_SOCKET_DISCONNECTED) {
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.ACK_OUTGOING_CALL_START) {
                this.#setCallObject({
                    startTime: message.object.startTime,
                    endTime: null,
                    hold: null,
                    mute: null,
                    sender: message.object.sender,
                    receiver: message.object.receiver,
                });
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.ACK_OUTGOING_CALL_END) {
                this.#setCallObject({
                    hold: false,
                    mute: false,
                    endTime: message.object.endTime,
                    startTime: null,
                    sender: null,
                    receiver: null,
                });
                this.#setCallActive(false);
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.ACK_OUTGOING_CALL_FAIL) {
                this.#setCallObject({
                    hold: false,
                    mute: false,
                    startTime: "-|-",
                    endTime: "-|-",
                    sender: null,
                    receiver: null,
                });
                this.#setCallActive(false);
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.ACK_CALL_HOLD) {
                this.#setCallObject({ hold: true, mute: null, startTime: null, endTime: null, sender: null, receiver: null });
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.ACK_CALL_UNHOLD) {
                this.#setCallObject({ hold: false, mute: null, startTime: null, endTime: null, sender: null, receiver: null });
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.ACK_CALL_MUTE) {
                this.#setCallObject({ mute: true, hold: null, startTime: null, endTime: null, sender: null, receiver: null });
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.ACK_CALL_UNMUTE) {
                this.#setCallObject({ mute: false, hold: null, startTime: null, endTime: null, sender: null, receiver: null });
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.POPUP_CLOSED) {
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.PING_SESSION_DETAILS) {
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.PING_POPUP_ALIVE) {
                this.#eventEmitter.emit(message.type);
            }
            else if (message.type == MESSAGE_TYPE.ACK_SESSION_DETAILS) {
                this.#setCallObject(message.object);
                if (this.#callObject.startTime == "") {
                    this.#setCallActive(false);
                }
                else if (this.#callObject.endTime == "") {
                    this.#setCallActive(true);
                }
                this.#eventEmitter.emit(message.type);
            }
            else {
                console.log("UNKNOWN TYPE: ", message);
                this.#eventEmitter.emit(message.type);
            }
        }
    }
    /**
     * This function helps setup eventlistener on #eventEmitter.
     * @param {string} event
     * @param {function} callback
     */
    on(event, callback) {
        this.#eventEmitter.on(event, () => {
            callback();
        });
    }
    /**
     * This function sets #callActive variable.
     * @param {boolean} ifActive
     */
    #setCallActive(ifActive) {
        this.#callActive = ifActive;
    }
    /**
     * This function handle send request from Parent to Popup.
     * @param {object} message
     */
    #sendEngine(message) {
        console.log("Sending : " + message.type);
        if (message.type == MESSAGE_TYPE.REQUEST_OUTGOING_CALL_START) {
            if (this.#callActive == true) {
                console.log("Call Already Active");
            }
            else {
                this.#setCallActive(true);
                this.#postHandler(message);
            }
        }
        else if (message.type == MESSAGE_TYPE.REQUEST_OUTGOING_CALL_END) {
            this.#postHandler(message);
        }
        else if (message.type == MESSAGE_TYPE.REQUEST_CALL_HOLD) {
            this.#postHandler(message);
        }
        else if (message.type == MESSAGE_TYPE.REQUEST_CALL_UNHOLD) {
            this.#postHandler(message);
        }
        else if (message.type == MESSAGE_TYPE.REQUEST_CALL_MUTE) {
            this.#postHandler(message);
        }
        else if (message.type == MESSAGE_TYPE.REQUEST_CALL_UNMUTE) {
            this.#postHandler(message);
        }
        else if (message.type == MESSAGE_TYPE.REQUEST_SESSION_DETAILS) {
            this.#postHandler(message);
        }
    }
    /**
     * This function posts message in broadcast #channel.
     * @param {object} message
     */
    #postHandler(message) {
        this.#channel.postMessage(message);
    }
    #openNewPopup(popup_path, config) {
        if (this.#popupWindow)
            this.#popupWindow.close();
        this.#popupWindow = window.open(popup_path, "connection", `left=${POPUP_WINDOW_LEFT}, top=${POPUP_WINDOW_TOP}, width=${POPUP_WINDOW_WIDTH}, height=${POPUP_WINDOW_HEIGHT}`);
        setTimeout(() => {
            this.#config_channel.postMessage(config);
        }, 1000);
    }
    /**
     * This function :
     *     1) If popup is already active, gets details from them.
     *     2) If popup is not active, then it creates a new popup.
     * @param {function} callback
     */
    connect(config, callback) {
        if (localStorage.getItem(IS_POPUP_ACTIVE) === null) {
            const popup_path = path.parse(__filename).dir + "/popup/popup.html";
            console.log("popup path: " + popup_path);
            this.#openNewPopup(popup_path, config);
        }
        else {
            console.log("Session details request");
            this.#sendEngine({
                to: AGENT_TYPE.WRAPPER,
                from: AGENT_TYPE.PARENT,
                type: MESSAGE_TYPE.REQUEST_SESSION_DETAILS,
                object: EMPTY_CALL_OBJECT,
            });
        }
        callback();
    }
    /**
     * This function sets the local call object.
     * @param {object} #callObject
     */
    #setCallObject(callObject) {
        if (callObject.sender) {
            this.#callObject.sender = callObject.sender;
        }
        if (callObject.receiver) {
            this.#callObject.receiver = callObject.receiver;
        }
        if (callObject.startTime) {
            this.#callObject.startTime = callObject.startTime;
        }
        if (callObject.endTime) {
            this.#callObject.endTime = callObject.endTime;
        }
        if (callObject.hold) {
            this.#callObject.hold = callObject.hold;
        }
        if (callObject.mute) {
            this.#callObject.mute = callObject.mute;
        }
    }
    /**
     * This function sends the request to popup to start an outgoing call.
     * @param {string} receiver
     */
    call(receiver) {
        this.#resetCallObject();
        this.#setCallObject({ sender: null, receiver: receiver, hold: null, mute: null, startTime: null, endTime: null });
        this.#sendEngine({
            to: AGENT_TYPE.POPUP,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_OUTGOING_CALL_START,
            object: this.#callObject,
        });
    }
    /**
     * Requests popup to end the current outgoing call.
     */
    terminate() {
        this.#sendEngine({
            to: AGENT_TYPE.POPUP,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_OUTGOING_CALL_END,
            object: EMPTY_CALL_OBJECT,
        });
    }
    /**
     * This function sends the request to popup to put on hold.
     */
    hold() {
        this.#sendEngine({
            to: AGENT_TYPE.POPUP,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_CALL_HOLD,
            object: EMPTY_CALL_OBJECT,
        });
    }
    /**
     * This function sends the request to popup to put on unhold.
     */
    unhold() {
        this.#sendEngine({
            to: AGENT_TYPE.POPUP,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_CALL_UNHOLD,
            object: EMPTY_CALL_OBJECT,
        });
    }
    /**
     * This function sends the request to popup to put on mute.
     */
    mute() {
        this.#sendEngine({
            to: AGENT_TYPE.POPUP,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_CALL_MUTE,
            object: EMPTY_CALL_OBJECT,
        });
    }
    /**
     * This function sends the request to popup to put on unmute.
     */
    unmute() {
        this.#sendEngine({
            to: AGENT_TYPE.POPUP,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_CALL_UNMUTE,
            object: EMPTY_CALL_OBJECT,
        });
    }
    /**
     * This function sends the request to popup to accept incoming call.
     */
    accept() {
        this.#sendEngine({
            to: AGENT_TYPE.POPUP,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_INCOMING_CALL_START,
            object: EMPTY_CALL_OBJECT,
        });
    }
    /**
     * This function sends the request to popup to decline incoming call.
     */
    decline() {
        this.#sendEngine({
            to: AGENT_TYPE.POPUP,
            from: AGENT_TYPE.PARENT,
            type: MESSAGE_TYPE.REQUEST_INCOMING_CALL_DECLINE,
            object: EMPTY_CALL_OBJECT,
        });
    }
}
module.exports = { CallerPackage: CallerPackage };
