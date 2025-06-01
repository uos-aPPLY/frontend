import React, { createContext, useContext, useState } from "react";

const PhotoContext = createContext();

export const PhotoProvider = ({ children }) => {
  const [photoList, setPhotoList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState(null);
  const [mainPhotoId, setMainPhotoId] = useState(null);
  const [tempPhotoList, setTempPhotoList] = useState(null);

  const resetPhoto = () => {
    setPhotoList([]);
    setSelected([]);
    setMode(null);
    setMainPhotoId(null);
    setTempPhotoList(null);
  };

  return (
    <PhotoContext.Provider
      value={{
        photoList,
        setPhotoList,
        tempPhotoList,
        setTempPhotoList,
        selected,
        setSelected,
        mode,
        setMode,
        mainPhotoId,
        setMainPhotoId,
        resetPhoto,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhoto = () => useContext(PhotoContext);
