import PeerJS from 'peerjs';
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

let connection;
let peer;

const NameInput = () => {
  const navigate = useNavigate();
  const [currentPeer, setCurrentPeer] = useState(peer);

  const onSubmit = useCallback((event) => {
    const input = event.currentTarget.elements.namedItem('name');
    const user = input.value;

    event.preventDefault();

    setCurrentPeer(new PeerJS(user));
  }, []);

  useEffect(() => {
    peer = currentPeer;

    if (currentPeer) {
      navigate('/overview');
    }
  }, [currentPeer]);

  return (
    <form onSubmit={onSubmit}>
      <label>Your name:</label>
      <input name="name" />
      <button>Save</button>
    </form>
  )
};

const Overview = () => {
  const navigate = useNavigate();
  const [currentPeer] = useState(peer);

  const [currentConnection, setCurrentConnection] = useState(connection);

  const onSubmit = useCallback((event) => {
    const input = event.currentTarget.elements.namedItem('name');
    const user = input.value;

    event.preventDefault();

    setCurrentConnection(currentPeer.connect(user));
  }, [currentPeer]);

  useEffect(() => {
    connection = currentConnection;

    if (!currentPeer) {
      navigate('/');
    } else if (currentConnection) {
      navigate('/call');
    } else {
      peer.on('connection', setCurrentConnection);
      return () => peer.off('connection', setCurrentConnection);
    }
  }, [currentPeer, currentConnection]);

  return (
    <div>
      <h1>Hi, {currentPeer?.id}</h1>
      <form onSubmit={onSubmit}>
        <label>Name to call:</label>
        <input name="name" />
        <button>Call</button>
      </form>
    </div>
  )
};

const Call = () => {
  const navigate = useNavigate();
  const [currentConnection, setCurrentConnection] = useState(connection);
  const [currentPeer] = useState(peer);
  const [messages, setMessages] = useState([]);

  const appendMessage = useCallback((message, self) => {
    setMessages((currentMessages) => [...currentMessages, {
      id: Date.now(),
      message,
      self,
      time: new Date().toLocaleTimeString(),
      user: self ? currentPeer.id : currentConnection.peer,
    }]);
  }, []);

  const onSubmit = useCallback((event) => {
    const input = event.currentTarget.elements.namedItem('message');
    const message = input.value;

    event.preventDefault();

    currentConnection.send(message);
    appendMessage(message, true);
    input.value = '';
  }, [currentConnection]);

  const disconnect = useCallback(() => {
    currentConnection.close();
    setCurrentConnection(undefined);
  }, [currentConnection]);

  useEffect(() => {
    connection = currentConnection;

    if (!connection) {
      navigate('/overview');
    } else {
      const dataHandler = (data: string) => appendMessage(data, false);

      const closeHandler = () => {
        setCurrentConnection(undefined);
      };

      currentConnection.on('data', dataHandler);
      currentConnection.on('close', closeHandler);
      
      return () => {
        currentConnection.off('data', dataHandler);
        currentConnection.off('close', closeHandler);
      }
    }
  }, [currentConnection]);

  return (
    <div>
      <h1>
        {currentPeer?.id} ⬄ {currentConnection?.peer} <button onClick={disconnect}>Hang up</button>
      </h1>
      <div>
        {messages.map((msg) => (
          <p key={msg.id} style={{ color: msg.self ? '#999' : '#222' }}>
            <b>{msg.user}</b> ({msg.time}): {msg.message}
          </p>
        ))}
      </div>
      <form onSubmit={onSubmit}>
        <input name="message" />
        <button>Send</button>
      </form>
    </div>
  )
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" element={<NameInput />} />
        <Route exact path="/overview" element={<Overview />} />
        <Route exact path="/call" element={<Call />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
