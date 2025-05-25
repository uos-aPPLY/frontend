import React, { createContext, useContext, useState } from "react";
import characterList from "../assets/characterList";

const DiaryContext = createContext();

export function DiaryProvider({ children }) {
  const [text, setText] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(characterList[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [diaryId, setDiaryId] = useState(null);

  const resetDiary = () => {
    setText("");
    setDiaryId(null);
    setSelectedCharacter(characterList[0]);
    setSelectedDate(new Date()); // null 대신 초기화된 날짜
  };

  return (
    <DiaryContext.Provider
      value={{
        text,
        setText,
        selectedCharacter,
        setSelectedCharacter,
        selectedDate,
        setSelectedDate,
        resetDiary,
        diaryId,
        setDiaryId,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  return useContext(DiaryContext);
}
