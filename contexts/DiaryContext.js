import React, { createContext, useContext, useState, useCallback } from "react";
import characterList from "../assets/characterList";

const DiaryContext = createContext();

export function DiaryProvider({ children }) {
  const [text, setText] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(characterList[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [diaryId, setDiaryId] = useState(null);
  const [diaryMapById, setDiaryMapById] = useState({});

  const resetDiary = useCallback(() => {
    setText("");
    setDiaryId(null);
    setSelectedCharacter(characterList[0]);
  }, []);

  return (
    <DiaryContext.Provider
      value={{
        text,
        setText,
        selectedCharacter,
        setSelectedCharacter,
        selectedDate,
        setSelectedDate,
        diaryId,
        setDiaryId,
        diaryMapById,
        setDiaryMapById,
        resetDiary
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  return useContext(DiaryContext);
}
