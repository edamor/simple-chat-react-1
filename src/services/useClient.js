import React from 'react'
import { Stomp, Client } from '@stomp/stompjs'

let stompClient

const useClient = () => {
  const [client, setClient] = React.useState(stompClient);
  const WS_URL = "ws://localhost:8090/spring-ws";

  React.useEffect(() => {
    if (!stompClient) {
      stompClient = Stomp.client(WS_URL)
      // stompClient = new Client({
      //   brokerURL: WS_URL,
      //   debug: (str) => console.log(str),
      //   reconnectDelay: 5000,
      //   heartbeatIncoming: 4000,
      //   heartbeatOutgoing: 4000
      // })
    }
    if (!client) {
      setClient(stompClient)
    }
  }, [client])

  return client
};

export default useClient;