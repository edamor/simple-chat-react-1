import React, { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";



// Generate anonymous username
const uName = ("user" + Math.round(Math.random() * 999));

// Instantiate new Client outside of component to prevent unwanted re-renders
const WS_URL = "ws://localhost:8090/spring-ws";


const client = new Client({
  brokerURL: WS_URL,
  connectHeaders: {username: uName},
  debug: (str) => console.log(str),
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  onDisconnect: (f) => {
    console.log(f);
    console.log("On Disconnect")
  },
  logRawCommunication: true
});


  // onConnect: (f) => {
  //   client.publish({destination: "/app/chat.newUser", headers: {}, body: JSON.stringify({
  //     sender: uName, type: "CONNECT"
  //   })})
  // },


export default function ChatBoxComponent(props) {

  
  
  //Connection helpers
  let [isConnected, setIsConnected] = useState(false);
  function toggleConnection() {setIsConnected(!isConnected)};

  // Chat box change handler
  let [chatMsg, setChatMsg] = useState("");
  function chatOnChange(e) {
    setChatMsg(e.target.value);
  }

  // Array for storing received messages
  let [messages, setMessages] = useState([]);
  const getMessages = useCallback((msgs) => {
    setMessages(m => [...m, msgs])
  }, [])



  const subscribe = useCallback(async () => {
    let waiting = await new Promise((resolve) => {
      client.activate();
      resolve(true);
    })
    
    if (!isConnected) {
      await new Promise((resolve) => {
        client.configure({onConnect: (f) => {
          client.publish({destination: "/app/chat.newUser", headers: {}, body: JSON.stringify({
            sender: uName, type: "CONNECT"
          })})
        }})
        resolve(true)
      })
    }

    if (waiting) {
      client.configure({onConnect: () => {
          console.log("On Connect");
          client.subscribe("/topic/public", msg => {
            if (msg) {
              let parsed = JSON.parse(msg.body);
              console.log(parsed)
              getMessages(parsed);
            }
          })
        }})
      
    } 
  }, [isConnected, getMessages])

  useEffect(() => {
    subscribe();
    
    
  }, [subscribe])


  

  function handleSend() {
    let date = new Date();
    let d = date.toString();
    let obj = {
      type: "CHAT",
      sender: uName,
      content: chatMsg,
      time: d
    }
    let payload = JSON.stringify(obj);

    client.publish({destination: "/app/chat.send", header: {}, body: payload});
    
  }
  

  console.log(messages);

  

  let renderMsgs = () => {
                if (messages.length === 0) {
                  return <li>nothing to show</li> ;
                } else {
                  return (
                    messages.map(e => (
                      <li key={e.time} >{e.content}</li>
                    ))
                  )
                }
              }
  
  

  

  
  
  
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
            <ul>
              {renderMsgs()}
            </ul>
          </div>
          <div className="chat-message">
            <textarea type="text" onChange={chatOnChange} >
              
            </textarea>
            <div>
              <button onClick={handleSend}>
                Send
              </button>
              <button>
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}