const JsSIP = require("jssip");
JsSIP.debug.enable("JsSIP:*");

import { MESSAGE_TYPE, AGENT_TYPE } from "../static/enums";
import { CLIENT_POPUP_CHANNEL } from "../static/constants";

interface MESSAGE {
    to: AGENT_TYPE;
    from: AGENT_TYPE;
    type: MESSAGE_TYPE;
    object: CALL_OBJECT;
}

interface CALL_OBJECT {
    sender?: string,
    receiver?: string,
    startTime?: string,
    endTime?: string,
    hold?: boolean,
    mute?: boolean,
}

interface CALLBACK {
  (): void
}

interface CONFIG {
    sip: string,
    password: string,
    server_address: string,
    port: string,
}

const EMPTY_CALL_OBJECT: CALL_OBJECT = {
    sender: "",
    receiver: "",
    startTime: "",
    endTime: "",
    hold: false,
    mute: false,
}

class Wrapper {
  private config: CONFIG;
  
  constructor(config: CONFIG) {
    this.config = config;
  }

  connect(callback: CALLBACK):void {
    const channel: BroadcastChannel = new BroadcastChannel(CLIENT_POPUP_CHANNEL);
    let userAgent: typeof JsSIP.UA = null;
    let session: any = null;

    let callActive: boolean = false;
    let callObject: CALL_OBJECT = EMPTY_CALL_OBJECT;

    channel.onmessage = (messageEvent) => {
      receiveEngine(messageEvent.data);
    };

    let { sip, password, server_address, port } = this.config;
    const configuration = {
      sockets: [
        new JsSIP.WebSocketInterface("wss://" + server_address + ":" + port),
      ],
      uri: "sip:" + sip + "@" + server_address,
      authorization_user: sip,
      password: password,
      registrar_server: "sip:" + server_address,
      no_answer_timeout: 20,
      session_timers: false,
      register: true,
      trace_sip: true,
      connection_recovery_max_interval: 30,
      connection_recovery_min_interval: 2,
    };

    let ring = new window.Audio("./media/ring.wav");
    ring.loop = true;

    let remoteAudio = new window.Audio();
    remoteAudio.autoplay = true;

    userAgent = new JsSIP.UA(configuration);
    userAgent.start();

    function receiveEngine(message: MESSAGE) : void{
      if (message.to == AGENT_TYPE.WRAPPER) {
        console.log("Recieved in Wrapper:", message);
        if (message.type == MESSAGE_TYPE.REQUEST_OUTGOING_CALL_START) {
          if (!callActive) {
            callObject.receiver = message.object.receiver;
            call_outgoing(callObject.receiver);
          }
        } else if (message.type ==  MESSAGE_TYPE.REQUEST_OUTGOING_CALL_END) {
          call_terminate();
        } else if (message.type ==  MESSAGE_TYPE.REQUEST_CALL_HOLD) {
          call_hold();
        } else if (message.type ==  MESSAGE_TYPE.REQUEST_CALL_UNHOLD) {
          call_unhold();
        } else if (message.type ==  MESSAGE_TYPE.REQUEST_CALL_MUTE) {
          call_mute();
        } else if (message.type ==  MESSAGE_TYPE.REQUEST_SESSION_DETAILS) {
            channel.postMessage({
                to: AGENT_TYPE.PARENT,
                from: AGENT_TYPE.POPUP,
                type:  MESSAGE_TYPE.ACK_SESSION_DETAILS,
                object: callObject,
            });
        } else if (message.type ==  MESSAGE_TYPE.REQUEST_CALL_UNMUTE) {
          call_unmute();
        } else if (message.type ==  MESSAGE_TYPE.ACK_OUTGOING_CALL_START) {
          //ring.pause();
          callObject.startTime = session.start_time;
          callObject.sender = session.local_identity;
          callObject.receiver = session.remote_identity;
          
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type:  MESSAGE_TYPE.ACK_OUTGOING_CALL_START,
            object: callObject,
          });
        } else if (message.type == MESSAGE_TYPE.ACK_OUTGOING_CALL_END) {
          callObject.endTime = session.end_time;
          callActive = false;
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_OUTGOING_CALL_END,
            object: callObject,
          });
          callObject = EMPTY_CALL_OBJECT;
          session = null;
        } else if (message.type == MESSAGE_TYPE.ACK_OUTGOING_CALL_FAIL) {
          if (ring) ring.pause();
          callActive = false;
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_OUTGOING_CALL_FAIL,
            object: callObject,
          });
          callObject = EMPTY_CALL_OBJECT;
          session = null;
        } else {
          console.log("UNKNOWN TYPE: ", message);
        }
        // }
      }
    }

    const addEventListeners = () => {
      userAgent.on("newRTCSession", function (event) {
        console.log("newRTCSession", event);

        session = event.session;
        console.log("Direction: ", session.direction);

        session.on("sdp", function (e) {
          console.log("call sdp: ", e.sdp);
        });
        session.on("accepted", function (e) {
          console.log("call accepted: ", e);
        });
        session.on("progress", function (e) {
          console.log("call is in progress: ", e);
        });
        session.on("confirmed", function (e) {
          console.log("confirmed by", e.originator);
        });
        session.on("ended", function (e) {
          console.log("Call ended: ", e);
          call_terminate();
        });
        session.on("failed", function (e) {
          console.log("Call failed: ", e);
          // call_terminate();
        });
        session.on("peerconnection", function (e) {
          console.log("call peerconnection: ", e);
        });
      });
    };

    userAgent.on("connected", (e) => {
      setTimeout(() => {
        channel.postMessage({
          to: AGENT_TYPE.PARENT,
          from: AGENT_TYPE.POPUP,
          type: MESSAGE_TYPE.INFORM_SOCKET_CONNECTED,
          object: {},
        });
      }, 0);

      addEventListeners();
      callback();
      console.log("INFORM_SOCKET_CONNECTED", e.data);
    });

    userAgent.on("disconnected", (e) => {
      setTimeout(() => {
        channel.postMessage({
          to: AGENT_TYPE.PARENT,
          from: AGENT_TYPE.POPUP,
          type: MESSAGE_TYPE.INFORM_SOCKET_DISCONNECTED,
          object: {},
        });
      }, 0);
      console.log("INFORM_SOCKET_DISCONNECTED", e.data);
    });

    userAgent.on("newMessage", function (e) {
      e.data.message.accept();
      console.log(e);
    });
    
    function call_outgoing(number) {
      console.log("CALL CLICKED", number);
      ring.play();
      userAgent.call("125311" + number, {
        eventHandlers: {
          progress: function (e) {
            console.log("call is in progress");
          },
          failed: (e) => {
            setTimeout(() => {
              let self_channel: BroadcastChannel = new BroadcastChannel(CLIENT_POPUP_CHANNEL);
              self_channel.postMessage({
                to: AGENT_TYPE.WRAPPER,
                from: AGENT_TYPE.WRAPPER,
                type: MESSAGE_TYPE.ACK_OUTGOING_CALL_FAIL,
                object: { object: e.data },
              });
            }, 0);
            console.log("ACK_OUTGOING_CALL_FAILED", e.data);
          },
          ended: (e) => {
            setTimeout(() => {
              let self_channel: BroadcastChannel = new BroadcastChannel(CLIENT_POPUP_CHANNEL);
              self_channel.postMessage({
                to: AGENT_TYPE.WRAPPER,
                from: AGENT_TYPE.WRAPPER,
                type: MESSAGE_TYPE.ACK_OUTGOING_CALL_END,
                object: {},
              });
            }, 0);
            console.log("ACK_OUTGOING_CALL_ENDED", e.data);
          },
          confirmed: (e) => {
            setTimeout(() => {
              let self_channel: BroadcastChannel = new BroadcastChannel(CLIENT_POPUP_CHANNEL);
              self_channel.postMessage({
                to: AGENT_TYPE.WRAPPER,
                from: AGENT_TYPE.WRAPPER,
                type: MESSAGE_TYPE.ACK_OUTGOING_CALL_START,
                object: {},
              });
            }, 0);
            console.log("ACK_OUTGOING_CALL_STARTED");
          },
        },
        pcConfig: {
          rtcpMuxPolicy: "negotiate",
          hackStripTcp: true,
          iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
          iceTransportPolicy: "all",
        },
        mediaConstraints: {
          audio: true,
          video: false,
        },
        rtcOfferConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        },
      });
      addStreams();
    }

    function call_answer(): void {
      if (session) {
        session.answer({
          eventHandlers: {
            progress: function (e) {
              console.log("call is in progress");
            },
            failed: function (e) {
              console.log("call failed with cause: " + e.data);
            },
            ended: function (e) {
              console.log("call ended with cause: " + e.data);
            },
            confirmed: (e) => {
              console.log("call confirmed");
            },
          },
          pcConfig: {
            rtcpMuxPolicy: "negotiate",
            hackStripTcp: true,
            iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
            iceTransportPolicy: AGENT_TYPE.PARENT,
          },
          mediaConstraints: {
            audio: true,
            video: false,
          },
          rtcOfferConstraints: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: false,
          },
        });
      }
    }

    function call_terminate(): void {
      if (session) {
        session.terminate();
      }
      session = null;
    }

    function addStreams(): void {
      session.connection.addEventListener("addstream", function (event) {
        ring.pause();
        remoteAudio.srcObject = event.stream;
        
        let local = document.getElementById("localMedia") as HTMLVideoElement;
        local.srcObject = session.connection.getLocalStreams()[0];

        let remote =  document.getElementById("remoteMedia") as HTMLVideoElement;
        remote.srcObject =
          session.connection.getRemoteStreams()[0];

      });
    }

    function endTime(): void {
      return session.end_Time;
    }

    function startTime(): void {
      return session.startTime();
    }

    function call_hold(): void {
      console.log("Request to hold caught by wrapper");
      session.hold();
      if (session.isOnHold().local) {
        setTimeout(() => {
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_CALL_HOLD,
            object: {},
          });
        }, 0);
        callObject.hold = true;
        console.log("ACK_CALL_HOLD");
      } else {
        setTimeout(() => {
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_CALL_HOLD_FAILED,
            object: {},
          });
        }, 0);
        console.log("ACK_CALL_HOLD_FAILED");
      }
    }

    function call_unhold(): void {
      console.log("Request to unhold caught by wrapper");
      session.unhold();
      if (!session.isOnHold().local) {
        setTimeout(() => {
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_CALL_UNHOLD,
            object: {},
          });
        }, 0);
         callObject.hold = false;
        console.log("ACK_CALL_UNHOLD");
      } else {
        setTimeout(() => {
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_CALL_UNHOLD_FAILED,
            object: {},
          });
        }, 0);
        console.log("ACK_CALL_UNHOLD_FAILED");
      }
    }

    function call_mute(): void {
      console.log("Request to MUTE caught by wrapper");

      session.mute();
      if (session.isMuted().audio) {
        setTimeout(() => {
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_CALL_MUTE,
            object: {},
          });
        }, 0);
        callObject.mute = true;
        console.log("ACK_CALL_MUTE");
      } else {
        setTimeout(() => {
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_CALL_MUTE_FAILED,
            object: {},
          });
        }, 0);
        console.log("ACK_CALL_MUTE_FAILED");
      }
    }

    function call_unmute():void {
      console.log("Request to UNMUTE caught by wrapper");
      session.unmute();
      if (!session.isMuted().audio) {
        setTimeout(() => {
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_CALL_UNMUTE,
            object: {},
          });
        }, 0);
        callObject.mute = false;
        console.log("ACK_CALL_UNMUTE");
      } else {
        setTimeout(() => {
          channel.postMessage({
            to: AGENT_TYPE.PARENT,
            from: AGENT_TYPE.POPUP,
            type: MESSAGE_TYPE.ACK_CALL_UNMUTE_FAILED,
            object: {},
          });
        }, 0);
        console.log("ACK_CALL_UNMUTE_FAILED");
      }
      console.log("ACK_CALL_UNMUTE");
    }
  }
}

module.exports = { Wrapper: Wrapper };
