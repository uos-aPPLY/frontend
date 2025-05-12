export const formatGridData = (data, numColumns) => {
  const filledData = [...data];
  const remainder = data.length % numColumns;
  if (remainder !== 0) {
    const blanksToAdd = numColumns - remainder;
    for (let i = 0; i < blanksToAdd; i++) {
      filledData.push(null);
    }
  }
  return filledData;
};
