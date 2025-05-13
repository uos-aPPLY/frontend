import React, { createContext, useContext, useState } from "react";
import characterList from "../assets/characterList";

const DiaryContext = createContext();

export function DiaryProvider({ children }) {
  const [text, setText] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(characterList[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <DiaryContext.Provider
      value={{
        text,
        setText,
        selectedCharacter,
        setSelectedCharacter,
        selectedDate,
        setSelectedDate,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  return useContext(DiaryContext);
}
