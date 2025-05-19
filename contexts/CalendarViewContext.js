// contexts/CalendarViewContext.js
import { createContext } from "react";

export const CalendarViewContext = createContext({
  showEmotion: false,
  setShowEmotion: () => {},
});
