import React, { createContext, useContext, useState } from "react";

const PhotoContext = createContext();

export const usePhoto = () => useContext(PhotoContext);

export const PhotoProvider = ({ children }) => {
  const [photoList, setPhotoList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState(null);

  const reset = () => {
    setPhotoList([]);
    setSelected([]);
    setMode(null);
  };

  return (
    <PhotoContext.Provider
      value={{
        photoList,
        setPhotoList,
        selected,
        setSelected,
        mode,
        setMode,
        reset,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
};
