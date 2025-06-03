import { set } from "date-fns";
import React, { createContext, useContext, useState } from "react";

const PhotoContext = createContext();

export const PhotoProvider = ({ children }) => {
  const [photoList, setPhotoList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState(null);
  const [mainPhotoId, setMainPhotoId] = useState(null);
  const [tempPhotoList, setTempPhotoList] = useState(null);
  const [photoCount, setPhotoCount] = useState(photoList.length);
  const [selectedAssets, setSelectedAssets] = useState([]);

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
        selectedAssets,
        setSelectedAssets,
        mode,
        setMode,
        photoCount,
        setPhotoCount,
        mainPhotoId,
        setMainPhotoId,
        resetPhoto
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhoto = () => useContext(PhotoContext);
