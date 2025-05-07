import React, { createContext, useContext, useState } from 'react';

const DiaryContext = createContext();

export function DiaryProvider({ children }) {
  const [text, setText] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(require('../assets/character/char1.png'));

  return (
    <DiaryContext.Provider
      value={{
        text,
        setText,
        selectedCharacter,
        setSelectedCharacter,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  return useContext(DiaryContext);
}
