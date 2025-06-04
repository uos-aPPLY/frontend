import { set } from "date-fns";
import React, { createContext, useContext, useState, useEffect } from "react";

const PhotoContext = createContext();

export const PhotoProvider = ({ children }) => {
  const [photoList, setPhotoList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState(null);
  const [mainPhotoId, setMainPhotoId] = useState(null);
  const [tempPhotoList, setTempPhotoList] = useState(null);
  const [photoCount, setPhotoCount] = useState(0);

  const [selectedAssets, setSelectedAssets] = useState([]);
  const [clear, setClear] = useState(false);

  useEffect(() => {
    setPhotoCount(photoList.length);
  }, [photoList]);

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
        resetPhoto,
        setClear,
        clear
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhoto = () => useContext(PhotoContext);
