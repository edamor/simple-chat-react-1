import React, { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";



// Generate anonymous username
const uName = ("user" + Math.round(Math.random() * 9999));

// Stomp over Websocket Broker URL
const WS_URL = "wss://thawing-retreat-89546.herokuapp.com/spring-ws";

// Create new Client instance once on page load
const client = new Client({
  brokerURL: WS_URL,
  connectHeaders: {username: uName},
  debug: (str) => console.log(str),
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  onDisconnect: (f) => {
    console.log(f);
    console.log("On Disconnect");
  },
  logRawCommunication: true
});



export default function ChatBoxComponent(props) {
  // Date generator DD-MM-YYYY
  let today = new Date();
  let [day] = useState(`${today.getDate() < 10 ? "0"+today.getDate() : today.getDate()}-${today.getMonth() < 10 ? "0"+today.getMonth() : today.getMonth()}-${today.getFullYear()}`);
    

  // Chat box change handler
  let [chatMsg, setChatMsg] = useState("");
  function chatOnChange(e) {
    setChatMsg(e.target.value);
  }

  // Array for storing received messages with an initial value set
  let [messages, setMessages] = useState([
    {
      type: "WELCOME",
      sender: "system",
      content: `${uName} has entered the room.`,
      class: "none",
      time: day
    }
  ]);
  // Method to get and process messages coming from the subscription
  const getMessages = useCallback((m) => {
    if (m.sender === uName) {
      m.class = "outgoing"
    } else m.class = "incoming";
    setMessages(msgs => [...msgs, m])
  }, [])


  // Async callback to establish the subscription to the broker
  const subscribe = useCallback(async () => {
    let waiting = await new Promise((resolve) => {
        client.activate();
        resolve(true);
    })
    await new Promise((resolve) => {
      client.configure({onConnect: (f) => {
        client.publish({destination: "/app/chat.newUser", headers: {}, body: JSON.stringify({
          sender: uName, type: "CONNECT"
        })})
      }})
      resolve()
    })
    
    if (waiting) {
      client.configure({onConnect: () => {
        console.log("On Connect");
        client.subscribe("/topic/public", msg => {
          if (msg) {
            let parsed = JSON.parse(msg.body);
            getMessages(parsed);
          }
        })
      }})
    } 
  }, [getMessages])

  

  
  // Async function for sending a message to the server
  const handleSend = async () => {
    let obj = {
      type: "CHAT",
      sender: uName,
      content: chatMsg,
      time: day
    }
    let payload = JSON.stringify(obj);
    await new Promise((resolve) => {
      client.publish({destination: "/app/chat.send", header: {}, body: payload});
      resolve()
    })
    setChatMsg("");
  }


  // Ref for scrolling to bottom element in chat thread
  let bottomRef = useRef(null);
  
  
  // Method to render mapped messages from subscription
  const renderMsgs = () => (messages.map((e, index) => (
          <p key={index} className={e.class} >
            <span>{e.sender === uName ? "Myself" : e.sender} </span>
            {e.content}
            <span><i> {e.time}</i></span>
          </p>
        )
      )
    )

  
    // keydownHandler
    // const keydownHandler = useCallback((e) => {
    //   let payload = JSON.stringify(obj);
    //   if (e.key === "Enter") {
    //     client.publish({destination: "/app/chat.send", header: {}, body: payload});
    //   }
      
    // }, [obj]) 

  // Call the async callback for subscribing on page load
  useEffect(() => {
    subscribe();
    if (messages.length > 3) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }

    

    // Send function for handling keydown=enter
    // window.addEventListener("keydown", keydownHandler)
    

    // Cleanup
    // return () => (
    //   window.removeEventListener("keydown", keydownHandler)
    // )
  }, [subscribe, messages])
  
  
  return (
    <React.Fragment>
      <div className="chat-box">
        <header>
          <h1>
            Simple Chat App
          </h1>
        </header>
        <div className="chat-body">
          <div className="chat-thread">
              {renderMsgs()}
              <div ref={bottomRef} />
          </div>
          <div className="chat-message">
            <textarea 
              type="text"
              onChange={chatOnChange} 
              maxLength={100}
              rows={3}
              value={chatMsg}
              >
              
            </textarea>
            <div className="chat-button">
              <button onClick={handleSend}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}