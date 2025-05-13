import React, { createContext, useContext, useState } from "react";

const DiaryContext = createContext();

export function DiaryProvider({ children }) {
  const [text, setText] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(
    require("../assets/character/char1.png")
  );
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
