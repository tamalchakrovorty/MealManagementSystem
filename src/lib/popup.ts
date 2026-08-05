type PopupType = "success" | "error" | "info";

interface PopupEvent {
  message: string;
  type: PopupType;
}

type Listener = (e: PopupEvent) => void;

let listener: Listener | null = null;

export const popup = {
  success(message: string) {
    listener?.({ message, type: "success" });
  },
  error(message: string) {
    listener?.({ message, type: "error" });
  },
  info(message: string) {
    listener?.({ message, type: "info" });
  },
  _subscribe(cb: Listener) {
    listener = cb;
    return () => { listener = null; };
  },
};
