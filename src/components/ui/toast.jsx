import { Toaster as SonnerToaster, toast } from "sonner";

/** 全站 Toast（sonner） */
export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-center"
      toastOptions={{
        style: {
          background: "rgba(13,21,38,0.96)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#e2e8f0",
          borderRadius: "12px",
          fontSize: "13px",
        },
      }}
    />
  );
}

export { toast };
export default Toaster;
