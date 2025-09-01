/**
 * 主应用组件
 */
import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import ChatLayout from './components/Chat/ChatLayout';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f8f9fa;
  }

  button {
    border: none;
    background: none;
    font-family: inherit;
  }

  input, textarea {
    font-family: inherit;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const AppContainer = styled.div`
  height: 100vh;
  overflow: hidden;
`;

function App() {
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <ChatLayout />
      </AppContainer>
    </>
  );
}

export default App;